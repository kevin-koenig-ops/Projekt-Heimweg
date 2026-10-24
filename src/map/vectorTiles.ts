// Kartenkacheln der echten Karte selbst lesen (OpenFreeMap, Aufbau „OpenMapTiles“), für den
// gemalten Boden. Läuft im Hintergrund-Thread (groundWorker.ts), braucht kein DOM.
//
// Die Karte hat Daten bis Stufe 14; für nähere Kacheln nimmt man die Stufe-14-Kachel, die sie
// enthält. Flächen sind an den Kachelgrenzen abgeschnitten (mit etwas Überlappung), deshalb
// werden für eine Bodenkachel alle Datenkacheln gelesen, die sie berührt.

import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import type { GroundFeature, GroundQuery } from './groundPaint';

/** Diese Schichten braucht der Boden: Bewuchs, Nutzung, Häuser, Straßen. */
const LAYERS = ['landcover', 'landuse', 'building', 'transportation'];
/** So viele Datenkacheln bleiben gelesen im Speicher (je Kachel einige hundert Flächen). */
const KEEP = 24;
/** Mehr Datenkacheln liest eine Bodenkachel nie (sonst ist der Ausschnitt viel zu groß). */
const MAX_TILES = 9;

/** Eine Datenkachel (Bytes) in Flächen und Linien mit Längen- und Breitengrad umwandeln. */
export function decodeTile(buf: ArrayBuffer | Uint8Array, x: number, y: number, z: number): GroundFeature[] {
  const tile = new VectorTile(new Pbf(buf instanceof Uint8Array ? buf : new Uint8Array(buf)));
  const out: GroundFeature[] = [];
  for (const name of LAYERS) {
    const layer = tile.layers[name];
    if (!layer) continue;
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      if (f.type !== 2 && f.type !== 3) continue;
      const g = f.toGeoJSON(x, y, z).geometry;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      if (!polys.length && !lines.length) continue;
      let w = Infinity;
      let s = Infinity;
      let e = -Infinity;
      let n = -Infinity;
      for (const ring of [...polys.flat(), ...lines])
        for (const [lon, lat] of ring) {
          if (lon < w) w = lon;
          if (lon > e) e = lon;
          if (lat < s) s = lat;
          if (lat > n) n = lat;
        }
      const p = f.properties;
      const cls = String(p.class ?? '');
      // Ohne Nummer in den Daten 0 (wie im Kartenstil): eine Nummer aus der Lage würde sich an
      // Kachelgrenzen ändern, weil die Flächen dort abgeschnitten sind (ein Feld hätte dann zwei Sorten)
      out.push({ layer: name, cls, sub: String(p.subclass ?? ''), id: f.id ?? 0, polys: polys as number[][][][], lines: lines as number[][][], bbox: [w, s, e, n] });
    }
  }
  return out;
}

function lonToTileX(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}
function latToTileY(lat: number, z: number) {
  const s = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z);
}

/** Holt eine Datenkachel; null = dort gibt es keine Daten (zum Beispiel offenes Meer). */
export type TileFetch = (url: string) => Promise<ArrayBuffer | null>;

const defaultFetch: TileFetch = async (url) => {
  const res = await fetch(url);
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Kachel ${res.status}`);
  return res.arrayBuffer();
};

/**
 * Abfrage für den Maler: liest die Datenkacheln (Adresse mit {z}/{x}/{y}) rund um den Ausschnitt,
 * merkt sich die letzten und liefert alle Flächen und Linien, die den Ausschnitt berühren.
 */
export function mvtQuery(template: string, maxzoom = 14, load: TileFetch = defaultFetch): GroundQuery {
  const cache = new Map<string, Promise<GroundFeature[]>>();
  const tile = (x: number, y: number, z: number): Promise<GroundFeature[]> => {
    const key = `${z}/${x}/${y}`;
    const hit = cache.get(key);
    if (hit) {
      // Zuletzt benutzt ans Ende, damit es zuletzt vergessen wird
      cache.delete(key);
      cache.set(key, hit);
      return hit;
    }
    const url = template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
    const p = load(url).then((buf) => (buf ? decodeTile(buf, x, y, z) : []));
    // Fehler (kein Netz) nicht merken, beim nächsten Mal neu versuchen
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    while (cache.size > KEEP) cache.delete(cache.keys().next().value!);
    return p;
  };
  return async (w, s, e, n) => {
    const z = maxzoom;
    const x0 = lonToTileX(w, z);
    const x1 = lonToTileX(e, z);
    const y0 = latToTileY(n, z);
    const y1 = latToTileY(s, z);
    const jobs: Promise<GroundFeature[]>[] = [];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (jobs.length < MAX_TILES) jobs.push(tile(tx, ty, z));
    const out: GroundFeature[] = [];
    for (const list of await Promise.all(jobs)) for (const f of list) if (f.bbox[0] <= e && f.bbox[2] >= w && f.bbox[1] <= n && f.bbox[3] >= s) out.push(f);
    return out;
  };
}
