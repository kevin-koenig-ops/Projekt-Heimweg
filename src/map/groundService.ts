// Gemalter Boden aus Sicht der Karte: schickt die Aufträge an den Hintergrund-Thread
// (groundWorker.ts). Geht das auf einem Gerät nicht, malt der Hauptthread selbst (langsamer).

import { GroundPainter, geojsonQuery, GROUND_TEXTURES } from './groundPaint';
import { mvtQuery } from './vectorTiles';
import type { FromGroundWorker, GroundImages, GroundSource, ToGroundWorker } from './groundWorker';
import GroundWorker from './groundWorker?worker&inline';

interface Pending {
  resolve(b: ImageBitmap): void;
  reject(e: Error): void;
  z: number;
  x: number;
  y: number;
}

export class GroundService {
  private worker: Worker | null = null;
  private local: GroundPainter | null = null;
  private pending = new Map<number, Pending>();
  private seq = 0;
  private imgs: GroundImages;

  constructor(
    private source: GroundSource,
    private images: () => GroundImages,
  ) {
    this.imgs = images();
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      try {
        const w = new GroundWorker();
        w.onmessage = (e: MessageEvent<FromGroundWorker>) => this.done(e.data);
        // Bricht der Hintergrund-Thread zusammen: ab jetzt hier malen, Offenes neu anstoßen
        w.onerror = () => this.fallBack();
        this.post(w, { type: 'init', source, ...this.imgs });
        this.worker = w;
      } catch {
        this.worker = null;
      }
    }
  }

  /** Eine Kachel malen lassen. Mit signal: wird sie nicht mehr gebraucht, fällt der Auftrag weg. */
  paint(z: number, x: number, y: number, signal?: AbortSignal): Promise<ImageBitmap> {
    if (!this.worker) return this.painter().paint(z, x, y);
    const id = ++this.seq;
    return new Promise<ImageBitmap>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, z, x, y });
      signal?.addEventListener('abort', () => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        this.worker?.postMessage({ type: 'cancel', id } satisfies ToGroundWorker);
        reject(new Error('abgebrochen'));
      });
      this.post(this.worker!, { type: 'paint', id, z, x, y });
    });
  }

  /** Neue Bodenbilder (Jahreszeit): ab jetzt mit diesen malen. */
  refresh() {
    this.imgs = this.images();
    this.local?.invalidate();
    if (this.worker) this.post(this.worker, { type: 'images', ...this.imgs });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    for (const p of this.pending.values()) p.reject(new Error('beendet'));
    this.pending.clear();
  }

  private post(w: Worker, m: ToGroundWorker) {
    w.postMessage(m);
  }

  private done(m: FromGroundWorker) {
    const p = this.pending.get(m.id);
    if (!p) {
      m.bitmap?.close();
      return;
    }
    this.pending.delete(m.id);
    if (m.bitmap) {
      if (debug()) console.log(`[Boden] ${p.z}/${p.x}/${p.y} ${m.ms} ms`);
      p.resolve(m.bitmap);
    } else p.reject(new Error(m.error ?? 'Boden'));
  }

  private painter(): GroundPainter {
    if (!this.local) {
      const query = this.source.kind === 'geojson' ? geojsonQuery(this.source.fc) : mvtQuery(this.source.template, this.source.maxzoom);
      this.local = new GroundPainter(query, { image: (id) => this.imgs.images[id] ?? null, color: (id) => this.imgs.colors[id] });
    }
    return this.local;
  }

  private fallBack() {
    this.worker?.terminate();
    this.worker = null;
    const open = [...this.pending.values()];
    this.pending.clear();
    for (const p of open) this.painter().paint(p.z, p.x, p.y).then(p.resolve, p.reject);
  }
}

/** Die Bilder für den Boden aus den geladenen Kartenmustern zusammenstellen. */
export function groundImages(image: (id: string) => ImageData | null, color: (id: string) => string | undefined): GroundImages {
  const images: Record<string, ImageData | null> = {};
  const colors: Record<string, string | undefined> = {};
  for (const id of GROUND_TEXTURES) {
    images[id] = image(id);
    colors[id] = color(id);
  }
  return { images, colors };
}

function debug(): boolean {
  try {
    return !!localStorage.getItem('endstation.debug');
  } catch {
    return false;
  }
}
