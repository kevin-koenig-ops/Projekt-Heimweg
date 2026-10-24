// Kartentexturen: gemalte Bilder (src/assets/textures, nahtlos gemacht) und, wo es
// noch kein Bild gibt, zur Laufzeit auf ein Canvas gezeichnete Muster.

import { rngFrom } from '../core/rng';
import type { Season } from '../services/settings';
import ackerErde from '../assets/textures/acker-erde.webp';
import ackerGruen from '../assets/textures/acker-gruen.webp';
import fels from '../assets/textures/fels.webp';
import grundboden from '../assets/textures/grundboden.webp';
import rasen from '../assets/textures/rasen.webp';
import sand from '../assets/textures/sand.webp';
import schutt from '../assets/textures/schutt.webp';
import sumpf from '../assets/textures/sumpf.webp';
import waldboden from '../assets/textures/waldboden.webp';
import vorgaerten from '../assets/textures/vorgaerten.webp';
import hof from '../assets/textures/hof.webp';
import wiese from '../assets/textures/wiese-sommer.webp';

/**
 * Gemalte Texturen (512 × 512, nahtlos gemacht mit scripts/textur-nahtlos.py; Originale in kunst/texturen). Ersetzen das gezeichnete Muster gleichen Namens.
 * pr: je größer, desto kleiner erscheint das Bild auf der Karte (2 = 256 Bildpunkte breit).
 */
const IMAGES: Record<string, { url: string; pr: number }> = {
  'pat-ground': { url: grundboden, pr: 2 },
  'pat-meadow': { url: wiese, pr: 2 },
  'pat-grass': { url: rasen, pr: 2 },
  // Wohngebiet: Vorgärten mit Büschen, Beeten und Kieswegen
  'pat-gardens': { url: vorgaerten, pr: 2.5 },
  'pat-forest-floor': { url: waldboden, pr: 3.5 },
  'pat-rubble': { url: schutt, pr: 3 },
  // Siedlung ohne Gärten: Höfe mit Steinplatten, und Asphalt/Pflaster in Städten
  // (bis es ein eigenes Pflasterbild gibt, der rissige Beton)
  'pat-yard': { url: hof, pr: 2.5 },
  'pat-paved': { url: schutt, pr: 3 },
  'pat-sand': { url: sand, pr: 2 },
  // Sandige Plätze und Parkplätze: Kies, bis es ein eigenes Bild gibt (kies.webp) der Grundboden
  'pat-gravel': { url: grundboden, pr: 2 },
  'pat-rock': { url: fels, pr: 2.5 },
  'pat-wetland': { url: sumpf, pr: 2.5 },
  // Äcker: zwei Sorten, damit nicht jedes Feld gleich aussieht
  'pat-farm-a': { url: ackerErde, pr: 2.5 },
  'pat-farm-b': { url: ackerGruen, pr: 2.5 },
  'pat-farm': { url: ackerErde, pr: 2.5 },
  // Eigene Arten für Flächen, die bisher ein gemeinsames Bild hatten (Kevin, 23.10.: Textur für alles).
  // Bis ihr eigenes Bild da ist, nehmen sie das bisherige.
  'pat-industrial': { url: schutt, pr: 3 },
  'pat-commercial': { url: schutt, pr: 3 },
  'pat-railyard': { url: schutt, pr: 3 },
  'pat-quarry': { url: schutt, pr: 3 },
  'pat-pitch': { url: rasen, pr: 2 },
  'pat-playground': { url: rasen, pr: 2 },
};
const loaded = new Map<string, { data: ImageData; pixelRatio: number; url: string; mean: string }>();

/** Alle Bilder im Texturen-Ordner, auch die je Jahreszeit (sobald Kevin sie liefert). */
const ALL_FILES = import.meta.glob('../assets/textures/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const fileUrl = (name: string): string | undefined => ALL_FILES[`../assets/textures/${name}.webp`];
// Eigenes Pflaster-/Asphaltbild für Städte, sobald es da ist (pflaster.webp)
if (fileUrl('pflaster')) IMAGES['pat-paved'] = { url: fileUrl('pflaster')!, pr: 3 };
if (fileUrl('kies')) IMAGES['pat-gravel'] = { url: fileUrl('kies')!, pr: 2 };
// Für den selbst gemalten Boden (24.10.): Asphalt für große Plätze, verwilderter Rasen im Wohngebiet.
// Bis Kevins Bilder da sind, stehen Pflaster und Rasen dafür (dann sieht man keinen Unterschied).
IMAGES['pat-asphalt'] = { url: fileUrl('asphalt') ?? IMAGES['pat-paved'].url, pr: 3 };
IMAGES['pat-wild'] = { url: fileUrl('wildwuchs') ?? rasen, pr: 2 };
const SEASON_NAME: Record<Season, string> = { spring: 'fruehling', summer: 'sommer', autumn: 'herbst', winter: 'winter' };
/** Muster mit eigenen Bildern je Jahreszeit, z. B. wiese-herbst.webp. Fehlt eins, bleibt das normale. */
const SEASONAL: Record<string, string> = {
  'pat-ground': 'grundboden',
  'pat-meadow': 'wiese',
  'pat-grass': 'rasen',
  'pat-gardens': 'vorgaerten',
  'pat-forest-floor': 'wald',
  'pat-rubble': 'schutt',
  'pat-yard': 'hof',
  'pat-paved': 'pflaster',
  'pat-asphalt': 'asphalt',
  'pat-wild': 'wildwuchs',
  'pat-sand': 'sand',
  'pat-gravel': 'kies',
  'pat-rock': 'fels',
  'pat-wetland': 'sumpf',
  'pat-farm': 'acker-a',
  'pat-farm-a': 'acker-a',
  'pat-farm-b': 'acker-b',
  'pat-industrial': 'industrie',
  'pat-commercial': 'gewerbe',
  'pat-railyard': 'bahngelaende',
  'pat-quarry': 'steinbruch',
  'pat-pitch': 'sportplatz',
  'pat-playground': 'spielplatz',
};

/**
 * Bilder, die es nur gibt, wenn Kevin sie geliefert hat (je Jahreszeit oder ganzjährig).
 * Straßen, Wege und Gleise liegen quer: sie laufen von links nach rechts, oben und unten sind
 * ihre Ränder. Die Karte streckt das Bild auf die Breite der Linie und wiederholt es entlang.
 * Fehlt ein Bild, bleibt die gezeichnete Linie, der gemalte Wald oder die schlichte Farbe.
 */
const OPTIONAL: Record<string, { key: string; pr: number }> = {
  'pat-road-major': { key: 'strasse-haupt', pr: 1 },
  'pat-road-minor': { key: 'strasse-neben', pr: 1 },
  'pat-track': { key: 'feldweg', pr: 1 },
  'pat-path': { key: 'fussweg', pr: 1 },
  'pat-footway': { key: 'gehweg', pr: 1 },
  'pat-rail': { key: 'gleis', pr: 1 },
  // Wald von weitem: Baumkronen von oben (statt des gezeichneten Musters)
  'pat-forest': { key: 'wald-oben', pr: 2 },
  'pat-ice': { key: 'eis', pr: 2.5 },
};

/** Linien mit Bild: Straßen, Wege und Gleise laufen oben und unten weich in den Boden aus. */
const LINE_PATTERNS = new Set(['pat-road-major', 'pat-road-minor', 'pat-track', 'pat-path', 'pat-footway', 'pat-rail']);
/** So viel vom Bild (je Rand, Anteil der Höhe) wird nach außen hin durchsichtig. */
const EDGE_FADE = 0.22;

/** Oberen und unteren Rand eines Linienbilds weich ausblenden (sanfte S-Kurve). */
function fadeEdges(d: ImageData, band = EDGE_FADE) {
  const { width: w, height: h, data } = d;
  const n = Math.max(1, Math.min(Math.floor(h / 2), Math.round(h * band)));
  for (let y = 0; y < n; y++) {
    const t = (y + 0.5) / n;
    const a = t * t * (3 - 2 * t);
    for (const row of [y, h - 1 - y]) {
      for (let x = 0, i = row * w * 4 + 3; x < w; x++, i += 4) data[i] = Math.round(data[i] * a);
    }
  }
}

/** Gibt es für dieses Muster gerade ein geliefertes Bild? */
export function hasOptionalTexture(id: string): boolean {
  return id in OPTIONAL && loaded.has(id);
}

/**
 * Vor dem Kartenstart aufrufen: lädt die Bild-Texturen (fehlt eins, bleibt das gezeichnete Muster).
 * Mit Jahreszeit: wo es ein Bild für diese Jahreszeit gibt, wird es genommen.
 * Gibt die Muster zurück, die sich gegenüber vorher geändert haben.
 */
export async function loadTextures(season?: Season): Promise<string[]> {
  const changed: string[] = [];
  // Wahlweise Bilder: nur wenn es eins gibt
  const optional = Object.entries(OPTIONAL).flatMap(([id, { key, pr }]) => {
    const url = (season && fileUrl(`${key}-${SEASON_NAME[season]}`)) || fileUrl(key);
    if (!url && loaded.delete(id)) changed.push(id);
    return url ? [[id, { url, pr }] as const] : [];
  });
  await Promise.all(
    [...Object.entries(IMAGES), ...optional].map(async ([id, { url, pr }]) => {
      const seasonal = season && SEASONAL[id] ? fileUrl(`${SEASONAL[id]}-${SEASON_NAME[season]}`) : undefined;
      const want = seasonal ?? url;
      const cur = loaded.get(id);
      if (cur?.url === want) return;
      try {
        const img = new Image();
        img.src = want;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height);
        const mean = meanColor(data);
        if (LINE_PATTERNS.has(id)) fadeEdges(data);
        loaded.set(id, { data, pixelRatio: pr, url: want, mean });
        if (cur) changed.push(id);
      } catch (err) {
        console.warn('[Textur]', id, err);
      }
    }),
  );
  return changed;
}

/** Mittlere Farbe eines Bilds als #rrggbb (für die weichen Ränder der Flächen). */
function meanColor(d: ImageData): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  // jeden 7. Bildpunkt reicht
  for (let i = 0; i < d.data.length; i += 28) {
    r += d.data[i];
    g += d.data[i + 1];
    b += d.data[i + 2];
    n++;
  }
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Mittlere Farbe des geladenen Bilds zu einem Muster (fehlt es, undefined). */
export function textureColor(id: string): string | undefined {
  return loaded.get(id)?.mean;
}

const PR = 2; // Pixeldichte der Muster
const WATER_SIZE = 128;
const TAU = Math.PI * 2;

type Painter = (ctx: CanvasRenderingContext2D, s: number) => void;

function make(size: number, paint: Painter): ImageData {
  const c = document.createElement('canvas');
  c.width = c.height = size * PR;
  const ctx = c.getContext('2d')!;
  ctx.scale(PR, PR);
  paint(ctx, size);
  return ctx.getImageData(0, 0, c.width, c.height);
}

/** Etwas an allen Kanten wiederholen, damit das Muster nahtlos kachelt. */
function wrap(s: number, draw: (dx: number, dy: number) => void) {
  for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) draw(dx, dy);
}

// --- Malhelfer -------------------------------------------------------------------------
type R = () => number;

/** Weiche Farbflecken (wie Aquarell), nahtlos. */
function blotches(ctx: CanvasRenderingContext2D, s: number, r: R, n: number, minR: number, maxR: number, colors: string[]) {
  for (let i = 0; i < n; i++) {
    const x = r() * s;
    const y = r() * s;
    const rad = minR + r() * (maxR - minR);
    const col = colors[Math.floor(r() * colors.length)];
    wrap(s, (dx, dy) => {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    });
  }
}

/** Kleine Tupfen (Steinchen, Blätter, Blüten). */
function specks(ctx: CanvasRenderingContext2D, s: number, r: R, n: number, colors: string[], size: [number, number], round = false) {
  for (let i = 0; i < n; i++) {
    const x = r() * s;
    const y = r() * s;
    const w = size[0] + r() * (size[1] - size[0]);
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    wrap(s, (dx, dy) => {
      if (round) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(x + dx, y + dy, w, w * (0.6 + r() * 0.4));
    });
  }
}

/** Grashalme: kurze, leicht schräge Striche. */
function blades(ctx: CanvasRenderingContext2D, s: number, r: R, n: number, colors: string[], len = 3.2) {
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * s;
    const y = r() * s;
    const l = len * (0.6 + r() * 0.7);
    const lean = (r() - 0.5) * 1.6;
    ctx.strokeStyle = colors[Math.floor(r() * colors.length)];
    wrap(s, (dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx + lean, y + dy - l);
      ctx.stroke();
    });
  }
}

/** Ackerreihen: parallele, leicht wellige Linien. */
function rows(ctx: CanvasRenderingContext2D, s: number, r: R, gap: number, dark: string, light: string) {
  ctx.lineWidth = gap * 0.42;
  for (let y = gap / 2; y < s; y += gap) {
    for (const [col, off] of [[dark, 0], [light, gap / 2]] as const) {
      ctx.strokeStyle = col;
      ctx.beginPath();
      for (let x = 0; x <= s; x += 4) {
        const yy = y + off + Math.sin((x / s) * Math.PI * 2 + y) * 0.6;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }
  specks(ctx, s, r, 40, ['rgba(60, 44, 28, 0.35)', 'rgba(220, 200, 150, 0.25)'], [0.8, 1.8]);
}

/** Feld in einer Grundfarbe mit Reihen (Acker, Getreide, Raps …). */
function field(base: string, dark: string, light: string, seed: string): [number, Painter] {
  return [
    96,
    (ctx, s) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom(seed);
      blotches(ctx, s, r, 10, 14, 36, ['rgba(255, 245, 210, 0.08)', 'rgba(40, 30, 20, 0.08)']);
      rows(ctx, s, r, 6, dark, light);
    },
  ];
}

// Freundlich, aber nicht bunt: warme, leicht entsättigte Naturfarben, wie gemalt.
const PAINTERS: Record<string, [number, Painter]> = {
  // Boden unter allem: trockene Wiese und Erde, Flecken und Steinchen
  'pat-ground': [
    192,
    (ctx, s) => {
      ctx.fillStyle = '#8c8663';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('ground-v2');
      blotches(ctx, s, r, 30, 14, 48, ['rgba(120, 132, 80, 0.32)', 'rgba(150, 132, 96, 0.28)', 'rgba(104, 96, 70, 0.22)', 'rgba(170, 160, 120, 0.2)']);
      blades(ctx, s, r, 160, ['rgba(96, 108, 62, 0.55)', 'rgba(150, 150, 98, 0.5)'], 3);
      specks(ctx, s, r, 70, ['rgba(70, 62, 48, 0.45)', 'rgba(190, 180, 150, 0.45)'], [0.7, 1.6]);
    },
  ],
  // Rasen, Parks, Grünflächen
  'pat-grass': [
    128,
    (ctx, s) => {
      ctx.fillStyle = '#7c8a4c';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('grass-v2');
      blotches(ctx, s, r, 18, 10, 34, ['rgba(140, 156, 86, 0.35)', 'rgba(98, 112, 58, 0.3)', 'rgba(156, 160, 96, 0.22)']);
      blades(ctx, s, r, 260, ['rgba(88, 104, 52, 0.7)', 'rgba(150, 168, 96, 0.6)', 'rgba(120, 138, 70, 0.6)']);
    },
  ],
  // Wiese: Gras mit ein paar Blüten
  'pat-meadow': [
    160,
    (ctx, s) => {
      ctx.fillStyle = '#86904f';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('meadow');
      blotches(ctx, s, r, 22, 12, 40, ['rgba(160, 166, 92, 0.32)', 'rgba(104, 118, 60, 0.3)', 'rgba(176, 160, 100, 0.2)']);
      blades(ctx, s, r, 320, ['rgba(92, 108, 54, 0.7)', 'rgba(160, 170, 100, 0.6)'], 4);
      specks(ctx, s, r, 26, ['#f1ead6', '#e8c84a', '#b79bcf', '#d0623f'], [1.4, 2.2], true);
    },
  ],
  // Äcker: zwei Sorten, damit nicht jedes Feld gleich aussieht
  'pat-farm-a': field('#8f7250', '#7a5e40', '#a2845d', 'acker-erde'),
  'pat-farm-b': field('#8d9852', '#78833f', '#a1ab63', 'acker-gruen'),
  // Wald von weitem: Baumkronen
  'pat-forest': [
    96,
    (ctx, s) => {
      ctx.fillStyle = '#44562f';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('forest-v2');
      const crowns = Array.from({ length: 22 }, () => ({ x: r() * s, y: r() * s, rad: 5 + r() * 7, c: r() }));
      for (const c of crowns)
        wrap(s, (dx, dy) => {
          ctx.fillStyle = 'rgba(30, 40, 22, 0.55)';
          ctx.beginPath();
          ctx.arc(c.x + dx + 2, c.y + dy + 2.5, c.rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = c.c < 0.12 ? '#9a7d3e' : c.c < 0.45 ? '#5d7440' : c.c < 0.75 ? '#4f6638' : '#6a8046';
          ctx.beginPath();
          ctx.arc(c.x + dx, c.y + dy, c.rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(190, 210, 140, 0.25)';
          ctx.beginPath();
          ctx.arc(c.x + dx - c.rad * 0.35, c.y + dy - c.rad * 0.35, c.rad * 0.45, 0, Math.PI * 2);
          ctx.fill();
        });
    },
  ],
  // Waldboden: Moos, Laub, Nadeln. Darauf stehen nah dran die 3D-Bäume.
  'pat-forest-floor': [
    128,
    (ctx, s) => {
      ctx.fillStyle = '#5c6038';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('waldboden-v2');
      blotches(ctx, s, r, 26, 8, 30, ['rgba(110, 126, 64, 0.4)', 'rgba(130, 98, 56, 0.35)', 'rgba(70, 70, 40, 0.3)']);
      specks(ctx, s, r, 160, ['rgba(160, 112, 58, 0.7)', 'rgba(184, 140, 70, 0.6)', 'rgba(70, 60, 36, 0.6)', 'rgba(132, 150, 80, 0.6)'], [1, 2.2]);
      ctx.strokeStyle = 'rgba(80, 62, 40, 0.6)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 14; i++) {
        const x = r() * s;
        const y = r() * s;
        const a = r() * Math.PI;
        const l = 3 + r() * 5;
        wrap(s, (dx, dy) => {
          ctx.beginPath();
          ctx.moveTo(x + dx, y + dy);
          ctx.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l);
          ctx.stroke();
        });
      }
    },
  ],
  // Sand, Dünen, Strand
  'pat-sand': [
    128,
    (ctx, s) => {
      ctx.fillStyle = '#cbb78a';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('sand');
      blotches(ctx, s, r, 14, 12, 36, ['rgba(220, 204, 160, 0.35)', 'rgba(170, 150, 108, 0.25)']);
      ctx.strokeStyle = 'rgba(160, 138, 96, 0.35)';
      ctx.lineWidth = 1;
      for (let y = 4; y < s; y += 9) {
        ctx.beginPath();
        for (let x = 0; x <= s; x += 4) {
          const yy = y + Math.sin((x / s) * Math.PI * 4 + y * 0.7) * 1.6;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      specks(ctx, s, r, 50, ['rgba(120, 104, 74, 0.4)', 'rgba(240, 230, 200, 0.5)'], [0.6, 1.3]);
    },
  ],
  // Fels und Geröll
  'pat-rock': [
    128,
    (ctx, s) => {
      ctx.fillStyle = '#8e897c';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('fels');
      blotches(ctx, s, r, 16, 10, 30, ['rgba(120, 128, 90, 0.3)', 'rgba(70, 66, 58, 0.25)']);
      for (let i = 0; i < 46; i++) {
        const x = r() * s;
        const y = r() * s;
        const rad = 2 + r() * 5;
        const n = 5 + Math.floor(r() * 3);
        const pts = Array.from({ length: n }, (_, k) => {
          const a = (k / n) * Math.PI * 2;
          const rr = rad * (0.7 + r() * 0.4);
          return [Math.cos(a) * rr, Math.sin(a) * rr * 0.75];
        });
        const light = r() < 0.5 ? '#a8a294' : '#9a9486';
        wrap(s, (dx, dy) => {
          ctx.fillStyle = 'rgba(50, 46, 40, 0.4)';
          ctx.beginPath();
          pts.forEach(([px, py], k) => (k ? ctx.lineTo(x + dx + px + 1, y + dy + py + 1.2) : ctx.moveTo(x + dx + px + 1, y + dy + py + 1.2)));
          ctx.fill();
          ctx.fillStyle = light;
          ctx.beginPath();
          pts.forEach(([px, py], k) => (k ? ctx.lineTo(x + dx + px, y + dy + py) : ctx.moveTo(x + dx + px, y + dy + py)));
          ctx.fill();
        });
      }
    },
  ],
  // Moor, Sumpf, Feuchtwiese: Pfützen und Schilf
  'pat-wetland': [
    128,
    (ctx, s) => {
      ctx.fillStyle = '#6d7650';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('moor');
      blotches(ctx, s, r, 18, 10, 30, ['rgba(90, 104, 66, 0.4)', 'rgba(120, 120, 70, 0.3)']);
      for (let i = 0; i < 9; i++) {
        const x = r() * s;
        const y = r() * s;
        const w = 6 + r() * 12;
        const h = 3 + r() * 5;
        wrap(s, (dx, dy) => {
          ctx.fillStyle = 'rgba(78, 108, 112, 0.75)';
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, w, h, r() * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(200, 220, 214, 0.25)';
          ctx.beginPath();
          ctx.ellipse(x + dx - w * 0.3, y + dy - h * 0.3, w * 0.3, h * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      blades(ctx, s, r, 200, ['rgba(140, 140, 80, 0.75)', 'rgba(96, 104, 58, 0.75)', 'rgba(170, 150, 96, 0.6)'], 5);
    },
  ],
  // Wohngebiet (Ersatz, falls das Bild der Vorgärten nicht lädt): Höfe, Kies, Rasen
  'pat-gardens': [
    160,
    (ctx, s) => {
      ctx.fillStyle = '#8b856b';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('hof');
      blotches(ctx, s, r, 22, 12, 40, ['rgba(120, 136, 76, 0.4)', 'rgba(160, 150, 120, 0.3)', 'rgba(110, 104, 84, 0.25)']);
      blades(ctx, s, r, 120, ['rgba(100, 116, 60, 0.6)', 'rgba(150, 160, 96, 0.5)'], 3);
      specks(ctx, s, r, 90, ['rgba(180, 172, 150, 0.6)', 'rgba(96, 90, 76, 0.5)'], [0.7, 1.5]);
    },
  ],
  // Risse und Schlaglöcher für Straßen. Die Bildhöhe entspricht der Straßenbreite,
  // deshalb nur wenige, diagonale Risse (sonst wirkt es wie Bahngleise).
  'pat-cracks': [
    96,
    (ctx, s) => {
      ctx.clearRect(0, 0, s, s);
      const r = rngFrom('risse2');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(52, 48, 42, 0.55)';
      for (const [sx, sy] of [[8, 30], [52, 66], [70, 20]]) {
        let x = sx;
        let y = sy;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += 3 + r() * 6;
          y += (r() < 0.5 ? -1 : 1) * (4 + r() * 6);
          ctx.lineTo(x, Math.max(10, Math.min(s - 10, y)));
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(60, 56, 50, 0.45)';
      ctx.beginPath();
      ctx.ellipse(s * 0.33, s * 0.6, 5, 3.4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Ein Grasbüschel, das durch den Asphalt wächst
      ctx.strokeStyle = 'rgba(110, 128, 64, 0.8)';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(s * 0.7 + i, s * 0.45);
        ctx.lineTo(s * 0.7 + i + (r() - 0.5) * 3, s * 0.45 - 3 - r() * 3);
        ctx.stroke();
      }
    },
  ],
  // Wasser: blaugrün, sanfte Wellen und Lichtpunkte (bewegt sich, siehe waterFrames)
  'pat-water': [
    WATER_SIZE,
    (ctx, s) => {
      paintWaterBase(ctx, s);
      paintWaterMotion(ctx, s, 0);
    },
  ],
  // Alte Äcker-Vorlage (bleibt für ältere Stile)
  'pat-farm': field('#8f7250', '#7a5e40', '#a2845d', 'acker-erde'),
  // Gewerbe und Industrie: Beton mit Rissen, Kies und Unkraut
  'pat-rubble': [
    128,
    (ctx, s) => {
      ctx.fillStyle = '#86837a';
      ctx.fillRect(0, 0, s, s);
      const r = rngFrom('rubble-v2');
      blotches(ctx, s, r, 18, 10, 34, ['rgba(110, 106, 96, 0.35)', 'rgba(150, 146, 134, 0.3)', 'rgba(110, 124, 72, 0.25)']);
      ctx.strokeStyle = 'rgba(80, 76, 68, 0.35)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i <= s; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, s);
        ctx.moveTo(0, i);
        ctx.lineTo(s, i);
        ctx.stroke();
      }
      specks(ctx, s, r, 80, ['rgba(70, 66, 58, 0.5)', 'rgba(180, 176, 160, 0.5)'], [0.8, 2]);
      blades(ctx, s, r, 50, ['rgba(110, 128, 64, 0.7)'], 3);
    },
  ],
};

// --- Wasser ------------------------------------------------------------------------------

/** Was sich nicht bewegt: Grundfarbe und weiche Flecken. */
function paintWaterBase(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = '#577f87';
  ctx.fillRect(0, 0, s, s);
  blotches(ctx, s, rngFrom('wasser-v2'), 14, 14, 44, ['rgba(110, 150, 156, 0.3)', 'rgba(60, 96, 104, 0.3)']);
}

/**
 * Was sich bewegt, zum Zeitpunkt t (0 bis 1, danach geht es nahtlos von vorne los):
 * Wellen schaukeln auf der Stelle hin und her, Lichtpunkte glitzern auf und verlöschen.
 * Jede Welle schwingt 1- oder 2-mal pro Kreislauf, deshalb passt das Ende an den Anfang.
 */
function paintWaterMotion(ctx: CanvasRenderingContext2D, s: number, t: number) {
  const r = rngFrom('wasser-wellen');
  ctx.lineCap = 'round';
  for (let i = 0; i < 24; i++) {
    const x = r() * s;
    const y = r() * s;
    const w = 6 + r() * 12;
    const light = r() < 0.6;
    const width = 1 + r() * 0.6;
    const a = TAU * ((r() < 0.5 ? 1 : 2) * t + r());
    const amp = 1.5 + r() * 2.5;
    const ox = Math.sin(a) * amp;
    const oy = Math.cos(a) * amp * 0.35;
    // Wellen werden kurz heller und wieder schwächer, wie Licht auf bewegtem Wasser
    const fade = 0.55 + 0.45 * Math.sin(a + 1.3);
    ctx.strokeStyle = light ? `rgba(170, 206, 206, ${(0.5 * fade).toFixed(3)})` : `rgba(40, 70, 78, ${(0.38 * fade).toFixed(3)})`;
    ctx.lineWidth = width;
    wrap(s, (dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(x + ox + dx, y + oy + dy);
      ctx.quadraticCurveTo(x + ox + dx + w / 2, y + oy + dy - 2.2, x + ox + dx + w, y + oy + dy);
      ctx.stroke();
    });
  }
  for (let i = 0; i < 22; i++) {
    const x = r() * s;
    const y = r() * s;
    const size = 0.8 + r() * 0.7;
    const glint = Math.max(0, Math.sin(TAU * ((r() < 0.5 ? 1 : 2) * t + r())));
    const alpha = 0.85 * glint * glint;
    if (alpha < 0.03) continue;
    ctx.fillStyle = `rgba(240, 248, 242, ${alpha.toFixed(3)})`;
    wrap(s, (dx, dy) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, (size / 2) * (0.6 + 0.4 * glint), 0, TAU);
      ctx.fill();
    });
  }
}

/**
 * Bilder für das bewegte Wasser (gleich groß wie das Muster 'pat-water').
 * null, wenn es ein gemaltes Wasserbild gibt: das bleibt dann ruhig.
 */
export function waterFrames(n: number): ImageData[] | null {
  if (loaded.has('pat-water')) return null;
  const px = WATER_SIZE * PR;
  const base = document.createElement('canvas');
  base.width = base.height = px;
  const bctx = base.getContext('2d')!;
  bctx.scale(PR, PR);
  paintWaterBase(bctx, WATER_SIZE);
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const frames: ImageData[] = [];
  for (let f = 0; f < n; f++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0);
    ctx.scale(PR, PR);
    paintWaterMotion(ctx, WATER_SIZE, f / n);
    frames.push(ctx.getImageData(0, 0, px, px));
  }
  return frames;
}

/** Für map.on('styleimagemissing'): liefert ein Muster, falls wir es kennen. */
export function patternImage(id: string): { data: ImageData; pixelRatio: number } | null {
  const img = loaded.get(id);
  if (img) return img;
  const p = PAINTERS[id];
  if (!p) return null;
  return { data: make(p[0], p[1]), pixelRatio: PR };
}
