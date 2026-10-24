// Kartenkacheln selbst lesen (für den gemalten Boden auf der echten Karte).
import Pbf from 'pbf';
import { describe, expect, it } from 'vitest';
import { decodeTile, mvtQuery } from '../src/map/vectorTiles';

/** Eine Fläche oder Linie in Kachelkoordinaten (0 bis 4096). */
interface TestFeature {
  id?: number;
  type: 2 | 3;
  props: Record<string, string>;
  /** Ringe (Fläche) oder Linienzüge, je Liste von [x, y]. */
  parts: [number, number][][];
}

const zig = (n: number) => (n << 1) ^ (n >> 31);
const cmd = (id: number, count: number) => (id & 7) | (count << 3);

/** Geometrie nach Vektorkachel-Regeln: MoveTo, LineTo, bei Flächen ClosePath. */
function geometry(f: TestFeature): number[] {
  const out: number[] = [];
  let cx = 0;
  let cy = 0;
  for (const part of f.parts) {
    const pts = f.type === 3 ? part.slice(0, -1) : part;
    out.push(cmd(1, 1), zig(pts[0][0] - cx), zig(pts[0][1] - cy));
    [cx, cy] = pts[0];
    out.push(cmd(2, pts.length - 1));
    for (const [x, y] of pts.slice(1)) {
      out.push(zig(x - cx), zig(y - cy));
      cx = x;
      cy = y;
    }
    if (f.type === 3) out.push(cmd(7, 1));
  }
  return out;
}

/** Eine kleine Vektorkachel bauen (so wie OpenFreeMap sie liefert). */
function encodeTile(layers: Record<string, TestFeature[]>): Uint8Array {
  const pbf = new Pbf();
  for (const [name, feats] of Object.entries(layers)) {
    const keys: string[] = [];
    const values: string[] = [];
    pbf.writeMessage(
      3,
      (_: unknown, p: Pbf) => {
        p.writeVarintField(15, 2);
        p.writeStringField(1, name);
        for (const f of feats) {
          const tags: number[] = [];
          for (const [k, v] of Object.entries(f.props)) {
            if (!keys.includes(k)) keys.push(k);
            if (!values.includes(v)) values.push(v);
            tags.push(keys.indexOf(k), values.indexOf(v));
          }
          p.writeMessage(
            2,
            (_: unknown, q: Pbf) => {
              if (f.id !== undefined) q.writeVarintField(1, f.id);
              q.writePackedVarint(2, tags);
              q.writeVarintField(3, f.type);
              q.writePackedVarint(4, geometry(f));
            },
            null,
          );
        }
        for (const k of keys) p.writeStringField(3, k);
        for (const v of values) p.writeMessage(4, (_: unknown, q: Pbf) => q.writeStringField(1, v), null);
        p.writeVarintField(5, 4096);
      },
      null,
    );
  }
  return pbf.finish();
}

// Kachel 14/8640/5435 liegt in Mitteldeutschland
const X = 8640;
const Y = 5435;
const Z = 14;
const lonOf = (px: number) => ((X + px / 4096) / 2 ** Z) * 360 - 180;

const square = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
  [x0, y0],
];

describe('Kartenkacheln lesen', () => {
  const tile = encodeTile({
    landcover: [{ id: 7, type: 3, props: { class: 'farmland' }, parts: [square(100, 100, 2000, 1500)] }],
    landuse: [{ type: 3, props: { class: 'residential' }, parts: [square(2100, 100, 4000, 4000), square(2500, 500, 3000, 1000).reverse()] }],
    building: [{ id: 3, type: 3, props: {}, parts: [square(2600, 600, 2700, 700)] }],
    transportation: [{ type: 2, props: { class: 'minor' }, parts: [[[0, 2048], [4096, 2048]]] }],
    poi: [{ type: 3, props: { class: 'shop' }, parts: [square(10, 10, 20, 20)] }],
  });

  it('liest Flächen, Löcher, Häuser und Straßen mit Längen- und Breitengrad', () => {
    const feats = decodeTile(tile, X, Y, Z);
    // Die Schicht „poi“ braucht der Boden nicht
    expect(feats.map((f) => f.layer)).toEqual(['landcover', 'landuse', 'building', 'transportation']);
    const [farm, town, house, road] = feats;
    expect(farm.cls).toBe('farmland');
    expect(farm.id).toBe(7);
    expect(farm.polys).toHaveLength(1);
    expect(farm.bbox[0]).toBeCloseTo(lonOf(100), 6);
    expect(farm.bbox[2]).toBeCloseTo(lonOf(2000), 6);
    // Wohngebiet mit einem Loch: ein Polygon mit zwei Ringen
    expect(town.cls).toBe('residential');
    expect(town.polys).toHaveLength(1);
    expect(town.polys[0]).toHaveLength(2);
    // Ohne Nummer in den Daten: 0 (gleich in jeder Kachel)
    expect(town.id).toBe(0);
    expect(house.layer).toBe('building');
    expect(road.cls).toBe('minor');
    expect(road.lines).toHaveLength(1);
    expect(road.polys).toHaveLength(0);
    // Breitengrad nimmt nach Süden (größeres y) ab
    expect(farm.bbox[3]).toBeGreaterThan(farm.bbox[1]);
    expect(farm.bbox[3]).toBeGreaterThan(51);
    expect(farm.bbox[1]).toBeLessThan(52);
  });

  it('liest nur die Kacheln rund um den Ausschnitt und merkt sich gelesene', async () => {
    const asked: string[] = [];
    const query = mvtQuery('https://kacheln.test/{z}/{x}/{y}.pbf', 14, async (url) => {
      asked.push(url);
      // Nur unsere Kachel hat Daten, die Nachbarn sind leer (zum Beispiel Meer)
      return url.endsWith(`/${X}/${Y}.pbf`) ? tile.slice().buffer : null;
    });
    const n = decodeTile(tile, X, Y, Z)[0].bbox;
    // Ausschnitt nur um das Feld: eine Kachel, ein Feld (und die Straße läuft nicht hindurch)
    const near = await query(n[0], n[1], n[2], n[3]);
    expect(asked).toEqual([`https://kacheln.test/14/${X}/${Y}.pbf`]);
    expect(near.map((f) => f.cls)).toContain('farmland');
    expect(near.map((f) => f.cls)).not.toContain('residential');
    // Gleiche Stelle noch einmal: nichts neu laden
    await query(n[0], n[1], n[2], n[3]);
    expect(asked).toHaveLength(1);
    // Über die Kachelgrenze hinaus: Nachbarkacheln werden mitgelesen
    await query(lonOf(-50), n[1], n[2], n[3]);
    expect(asked).toContain(`https://kacheln.test/14/${X - 1}/${Y}.pbf`);
  });

  it('versucht es nach einem Netzfehler noch einmal', async () => {
    let fail = true;
    const query = mvtQuery('t/{z}/{x}/{y}', 14, async () => {
      if (fail) throw new Error('offline');
      return tile.slice().buffer;
    });
    const b = decodeTile(tile, X, Y, Z)[0].bbox;
    await expect(query(b[0], b[1], b[2], b[3])).rejects.toThrow('offline');
    fail = false;
    expect((await query(b[0], b[1], b[2], b[3])).length).toBeGreaterThan(0);
  });
});
