// Gemalte Hintergründe für den Kampf (Kevin 23.10.): ein Bild ganz hinten wie ein Bühnenbild,
// Boden, Figuren und ein paar Sachen davor bleiben 3D. Ohne Bild bleibt die 3D-Kulisse.
//
// Dateien: src/assets/kampf/kampf-<gegend>[-<jahreszeit>].webp, z. B. kampf-dorf.webp oder
// kampf-dorf-winter.webp. Aus Kevins Original (kunst/kampf/…) macht sie scripts/kampf-hintergrund.py.

import type { RegionId, Season } from '../core/types';

const FILES = import.meta.glob<string>('../assets/kampf/kampf-*.webp', { eager: true, import: 'default' });
const BY_NAME = new Map(Object.entries(FILES).map(([path, url]) => [path.replace(/^.*\/kampf-|\.webp$/g, ''), url]));

/** So heißen die Gegenden in den Dateinamen. */
export const BACKDROP_REGION: Record<RegionId, string> = {
  village: 'dorf',
  town: 'kleinstadt',
  city: 'stadt',
  wild: 'wald',
  mountain: 'berge',
  coast: 'kueste',
  desert: 'wueste',
  snow: 'schnee',
};

export const BACKDROP_SEASON: Record<Season, string> = { spring: 'fruehling', summer: 'sommer', autumn: 'herbst', winter: 'winter' };

/**
 * Wo im Bild der Boden liegt (Anteil der Bildhöhe von unten): Diese Linie steht im Spiel auf dem
 * 3D-Boden, alles darunter verschwindet dahinter. So passt auch ein Bild, dessen Häuser höher stehen.
 */
const GROUND: Record<string, number> = {
  // Kevins Dorfrand (23.10.): vorne Wiese, die Zäune stehen gut ein Fünftel über dem unteren Rand
  dorf: 0.21,
  // Kevins Kleinstadt (24.10.): vorne Unkraut, dahinter ein Streifen Kopfsteinpflaster, die Häuser stehen bei 0,18
  kleinstadt: 0.12,
  // Kevins Wald (24.10.): vorne Farn, der umgestürzte Stamm liegt bei 0,15
  wald: 0.12,
  // Kevins Großstadt (24.10.): vorne Unkraut, dann eine gemalte Straße; die Häuser stehen bei 0,22 auf dem Gehweg
  stadt: 0.2,
  // Kevins Berge (24.10.): vorne Wiese mit Steinen, Hütte und Zaun stehen bei 0,15
  berge: 0.13,
  // Kevins Küste (24.10.): vorne Uferwiese, Hütten und Steg stehen bei 0,17
  kueste: 0.15,
  // Kevins Schneeland und Steppe (24.10.), je ein Bild fürs ganze Jahr
  schnee: 0.14,
  wueste: 0.16,
};
const DEFAULT_GROUND = 0.03;

export interface Backdrop {
  url: string;
  /** Anteil der Bildhöhe (von unten), der auf dem 3D-Boden steht. */
  ground: number;
  /** Kevins Bodenbilder von der Karte für die 3D-Straße und den Boden daneben (Kevin 24.10.). */
  floor?: Floor;
}

export interface Floor {
  /** Straßenstreifen quer zur Blickrichtung (Bild 1024 × 427, Ränder oben und unten). */
  road: string;
  /** Boden links und rechts der Straße, gekachelt. */
  grass: string;
  /** So viele Meter misst eine Kachel des Bodens. */
  grassM: number;
  /** Abdunkeln (Farbe, mit der das Bild malgenommen wird), Straße und Boden. Schnee bleibt heller. */
  tint: [string, string];
}

const TEX = import.meta.glob<string>('../assets/textures/*.webp', { eager: true, import: 'default' });
const tex = (name: string): string | undefined => TEX[`../assets/textures/${name}.webp`];

/** Welche Straße zur Gegend passt: Hauptstraße in der Stadt, Feldweg in Wald und Bergen, sonst Nebenstraße. */
const FLOOR_ROAD: Record<RegionId, string> = {
  village: 'strasse-neben',
  town: 'strasse-haupt',
  city: 'strasse-haupt',
  wild: 'feldweg',
  mountain: 'feldweg',
  coast: 'strasse-neben',
  desert: 'strasse-neben',
  snow: 'strasse-neben',
};

/** Boden neben der Straße: in Kleinstadt und Stadt Pflaster (wie der Platz im Bild), im Wald Waldboden, sonst Wiese. */
const FLOOR_GROUND: Partial<Record<RegionId, string>> = { town: 'pflaster', city: 'pflaster', wild: 'wald' };

/** Bodenbilder für den Kampf; im Schneeland immer Winter, in der Wüste Sand statt Wiese. */
export function floorFor(region: RegionId, season: Season): Floor | undefined {
  const s = region === 'snow' ? 'winter' : region === 'desert' ? 'sommer' : BACKDROP_SEASON[season];
  const road = tex(`${FLOOR_ROAD[region]}-${s}`) ?? tex(`strasse-neben-${s}`);
  // Waldboden im Winter ist eher dunkel mit Schneeflecken; vor dem verschneiten Wald im Bild passt die Schneewiese besser
  const kind = region === 'wild' && s === 'winter' ? undefined : FLOOR_GROUND[region];
  const own = kind ? tex(`${kind}-${s}`) ?? tex(kind) : undefined;
  const paved = kind === 'pflaster' && !!own;
  const grass = own ?? (region === 'desert' ? tex(`sand-${s}`) ?? tex('sand') : undefined) ?? tex(`wiese-${s}`);
  // Die Bilder sind für die Draufsicht gemalt und wirken im warmen Kampflicht zu hell; Schnee nur
  // wenig abdunkeln und etwas kühler, sonst wird er bräunlich. Pflaster grau statt gelblich.
  const tint: [string, string] = s === 'winter' ? ['#c9ccd2', '#d4d8de'] : ['#8e877c', paved ? '#a29f98' : '#9c9a7e'];
  return road && grass ? { road, grass, grassM: paved ? 2.5 : 3.5, tint } : undefined;
}

/**
 * Das passende Bild: erst Gegend mit Jahreszeit, dann die Gegend allein, sonst das Dorf
 * (solange es erst wenige Bilder gibt). Ohne Bild: null.
 */
export function backdropFor(region: RegionId, season: Season): Backdrop | null {
  const s = BACKDROP_SEASON[season];
  for (const name of [`${BACKDROP_REGION[region]}-${s}`, BACKDROP_REGION[region], `dorf-${s}`, 'dorf']) {
    const url = BY_NAME.get(name);
    if (url) return { url, ground: GROUND[name] ?? GROUND[name.split('-')[0]] ?? DEFAULT_GROUND, floor: floorFor(region, season) };
  }
  return null;
}
