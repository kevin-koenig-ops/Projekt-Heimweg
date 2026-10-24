// Die Spielkarte: MapLibre mit Endzeit-Stil, Spielerfigur, Suchradius und Fundstellen.

import maplibregl from 'maplibre-gl';
import type { GeoJSONFeature, GeoJSONSource, Map as MLMap, Marker } from 'maplibre-gl';
import { circleRing, distanceM, offsetM } from '../core/geo';
import type { EnemyId, FoeKind, LatLon, Spot, WorldEventKind } from '../core/types';
import type { RegionStats } from '../core/terrain';
import type { PoiCandidate } from '../core/world';
import { h, svgEl } from '../ui/dom';
import { icon, paintedSymbol, spotIcon } from '../ui/icons';
import { generateDecor, type DecorInput, type RawLine, type RawPolygon } from './decor';
import { FogOfWar } from './fogOfWar';
import { WaterAnimation } from './waterAnim';
import demoWorld from './demoWorld.json';
import { hasOptionalTexture, loadTextures, patternImage, textureColor } from './patterns';
import { GroundPainter, geojsonQuery } from './groundPaint';
import { seasonMonth, type Season } from '../services/settings';
import { buildStyle, DECOR_MINZOOM, loadRealSource } from './style';
import type { WalkInput } from './walkNet';
import { FOE_TACTICS, type HintKind } from '../core/content';
import type { TreeLayer } from './treeLayer';

/** Umkreis der Detail-Ebene. Dahinter liegt ohnehin Nebel. */
const DECOR_RADIUS_M = 550;
/** Da läuft niemand: Autobahn, Gleise, Fähren, Seilbahnen. */
const NOT_WALKABLE = ['motorway', 'rail', 'transit', 'ferry', 'aerialway', 'raceway', 'bus_guideway', 'busway'];
const DRIVABLE = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service', 'residential', 'unclassified', 'living_street'];

export type SpotState = 'ready' | 'cooldown' | 'inrange';
export interface SpotView {
  spot: Spot;
  /** Besonderer Ort, noch unbekannt: man sieht nur den Hinweis (Rauch, Licht …). */
  unknown?: HintKind;
  state: SpotState;
  /** Gegner, der die Fundstelle bewacht, oder null. */
  guard: EnemyId | null;
  /** Liegengebliebene Händlerkiste? */
  cart?: boolean;
  /** Noch nie durchsucht (Erstfund-Bonus). */
  fresh?: boolean;
  /** Taucht beim Näherkommen auf: mit kleinem Hüpfer einblenden. */
  pop?: boolean;
}

/** Ein Trupp auf der Karte. */
export interface PatrolView {
  id: string;
  pos: LatLon;
  /** Blickrichtung in Grad (0 = Norden). */
  heading: number;
  group: FoeKind[];
  /** So weit sieht er dich gerade (Meter), für den Sichtkegel. */
  sightM: number;
  coneDeg: number;
  /** Sichtweite je Strahl (gleichmäßig über den Kegel verteilt), kürzer, wo ein Haus im Weg ist. */
  rays?: number[];
  /** Sichtbarkeit beim Ein- und Ausblenden (0–1, ohne Angabe 1). */
  fade?: number;
  /** Wie kurz er davor ist, dich zu entdecken (0–1). */
  alert: number;
  /** Folgt deiner Spur im Schnee oder hat dich entdeckt. */
  hunting?: boolean;
  horde?: boolean;
}

/** Eine Zone eines Weltereignisses. */
export interface ZoneView {
  id: string;
  kind: WorldEventKind;
  center: LatLon;
  radiusM: number;
}

/** Ein Versteck-Suchkreis auf der Karte. */
export interface CacheView {
  id: string;
  center: LatLon;
  radiusM: number;
  /** Spuren: Linie bis zum Versteck. */
  trail?: LatLon[];
}

/** Eine Sichtung auf der Karte (was drin ist, sieht man erst beim Einsammeln). */
export interface SightingMapView {
  id: string;
  pos: LatLon;
  kind: 'notebook' | 'cache' | 'medkit' | 'convoy';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  /** Noch so viele Minuten da. */
  minLeft: number;
  /** Nah genug zum Einsammeln. */
  near: boolean;
}

export const SIGHTING_ICON: Record<SightingMapView['kind'], string> = { notebook: 'book', cache: 'crate', medkit: 'medicine', convoy: 'convoy' };

export const DEMO = demoWorld as unknown as {
  name: string;
  center: LatLon;
  start: LatLon;
  bounds: [[number, number], [number, number]];
  geojson: GeoJSON.FeatureCollection;
};

// Boden selbst malen: Die Karte holt Kacheln über die Adresse boden://z/x/y, das Spiel malt sie (groundPaint.ts)
let groundPainter: GroundPainter | null = null;
let groundProtocol = false;
function registerGround() {
  if (groundProtocol) return;
  groundProtocol = true;
  maplibregl.addProtocol('boden', async (params) => {
    const m = /^boden:\/\/(\d+)\/(\d+)\/(\d+)/.exec(params.url);
    if (!m || !groundPainter) throw new Error('kein Boden');
    const t0 = performance.now();
    const data = await groundPainter.paint(Number(m[1]), Number(m[2]), Number(m[3]));
    if (localStorage.getItem('endstation.debug')) console.log(`[Boden] ${m[1]}/${m[2]}/${m[3]} ${Math.round(performance.now() - t0)} ms`);
    return { data };
  });
}
/** Alte Musterflächen, die der gemalte Boden ersetzt (Friedhöfe bleiben schlicht darüber). */
const PATTERN_LAYERS = /^(landuse-(residential|industrial|green)|landcover-|soft-)/;

interface Options {
  mode: 'real' | 'demo';
  start: LatLon;
  /** Wasser bewegt sich (Einstellung). */
  waterMotion: boolean;
  /** Boden selbst malen (Probe, bisher nur im Demo-Dorf). */
  groundPaint?: boolean;
  /** Jahreszeit für die Optik (Laub, Schnee, Bodenbilder). */
  season: Season;
  onTap: (p: LatLon) => void;
  onSpotTap: (id: string) => void;
  onFollowChange: (follow: boolean) => void;
  onCameraMove: () => void;
  onDataChanged: () => void;
  onError: (msg: string) => void;
  onBaseTap?: () => void;
  onCacheTap?: (id: string) => void;
  onPatrolTap?: (id: string) => void;
  onSightingTap?: (id: string) => void;
}

const ll = (p: LatLon): [number, number] => [p.lon, p.lat];

/** Körpergröße der Spielfigur in Metern: Sie steht maßstabsgetreu auf der Karte. */
const PERSON_M = 1.8;
/** So klein wird sie beim Herauszoomen höchstens, damit man sich noch findet. */
const FIGURE_MIN_PX = 11;
/**
 * Start-Zoom: nah genug, dass die Figur in echter Größe gut zu sehen ist.
 * Ganze Stufe, weil die Karte nach dem Zoomen auf ganze Stufen einrastet (siehe snapZoom).
 */
export const PLAY_ZOOM = 19;

export class GameMap {
  map!: MLMap;
  follow = true;
  fog: FogOfWar | null = null;
  private markers = new Map<string, { marker: Marker; el: HTMLElement; state: string }>();
  private cacheMarkers = new Map<string, Marker>();
  private patrolMarkers = new Map<string, { marker: Marker; el: HTMLElement; sig: string }>();
  private pendingCaches: CacheView[] | null = null;
  private sightMarkers = new Map<string, { marker: Marker; el: HTMLElement; sig: string }>();
  private player: Marker | null = null;
  private playerEl: HTMLElement | null = null;
  private figure: { el: HTMLElement; anchorY: number; h: number; px: number } | null = null;
  private playerPos: LatLon | null = null;
  private figScale = 0;
  private target: Marker | null = null;
  private baseMarker: Marker | null = null;
  private homeState: { p: LatLon; tier: number } | null = null;
  private lastMarkerTap = 0;
  private loaded = false;
  private errorShown = false;
  private pendingRange: { c: LatLon; r: number } | null = null;
  private decorCenter: LatLon | null = null;
  private tilesDirty = true;
  /** Ursprüngliche Breite der Straßen ohne Bild (zum Zurückstellen). */
  private roadWidth: Record<string, unknown> = {};
  private decorTimer = 0;
  /** 3D-Bäume (three.js), wird nach dem Laden nachgeladen. Bis dahin Klötzchen-Bäume. */
  private trees: TreeLayer | null = null;
  private water: WaterAnimation | null = null;
  /** Finger oder Maustasten, die gerade auf der Karte liegen. */
  private pointers = new Set<number>();
  private offPointers: (() => void) | null = null;

  constructor(
    private container: HTMLElement,
    private opts: Options,
  ) {}

  async init() {
    const { mode, start } = this.opts;
    const [source] = await Promise.all([mode === 'real' ? loadRealSource() : null, loadTextures(this.opts.season)]);
    const style = source ? buildStyle('real', source) : buildStyle('demo');
    // generateId: jede Fläche bekommt eine Nummer (damit Äcker unterschiedlich aussehen)
    if (mode === 'demo') style.sources.demo = { type: 'geojson', data: DEMO.geojson, generateId: true };

    this.map = new maplibregl.Map({
      container: this.container,
      style,
      center: ll(start),
      zoom: PLAY_ZOOM,
      pitch: 52,
      maxPitch: 62,
      minZoom: mode === 'demo' ? 14.5 : 11,
      maxZoom: 21,
      maxBounds: mode === 'demo' ? DEMO.bounds : undefined,
      attributionControl: mode === 'real' ? { compact: true } : false,
      fadeDuration: 0,
    });

    // Finger oder Maus auf der Karte: solange nicht nachführen. Jedes Nachführen bricht in
    // MapLibre ein begonnenes Ziehen ab, deshalb ließ sich die Karte beim Laufen nicht verschieben.
    const canvas = this.map.getCanvasContainer();
    canvas.addEventListener('pointerdown', (e) => this.pointers.add(e.pointerId));
    const up = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      // Finger weg: falls der Zoom zwischen zwei Stufen stehen geblieben ist, jetzt einrasten
      if (!this.pointers.size) setTimeout(() => !this.map.isMoving() && this.snapZoom(), 60);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this.offPointers = () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    this.map.on('styleimagemissing', (e) => {
      const img = patternImage(e.id);
      if (img && !this.map.hasImage(e.id)) this.map.addImage(e.id, img.data, { pixelRatio: img.pixelRatio });
    });

    this.map.on('click', (e) => {
      if (Date.now() - this.lastMarkerTap < 400) return;
      this.opts.onTap({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });

    const breakFollow = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent && this.follow) {
        this.follow = false;
        this.opts.onFollowChange(false);
      }
    };
    this.map.on('dragstart', breakFollow);
    // Bodentexturen wachsen zwischen zwei Zoomstufen bis aufs Doppelte und springen dann zurück
    // (so zeichnet die Karte Muster). Kevin 23.10.: Sie sollen klein bleiben. Darum rastet der Zoom
    // nach dem Loslassen auf die nächste ganze Stufe ein, dort sind die Texturen immer gleich klein.
    this.map.on('zoomend', () => this.snapZoom());
    this.map.on('move', () => {
      this.scaleFigure();
      this.opts.onCameraMove();
    });

    this.map.on('error', (e) => {
      console.warn('[Karte]', e.error);
      // Fehlen Höhendaten, fehlt nur die Schattierung: kein Grund für eine Fehlermeldung
      if ((e as { sourceId?: string }).sourceId === 'dem') return;
      if (mode === 'real' && !this.errorShown && /fetch|load|tile|NetworkError|Failed/i.test(String(e.error?.message ?? ''))) {
        this.errorShown = true;
        this.opts.onError('Kartendaten konnten nicht geladen werden. Prüfe deine Internetverbindung.');
      }
    });

    const dataSource = mode === 'real' ? 'omt' : 'demo';
    this.map.on('sourcedata', (e) => {
      if (e.sourceId === dataSource && (e.tile || e.isSourceLoaded)) this.tilesDirty = true;
    });

    // Nach dem Bewegen oder wenn neue Kacheln da sind: kurz warten, dann Bescheid geben.
    // Nicht bei jedem 'idle': das bewegte Wasser zeichnet die Karte ständig neu.
    let dataDirty = true;
    let idleTimer = 0;
    this.map.on('sourcedata', (e) => {
      if (e.sourceId === dataSource && (e.tile || e.isSourceLoaded)) dataDirty = true;
    });
    this.map.on('moveend', () => (dataDirty = true));
    this.map.on('movestart', () => {
      clearTimeout(idleTimer);
      idleTimer = 0;
    });
    this.map.on('idle', () => {
      if (dataDirty && !idleTimer) {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0;
          dataDirty = false;
          this.opts.onDataChanged();
        }, 250);
      }
      this.scheduleDecor();
    });

    await new Promise<void>((resolve) => this.map.once('load', () => resolve()));
    this.loaded = true;
    this.fog = new FogOfWar(this.map);
    this.water = new WaterAnimation(this.map, this.opts.waterMotion);
    this.applySnow();
    this.applySoftColors();
    this.applyRoadTextures();
    this.setGroundPaint(!!this.opts.groundPaint);
    if (this.pendingRange) this.setRange(this.pendingRange.c, this.pendingRange.r);
    if (this.pendingCaches) this.setCaches(this.pendingCaches);
    void this.initTrees();
  }

  /** three.js erst laden, wenn die Karte steht (die Karte soll schnell erscheinen). */
  private async initTrees() {
    try {
      const { TreeLayer } = await import('./treeLayer');
      if (!this.map) return;
      this.trees = new TreeLayer(DECOR_MINZOOM);
      this.map.addLayer(this.trees, this.map.getLayer('street-names') ? 'street-names' : undefined);
      if (this.homeState) this.trees.setHome(this.homeState.p, this.homeState.tier);
      // Details neu aufbauen, jetzt mit echten Bäumen statt Klötzchen
      this.decorCenter = null;
      this.scheduleDecor();
    } catch (err) {
      console.warn('[Bäume]', err);
      this.trees = null;
    }
  }

  /** Suchkreise für Verstecke, mit einem Kreidezeichen in der Mitte. */
  setCaches(list: CacheView[]) {
    if (!this.loaded) {
      this.pendingCaches = list;
      return;
    }
    (this.map.getSource('caches') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: [
        ...list.map((c): GeoJSON.Feature => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [circleRing(c.center, c.radiusM)] } })),
        ...list.filter((c) => c.trail && c.trail.length > 1).map((c): GeoJSON.Feature => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c.trail!.map(ll) } })),
      ],
    });
    const ids = new Set(list.map((c) => c.id));
    for (const [id, m] of this.cacheMarkers) {
      if (!ids.has(id)) {
        m.remove();
        this.cacheMarkers.delete(id);
      }
    }
    for (const c of list) {
      if (this.cacheMarkers.has(c.id)) continue;
      const el = h('button', { class: 'cache-marker', type: 'button', 'aria-label': 'Versteck: Hinweis ansehen' }, svgEl(icon(c.trail ? 'steps' : 'chalk', 20)), h('span', null, '?'));
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.lastMarkerTap = Date.now();
        this.opts.onCacheTap?.(c.id);
      });
      this.cacheMarkers.set(c.id, new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(ll(c.center)).addTo(this.map));
    }
  }

  /** Sichtungen: leuchtende Abzeichen, Farbe nach Seltenheit, darunter die Restzeit. */
  setSightings(list: SightingMapView[]) {
    if (!this.map) return;
    const seen = new Set<string>();
    for (const v of list) {
      seen.add(v.id);
      let m = this.sightMarkers.get(v.id);
      if (!m) {
        const el = h(
          'button',
          { class: 'sighting', type: 'button', 'data-rarity': v.rarity, 'data-kind': v.kind },
          h('span', { class: 'sighting-glow', 'aria-hidden': 'true' }),
          h('span', { class: 'sighting-badge' }, svgEl(icon(SIGHTING_ICON[v.kind], 20))),
          h('small', { class: 'sighting-time' }),
        );
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.lastMarkerTap = Date.now();
          this.opts.onSightingTap?.(v.id);
        });
        m = { marker: new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(v.pos)).addTo(this.map), el, sig: '' };
        this.sightMarkers.set(v.id, m);
        el.classList.add('pop');
      }
      const sig = `${v.minLeft}|${v.near}`;
      if (m.sig !== sig) {
        m.sig = sig;
        m.el.dataset.near = v.near ? '1' : '0';
        m.el.dataset.late = v.minLeft <= 3 ? '1' : '0';
        const t = m.el.querySelector('.sighting-time');
        if (t) t.textContent = v.near ? 'Einsammeln!' : `${Math.max(1, v.minLeft)} Min.`;
        m.el.setAttribute('aria-label', `Sichtung, noch ${v.minLeft} Minuten${v.near ? ', antippen zum Einsammeln' : ''}`);
      }
    }
    for (const [id, m] of this.sightMarkers) {
      if (seen.has(id)) continue;
      m.marker.remove();
      this.sightMarkers.delete(id);
    }
  }

  /** Deine Position; face baut beim ersten Mal das Bild (Porträt) für den Marker. */
  setPlayer(pos: LatLon, face: () => HTMLElement) {
    this.fog?.setPlayer(pos);
    this.playerPos = pos;
    if (!this.player) {
      this.playerEl = h('div', { class: 'player' }, h('div', { class: 'player-ring' }), face());
      if (this.figure) this.attachFigure();
      this.player = new maplibregl.Marker({ element: this.playerEl, anchor: 'center', pitchAlignment: 'viewport' })
        .setLngLat(ll(pos))
        .addTo(this.map);
    } else {
      this.player.setLngLat(ll(pos));
    }
    this.scaleFigure();
  }

  /** Unterwegs: das Porträt wippt leicht. */
  setPlayerWalking(on: boolean) {
    this.playerEl?.classList.toggle('walking', on);
  }

  /** 3D-Spielfigur statt des runden Gesichts. Die Füße stehen genau auf dem Standort. */
  setPlayerFigure(el: HTMLElement, anchorY: number, height: number, figurePx: number) {
    this.figure = { el, anchorY, h: height, px: figurePx };
    if (this.playerEl) this.attachFigure();
  }

  private attachFigure() {
    if (!this.playerEl || !this.figure) return;
    const f = this.figure;
    f.el.classList.add('player-figure');
    f.el.style.top = `${25 - f.anchorY * f.h}px`;
    // Skaliert wird um die Füße herum
    f.el.style.transformOrigin = `36px ${f.anchorY * f.h}px`;
    this.playerEl.classList.add('has-figure');
    this.playerEl.append(f.el);
    this.figScale = 0;
    this.scaleFigure();
  }

  /**
   * Figur in echter Größe: so hoch, wie ein Mensch an dieser Stelle der Karte wäre.
   * Gemessen wird quer zur Blickrichtung (dort verzerrt die Neigung nicht).
   */
  private scaleFigure() {
    const f = this.figure;
    const p = this.playerPos;
    if (!f || !p || !this.playerEl || !this.map) return;
    const az = ((this.map.getBearing() + 90) * Math.PI) / 180;
    const a = this.map.project(ll(p));
    const b = this.map.project(ll(offsetM(p, Math.sin(az) * 10, Math.cos(az) * 10)));
    const ppm = Math.hypot(b.x - a.x, b.y - a.y) / 10;
    const pitch = (this.map.getPitch() * Math.PI) / 180;
    const want = Math.max(FIGURE_MIN_PX, PERSON_M * ppm * Math.max(0.3, Math.sin(pitch)));
    const scale = Math.min(1.6, want / f.px);
    if (!isFinite(scale) || Math.abs(scale - this.figScale) < 0.003) return;
    this.figScale = scale;
    f.el.style.transform = `scale(${scale.toFixed(4)})`;
    // Der Ortungsring wächst mit, bleibt aber gut sichtbar
    const ring = this.playerEl.querySelector<HTMLElement>('.player-ring');
    if (ring) {
      const w = Math.max(26, Math.min(70, want * 1.3));
      ring.style.cssText = `inset:auto;left:${25 - w / 2}px;top:${25 - w / 4}px;width:${w}px;height:${w / 2}px;transform:none`;
    }
  }

  /** Drehung der Karte in Grad. */
  get bearing(): number {
    return this.map.getBearing();
  }

  /** Das eigene Zuhause auf der Karte (nur für dich sichtbar), als 3D-Modell je nach Stufe. */
  setBase(p: LatLon | null, tier = 0) {
    this.homeState = p ? { p, tier } : null;
    this.trees?.setHome(p, tier);
    this.baseMarker?.remove();
    this.baseMarker = null;
    if (!p) return;
    const el = h('button', { class: 'base-marker', type: 'button', 'aria-label': 'Dein Zuhause' }, h('span', { class: 'base-sign' }, svgEl(paintedSymbol('zuhause', 20) ?? icon('home', 20))), h('span', { class: 'base-pole' }));
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      this.lastMarkerTap = Date.now();
      this.opts.onBaseTap?.();
    });
    this.baseMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(p)).addTo(this.map);
  }

  setRange(c: LatLon, radiusM: number) {
    if (!this.loaded) {
      this.pendingRange = { c, r: radiusM };
      return;
    }
    (this.map.getSource('range') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [circleRing(c, radiusM)] } }],
    });
  }

  /** Geplante Strecke zeigen (Testmodus): offroad = Abschnitt quer durchs Gelände. */
  setRoute(path: LatLon[] | null, offroad: boolean[] = []) {
    if (!this.loaded) return;
    const features: GeoJSON.Feature[] = [];
    if (path && path.length > 1) {
      let cur: [number, number][] = [ll(path[0])];
      let off = offroad[0] ?? false;
      for (let i = 1; i < path.length; i++) {
        const o = offroad[i - 1] ?? false;
        if (o !== off) {
          features.push({ type: 'Feature', properties: { off }, geometry: { type: 'LineString', coordinates: cur } });
          cur = [ll(path[i - 1])];
          off = o;
        }
        cur.push(ll(path[i]));
      }
      features.push({ type: 'Feature', properties: { off }, geometry: { type: 'LineString', coordinates: cur } });
    }
    (this.map.getSource('route') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features });
  }

  /**
   * Weit herausgezoomt hat die echte Karte nur grobe Daten (keine Bäche, Feldwege und kleinen Teiche).
   * Ein Wegenetz daraus würde quer übers Wasser führen.
   */
  walkDataCoarse(): boolean {
    return this.opts.mode === 'real' && this.map.getZoom() < 13;
  }

  /** Straßen, Wege, Häuser, Wasser, Ortsflächen und Wald rund um einen Punkt (für das Wegenetz). */
  /**
   * patrol: Wege für die Strecken der Trupps. Ohne große Straßen (Bundes- und Hauptstraßen),
   * ohne Zufahrten und Parkplatzwege, und nie über Friedhöfe, Schulhöfe und andere heikle Orte.
   */
  walkInput(center: LatLon, radiusM: number, extra: Pick<WalkInput, 'noGo' | 'season' | 'wade'> = {}, opts: { patrol?: boolean } = {}): WalkInput {
    const real = this.opts.mode === 'real';
    const out: WalkInput = { center, ways: [], buildings: [], water: [], built: [], forest: [], fields: [], wetland: [], ...extra };
    let feats: (layer: string) => { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[];
    if (real) {
      if (!this.loaded || !this.map.getSource('omt')) return out;
      feats = (layer) => this.map.querySourceFeatures('omt', { sourceLayer: layer });
    } else feats = (layer) => DEMO.geojson.features.filter((f) => f.properties?._layer === layer) as unknown as { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[];
    const kx = 111320 * Math.cos((center.lat * Math.PI) / 180);
    const near = (coords: number[][]) => {
      for (const [lon, lat] of coords) if (Math.hypot((lon - center.lon) * kx, (lat - center.lat) * 111320) <= radiusM) return true;
      // Große Flächen: Mittelpunkt liegt vielleicht außerhalb, aber sie überdecken uns
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [lon, lat] of coords) {
        x0 = Math.min(x0, lon);
        x1 = Math.max(x1, lon);
        y0 = Math.min(y0, lat);
        y1 = Math.max(y1, lat);
      }
      return center.lon >= x0 && center.lon <= x1 && center.lat >= y0 && center.lat <= y1;
    };
    const polys = (layer: string, classes: string[] | null, to: [number, number][][][]) => {
      for (const f of feats(layer)) {
        if (classes && !classes.includes(String(f.properties?.class ?? ''))) continue;
        const g = f.geometry;
        const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const rings of list) if (rings[0]?.length >= 4 && near(rings[0])) to.push(rings as [number, number][][]);
      }
    };
    try {
      const sens = opts.patrol ? this.sensitiveCheck() : null;
      for (const f of feats('transportation')) {
        const cls = String(f.properties?.class ?? '');
        if (NOT_WALKABLE.includes(cls)) continue;
        if (opts.patrol && ['trunk', 'primary', 'service'].includes(cls)) continue;
        const g = f.geometry;
        const list = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
        for (const c of list) {
          if (c.length < 2 || !near(c)) continue;
          if (sens && c.some(([lon, lat]) => sens({ lat, lon }, false))) continue;
          out.ways.push(c as [number, number][]);
        }
      }
      polys('building', null, out.buildings);
      polys('water', null, out.water);
      // Flüsse, Bäche und Kanäle als Linien (Gräben und Rohre unter der Straße zählen nicht)
      out.waterLines = [];
      for (const f of feats('waterway')) {
        if (!['river', 'stream', 'canal'].includes(String(f.properties?.class ?? '')) || f.properties?.brunnel === 'tunnel') continue;
        const g = f.geometry;
        const list = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
        for (const c of list) if (c.length > 1 && near(c)) out.waterLines.push(c as [number, number][]);
      }
      polys('landuse', ['residential', 'commercial', 'industrial', 'retail', 'garages', 'railway'], out.built);
      polys('landcover', ['wood', 'forest'], out.forest);
      polys('landcover', ['farmland'], out.fields!);
      polys('landcover', ['wetland'], out.wetland!);
    } catch {
      /* ohne Kartendaten: freies Laufen */
    }
    return out;
  }

  /** Zonen der Weltereignisse (Staubsturm, Horde, Sperrgebiet). */
  setZones(list: ZoneView[]) {
    if (!this.loaded) return;
    (this.map.getSource('zones') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: list.filter((z) => z.radiusM > 0).map((z): GeoJSON.Feature => ({ type: 'Feature', properties: { k: z.kind, id: z.id }, geometry: { type: 'Polygon', coordinates: [circleRing(z.center, z.radiusM, 96)] } })),
    });
  }

  /** Trupps mit Sichtkegel. Wer nicht in der Liste ist, verschwindet. */
  setPatrols(list: PatrolView[]) {
    if (!this.loaded) return;
    const cones: GeoJSON.Feature[] = [];
    for (const p of list) {
      const ring: [number, number][] = [ll(p.pos)];
      const steps = p.rays ? p.rays.length - 1 : 14;
      for (let i = 0; i <= steps; i++) {
        const a = ((p.heading - p.coneDeg + (2 * p.coneDeg * i) / steps) * Math.PI) / 180;
        const r = p.rays ? p.rays[i] : p.sightM;
        ring.push(ll(offsetM(p.pos, Math.sin(a) * r, Math.cos(a) * r)));
      }
      ring.push(ll(p.pos));
      cones.push({ type: 'Feature', properties: { a: p.alert, f: p.fade ?? 1, id: p.id }, geometry: { type: 'Polygon', coordinates: [ring] } });
    }
    (this.map.getSource('patrols') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: cones });
    const seen = new Set<string>();
    for (const p of list) {
      seen.add(p.id);
      let m = this.patrolMarkers.get(p.id);
      if (!m) {
        const el = h('button', { class: 'patrol', type: 'button', 'data-id': p.id }, h('span', { class: 'patrol-badge' }, svgEl(icon(p.group.includes('watcher') ? 'eye' : p.group.includes('habit') ? 'clock' : p.group.includes('feverish') ? 'hands' : p.group.some((k) => FOE_TACTICS[k].human) ? 'flag' : 'patrol', 18)), h('b', null, String(p.group.length))), h('span', { class: 'patrol-alert', 'aria-hidden': 'true' }));
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.lastMarkerTap = Date.now();
          this.opts.onPatrolTap?.(p.id);
        });
        m = { marker: new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(p.pos)).addTo(this.map), el, sig: '' };
        this.patrolMarkers.set(p.id, m);
      } else m.marker.setLngLat(ll(p.pos));
      m.el.style.opacity = String(p.fade ?? 1);
      const state = p.hunting || p.alert >= 1 ? 'hunt' : p.alert > 0.05 ? 'alert' : 'idle';
      const sig = state + (p.horde ? 'h' : '') + p.group.join(',');
      if (m.sig !== sig) {
        m.sig = sig;
        m.el.dataset.state = state;
        m.el.dataset.horde = p.horde ? '1' : '0';
        m.el.dataset.watcher = p.group.includes('watcher') ? '1' : '0';
        const alertEl = m.el.querySelector('.patrol-alert');
        if (alertEl) alertEl.textContent = state === 'hunt' ? '!' : state === 'alert' ? '?' : '';
        m.el.setAttribute('aria-label', `${p.horde ? 'Horde' : 'Trupp'}: ${p.group.length} ${p.group.length === 1 ? 'Gegner' : 'Gegner'}${state === 'hunt' ? ', hat dich entdeckt' : state === 'alert' ? ', wird aufmerksam' : ''}`);
      }
    }
    for (const [id, m] of this.patrolMarkers) {
      if (!seen.has(id)) {
        m.marker.remove();
        this.patrolMarkers.delete(id);
      }
    }
  }

  /** Spielerfigur: versteckt (blasser, mit Zeichen) oder nicht. */
  setHidden(on: boolean) {
    this.playerEl?.classList.toggle('is-hidden', on);
  }

  /**
   * Was rund um einen Punkt liegt (für die Art der Gegend): Anteile von Häusern, Wald, Acker,
   * Wasser, Sand, Fels und Eis. Gezählt wird an Stichproben auf einem Raster.
   */
  regionStats(center: LatLon, radiusM: number): RegionStats {
    const out: RegionStats = { buildings: 0, houses: 0, forest: 0, farm: 0, water: 0, sand: 0, rock: 0, ice: 0, relief: null };
    const real = this.opts.mode === 'real';
    if (real && (!this.loaded || !this.map.getSource('omt'))) return out;
    const feats = (layer: string): { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[] => {
      try {
        return real ? this.map.querySourceFeatures('omt', { sourceLayer: layer }) : (DEMO.geojson.features.filter((f) => f.properties?._layer === layer) as unknown as { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[]);
      } catch {
        return [];
      }
    };
    const kx = 111320 * Math.cos((center.lat * Math.PI) / 180);
    const toXY = (lon: number, lat: number) => [(lon - center.lon) * kx, (lat - center.lat) * 111320] as const;
    type A = { ring: [number, number][]; x0: number; y0: number; x1: number; y1: number; cls: string };
    const areas: A[] = [];
    const add = (g: GeoJSON.Geometry, cls: string) => {
      const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const r of list) {
        if (!r[0] || r[0].length < 4) continue;
        const ring = r[0].map(([lon, lat]) => toXY(lon, lat) as unknown as [number, number]);
        const xs = ring.map((p) => p[0]);
        const ys = ring.map((p) => p[1]);
        const a: A = { ring, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), cls };
        if (a.x1 < -radiusM || a.x0 > radiusM || a.y1 < -radiusM || a.y0 > radiusM) continue;
        areas.push(a);
      }
    };
    for (const f of feats('landcover')) {
      const c = String(f.properties?.class ?? '');
      const sub = String(f.properties?.subclass ?? '');
      const cls = c === 'wood' || c === 'forest' ? 'forest' : c === 'farmland' ? 'farm' : c === 'sand' ? 'sand' : c === 'rock' ? 'rock' : c === 'ice' || sub === 'glacier' ? 'ice' : '';
      if (cls) add(f.geometry, cls);
    }
    for (const f of feats('water')) add(f.geometry, 'water');
    // Häuser: Fläche und Anzahl (Mittelpunkt im Umkreis)
    let houseArea = 0;
    for (const f of feats('building')) {
      const g = f.geometry;
      const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const r of list) {
        const ring = r[0];
        if (!ring || ring.length < 4) continue;
        let cx = 0;
        let cy = 0;
        let area = 0;
        for (let i = 1; i < ring.length; i++) {
          const [ax, ay] = toXY(ring[i - 1][0], ring[i - 1][1]);
          const [bx, by] = toXY(ring[i][0], ring[i][1]);
          area += ax * by - bx * ay;
          cx += ax;
          cy += ay;
        }
        cx /= ring.length - 1;
        cy /= ring.length - 1;
        if (cx * cx + cy * cy > radiusM * radiusM) continue;
        out.houses++;
        houseArea += Math.abs(area) / 2;
      }
    }
    // Vektor-Kacheln liefern Häuser an Kachelrändern doppelt: grob ausgleichen
    if (real) {
      out.houses = Math.round(out.houses * 0.85);
      houseArea *= 0.85;
    }
    out.buildings = Math.min(1, houseArea / (Math.PI * radiusM * radiusM));
    const inside = (x: number, y: number, ring: [number, number][]) => {
      let c = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const n = 17;
    let total = 0;
    const hits: Record<string, number> = { forest: 0, farm: 0, water: 0, sand: 0, rock: 0, ice: 0 };
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (-1 + (2 * (i + 0.5)) / n) * radiusM;
        const y = (-1 + (2 * (j + 0.5)) / n) * radiusM;
        if (x * x + y * y > radiusM * radiusM) continue;
        total++;
        const got = new Set<string>();
        for (const a of areas) if (!got.has(a.cls) && x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1 && inside(x, y, a.ring)) got.add(a.cls);
        for (const c of got) hits[c]++;
      }
    if (total) for (const k of Object.keys(hits) as (keyof typeof hits)[]) (out as unknown as Record<string, number>)[k] = hits[k] / total;
    return out;
  }

  setTarget(p: LatLon | null) {
    if (!p) {
      this.target?.remove();
      this.target = null;
      return;
    }
    if (!this.target) {
      this.target = new maplibregl.Marker({ element: svgEl(icon('close', 18), 'walk-target'), anchor: 'center' }).setLngLat(ll(p)).addTo(this.map);
    } else this.target.setLngLat(ll(p));
  }

  /** Bis wann der Zoom gerade auf eine ganze Stufe einrastet (dann nicht dazwischen zentrieren). */
  private snapUntil = 0;

  /** Zoom auf die nächste ganze Stufe einrasten lassen (dort sind die Bodentexturen am kleinsten). */
  private snapZoom() {
    if (this.pointers.size) return;
    const z = this.map.getZoom();
    const t = Math.min(Math.floor(this.map.getMaxZoom()), Math.max(Math.ceil(this.map.getMinZoom()), Math.round(z)));
    if (Math.abs(z - t) < 0.01) return;
    this.snapUntil = performance.now() + 240;
    this.map.easeTo({ zoom: t, duration: 200 });
  }

  centerOn(p: LatLon, smooth: boolean) {
    // Hält jemand die Karte fest, nicht dazwischenfunken (er will sie vielleicht verschieben)
    if (this.pointers.size || performance.now() < this.snapUntil) return;
    if (smooth) this.map.easeTo({ center: ll(p), duration: 900 });
    else this.map.jumpTo({ center: ll(p) });
  }

  setFollow(on: boolean, p?: LatLon) {
    this.follow = on;
    // Zentrieren: schön nah an die Figur heran (wie beim Start), dann folgt die Karte ihr
    if (on && p) this.map.easeTo({ center: ll(p), zoom: PLAY_ZOOM, pitch: Math.max(this.map.getPitch(), 52), duration: 800 });
  }

  project(p: LatLon) {
    return this.map.project(ll(p));
  }

  metersToPixels(m: number, at: LatLon) {
    const mpp = (156543.03392 * Math.cos((at.lat * Math.PI) / 180)) / 2 ** this.map.getZoom();
    return m / mpp;
  }

  private glowSig = '';

  setSpots(views: SpotView[]) {
    // Bodenleuchten nur neu setzen, wenn sich Fundstellen oder ihr Zustand ändern
    const sig = views.map((v) => v.spot.id + v.state + (v.guard ?? '') + (v.cart ? 'c' : '')).join('|');
    if (sig !== this.glowSig && this.loaded) {
      this.glowSig = sig;
      (this.map.getSource('glow') as GeoJSONSource | undefined)?.setData({
        type: 'FeatureCollection',
        features: views.map((v) => ({
          type: 'Feature',
          properties: { s: v.state, src: v.spot.source, g: v.guard ? 1 : 0, c: v.cart ? 1 : 0 },
          geometry: { type: 'Point', coordinates: ll(v.spot.pos) },
        })),
      });
    }
    const seen = new Set<string>();
    for (const v of views) {
      seen.add(v.spot.id);
      let m = this.markers.get(v.spot.id);
      if (!m) {
        const el = h(
          'button',
          { class: 'spot', type: 'button', 'aria-label': v.spot.name, 'data-source': v.spot.source },
          h('span', { class: 'spot-badge' }, svgEl(spotIcon(v.spot.kind, 19))),
          h('span', { class: 'spot-hint', 'aria-hidden': 'true' }),
          h('span', { class: 'spot-stake' }),
          h('span', { class: 'spot-guard', 'aria-hidden': 'true' }),
        );
        if (v.pop) {
          el.classList.add('spot-pop');
          // Danach wieder frei für andere Bewegungen (Leuchten in Reichweite)
          el.addEventListener('animationend', () => el.classList.remove('spot-pop'), { once: true });
        }
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.lastMarkerTap = Date.now();
          this.opts.onSpotTap(v.spot.id);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(v.spot.pos)).addTo(this.map);
        m = { marker, el, state: '' };
        this.markers.set(v.spot.id, m);
      }
      const st = v.state + (v.guard ? ':g' : '') + (v.cart ? ':c' : '') + (v.fresh ? ':f' : '') + (v.unknown ? `:u${v.unknown}` : '');
      if (m.state !== st) {
        // Unbekannter besonderer Ort: Fragezeichen statt Symbol, darüber Rauch, Licht oder Funkwellen
        const badge = m.el.querySelector('.spot-badge');
        if (badge) badge.innerHTML = v.unknown ? (paintedSymbol('unbekannt', 21) ?? icon('question', 21)) : spotIcon(v.spot.kind, 19);
        if (v.unknown) m.el.dataset.unknown = v.unknown;
        else delete m.el.dataset.unknown;
        m.el.dataset.state = v.state;
        m.el.dataset.guard = v.guard ? '1' : '0';
        m.el.dataset.cart = v.cart ? '1' : '0';
        m.el.dataset.fresh = v.fresh ? '1' : '0';
        m.el.setAttribute('aria-label', v.unknown ? 'Etwas Unbekanntes' : v.cart ? `${v.spot.name} (Händlerkiste)` : v.guard ? `${v.spot.name} (bewacht)` : v.spot.name);
        m.state = st;
      }
    }
    for (const [id, m] of this.markers) {
      if (!seen.has(id)) {
        m.marker.remove();
        this.markers.delete(id);
      }
    }
  }

  // --- Detail-Ebene ---------------------------------------------------------------

  /** Nach Kamerabewegung oder neu geladenen Kacheln die Details neu aufbauen (wenn nötig). */
  private scheduleDecor() {
    if (!this.loaded || this.map.getZoom() < DECOR_MINZOOM - 0.5) return;
    const c = this.map.getCenter();
    const center = { lat: c.lat, lon: c.lng };
    const moved = !this.decorCenter || distanceM(this.decorCenter, center) > 150;
    if (!moved && !this.tilesDirty) return;
    this.tilesDirty = false;
    clearTimeout(this.decorTimer);
    this.decorTimer = window.setTimeout(() => this.buildDecor(center), 30);
  }

  private buildDecor(center: LatLon) {
    const t0 = performance.now();
    try {
      const res = generateDecor(this.collectDecorInput(center, DECOR_RADIUS_M + 250), center, DECOR_RADIUS_M, {
        month: seasonMonth(this.opts.season),
        treeParts: !this.trees,
        houseMeshes: !!this.trees,
      });
      this.trees?.setTrees(res.trees, center);
      this.trees?.setHouses(res.houses, center, res.props, res.bridges, res.graveyards);
      (this.map.getSource('decor') as GeoJSONSource | undefined)?.setData({
        type: 'FeatureCollection',
        features: res.parts.map((p) => ({
          type: 'Feature',
          properties: { b: p.base, t: p.top, c: p.color },
          geometry: { type: 'Polygon', coordinates: [p.ring] },
        })),
      });
      this.decorCenter = center;
      this.container.dataset.decor = JSON.stringify({ ...res.counts, parts: res.parts.length, ms: Math.round(performance.now() - t0) });
    } catch (err) {
      console.warn('[Details]', err);
    }
  }

  private collectDecorInput(center: LatLon, maxDist: number): DecorInput {
    const real = this.opts.mode === 'real';
    const kx = 111320 * Math.cos((center.lat * Math.PI) / 180);
    const ky = 111320;
    const query = (layer: string) =>
      this.map.querySourceFeatures(real ? 'omt' : 'demo', real ? { sourceLayer: layer } : { filter: ['==', ['get', '_layer'], layer] });
    const nearBox = (ring: number[][]) => {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const [lon, lat] of ring) {
        const x = (lon - center.lon) * kx;
        const y = (lat - center.lat) * ky;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      const dx = Math.max(x0, 0, -x1);
      const dy = Math.max(y0, 0, -y1);
      return dx * dx + dy * dy <= maxDist * maxDist;
    };
    const cls = (f: { properties: Record<string, unknown> | null }) => String(f.properties?.class ?? '');
    const polys = (features: GeoJSONFeature[], classes?: string[]): RawPolygon[] => {
      const out: RawPolygon[] = [];
      for (const f of features) {
        if (classes && !classes.includes(cls(f))) continue;
        const g = f.geometry;
        const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const rings of list) {
          if (!rings[0] || rings[0].length < 4 || !nearBox(rings[0])) continue;
          out.push({
            rings: rings as [number, number][][],
            height: Number(f.properties?.render_height ?? 6),
            minHeight: Number(f.properties?.render_min_height ?? 0),
          });
        }
      }
      return out;
    };
    const lines = (features: GeoJSONFeature[]): RawLine[] => {
      const out: RawLine[] = [];
      for (const f of features) {
        if (f.properties?.brunnel === 'tunnel') continue;
        const g = f.geometry;
        const list = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
        const c = cls(f);
        // Brücke: welche Art Weg darüber führt (für das 3D-Modell)
        const bridge = f.properties?.brunnel === 'bridge' ? (['motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(c) ? 'major' : DRIVABLE.includes(c) ? 'minor' : c === 'rail' || c === 'transit' ? 'rail' : 'path') : undefined;
        for (const coords of list) if (coords.length > 1 && nearBox(coords)) out.push({ coords: coords as [number, number][], drivable: DRIVABLE.includes(c), bridge });
      }
      return out;
    };
    const landcover = query('landcover');
    const landuse = query('landuse');
    return {
      buildings: polys(query('building')),
      forests: polys(landcover, ['wood', 'forest']),
      greens: [...polys(landuse, ['park', 'cemetery', 'village_green', 'garden', 'allotments']), ...(real ? polys(query('park'), ['park']) : [])],
      meadows: polys(landcover, ['grass', 'meadow', 'scrub']),
      residential: polys(landuse, ['residential']),
      cemeteries: polys(landuse, ['cemetery']),
      industrial: polys(landuse, ['industrial', 'commercial', 'retail', 'garages']),
      rocks: polys(landcover, ['rock']),
      water: polys(query('water')),
      waterways: lines(query('waterway')),
      roads: lines(query('transportation')),
      pois: this.poiCandidates().map((c) => ({ lon: c.pos.lon, lat: c.pos.lat, cls: c.cls, subclass: c.subclass })),
    };
  }

  /** Echte Orte (Supermarkt, Apotheke, Haltestelle …) aus den geladenen Kartendaten. */
  poiCandidates(): PoiCandidate[] {
    if (this.opts.mode === 'demo') {
      return DEMO.geojson.features
        .filter((f) => f.properties?._layer === 'poi' && f.geometry.type === 'Point')
        .map((f) => {
          const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates;
          return { pos: { lat, lon }, cls: f.properties?.class, subclass: f.properties?.subclass };
        });
    }
    if (!this.loaded || !this.map.getSource('omt')) return [];
    try {
      return this.map
        .querySourceFeatures('omt', { sourceLayer: 'poi' })
        .filter((f) => f.geometry.type === 'Point')
        .map((f) => {
          const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates;
          return { id: f.id ?? undefined, pos: { lat, lon }, cls: f.properties?.class, subclass: f.properties?.subclass };
        });
    } catch {
      return [];
    }
  }

  /**
   * Orte, an denen keine Fundstellen liegen dürfen: Friedhöfe, Krankenhäuser, Schulen,
   * Kitas, Gedenkstätten, Kirchen, dazu das Innere von Gebäuden (Privatgrund).
   * Gibt eine Prüf-Funktion zurück. Später muss ein Server dasselbe prüfen.
   */
  /**
   * Bebaut? (Wohn-, Gewerbe-, Industriegebiet oder nah an Häusern.) Besondere Orte liegen
   * nur draußen im Offenen, also nie in Gärten oder auf Höfen, und sind immer erreichbar.
   */
  builtCheck(padM = 25): (p: LatLon) => boolean {
    const BUILT = ['residential', 'commercial', 'industrial', 'retail', 'garages', 'railway'];
    const areas: { ring: [number, number][]; x0: number; y0: number; x1: number; y1: number }[] = [];
    const houses: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const real = this.opts.mode === 'real';
    try {
      const features = (layer: string): { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[] =>
        real
          ? this.loaded && this.map.getSource('omt')
            ? this.map.querySourceFeatures('omt', { sourceLayer: layer })
            : []
          : (DEMO.geojson.features.filter((f) => f.properties?._layer === layer) as unknown as { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[]);
      const box = (ring: number[][]) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const [x, y] of ring) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
        return { x0, y0, x1, y1 };
      };
      const each = (g: GeoJSON.Geometry, fn: (ring: number[][]) => void) => {
        const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const r of list) if (r[0]?.length >= 4) fn(r[0]);
      };
      for (const f of features('landuse')) if (BUILT.includes(String(f.properties?.class ?? ''))) each(f.geometry, (r) => areas.push({ ring: r as [number, number][], ...box(r) }));
      for (const f of features('building')) each(f.geometry, (r) => houses.push(box(r)));
    } catch {
      /* ohne Kartendaten: nichts bekannt */
    }
    const inside = (p: LatLon, ring: [number, number][]) => {
      let c = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > p.lat !== yj > p.lat && p.lon < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    return (p: LatLon) => {
      const pad = padM / 111320;
      const padX = pad / Math.cos((p.lat * Math.PI) / 180);
      if (houses.some((b) => p.lon > b.x0 - padX && p.lon < b.x1 + padX && p.lat > b.y0 - pad && p.lat < b.y1 + pad)) return true;
      return areas.some((a) => p.lon > a.x0 && p.lon < a.x1 && p.lat > a.y0 && p.lat < a.y1 && inside(p, a.ring));
    };
  }

  /** Liegt der Punkt im Wald? (Für Pilzstellen, die nur im Wald wachsen.) */
  forestCheck(): (p: LatLon) => boolean {
    const areas: { ring: number[][]; x0: number; y0: number; x1: number; y1: number }[] = [];
    try {
      const real = this.opts.mode === 'real';
      const features: { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[] = real
        ? this.loaded && this.map.getSource('omt')
          ? this.map.querySourceFeatures('omt', { sourceLayer: 'landcover' })
          : []
        : (DEMO.geojson.features.filter((f) => f.properties?._layer === 'landcover') as unknown as typeof features);
      for (const f of features) {
        if (!['wood', 'forest'].includes(String(f.properties?.class ?? ''))) continue;
        const g = f.geometry;
        const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const rings of list) {
          const ring = rings[0];
          if (!ring || ring.length < 4) continue;
          const xs = ring.map((c) => c[0]);
          const ys = ring.map((c) => c[1]);
          areas.push({ ring, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
        }
      }
    } catch {
      /* ohne Kartendaten: kein Wald bekannt */
    }
    const inside = (p: LatLon, ring: number[][]) => {
      let c = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > p.lat !== yj > p.lat && p.lon < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    return (p: LatLon) => areas.some((a) => p.lon > a.x0 && p.lon < a.x1 && p.lat > a.y0 && p.lat < a.y1 && inside(p, a.ring));
  }

  sensitiveCheck(): (p: LatLon, grid?: boolean) => boolean {
    const AREA = ['cemetery', 'hospital', 'school', 'kindergarten', 'college', 'university', 'religious'];
    const POINT = ['cemetery', 'grave_yard', 'hospital', 'school', 'kindergarten', 'college', 'university', 'place_of_worship', 'memorial', 'monument'];
    const rings: [number, number][][] = [];
    const points: LatLon[] = [];
    const buildings: [number, number][][] = [];
    try {
      const real = this.opts.mode === 'real';
      const features = (layer: string): { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[] =>
        real
          ? this.loaded && this.map.getSource('omt')
            ? this.map.querySourceFeatures('omt', { sourceLayer: layer })
            : []
          : (DEMO.geojson.features.filter((f) => f.properties?._layer === layer) as unknown as { geometry: GeoJSON.Geometry; properties: Record<string, unknown> | null }[]);
      const addPolys = (g: GeoJSON.Geometry, to: [number, number][][]) => {
        const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const r of list) if (r[0]?.length >= 4) to.push(r[0] as [number, number][]);
      };
      for (const f of features('landuse')) if (AREA.includes(String(f.properties?.class ?? ''))) addPolys(f.geometry, rings);
      for (const f of features('building')) addPolys(f.geometry, buildings);
      // Auch nicht mitten im Wasser
      for (const f of features('water')) addPolys(f.geometry, buildings);
      for (const f of features('poi')) {
        const c = String(f.properties?.class ?? '');
        const sc = String(f.properties?.subclass ?? '');
        if (!POINT.includes(c) && !POINT.includes(sc)) continue;
        if (f.geometry.type === 'Point') points.push({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] });
        else addPolys(f.geometry, rings);
      }
    } catch {
      /* ohne Kartendaten: nichts ausschließen */
    }
    const inside = (p: LatLon, ring: [number, number][]) => {
      let c = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > p.lat !== yj > p.lat && p.lon < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    // Abstand zum Rand (in Metern, grob) – Fundstellen halten etwas Abstand zu sensiblen Flächen
    const nearEdge = (p: LatLon, ring: [number, number][], m: number) => {
      const kx = 111320 * Math.cos((p.lat * Math.PI) / 180);
      for (let i = 1; i < ring.length; i++) {
        const ax = (ring[i - 1][0] - p.lon) * kx;
        const ay = (ring[i - 1][1] - p.lat) * 111320;
        const bx = (ring[i][0] - p.lon) * kx;
        const by = (ring[i][1] - p.lat) * 111320;
        const dx = bx - ax;
        const dy = by - ay;
        const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(ax + t * dx, ay + t * dy) < m) return true;
      }
      return false;
    };
    // Echte Läden liegen natürlich in Gebäuden; nur erfundene Fundstellen dürfen nicht in Häusern liegen
    return (p: LatLon, grid = true) =>
      rings.some((r) => inside(p, r) || nearEdge(p, r, 20)) || points.some((q) => distanceM(p, q) < 40) || (grid && buildings.some((r) => inside(p, r)));
  }

  /** Jahreszeit umgeschaltet (Testen): Laub und Büsche neu, Schnee, Bodenbilder der Jahreszeit. */
  async setSeason(season: Season) {
    if (season === this.opts.season) return;
    this.opts.season = season;
    if (!this.loaded) return;
    this.decorCenter = null;
    this.tilesDirty = true;
    this.scheduleDecor();
    this.applySnow();
    for (const id of await loadTextures(season)) {
      const img = patternImage(id);
      if (!img || !this.map.hasImage(id)) continue;
      this.map.removeImage(id);
      this.map.addImage(id, img.data, { pixelRatio: img.pixelRatio });
    }
    this.applySoftColors();
    this.applyRoadTextures();
    this.refreshGround();
  }

  private groundOn = false;
  private groundRev = 0;

  /**
   * Boden selbst malen an oder aus (Einstellung „Boden“). Bisher nur im Demo-Dorf: Für die echte
   * Karte fehlt noch das Lesen der Kartenkacheln.
   */
  setGroundPaint(on: boolean) {
    this.opts.groundPaint = on;
    if (!this.loaded) return;
    const want = on && this.opts.mode === 'demo';
    if (want === this.groundOn) return;
    this.groundOn = want;
    if (want) {
      registerGround();
      groundPainter ??= new GroundPainter(geojsonQuery(DEMO.geojson), { image: (id) => patternImage(id)?.data ?? null, color: textureColor });
      if (!this.map.getSource('boden')) {
        const [[w, s], [e, n]] = DEMO.bounds;
        this.map.addSource('boden', { type: 'raster', tiles: [`boden://{z}/{x}/{y}?v=${this.groundRev}`], tileSize: 512, minzoom: 14, maxzoom: 19, bounds: [w, s, e, n] });
      }
      const before = this.map.getStyle().layers.find((l) => PATTERN_LAYERS.test(l.id))?.id;
      if (!this.map.getLayer('boden')) this.map.addLayer({ id: 'boden', type: 'raster', source: 'boden', paint: { 'raster-fade-duration': 0, 'raster-resampling': 'linear' } }, before);
    }
    for (const l of this.map.getStyle().layers) if (PATTERN_LAYERS.test(l.id)) this.map.setLayoutProperty(l.id, 'visibility', want ? 'none' : 'visible');
    if (this.map.getLayer('boden')) this.map.setLayoutProperty('boden', 'visibility', want ? 'visible' : 'none');
    // Unter den Kacheln (solange sie noch gemalt werden) die mittlere Bodenfarbe statt des Musters
    this.map.setPaintProperty('ground', 'background-pattern', want ? undefined : 'pat-ground');
    if (want) this.map.setPaintProperty('ground', 'background-color', textureColor('pat-ground') ?? '#7a6a4c');
  }

  /** Neue Bodenbilder (Jahreszeit): gemalte Kacheln neu malen lassen. */
  private refreshGround() {
    if (!this.groundOn) return;
    groundPainter?.invalidate();
    this.groundRev++;
    (this.map.getSource('boden') as maplibregl.RasterTileSource | undefined)?.setTiles([`boden://{z}/{x}/{y}?v=${this.groundRev}`]);
    this.map.setPaintProperty('ground', 'background-color', textureColor('pat-ground') ?? '#7a6a4c');
  }

  /** Straßen und Wege mit Bild, sobald es eins gibt; sonst die gezeichneten Linien. */
  private applyRoadTextures() {
    const has = hasOptionalTexture;
    const use = (layer: string, pat: string) => {
      if (!this.map.getLayer(layer)) return false;
      const on = has(pat);
      this.map.setPaintProperty(layer, 'line-pattern', on ? pat : undefined);
      return on;
    };
    const major = use('road-major', 'pat-road-major');
    const minor = use('road-minor', 'pat-road-minor');
    // Straßen mit Bild: ohne dunkle Kante, dafür so breit wie die Kante, damit der weiche Rand
    // (patterns.ts, fadeEdges) in den Boden ausläuft und die Fahrbahn gleich breit bleibt
    const casing = (layer: string, edge: string, on: boolean) => {
      if (!this.map.getLayer(layer) || !this.map.getLayer(edge)) return;
      this.roadWidth[layer] ??= this.map.getPaintProperty(layer, 'line-width');
      this.map.setPaintProperty(layer, 'line-width', on ? this.map.getPaintProperty(edge, 'line-width') : this.roadWidth[layer]);
      this.map.setLayoutProperty(edge, 'visibility', on ? 'none' : 'visible');
    };
    casing('road-major', 'road-major-casing', major);
    casing('road-minor', 'road-minor-casing', minor);
    // Feld- und Fußwege, Gleise mit Bild breiter (auch wegen des weichen Rands), sonst sieht man vom Bild nur die Farbe
    const width = (layer: string, on: boolean, plain: [number, number][], wide: [number, number][]) => {
      if (this.map.getLayer(layer)) this.map.setPaintProperty(layer, 'line-width', ['interpolate', ['exponential', 1.6], ['zoom'], ...(on ? wide : plain).flat()]);
    };
    width('road-track', use('road-track', 'pat-track'), [[14, 1], [17, 4.5], [20, 14]], [[14, 1.8], [17, 8.4], [20, 25]]);
    // Fußwege: gepflasterte Gehwege (footway) und Pfade im Grünen, je mit eigenem Bild
    const path = has('pat-path');
    const footway = has('pat-footway');
    if (this.map.getLayer('road-path')) {
      const pattern = footway ? ['match', ['coalesce', ['get', 'subclass'], ''], ['footway', 'pedestrian'], 'pat-footway', path ? 'pat-path' : 'pat-footway'] : path ? 'pat-path' : undefined;
      this.map.setPaintProperty('road-path', 'line-pattern', pattern);
    }
    width('road-path', path || footway, [[14, 0.6], [17, 2.6], [20, 7]], [[14, 1.2], [17, 5], [20, 13]]);
    width('road-rail', use('road-rail', 'pat-rail'), [[13, 1], [18, 5]], [[13, 1.8], [17, 7.2], [20, 22]]);
    if (this.map.getLayer('landcover-ice')) this.map.setPaintProperty('landcover-ice', 'fill-pattern', has('pat-ice') ? 'pat-ice' : undefined);
    // Die gemalten Straßen haben ihre Risse schon im Bild
    if (this.map.getLayer('road-cracks')) this.map.setLayoutProperty('road-cracks', 'visibility', major && minor ? 'none' : 'visible');
  }

  /**
   * Die weichen Ränder der Flächen bekommen die mittlere Farbe des Bodenbilds,
   * damit die Übergänge auch zu den Bildern der Jahreszeit passen.
   */
  private applySoftColors() {
    const c = textureColor;
    const set = (layer: string, color: unknown) => {
      if (this.map.getLayer(layer)) this.map.setPaintProperty(layer, 'line-color', color);
    };
    const one = (layer: string, pat: string) => {
      const col = c(pat);
      if (col) set(layer, col);
    };
    one('soft-residential', this.settlement && this.settlement !== 'village' ? 'pat-paved' : 'pat-gardens');
    const ind = c('pat-industrial');
    const com = c('pat-commercial');
    const rail = c('pat-railyard');
    const quarry = c('pat-quarry');
    if (ind && com && rail && quarry) set('soft-industrial', ['match', ['get', 'class'], ['commercial', 'retail'], com, 'railway', rail, 'quarry', quarry, ind]);
    const pitch = c('pat-pitch');
    const play = c('pat-playground');
    const lawn = c('pat-grass');
    if (pitch && play && lawn) set('soft-green', ['match', ['get', 'class'], ['pitch', 'stadium'], pitch, 'playground', play, lawn]);
    one('soft-ice', 'pat-ice');
    const sandC = c('pat-sand');
    const gravelC = c('pat-gravel');
    if (sandC && gravelC) set('soft-sand', ['match', ['coalesce', ['get', 'subclass'], ''], ['beach', 'dune'], sandC, gravelC]);
    one('soft-rock', 'pat-rock');
    one('soft-wetland', 'pat-wetland');
    const grass = c('pat-grass');
    const meadow = c('pat-meadow');
    if (grass && meadow) {
      set('soft-grass', ['match', ['coalesce', ['get', 'subclass'], ''], ['park', 'garden', 'village_green', 'recreation_ground', 'golf_course', 'flowerbed'], grass, meadow]);
    }
    const fa = c('pat-farm-a');
    const fb = c('pat-farm-b');
    if (fa && fb) set('soft-farm', ['match', ['%', ['to-number', ['coalesce', ['id'], 0]], 2], 0, fa, fb]);
    const floor = c('pat-forest-floor');
    if (floor) set('soft-wood', ['step', ['zoom'], '#4f5a33', DECOR_MINZOOM, floor]);
  }

  /**
   * Boden in Wohngebieten je nach Ort: In Städten meist Asphalt und Pflaster, Gärten nur in
   * manchen Vierteln; im Dorf meist Gärten, ab und zu ein Hof. Welches Viertel was bekommt,
   * hängt an der Nummer der Fläche in den Kartendaten (bleibt also immer gleich).
   */
  setSettlement(kind: 'city' | 'town' | 'village') {
    if (this.settlement === kind || !this.map.getLayer('landuse-residential')) return;
    this.settlement = kind;
    // Von zehn Vierteln: so viele Gärten, so viele Höfe, der Rest Pflaster
    const [gardens, yards] = kind === 'city' ? [2, 2] : kind === 'town' ? [4, 2] : [7, 2];
    const slots = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i);
    const fallback = kind === 'village' ? 'pat-gardens' : 'pat-paved';
    const expr = ['match', ['%', ['to-number', ['coalesce', ['id'], -1]], 10], -1, fallback, slots(0, gardens), 'pat-gardens', slots(gardens, yards), 'pat-yard', 'pat-paved'];
    this.map.setPaintProperty('landuse-residential', 'fill-pattern', expr as maplibregl.ExpressionSpecification);
    const col = textureColor(fallback);
    if (col && this.map.getLayer('soft-residential')) this.map.setPaintProperty('soft-residential', 'line-color', col);
  }
  private settlement: 'city' | 'town' | 'village' | null = null;

  /** Im Winter liegt eine dünne Schneeschicht über allem Boden (bis es eigene Winterbilder gibt). */
  private applySnow() {
    const on = this.opts.season === 'winter';
    if (on && !this.map.getLayer('snow')) {
      if (!this.map.getSource('snow')) {
        this.map.addSource('snow', { type: 'geojson', data: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] } });
      }
      const before = ['hillshade', 'water-shore'].find((id) => this.map.getLayer(id));
      this.map.addLayer({ id: 'snow', type: 'fill', source: 'snow', paint: { 'fill-color': '#eef1f2', 'fill-opacity': 0.5 } }, before);
    } else if (!on && this.map.getLayer('snow')) {
      this.map.removeLayer('snow');
    }
  }

  /** Einstellung „Bewegtes Wasser“ geändert. */
  setWaterMotion(on: boolean) {
    this.opts.waterMotion = on;
    this.water?.setEnabled(on);
  }

  destroy() {
    clearTimeout(this.decorTimer);
    this.fog?.destroy();
    this.water?.destroy();
    this.offPointers?.();
    this.markers.forEach((m) => m.marker.remove());
    this.markers.clear();
    this.sightMarkers.forEach((m) => m.marker.remove());
    this.sightMarkers.clear();
    this.map?.remove();
  }
}
