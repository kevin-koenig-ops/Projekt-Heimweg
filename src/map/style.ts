// Der Endzeit-Kartenstil.
//
// Funktioniert für zwei Datenquellen:
//  - 'real': OpenStreetMap-Vektorkacheln von OpenFreeMap (OpenMapTiles-Schema)
//  - 'demo': das eingebaute Demo-Dorf (GeoJSON mit denselben Ebenen-/Klassennamen)

import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  SourceSpecification,
  StyleSpecification,
} from 'maplibre-gl';
import { contourTiles } from './contours';

export const MAP_COLORS = {
  ground: '#8c8663',
  residential: '#8b856b',
  industrial: '#86837a',
  water: '#577f87',
  waterEdge: '#a3ad8f',
  casing: '#57534b',
  roadMajor: '#8f8a7f',
  roadMinor: '#7f7b72',
  track: '#a48e66',
  path: '#b6a27a',
  marking: '#e6dcb8',
  building: '#5f584e',
  buildingTop: '#7a7062',
  label: '#3a342b',
  labelHalo: '#f1e9d6',
  /** Höhenlinien: Erdbraun wie auf Wanderkarten. */
  contour: '#6b4a26',
};

type Mode = 'real' | 'demo';

/** Ab dieser Zoomstufe zeigt die Karte die Detail-Ebene (Bäume, Häuser mit Dach, Autowracks). */
export const DECOR_MINZOOM = 15;

export interface RealSource {
  source: SourceSpecification;
  glyphs?: string;
}

const z = (stops: [number, number][], base = 1.6): ExpressionSpecification =>
  ['interpolate', ['exponential', base], ['zoom'], ...stops.flat()] as ExpressionSpecification;

const cls = (...values: string[]): FilterSpecification => ['in', ['get', 'class'], ['literal', values]] as FilterSpecification;

export function buildStyle(mode: Mode, real?: RealSource): StyleSpecification {
  const C = MAP_COLORS;

  // Liefert source/source-layer/filter passend zur Datenquelle.
  const from = (layer: string, filter?: FilterSpecification) => {
    if (mode === 'real') return { source: 'omt', 'source-layer': layer, ...(filter ? { filter } : {}) };
    const f = ['==', ['get', '_layer'], layer] as FilterSpecification;
    return { source: 'demo', filter: (filter ? ['all', f, filter] : f) as FilterSpecification };
  };

  const isLine = ['==', ['geometry-type'], 'LineString'] as FilterSpecification;
  const road = (classes: string[]): FilterSpecification => ['all', isLine, cls(...classes)] as FilterSpecification;

  const MAJOR = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];
  const MINOR = ['minor', 'service', 'residential', 'unclassified', 'living_street'];
  const wMajor = z([[12, 1.5], [15, 6], [17, 16], [19, 46], [21, 150]]);
  const wMinor = z([[13, 0.8], [15, 3], [17, 10], [19, 30], [21, 100]]);

  /** Weicher Rand einer Fläche (siehe unten bei den Flächen). */
  const softW = z([[13, 2], [15, 8], [17, 32], [19, 128], [21, 512]], 2);
  const soft = (id: string, src: ReturnType<typeof from>, color: string | ExpressionSpecification): LayerSpecification => ({
    id: `soft-${id}`,
    type: 'line',
    ...src,
    layout: { 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': softW, 'line-blur': softW, 'line-opacity': 0.85 },
  });

  const layers: LayerSpecification[] = [
    { id: 'ground', type: 'background', paint: { 'background-pattern': 'pat-ground' } },

    // Flächen: gemalte Texturen je Untergrund (map/patterns.ts)
    { id: 'landuse-residential', type: 'fill', ...from('landuse', cls('residential', 'suburb', 'neighbourhood')), paint: { 'fill-pattern': 'pat-gardens', 'fill-opacity': 0.9 } },
    {
      id: 'landuse-industrial',
      type: 'fill',
      ...from('landuse', cls('industrial', 'commercial', 'retail', 'railway', 'garages', 'quarry')),
      // Je Art ein eigenes Bild: Industrie, Gewerbe und Parkplätze, Bahngelände, Steinbruch
      paint: { 'fill-pattern': ['match', ['get', 'class'], ['commercial', 'retail'], 'pat-commercial', 'railway', 'pat-railyard', 'quarry', 'pat-quarry', 'pat-industrial'] as ExpressionSpecification, 'fill-opacity': 0.95 },
    },
    {
      id: 'landcover-farm',
      type: 'fill',
      ...from('landcover', cls('farmland')),
      // Zwei Sorten Acker, je Feld eine: wie ein Flickenteppich (Kevin 24.10.: zwei Felder reichen)
      paint: { 'fill-pattern': ['match', ['%', ['to-number', ['coalesce', ['id'], 0]], 2], 0, 'pat-farm-a', 'pat-farm-b'] as ExpressionSpecification },
    },
    { id: 'landcover-farm-edge', type: 'line', ...from('landcover', cls('farmland')), paint: { 'line-color': '#6f6a46', 'line-width': z([[14, 0.6], [17, 2], [20, 5]]), 'line-opacity': 0.55, 'line-blur': 1 } },
    {
      id: 'landcover-grass',
      type: 'fill',
      ...from('landcover', cls('grass', 'meadow')),
      // Gepflegter Rasen nur in Parks und Gärten, sonst wilde Wiese mit Blumen
      paint: {
        'fill-pattern': ['match', ['coalesce', ['get', 'subclass'], ''], ['park', 'garden', 'village_green', 'recreation_ground', 'golf_course', 'flowerbed'], 'pat-grass', 'pat-meadow'] as ExpressionSpecification,
      },
    },
    {
      id: 'landuse-green',
      type: 'fill',
      ...from('landuse', cls('pitch', 'playground', 'stadium', 'park', 'school')),
      paint: { 'fill-pattern': ['match', ['get', 'class'], ['pitch', 'stadium'], 'pat-pitch', 'playground', 'pat-playground', 'pat-grass'] as ExpressionSpecification },
    },
    // Friedhöfe bleiben schlicht (sensible Orte)
    { id: 'landuse-cemetery', type: 'fill', ...from('landuse', cls('cemetery')), paint: { 'fill-color': '#7e8463' } },
    { id: 'landuse-cemetery-edge', type: 'line', ...from('landuse', cls('cemetery')), paint: { 'line-color': '#5f6248', 'line-width': 1.2, 'line-dasharray': [2, 2] } },
    // Sand: Strand und Dünen mit Sandbild; „sand“ allein sind bei uns meist sandige Plätze und
    // Parkplätze (Kevin 23.10.: sah aus wie Wüste), die bekommen Kies (bis es ein Bild gibt: Grundboden)
    {
      id: 'landcover-sand',
      type: 'fill',
      ...from('landcover', cls('sand')),
      paint: { 'fill-pattern': ['match', ['coalesce', ['get', 'subclass'], ''], ['beach', 'dune'], 'pat-sand', 'pat-gravel'] as ExpressionSpecification },
    },
    { id: 'landcover-rock', type: 'fill', ...from('landcover', cls('rock')), paint: { 'fill-pattern': 'pat-rock' } },
    { id: 'landcover-wetland', type: 'fill', ...from('landcover', cls('wetland')), paint: { 'fill-pattern': 'pat-wetland' } },
    // Eis und Gletscher: schlichte Farbe, bis es ein Bild gibt (GameMap setzt es dann)
    { id: 'landcover-ice', type: 'fill', ...from('landcover', cls('ice', 'glacier')), paint: { 'fill-color': '#dfe5e6' } },
    {
      id: 'landcover-wood',
      type: 'fill',
      ...from('landcover', cls('wood', 'forest')),
      // Von weitem Baumkronen, nah dran Waldboden (die Bäume stehen dann in 3D darauf)
      paint: { 'fill-pattern': ['step', ['zoom'], 'pat-forest', DECOR_MINZOOM, 'pat-forest-floor'] },
    },
    { id: 'landcover-wood-edge', type: 'line', ...from('landcover', cls('wood', 'forest')), paint: { 'line-color': '#3c4a28', 'line-width': 3, 'line-blur': 3, 'line-opacity': 0.6 } },

    // Weiche Übergänge: ein breiter, ganz unscharfer Streifen in der Mittelfarbe der Textur
    // liegt auf jeder Kante und blendet in die Nachbarfläche über (etwa 8 m breit).
    soft('residential', from('landuse', cls('residential', 'suburb', 'neighbourhood')), '#767859'),
    soft('industrial', from('landuse', cls('industrial', 'commercial', 'retail', 'railway', 'garages', 'quarry')), '#7b6e5c'),
    soft('farm', from('landcover', cls('farmland')), ['match', ['%', ['to-number', ['coalesce', ['id'], 0]], 3], 0, '#5d4b32', 1, '#544b31', '#736141'] as ExpressionSpecification),
    soft(
      'grass',
      from('landcover', cls('grass', 'meadow')),
      ['match', ['coalesce', ['get', 'subclass'], ''], ['park', 'garden', 'village_green', 'recreation_ground', 'golf_course', 'flowerbed'], '#969657', '#9a955a'] as ExpressionSpecification,
    ),
    soft('green', from('landuse', cls('pitch', 'playground', 'stadium', 'park', 'school')), '#969657'),
    soft('sand', from('landcover', cls('sand')), ['match', ['coalesce', ['get', 'subclass'], ''], ['beach', 'dune'], '#c0a991', '#80694a'] as ExpressionSpecification),
    soft('rock', from('landcover', cls('rock')), '#908871'),
    soft('wetland', from('landcover', cls('wetland')), '#534d38'),
    soft('ice', from('landcover', cls('ice', 'glacier')), '#dfe5e6'),
    soft('wood', from('landcover', cls('wood', 'forest')), ['step', ['zoom'], '#4f5a33', DECOR_MINZOOM, '#6a4f37'] as ExpressionSpecification),

    // Wasser mit hellem Ufer
    { id: 'water-shore', type: 'line', ...from('water'), paint: { 'line-color': C.waterEdge, 'line-width': z([[14, 1.5], [17, 5], [20, 12]]), 'line-blur': 2, 'line-opacity': 0.9 } },
    { id: 'water', type: 'fill', ...from('water'), paint: { 'fill-pattern': 'pat-water' } },
    { id: 'water-edge', type: 'line', ...from('water'), paint: { 'line-color': '#3f646c', 'line-width': 1.2, 'line-opacity': 0.6 } },
    {
      id: 'waterway-shore',
      type: 'line',
      ...from('waterway'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.waterEdge, 'line-width': z([[13, 2], [17, 10], [20, 30]]), 'line-blur': 2, 'line-opacity': 0.8 },
    },
    {
      id: 'waterway',
      type: 'line',
      ...from('waterway'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.water, 'line-width': z([[13, 1], [17, 6], [20, 20]]) },
    },

    // Straßen: Kante, Belag, verblasste Mittellinie
    // Feldwege als Erdspur, Fußwege schmaler und heller
    { id: 'road-track', type: 'line', ...from('transportation', road(['track'])), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.track, 'line-width': z([[14, 1], [17, 4.5], [20, 14]]), 'line-opacity': 0.9 } },
    { id: 'road-path', type: 'line', ...from('transportation', road(['path', 'footway', 'cycleway', 'bridleway'])), layout: { 'line-cap': 'round' }, paint: { 'line-color': C.path, 'line-width': z([[14, 0.6], [17, 2.6], [20, 7]]), 'line-dasharray': [2, 1.2] } },
    { id: 'road-rail', type: 'line', ...from('transportation', road(['rail', 'transit'])), paint: { 'line-color': '#5a5550', 'line-width': z([[13, 1], [18, 5]]), 'line-dasharray': [1, 1] } },
    { id: 'road-minor-casing', type: 'line', ...from('transportation', road(MINOR)), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.casing, 'line-width': z([[13, 1.4], [15, 4.6], [17, 13], [19, 36], [21, 112]]) } },
    { id: 'road-major-casing', type: 'line', ...from('transportation', road(MAJOR)), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.casing, 'line-width': z([[12, 2.4], [15, 8], [17, 20], [19, 54], [21, 164]]) } },
    { id: 'road-minor', type: 'line', ...from('transportation', road(MINOR)), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.roadMinor, 'line-width': wMinor } },
    { id: 'road-major', type: 'line', ...from('transportation', road(MAJOR)), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.roadMajor, 'line-width': wMajor } },
    {
      id: 'road-cracks',
      type: 'line',
      minzoom: 16.3,
      ...from('transportation', road([...MAJOR, ...MINOR])),
      layout: { 'line-join': 'round' },
      paint: {
        'line-pattern': 'pat-cracks',
        'line-opacity': 0.6,
        'line-width': [
          'interpolate', ['exponential', 1.6], ['zoom'],
          15, ['match', ['get', 'class'], MAJOR, 6, 3],
          17, ['match', ['get', 'class'], MAJOR, 16, 10],
          19, ['match', ['get', 'class'], MAJOR, 46, 30],
          21, ['match', ['get', 'class'], MAJOR, 150, 100],
        ] as ExpressionSpecification,
      },
    },
    { id: 'road-marking', type: 'line', minzoom: 16, ...from('transportation', road(MAJOR)), paint: { 'line-color': C.marking, 'line-opacity': 0.45, 'line-width': z([[16, 0.8], [19, 2.4]]), 'line-dasharray': [4, 6] } },

    // Suchradius liegt auf dem Boden, Häuser und Bäume verdecken ihn
    { id: 'range-fill', type: 'fill', source: 'range', paint: { 'fill-color': '#ffb22e', 'fill-opacity': 0.08 } },
    { id: 'range-line', type: 'line', source: 'range', paint: { 'line-color': '#ffb22e', 'line-width': 2, 'line-opacity': 0.8, 'line-dasharray': [2, 2] } },

    // Geplante Strecke im Testmodus: durchgezogen auf Wegen, gepunktet quer durchs Gelände
    { id: 'route-shadow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#12110f', 'line-width': 8, 'line-opacity': 0.5 } },
    { id: 'route-way', type: 'line', source: 'route', filter: ['!=', ['get', 'off'], true], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffb22e', 'line-width': 4, 'line-opacity': 0.95 } },
    { id: 'route-off', type: 'line', source: 'route', filter: ['==', ['get', 'off'], true], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffd27a', 'line-width': 4, 'line-dasharray': [0.2, 2] } },

    // Weltereignisse: Zonen am Boden (Staubsturm braun, Horde rot, Sperrgebiet rot-weiß gestrichelt)
    {
      id: 'zone-fill',
      type: 'fill',
      source: 'zones',
      paint: {
        'fill-color': ['match', ['get', 'k'], 'dust', '#b08a58', 'horde', '#b8402b', 'quarantine', '#c23a22', '#ffffff'],
        'fill-opacity': ['match', ['get', 'k'], 'dust', 0.28, 'horde', 0.12, 'quarantine', 0.16, 0.1],
      },
    },
    {
      id: 'zone-line',
      type: 'line',
      source: 'zones',
      filter: ['!=', ['get', 'k'], 'quarantine'],
      paint: { 'line-color': ['match', ['get', 'k'], 'dust', '#8a6a3e', '#d4553a'], 'line-width': 2.5, 'line-opacity': 0.85, 'line-dasharray': [3, 2] },
    },
    // Absperrband: rot und weiß im Wechsel
    { id: 'zone-tape-white', type: 'line', source: 'zones', filter: ['==', ['get', 'k'], 'quarantine'], paint: { 'line-color': '#f2ede4', 'line-width': 4, 'line-opacity': 0.9 } },
    { id: 'zone-tape-red', type: 'line', source: 'zones', filter: ['==', ['get', 'k'], 'quarantine'], paint: { 'line-color': '#c23a22', 'line-width': 4, 'line-opacity': 0.95, 'line-dasharray': [1.2, 1.2] } },

    // Sichtkegel der Trupps: blass am Boden (rot, wenn sie dich gleich sehen)
    {
      id: 'patrol-cone',
      type: 'fill',
      source: 'patrols',
      paint: {
        // f: beim Ein- und Ausblenden
        'fill-color': ['case', ['>', ['get', 'a'], 0.5], '#e0442a', ['>', ['get', 'a'], 0.05], '#ff9a3a', '#ffe6a8'],
        'fill-opacity': ['*', ['coalesce', ['get', 'f'], 1], ['case', ['>', ['get', 'a'], 0.05], 0.42, 0.32]],
      },
    },
    {
      id: 'patrol-cone-edge',
      type: 'line',
      source: 'patrols',
      paint: {
        'line-color': ['case', ['>', ['get', 'a'], 0.05], '#e0442a', '#fff1cc'],
        'line-width': 2,
        'line-opacity': ['*', ['coalesce', ['get', 'f'], 1], 0.9],
      },
    },

    // Suchkreise von Verstecken: wie mit Kreide auf den Boden gemalt
    { id: 'cache-fill', type: 'fill', source: 'caches', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#e8dec8', 'fill-opacity': 0.07 } },
    { id: 'cache-line', type: 'line', source: 'caches', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'line-color': '#e8dec8', 'line-width': 2.5, 'line-opacity': 0.75, 'line-dasharray': [1, 2.2] } },
    // Spuren auf dem Boden: eine Reihe dunkler Tritte bis zum Versteck
    { id: 'cache-trail', type: 'line', source: 'caches', filter: ['==', ['geometry-type'], 'LineString'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#3b2a1f', 'line-width': 5, 'line-opacity': 0.8, 'line-dasharray': [0.25, 1.6] } },

    // Warmes Leuchten am Boden unter Fundstellen
    {
      id: 'spot-glow',
      type: 'circle',
      source: 'glow',
      paint: {
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
        'circle-blur': 1,
        'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 15, 7, 17, 26, 19, 100],
        'circle-color': ['case', ['==', ['get', 'c'], 1], '#ffe070', ['==', ['get', 'g'], 1], '#d9482b', ['==', ['get', 's'], 'inrange'], '#ffd27a', ['==', ['get', 'src'], 'poi'], '#f1e2bd', '#ffb22e'],
        'circle-opacity': ['case', ['==', ['get', 's'], 'cooldown'], 0, ['==', ['get', 'c'], 1], 0.9, ['==', ['get', 's'], 'inrange'], 0.75, 0.5],
      },
    },

    // Weit weg (herausgezoomt): einfache 3D-Blöcke aus den Kartendaten
    {
      id: 'buildings',
      type: 'fill-extrusion',
      minzoom: 13,
      maxzoom: DECOR_MINZOOM,
      ...from('building'),
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 2, '#8a8070', 8, '#9a907e', 20, '#a69c8a'],
        'fill-extrusion-height': ['*', 0.75, ['coalesce', ['get', 'render_height'], 6]],
        'fill-extrusion-base': ['*', 0.75, ['coalesce', ['get', 'render_min_height'], 0]],
        'fill-extrusion-opacity': 0.94,
      },
    },
    // Nah dran: nur Grundrisse; die Häuser selbst kommen aus der Detail-Ebene
    { id: 'buildings-flat', type: 'fill', minzoom: DECOR_MINZOOM, ...from('building'), paint: { 'fill-color': C.building } },
    // Detail-Ebene (map/decor.ts): Häuser mit Dächern und Ruinen, Bäume, Autowracks
    {
      id: 'decor',
      type: 'fill-extrusion',
      source: 'decor',
      minzoom: DECOR_MINZOOM,
      paint: {
        'fill-extrusion-color': ['get', 'c'],
        'fill-extrusion-height': ['get', 't'],
        'fill-extrusion-base': ['get', 'b'],
        'fill-extrusion-opacity': 1,
      },
    },
  ];

  if (mode === 'real') {
    layers.push(
      {
        id: 'street-names',
        type: 'symbol',
        minzoom: 15,
        source: 'omt',
        'source-layer': 'transportation_name',
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:de'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': z([[15, 10], [18, 13]], 1.2),
          'text-letter-spacing': 0.08,
          'text-transform': 'uppercase',
        },
        paint: { 'text-color': C.label, 'text-opacity': 0.55, 'text-halo-color': C.labelHalo, 'text-halo-width': 1.4 },
      },
      {
        id: 'place-names',
        type: 'symbol',
        source: 'omt',
        'source-layer': 'place',
        filter: cls('village', 'town', 'suburb', 'hamlet', 'city', 'quarter'),
        layout: {
          'text-field': ['coalesce', ['get', 'name:de'], ['get', 'name']],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
          'text-letter-spacing': 0.25,
          'text-transform': 'uppercase',
        },
        paint: { 'text-color': C.label, 'text-opacity': 0.4, 'text-halo-color': C.labelHalo, 'text-halo-width': 1.6 },
      },
    );
  }

  // Gelände: Hänge und Täler als weiche Schattierung (Höhendaten, nur auf der echten Karte)
  if (mode === 'real') {
    const at = layers.findIndex((l) => l.id === 'water-shore');
    layers.splice(at < 0 ? layers.length : at, 0, {
      id: 'hillshade',
      type: 'hillshade',
      source: 'dem',
      paint: {
        // Kräftig, sonst geht das Gelände unter den Texturen verloren
        'hillshade-exaggeration': z([[10, 1], [18, 1], [20, 0.9]]),
        'hillshade-shadow-color': 'rgba(28, 20, 10, 1)',
        'hillshade-highlight-color': 'rgba(255, 240, 200, 0.9)',
        'hillshade-accent-color': 'rgba(40, 30, 16, 0.5)',
        'hillshade-illumination-direction': 315,
        'hillshade-illumination-anchor': 'map',
      },
    });
    // Höhenlinien wie auf der Wanderkarte, die kräftigen mit Höhe in Metern
    layers.splice(at < 0 ? layers.length : at + 1, 0, {
      id: 'contour-lines',
      type: 'line',
      source: 'contours',
      'source-layer': 'contours',
      minzoom: 12,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': C.contour,
        'line-opacity': ['match', ['get', 'level'], 1, 0.55, 0.3],
        'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, ['match', ['get', 'level'], 1, 0.8, 0.4], 18, ['match', ['get', 'level'], 1, 1.6, 0.9]],
      },
    }, {
      id: 'contour-labels',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contours',
      minzoom: 13,
      filter: ['>', ['get', 'level'], 0],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 320,
        'text-field': ['concat', ['number-format', ['get', 'ele'], {}], ' m'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
      },
      paint: { 'text-color': C.contour, 'text-opacity': 0.8, 'text-halo-color': C.labelHalo, 'text-halo-width': 1.2 },
    });
  }

  const empty: SourceSpecification = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } };
  const sources: Record<string, SourceSpecification> = { range: empty, decor: { ...empty }, glow: { ...empty }, caches: { ...empty }, route: { ...empty }, zones: { ...empty }, patrols: { ...empty } };
  if (mode === 'real' && real) sources.omt = real.source;
  if (mode === 'real') sources.contours = { type: 'vector', tiles: [contourTiles(DEM_TILES)], maxzoom: 15 };
  if (mode === 'real') sources.dem = { type: 'raster-dem', tiles: [DEM_TILES], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: 'Höhen: <a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles</a>' };

  const style: StyleSpecification = {
    version: 8,
    sources,
    layers,
    light: { anchor: 'viewport', color: '#fff1d6', intensity: 0.5, position: [1.3, 210, 40] },
    sky: {
      'sky-color': '#9fb2bb',
      'horizon-color': '#d9cfb6',
      'fog-color': '#b9b49c',
      'sky-horizon-blend': 0.7,
      'horizon-fog-blend': 0.9,
      'fog-ground-blend': 0.75,
    },
  };
  if (mode === 'real' && real?.glyphs) style.glyphs = real.glyphs;
  return style;
}

// --- Echte Kartendaten -----------------------------------------------------------

const OFM_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
/** Höhendaten (frei, ohne Schlüssel): Farbe der Kachel = Höhe in Metern. */
const DEM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const OFM_FALLBACK: RealSource = {
  source: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
};

/**
 * Holt die aktuelle Kachel-Adresse von OpenFreeMap (kostenlos, ohne API-Key,
 * Daten von OpenStreetMap). Fällt bei Problemen auf bekannte Adressen zurück.
 */
export async function loadRealSource(): Promise<RealSource> {
  try {
    const res = await fetch(OFM_STYLE);
    if (!res.ok) throw new Error(String(res.status));
    const s = (await res.json()) as StyleSpecification;
    const src = s.sources?.openmaptiles;
    if (!src) throw new Error('keine Quelle');
    return { source: src, glyphs: s.glyphs ?? OFM_FALLBACK.glyphs };
  } catch {
    return OFM_FALLBACK;
  }
}
