// Boden selbst malen (Probe im Demo-Dorf, Kevin 23.10.): Statt jede Fläche der Karte hart mit
// einem Muster zu füllen, malt das Spiel den Boden Kachel für Kachel selbst:
//   - weiche, unregelmäßige Ränder (wie mit dem Pinsel), Natur wilder, Gebautes ruhiger
//   - rund um Häuser Höfe und Einfahrten, an Straßen im Ort Gehwege, dichte Ortskerne gepflastert,
//     Gärten bleiben dazwischen und dahinter
//   - die Texturen hängen fest am Boden (Meter statt Bildschirmpunkte), nichts springt beim Zoomen
// Die Karte legt die fertigen Bilder als Rasterkacheln unter Wasser, Straßen und Häuser.

/** Eine Fläche oder Linie aus den Kartendaten, in Längen- und Breitengrad. */
export interface GroundFeature {
  layer: string;
  cls: string;
  sub: string;
  id: number;
  /** Flächen: Polygone, jedes mit Ringen aus [lon, lat] (erster Ring außen, weitere Löcher). */
  polys: number[][][][];
  /** Linien aus [lon, lat]. */
  lines: number[][][];
  /** Umriss: West, Süd, Ost, Nord. */
  bbox: [number, number, number, number];
}

/** Liefert alle Flächen und Linien, die den Ausschnitt berühren. */
export type GroundQuery = (w: number, s: number, e: number, n: number) => GroundFeature[];

/** Woher die Bilder kommen (map/patterns.ts, mit den Bildern der Jahreszeit). */
export interface GroundTextures {
  image(id: string): ImageData | null;
  color(id: string): string | undefined;
}

/** Wie ein Rand aussieht: Natur franst aus, Gebautes bleibt ruhiger. */
type Edge = 'wild' | 'soft' | 'crisp' | 'yard';
const EDGES: Record<Edge, { blurM: number; amp: number; scaleM: number }> = {
  wild: { blurM: 2.6, amp: 0.6, scaleM: 7 },
  soft: { blurM: 1.4, amp: 0.34, scaleM: 4 },
  crisp: { blurM: 0.5, amp: 0.14, scaleM: 2.5 },
  // Höfe: unregelmäßig, mal größer, mal kleiner, nie ein glatter Kreis ums Haus
  yard: { blurM: 1.1, amp: 0.55, scaleM: 3.2 },
};

/** Bodenarten: welches Bild, wie viele Meter eine Wiederholung des Bilds abdeckt. */
interface Mat {
  tex: string;
  worldM: number;
  edge: Edge;
}
const MAT = {
  ground: { tex: 'pat-ground', worldM: 16, edge: 'wild' },
  meadow: { tex: 'pat-meadow', worldM: 14, edge: 'wild' },
  lawn: { tex: 'pat-grass', worldM: 10, edge: 'soft' },
  farmA: { tex: 'pat-farm-a', worldM: 22, edge: 'wild' },
  farmB: { tex: 'pat-farm-b', worldM: 22, edge: 'wild' },
  wood: { tex: 'pat-forest-floor', worldM: 7, edge: 'wild' },
  woodFar: { tex: 'pat-forest', worldM: 40, edge: 'wild' },
  wet: { tex: 'pat-wetland', worldM: 10, edge: 'wild' },
  sand: { tex: 'pat-sand', worldM: 10, edge: 'wild' },
  gravel: { tex: 'pat-gravel', worldM: 12, edge: 'soft' },
  rock: { tex: 'pat-rock', worldM: 12, edge: 'wild' },
  pitch: { tex: 'pat-pitch', worldM: 16, edge: 'soft' },
  playground: { tex: 'pat-playground', worldM: 10, edge: 'soft' },
  gardens: { tex: 'pat-gardens', worldM: 18, edge: 'wild' },
  townLawn: { tex: 'pat-grass', worldM: 10, edge: 'soft' },
  wild: { tex: 'pat-wild', worldM: 12, edge: 'wild' },
  asphalt: { tex: 'pat-asphalt', worldM: 10, edge: 'soft' },
  commercial: { tex: 'pat-commercial', worldM: 10, edge: 'soft' },
  industrial: { tex: 'pat-industrial', worldM: 12, edge: 'soft' },
  railyard: { tex: 'pat-railyard', worldM: 12, edge: 'soft' },
  quarry: { tex: 'pat-quarry', worldM: 14, edge: 'wild' },
  paved: { tex: 'pat-paved', worldM: 8, edge: 'soft' },
  yard: { tex: 'pat-yard', worldM: 7, edge: 'yard' },
  walk: { tex: 'pat-paved', worldM: 8, edge: 'crisp' },
} satisfies Record<string, Mat>;
type MatId = keyof typeof MAT;

/** Wie breit die Straßen der Karte gemalt sind (Meter), damit der Gehweg daneben anfängt. */
const ROAD_M: Record<string, number> = { motorway: 9, trunk: 9, primary: 8.5, secondary: 8.5, tertiary: 7, minor: 5.6, residential: 5.6, unclassified: 5.6, living_street: 5, service: 4 };
const PARK = ['park', 'garden', 'village_green', 'recreation_ground', 'golf_course', 'flowerbed'];

/** Ortsteile: so dicht bebaut ist ein Kern (Anteil Hausfläche im Umkreis von ~20 m). */
const CORE = { radiusM: 20, from: 0.24, full: 0.36 };
/** Hof rund ums Haus (Meter) und Gehweg neben der Straße (Meter je Seite). */
const YARD_M = 3;
const WALK_M = 1.5;
/** Einfahrt vom Haus zur Straße: so breit (Meter), nur wenn die Straße so nah ist (Meter). */
const DRIVE = { widthM: 3, maxM: 30 };
/** Gärten im Ort: Flecken von etwa dieser Größe (Meter), dazwischen Rasen. Anteil grob 1 - cut. */
const GARDEN = { scaleM: 24, cut: 0.5 };
/** Verwilderter Rasen im Ort: Flecken dieser Größe (Meter), Anteil grob 1 - cut. */
const WILD = { scaleM: 17, cut: 0.46 };
/** In dichten Kernen: große Asphaltflächen statt Pflaster, Flecken dieser Größe (Meter). */
const ASPHALT = { scaleM: 55, cut: 0.52 };
/** Feinheit der Masken (Meter je Zelle, höchstens). */
const CELL_M = 0.6;
/** So weit über die Kachel hinaus zählen Häuser für die Dichte (Meter). */
const DENSITY_EXT_M = 30;

const S = 512;
const MARGIN = 48;
const W = S + 2 * MARGIN;
const EARTH = 40075016.686;

const PARK_SET = new Set(PARK);

function mercY(lat: number) {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}
function tileLon(x: number, z: number) {
  return (x / 2 ** z) * 360 - 180;
}
function tileLat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

// --- Rauschen für unregelmäßige Ränder (fest an der Welt, damit Kacheln nahtlos passen) ---------
function hash(ix: number, iy: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) {
  return 0.62 * vnoise(x, y) + 0.38 * vnoise(x * 2.7 + 13.1, y * 2.7 + 7.3);
}

/** Weichzeichnen (zweimal Kastenfilter, fast wie Gauß), in place. */
function blur(a: Float32Array, n: number, r: number) {
  if (r < 1) return;
  const tmp = new Float32Array(a.length);
  for (let pass = 0; pass < 2; pass++) {
    // waagerecht
    for (let y = 0; y < n; y++) {
      let sum = 0;
      const row = y * n;
      for (let x = -r; x <= r; x++) sum += a[row + Math.min(n - 1, Math.max(0, x))];
      for (let x = 0; x < n; x++) {
        tmp[row + x] = sum / (2 * r + 1);
        sum += a[row + Math.min(n - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    // senkrecht
    for (let x = 0; x < n; x++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) sum += tmp[Math.min(n - 1, Math.max(0, y)) * n + x];
      for (let y = 0; y < n; y++) {
        a[y * n + x] = sum / (2 * r + 1);
        sum += tmp[Math.min(n - 1, y + r + 1) * n + x] - tmp[Math.max(0, y - r) * n + x];
      }
    }
  }
}

function canvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
type C2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
function ctx2d(c: HTMLCanvasElement | OffscreenCanvas, read = false): C2D {
  return c.getContext('2d', read ? { willReadFrequently: true } : undefined) as C2D;
}

/** Ein Bild in mehreren Größen (halbiert), damit kleine Wiederholungen nicht flimmern. */
interface Mips {
  levels: (HTMLCanvasElement | OffscreenCanvas)[];
  color: string;
}

export class GroundPainter {
  private mips = new Map<string, Mips | null>();
  private mask = canvas(8, 8);
  private maskCtx = ctx2d(this.mask, true);
  private main = canvas(W, W);
  private mainCtx = ctx2d(this.main);
  private layer = canvas(W, W);
  private layerCtx = ctx2d(this.layer);

  constructor(
    private query: GroundQuery,
    private tex: GroundTextures,
  ) {}

  /** Neue Bilder (Jahreszeit): alles neu zuschneiden. */
  invalidate() {
    this.mips.clear();
  }

  private mipsOf(id: string): Mips | null {
    if (this.mips.has(id)) return this.mips.get(id)!;
    const data = this.tex.image(id);
    if (!data) {
      this.mips.set(id, null);
      return null;
    }
    const base = canvas(data.width, data.height);
    ctx2d(base).putImageData(data, 0, 0);
    const levels = [base];
    let w = data.width;
    let h = data.height;
    while (w > 16 && h > 16) {
      w = Math.max(1, Math.round(w / 2));
      h = Math.max(1, Math.round(h / 2));
      const c = canvas(w, h);
      const cx = ctx2d(c);
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(levels[levels.length - 1], 0, 0, w, h);
      levels.push(c);
    }
    const m = { levels, color: this.tex.color(id) ?? '#7a7356' };
    this.mips.set(id, m);
    return m;
  }

  /** Eine Kachel malen. */
  async paint(z: number, x: number, y: number): Promise<ImageBitmap> {
    const zs = 2 ** z * S;
    const ox = x * S - MARGIN;
    const oy = y * S - MARGIN;
    // Breitengrad der Kachel (mit Rand)
    const north = tileLat(oy / S, z);
    const south = tileLat((oy + W) / S, z);
    const latC = (north + south) / 2;
    // Für Bildgröße und Rauschen ein fester Breitengrad je Gradband: so passen Nachbarkacheln nahtlos
    const latRef = Math.floor(latC) + 0.5;
    const metersPerWorld = EARTH * Math.cos((latRef * Math.PI) / 180);
    const mpp = metersPerWorld / zs;
    const cell = Math.max(1, Math.round(Math.max(CELL_M, mpp * 2) / mpp));
    const n = Math.ceil(W / cell);
    if (this.mask.width !== n) {
      this.mask.width = n;
      this.mask.height = n;
      this.maskCtx = ctx2d(this.mask, true);
    }
    const toPx = (lon: number, lat: number): [number, number] => [((lon + 180) / 360) * zs - ox, mercY(lat) * zs - oy];
    // Für die Dichte der Häuser auch etwas weiter drumherum schauen (sonst Nähte zwischen Kacheln)
    const ext = Math.ceil(DENSITY_EXT_M / mpp);
    const feats = this.query(tileLon((ox - ext) / S, z), tileLat((oy + W + ext) / S, z), tileLon((ox + W + ext) / S, z), tileLat((oy - ext) / S, z));

    // --- Flächen sortieren -------------------------------------------------------------------
    const groups = new Map<MatId, GroundFeature[]>();
    const add = (k: MatId, f: GroundFeature) => (groups.get(k) ?? groups.set(k, []).get(k)!).push(f);
    const settle: GroundFeature[] = [];
    const buildings: GroundFeature[] = [];
    const roads: { f: GroundFeature; m: number }[] = [];
    for (const f of feats) {
      const { layer, cls, sub } = f;
      if (layer === 'landcover') {
        if (cls === 'farmland') add((['farmA', 'farmB'] as const)[Math.abs(f.id) % 2], f);
        else if (cls === 'grass' || cls === 'meadow') add(PARK_SET.has(sub) ? 'lawn' : 'meadow', f);
        else if (cls === 'wood' || cls === 'forest') add(z < 15 && this.tex.image('pat-forest') ? 'woodFar' : 'wood', f);
        else if (cls === 'wetland') add('wet', f);
        else if (cls === 'sand') add(sub === 'beach' || sub === 'dune' ? 'sand' : 'gravel', f);
        else if (cls === 'rock') add('rock', f);
      } else if (layer === 'landuse') {
        if (cls === 'residential' || cls === 'suburb' || cls === 'neighbourhood') {
          add('gardens', f);
          settle.push(f);
        } else if (cls === 'commercial' || cls === 'retail') {
          add('commercial', f);
          settle.push(f);
        } else if (cls === 'industrial' || cls === 'garages') {
          add('industrial', f);
          settle.push(f);
        } else if (cls === 'railway') {
          add('railyard', f);
          settle.push(f);
        } else if (cls === 'quarry') add('quarry', f);
        else if (cls === 'pitch' || cls === 'stadium') add('pitch', f);
        else if (cls === 'playground') add('playground', f);
        else if (cls === 'park' || cls === 'school') add('lawn', f);
      } else if (layer === 'building') buildings.push(f);
      else if (layer === 'transportation' && f.lines.length && ROAD_M[cls]) roads.push({ f, m: ROAD_M[cls] });
    }

    // --- Masken -------------------------------------------------------------------------------
    const mctx = this.maskCtx;
    const raster = (draw: (c: C2D) => void): Float32Array => {
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, n, n);
      mctx.setTransform(1 / cell, 0, 0, 1 / cell, 0, 0);
      mctx.fillStyle = '#fff';
      mctx.strokeStyle = '#fff';
      draw(mctx);
      const d = mctx.getImageData(0, 0, n, n).data;
      const a = new Float32Array(n * n);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;
      return a;
    };
    const pathPoly = (c: C2D, poly: number[][][]) => {
      c.beginPath();
      for (const ring of poly) {
        ring.forEach(([lon, lat], i) => {
          const [px, py] = toPx(lon, lat);
          if (i) c.lineTo(px, py);
          else c.moveTo(px, py);
        });
        c.closePath();
      }
    };
    /** Jede Fläche einzeln füllen (Löcher bleiben frei, Überlappungen nicht). */
    const fillEach = (c: C2D, list: GroundFeature[]) => {
      for (const f of list)
        for (const poly of f.polys) {
          pathPoly(c, poly);
          c.fill('evenodd');
        }
    };
    const fillPolys = (list: GroundFeature[]) => raster((c) => fillEach(c, list));
    /** Welt-Meter einer Maskenzelle (für das Rauschen). */
    const wx = (i: number) => (((ox + (i + 0.5) * cell) / zs) * metersPerWorld);
    const wy = (j: number) => (((oy + (j + 0.5) * cell) / zs) * metersPerWorld);
    const cellM = cell * mpp;
    /** Ränder formen: weichzeichnen, mit Rauschen ausfransen, wieder etwas schärfen. */
    const shape = (a: Float32Array, edge: Edge): number => {
      const e = EDGES[edge];
      blur(a, n, Math.round(e.blurM / cellM));
      let max = 0;
      const k = 1 / e.scaleM;
      for (let j = 0; j < n; j++) {
        const yy = wy(j) * k;
        for (let i = 0; i < n; i++) {
          const idx = j * n + i;
          const v0 = a[idx];
          if (v0 <= 0.001) {
            a[idx] = 0;
            continue;
          }
          // Mitten in der Fläche bleibt es voll (das Rauschen reicht dort nicht hin)
          if (v0 >= 0.999) {
            a[idx] = 1;
            max = 1;
            continue;
          }
          const v = v0 + (fbm(wx(i) * k, yy) - 0.5) * e.amp;
          const t = Math.min(1, Math.max(0, (v - 0.32) / 0.36));
          const s = t * t * (3 - 2 * t);
          a[idx] = s;
          if (s > max) max = s;
        }
      }
      return max;
    };

    /** Nur Flecken einer Fläche behalten (Rauschen in Weltmetern, Größe scaleM, Anteil grob 1 - cut). */
    const blobs = (a: Float32Array, scaleM: number, cut: number, dx: number, dy: number): Float32Array => {
      const k = 1 / scaleM;
      for (let j = 0; j < n; j++) {
        const yy = wy(j) * k + dy;
        for (let i = 0; i < n; i++) {
          const idx = j * n + i;
          if (a[idx] <= 0) continue;
          a[idx] *= Math.min(1, Math.max(0, (fbm(wx(i) * k + dx, yy) - cut) / 0.14));
        }
      }
      return a;
    };

    // --- Malen --------------------------------------------------------------------------------
    const main = this.mainCtx;
    const lay = this.layerCtx;
    const fillWith = (c: C2D, id: MatId) => {
      const mat: Mat = MAT[id];
      const m = this.mipsOf(mat.tex);
      const period = mat.worldM / mpp;
      if (!m || period < 12) {
        c.fillStyle = m?.color ?? this.tex.color(mat.tex) ?? '#7a7356';
        c.fillRect(0, 0, W, W);
        return;
      }
      // Kleinste Stufe, die noch mindestens so groß ist wie eine Wiederholung
      let lvl = m.levels[0];
      for (const l of m.levels) if (l.width >= period) lvl = l;
      const pat = c.createPattern(lvl, 'repeat')!;
      const sc = period / lvl.width;
      const tx = -(((ox % period) + period) % period);
      const ty = -(((oy % period) + period) % period);
      pat.setTransform(new DOMMatrix([sc, 0, 0, sc, tx, ty]));
      c.fillStyle = pat;
      c.fillRect(0, 0, W, W);
    };
    const maskCanvas = this.mask;
    const maskData = (a: Float32Array) => {
      const img = mctx.createImageData(n, n);
      for (let i = 0; i < a.length; i++) {
        img.data[i * 4] = 255;
        img.data[i * 4 + 1] = 255;
        img.data[i * 4 + 2] = 255;
        img.data[i * 4 + 3] = Math.round(a[i] * 255);
      }
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.putImageData(img, 0, 0);
    };
    const layerWith = (id: MatId, a: Float32Array) => {
      maskData(a);
      lay.globalCompositeOperation = 'source-over';
      lay.clearRect(0, 0, W, W);
      fillWith(lay, id);
      lay.globalCompositeOperation = 'destination-in';
      lay.imageSmoothingEnabled = true;
      lay.drawImage(maskCanvas, 0, 0, n, n, 0, 0, n * cell, n * cell);
      lay.globalCompositeOperation = 'source-over';
      main.drawImage(this.layer, 0, 0);
    };
    const paintMat = (id: MatId, a: Float32Array | null) => {
      if (!a) return;
      if (shape(a, MAT[id].edge) > 0.01) layerWith(id, a);
    };

    main.globalCompositeOperation = 'source-over';
    fillWith(main, 'ground');

    const order: MatId[] = ['meadow', 'farmA', 'farmB', 'lawn', 'pitch', 'playground', 'wood', 'woodFar', 'wet', 'sand', 'gravel', 'rock', 'gardens', 'commercial', 'industrial', 'railyard', 'quarry'];
    for (const id of order) {
      const list = groups.get(id);
      if (!list?.length) continue;
      if (id === 'gardens') {
        // Wohngebiet: Rasen als Grund, darauf Gartenflecken mit Büschen und Beeten (nicht alles grün zugewuchert)
        paintMat('townLawn', fillPolys(list));
        // Verwilderte Flecken und Gärten: je eigene Flecken im Rasen
        paintMat('wild', blobs(fillPolys(list), WILD.scaleM, WILD.cut, 71.3, 12.9));
        paintMat('gardens', blobs(fillPolys(list), GARDEN.scaleM, GARDEN.cut, 31.7, 5.3));
        continue;
      }
      paintMat(id, fillPolys(list));
    }

    // Ortskerne, Höfe und Gehwege: nur, wenn man nah genug ist, dass man sie sieht
    if (z >= 15 && (settle.length || buildings.length)) {
      const town = settle.length ? fillPolys(settle) : new Float32Array(n * n);
      // Dichte: Anteil Hausfläche im Umkreis (auf einem gröberen Raster, das weiter über die Kachel reicht)
      const dens = this.density(buildings, toPx, mpp, ext, n, cell, CORE.radiusM);
      const near = this.density(buildings, toPx, mpp, ext, n, cell, 12);
      const core = new Float32Array(n * n);
      for (let i = 0; i < core.length; i++) {
        const t = Math.min(1, Math.max(0, (dens[i] - CORE.from) / (CORE.full - CORE.from)));
        core[i] = Math.max(town[i], Math.min(1, dens[i] * 4)) * t;
      }
      paintMat('paved', core);
      // Große Flächen im Kern: mal Asphalt, mal Pflaster
      paintMat('asphalt', blobs(core, ASPHALT.scaleM, ASPHALT.cut, 3.1, 47.7));
      if (buildings.length && z >= 16) {
        // Straßen als Strecken in Bildpunkten (für die Einfahrten)
        const segs: number[][] = [];
        for (const { f } of roads)
          for (const line of f.lines)
            for (let i = 1; i < line.length; i++) segs.push([...toPx(line[i - 1][0], line[i - 1][1]), ...toPx(line[i][0], line[i][1])]);
        const maxPx = DRIVE.maxM / mpp;
        const yard = raster((c) => {
          c.lineJoin = 'round';
          c.lineCap = 'round';
          c.lineWidth = (2 * YARD_M) / mpp;
          for (const f of buildings)
            for (const poly of f.polys) {
              pathPoly(c, poly);
              c.fill('evenodd');
              c.stroke();
            }
          // Einfahrten: vom Haus geradewegs zur nächsten Straße
          c.lineWidth = DRIVE.widthM / mpp;
          c.beginPath();
          for (const f of buildings) {
            const ring = f.polys[0]?.[0];
            if (!ring?.length) continue;
            let cx = 0;
            let cy = 0;
            for (const [lon, lat] of ring) {
              const [px, py] = toPx(lon, lat);
              cx += px;
              cy += py;
            }
            cx /= ring.length;
            cy /= ring.length;
            let best: [number, number] | null = null;
            let bd = maxPx;
            for (const [ax, ay, bx, by] of segs) {
              const dx = bx - ax;
              const dy = by - ay;
              const l2 = dx * dx + dy * dy;
              const t = l2 ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / l2)) : 0;
              const qx = ax + dx * t;
              const qy = ay + dy * t;
              const d = Math.hypot(cx - qx, cy - qy);
              if (d < bd) {
                bd = d;
                best = [qx, qy];
              }
            }
            if (best) {
              c.moveTo(cx, cy);
              c.lineTo(best[0], best[1]);
            }
          }
          c.stroke();
        });
        paintMat('yard', yard);
      }
      if (roads.length && z >= 16) {
        // Gehwege nur im Ort: in Wohngebieten oder wo Häuser in der Nähe stehen
        const walk = raster((c) => {
          c.lineJoin = 'round';
          c.lineCap = 'round';
          for (const { f, m } of roads) {
            c.lineWidth = (m + 2 * WALK_M) / mpp;
            c.beginPath();
            for (const line of f.lines)
              line.forEach(([lon, lat], i) => {
                const [px, py] = toPx(lon, lat);
                if (i) c.lineTo(px, py);
                else c.moveTo(px, py);
              });
            c.stroke();
          }
        });
        for (let i = 0; i < walk.length; i++) walk[i] *= Math.min(1, Math.max(town[i], near[i] * 6));
        paintMat('walk', walk);
      }
    }

    // Ohne Rand zurückgeben
    return createImageBitmap(this.main, MARGIN, MARGIN, S, S);
  }

  private dens = canvas(8, 8);
  private densCtx = ctx2d(this.dens, true);

  /**
   * Anteil Hausfläche im Umkreis von radiusM, für jede Maskenzelle. Gerechnet auf einem groben
   * Raster (~2 m), das ext Bildpunkte über die Kachel hinausreicht, damit Nachbarkacheln gleich rechnen.
   */
  private density(buildings: GroundFeature[], toPx: (lon: number, lat: number) => [number, number], mpp: number, ext: number, n: number, cell: number, radiusM: number): Float32Array {
    const out = new Float32Array(n * n);
    if (!buildings.length) return out;
    const dc = Math.max(1, Math.round(2 / mpp));
    const dn = Math.ceil((W + 2 * ext) / dc);
    if (this.dens.width !== dn) {
      this.dens.width = dn;
      this.dens.height = dn;
      this.densCtx = ctx2d(this.dens, true);
    }
    const c = this.densCtx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, dn, dn);
    c.setTransform(1 / dc, 0, 0, 1 / dc, ext / dc, ext / dc);
    c.fillStyle = '#fff';
    for (const f of buildings)
      for (const poly of f.polys) {
        c.beginPath();
        for (const ring of poly) {
          ring.forEach(([lon, lat], i) => {
            const [px, py] = toPx(lon, lat);
            if (i) c.lineTo(px, py);
            else c.moveTo(px, py);
          });
          c.closePath();
        }
        c.fill('evenodd');
      }
    const d = c.getImageData(0, 0, dn, dn).data;
    const a = new Float32Array(dn * dn);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;
    blur(a, dn, Math.max(1, Math.round(radiusM / (dc * mpp) / 1.7)));
    for (let j = 0; j < n; j++) {
      const dy = Math.min(dn - 1, Math.floor(((j + 0.5) * cell + ext) / dc));
      for (let i = 0; i < n; i++) out[j * n + i] = a[dy * dn + Math.min(dn - 1, Math.floor(((i + 0.5) * cell + ext) / dc))];
    }
    return out;
  }
}

/** Flächen und Linien aus GeoJSON (Demo-Dorf) mit schneller Suche nach Ausschnitt. */
export function geojsonQuery(fc: GeoJSON.FeatureCollection): GroundQuery {
  const list: GroundFeature[] = [];
  fc.features.forEach((f, idx) => {
    const p = (f.properties ?? {}) as Record<string, unknown>;
    const layer = String(p._layer ?? '');
    if (!['landcover', 'landuse', 'building', 'transportation'].includes(layer)) return;
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    if (!polys.length && !lines.length) return;
    let w = Infinity;
    let s = Infinity;
    let e = -Infinity;
    let n = -Infinity;
    for (const ring of [...polys.flat(), ...lines])
      for (const [lon, lat] of ring) {
        w = Math.min(w, lon);
        e = Math.max(e, lon);
        s = Math.min(s, lat);
        n = Math.max(n, lat);
      }
    list.push({ layer, cls: String(p.class ?? ''), sub: String(p.subclass ?? ''), id: typeof f.id === 'number' ? f.id : idx, polys: polys as number[][][][], lines: lines as number[][][], bbox: [w, s, e, n] });
  });
  return (w, s, e, n) => list.filter((f) => f.bbox[0] <= e && f.bbox[2] >= w && f.bbox[1] <= n && f.bbox[3] >= s);
}
