// Hintergrund-Thread für den gemalten Boden: liest die Kartendaten und malt die Kacheln, ohne
// dass die Karte dabei ruckelt. Der Hauptthread schickt Bilder und Aufträge (groundService.ts).

import { GroundPainter, geojsonQuery, type GroundFeature } from './groundPaint';
import { mvtQuery } from './vectorTiles';

/** Woher die Flächen kommen: Demo-Dorf (GeoJSON) oder Kartenkacheln der echten Karte. */
export type GroundSource = { kind: 'geojson'; fc: GeoJSON.FeatureCollection } | { kind: 'mvt'; template: string; maxzoom: number };

/** Bodenbilder und ihre Mittelfarben (aus map/patterns.ts, je Jahreszeit). */
export interface GroundImages {
  images: Record<string, ImageData | null>;
  colors: Record<string, string | undefined>;
}

export type ToGroundWorker =
  | ({ type: 'init'; source: GroundSource } & GroundImages)
  | ({ type: 'images' } & GroundImages)
  | { type: 'paint'; id: number; z: number; x: number; y: number }
  | { type: 'cancel'; id: number };

export interface FromGroundWorker {
  id: number;
  bitmap?: ImageBitmap;
  error?: string;
  ms?: number;
}

const scope = self as unknown as {
  postMessage(m: FromGroundWorker, transfer?: Transferable[]): void;
  onmessage: ((e: MessageEvent<ToGroundWorker>) => void) | null;
};

let painter: GroundPainter | null = null;
let imgs: GroundImages = { images: {}, colors: {} };
const canceled = new Set<number>();
/** Gemalt wird nacheinander (die Leinwände sind geteilt), geladen wird gleichzeitig. */
let queue: Promise<void> = Promise.resolve();

scope.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'init') {
    imgs = { images: m.images, colors: m.colors };
    const query = m.source.kind === 'geojson' ? geojsonQuery(m.source.fc) : mvtQuery(m.source.template, m.source.maxzoom);
    painter = new GroundPainter(query, { image: (id) => imgs.images[id] ?? null, color: (id) => imgs.colors[id] });
  } else if (m.type === 'images') {
    imgs = { images: m.images, colors: m.colors };
    painter?.invalidate();
  } else if (m.type === 'cancel') {
    canceled.add(m.id);
  } else if (m.type === 'paint') {
    const p = painter;
    if (!p) {
      scope.postMessage({ id: m.id, error: 'noch nicht bereit' });
      return;
    }
    // Daten sofort anfordern, malen erst, wenn die Kacheln davor fertig sind
    const t0 = performance.now();
    const feats = Promise.resolve(p.features(m.z, m.x, m.y));
    feats.catch(() => undefined);
    queue = queue.then(async () => {
      if (canceled.delete(m.id)) {
        scope.postMessage({ id: m.id, error: 'abgebrochen' });
        return;
      }
      try {
        const list: GroundFeature[] = await feats;
        if (canceled.delete(m.id)) {
          scope.postMessage({ id: m.id, error: 'abgebrochen' });
          return;
        }
        const bitmap = await p.paintFeatures(m.z, m.x, m.y, list);
        scope.postMessage({ id: m.id, bitmap, ms: Math.round(performance.now() - t0) }, [bitmap]);
      } catch (err) {
        scope.postMessage({ id: m.id, error: String(err) });
      }
    });
  }
};
