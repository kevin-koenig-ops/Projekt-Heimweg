// Einstellungen. Wird als eigener Bildschirm (aus dem Menü) und als Overlay (im Spiel) benutzt.

import { BUILD_STAMP, GAME_VERSION, IS_PREVIEW } from '../config';
import type { Settings } from '../services/settings';
import type { App } from './app';
import { h, svgEl } from './dom';
import { flagSvg, LANGUAGES } from './flags';
import { BOOK_ORDER, bookItem, type BookKey } from './cards';
import { showCardReveal } from './game/cardReveal';
import { CARDS, WEAPONS } from '../core/content';
import type { WeaponId } from '../core/types';

type Cat = 'general' | 'map' | 'control' | 'graphics' | 'sound' | 'test' | 'account';
/** Zuletzt offener Bereich (bleibt beim nächsten Öffnen). */
let lastCat: Cat = 'general';

export function settingsPanel(app: App, opts: { onDeleted?: () => void } = {}): HTMLElement {
  const s = app.settings;

  const segmented = <K extends keyof Settings>(key: K, id: string, options: [Settings[K], string][], disabled = false) => {
    const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-labelledby': id });
    const paint = () => [...group.children].forEach((c, i) => c.setAttribute('aria-checked', String(options[i][0] === s.get()[key])));
    for (const [value, label] of options) {
      group.append(
        h('button', { type: 'button', role: 'radio', disabled, onclick: () => (s.set({ [key]: value } as Partial<Settings>), paint()) }, label),
      );
    }
    paint();
    return group;
  };

  const vib = h('input', {
    id: 'set-vibration',
    type: 'checkbox',
    class: 'toggle',
    onchange: () => s.set({ vibration: vib.checked }),
  });
  vib.checked = s.get().vibration;

  const fullToggle = h('input', { id: 'set-full', type: 'checkbox', class: 'toggle', onchange: () => s.set({ fullscreen: fullToggle.checked }) });
  fullToggle.checked = s.get().fullscreen;

  const weatherToggle = h('input', { id: 'set-weather', type: 'checkbox', class: 'toggle', onchange: () => s.set({ realWeather: weatherToggle.checked }) });
  weatherToggle.checked = s.get().realWeather;

  const buildToggle = h('input', { id: 'set-instant', type: 'checkbox', class: 'toggle', onchange: () => s.set({ instantBuild: buildToggle.checked }) });
  buildToggle.checked = s.get().instantBuild;

  const waterToggle = h('input', { id: 'set-water', type: 'checkbox', class: 'toggle', onchange: () => s.set({ waterMotion: waterToggle.checked }) });
  waterToggle.checked = s.get().waterMotion;


  // Musiklautstärke: Regler 0–100, ändert sich sofort beim Schieben
  const volValue = h('output', { class: 'range-value', for: 'set-vol' });
  const volSlider = h('input', {
    id: 'set-vol',
    type: 'range',
    class: 'range',
    min: '0',
    max: '100',
    step: '5',
    oninput: () => {
      volValue.textContent = `${volSlider.value} %`;
      s.set({ musicVolume: Number(volSlider.value) / 100 });
    },
  });
  volSlider.value = String(Math.round(s.get().musicVolume * 100));
  volValue.textContent = `${volSlider.value} %`;

  const select = <K extends 'testPhase' | 'testWeather' | 'testSeason'>(key: K, id: string, options: [Settings[K], string][]) => {
    const sel = h('select', { id, class: 'select', onchange: () => s.set({ [key]: sel.value } as Partial<Settings>) }, options.map(([v, label]) => h('option', { value: String(v) }, label)));
    sel.value = String(s.get()[key]);
    return sel;
  };
  const phaseSelect = select('testPhase', 'set-phase', [
    ['auto', 'Echt (Sonnenstand)'],
    ['day', 'Tag'],
    ['dusk', 'Dämmerung'],
    ['night', 'Nacht'],
  ]);
  const weatherSelect = select('testWeather', 'set-wx', [
    ['auto', 'Echt'],
    ['clear', 'Klar'],
    ['cloudy', 'Bewölkt'],
    ['rain', 'Regen'],
    ['storm', 'Gewitter'],
    ['snow', 'Schnee'],
    ['fog', 'Nebel'],
  ]);

  const seasonSelect = select('testSeason', 'set-season', [
    ['auto', 'Echt (Kalender)'],
    ['spring', 'Frühling'],
    ['summer', 'Sommer'],
    ['autumn', 'Herbst'],
    ['winter', 'Winter'],
  ]);

  // Testen: eine Sammelkarte bekommen und gleich ansehen (wie bei einem Fund)
  let giftKey: BookKey = 'molotov';
  const giftSelect = h(
    'select',
    { id: 'set-gift', class: 'select', onchange: () => (giftKey = giftSelect.value as BookKey) },
    BOOK_ORDER.map((k) => h('option', { value: k }, bookItem(k).name)),
  );
  giftSelect.value = giftKey;
  const giftBtn = h(
    'button',
    {
      class: 'btn small',
      type: 'button',
      onclick: async () => {
        if (!app.backend.current()) return app.toast('Erst ein Spiel starten, dann geht das.', 'warn');
        const weapon = giftKey.startsWith('w:') ? (giftKey.slice(2) as WeaponId) : undefined;
        const card = weapon ? undefined : (giftKey as keyof typeof CARDS);
        const res = await app.backend.dispatch({ type: 'testGift', card, weapon });
        const ev = res.events[0];
        if (ev?.type !== 'gifted') return app.toast('Das ging nicht.', 'warn');
        const rarity = weapon ? (WEAPONS[weapon].rarity ?? 'common') : (CARDS[card!].rarity ?? 'common');
        const host = (document.querySelector('.overlay-host') as HTMLElement | null) ?? (document.querySelector('.screen') as HTMLElement | null) ?? document.body;
        showCardReveal(host, { type: 'sightingClaimed', id: 'test', card: ev.card, weapon: ev.weapon, repaired: ev.repaired, level: ev.level, levelUp: ev.levelUp, rarity, shiny: false }, res.state, '', () => undefined);
      },
    },
    'Bekommen',
  );

  let armed = false;
  let armTimer = 0;
  const del = h('button', { class: 'btn ghost danger-text', type: 'button' }, 'Spielstand löschen');
  del.addEventListener('click', async () => {
    if (!app.backend.current()) {
      app.toast('Es gibt keinen Spielstand.');
      return;
    }
    if (!armed) {
      armed = true;
      del.textContent = 'Wirklich löschen? Nochmal tippen';
      del.classList.add('armed');
      armTimer = window.setTimeout(() => {
        armed = false;
        del.textContent = 'Spielstand löschen';
        del.classList.remove('armed');
      }, 4000);
      return;
    }
    clearTimeout(armTimer);
    await app.backend.deleteSave();
    app.toast('Spielstand gelöscht.');
    del.textContent = 'Spielstand löschen';
    del.classList.remove('armed');
    armed = false;
    opts.onDeleted?.();
  });

  // Sprache: Fahnen zum Antippen. Noch nicht übersetzte Sprachen stehen als „bald“ da.
  const langGrid = h('div', { class: 'lang-grid', role: 'radiogroup', 'aria-labelledby': 'lbl-lang' });
  const paintLang = () =>
    [...langGrid.children].forEach((c, i) => c.setAttribute('aria-checked', String(LANGUAGES[i].code === s.get().language)));
  for (const lang of LANGUAGES) {
    langGrid.append(
      h(
        'button',
        {
          type: 'button',
          role: 'radio',
          class: 'lang' + (lang.ready ? '' : ' soon'),
          lang: lang.code,
          'aria-disabled': lang.ready ? undefined : 'true',
          onclick: () => {
            if (!lang.ready) return app.toast(`${lang.name}: kommt bald.`);
            s.set({ language: lang.code });
            paintLang();
          },
        },
        svgEl(flagSvg(lang.code)),
        h('span', { class: 'lang-name' }, lang.name),
        lang.ready ? null : h('small', null, 'bald'),
      ),
    );
  }
  paintLang();

  const previewNote = IS_PREVIEW
    ? h('p', { class: 'note' }, 'In dieser Vorschau gibt es nur das Demo-Dorf und Tippen-zum-Laufen. Echte Karte und GPS laufen in der App-Version auf dem Handy.')
    : null;

  // Unterpunkte: eine Leiste oben, darunter immer nur ein Bereich
  const row = (label: HTMLElement, control: HTMLElement | null) => h('div', { class: 'set-row' }, label, control);
  const lbl = (forId: string, title: string, hint?: string) => h('label', { class: 'set-label', for: forId }, title, hint ? h('small', null, hint) : null);
  const cats: [Cat, string, (HTMLElement | null)[]][] = [
    [
      'general',
      'Allgemein',
      [
        h('h2', { id: 'lbl-lang' }, 'Sprache'),
        h('p', { class: 'note' }, 'Bisher gibt es das Spiel nur auf Deutsch. Die anderen Sprachen kommen, sobald die Texte fertig sind.'),
        langGrid,
        row(lbl('set-vibration', 'Vibration', 'Kurz vibrieren, wenn eine Fundstelle in Reichweite ist'), vib),
        row(lbl('set-full', 'Vollbild', 'Am Handy beim Spielen ins Vollbild und im Querformat bleiben (geht nicht in jedem Browser).'), fullToggle),
      ],
    ],
    [
      'map',
      'Karte & Standort',
      [
        row(h('div', { class: 'set-label', id: 'lbl-map' }, 'Karte', h('small', null, 'Echte Umgebung oder das fiktive Dorf Altenbrück')), segmented('map', 'lbl-map', [['real', 'Echt'], ['demo', 'Demo-Dorf']], IS_PREVIEW)),
        row(h('div', { class: 'set-label', id: 'lbl-loc' }, 'Standort', h('small', null, 'GPS draußen, Simulation zum Testen drinnen')), segmented('location', 'lbl-loc', [['gps', 'GPS'], ['sim', 'Simulation']], IS_PREVIEW)),
        previewNote,
        row(lbl('set-weather', 'Echtes Wetter', 'Regen, Schnee und Nebel wie draußen. Dafür geht dein Standort, auf etwa 10 km gerundet, an Open-Meteo.'), weatherToggle),
      ],
    ],
    [
      'control',
      'Steuerung',
      [
        row(
          h('div', { class: 'set-label', id: 'lbl-ctrl' }, 'Figur bewegen', h('small', null, 'Antippen: Figur läuft zur Stelle, wie bei Die Sims. Joystick: selbst steuern, mit Benutzen-Taste. Gilt zu Hause und in der Simulation.')),
          segmented('control', 'lbl-ctrl', [
            ['tap', 'Antippen'],
            ['joystick', 'Joystick'],
          ]),
        ),
        row(
          h('div', { class: 'set-label', id: 'lbl-lgames' }, 'Minispiele beim Durchsuchen', h('small', null, 'Schloss knacken, aufhebeln, wühlen: Wer es gut macht, findet mehr. Aus: immer ein normales Ergebnis.')),
          segmented('lootGames', 'lbl-lgames', [
            ['on', 'An'],
            ['off', 'Aus'],
          ]),
        ),
      ],
    ],
    [
      'graphics',
      'Grafik',
      [
        row(
          h('div', { class: 'set-label', id: 'lbl-ui' }, 'Oberfläche', h('small', null, 'Wie groß Knöpfe, Schrift und Leisten sind. Karte, Zuhause und Kampf selbst bleiben gleich. „Groß“ ist die alte Größe.')),
          segmented('uiScale', 'lbl-ui', [
            [0.8, 'Klein'],
            [0.9, 'Normal'],
            [1, 'Groß'],
            [1.15, 'Sehr groß'],
          ]),
        ),
        row(lbl('set-water', 'Bewegtes Wasser', 'Wellen und Glitzern auf der Karte und am See. Aus spart etwas Akku.'), waterToggle),
        row(
          h('div', { class: 'set-label', id: 'lbl-ground' }, 'Boden der Karte', h('small', null, 'Neu: selbst gemalt, mit weichen Rändern, Höfen und Gehwegen (aus der Nähe). Alt: die bisherigen Muster. Läuft Neu auf deinem Handy zäh, nimm Alt.')),
          segmented('ground', 'lbl-ground', [
            ['paint', 'Neu'],
            ['pattern', 'Alt'],
          ]),
        ),
        row(
          h('div', { class: 'set-label', id: 'lbl-bview' }, 'Kampfansicht', h('small', null, 'Von der Seite oder über die Schulter deiner Figur. Die Schulteransicht ist noch ein Versuch.')),
          segmented('battleView', 'lbl-bview', [
            ['side', 'Seite'],
            ['shoulder', 'Schulter'],
          ]),
        ),
        row(
          h('div', { class: 'set-label', id: 'lbl-fps' }, 'Bildrate (FPS)', h('small', null, 'Bilder pro Sekunde. 30 schont Akku und hält das Handy kühl, 60 ist flüssig. 90 und Max nur, wenn dein Bildschirm das kann.')),
          segmented('fpsCap', 'lbl-fps', [
            [30, '30'],
            [60, '60'],
            [90, '90'],
            [0, 'Max'],
          ]),
        ),
      ],
    ],
    [
      'sound',
      'Klang',
      [
        row(
          h('div', { class: 'set-label', id: 'lbl-music' }, 'Musik', h('small', null, 'Dauerschleife: Musik läuft ohne Pause. Ab und zu: ein Stück, dann ein paar Minuten Stille, dann das nächste.')),
          segmented('music', 'lbl-music', [
            ['loop', 'Dauerschleife'],
            ['sometimes', 'Ab und zu'],
            ['off', 'Aus'],
          ]),
        ),
        row(lbl('set-vol', 'Lautstärke', 'Nur die Musik'), h('div', { class: 'range-wrap' }, volSlider, volValue)),
        h('p', { class: 'note' }, 'Im Hauptmenü, zu Hause und auf der Karte läuft jeweils eigene Musik.'),
      ],
    ],
    [
      'test',
      'Testen',
      [
        h('p', { class: 'note' }, 'Zum Ausprobieren: Tageszeit, Wetter und Jahreszeit erzwingen, um die Stimmungen zu sehen. Ändert nur die Optik, nicht Beute oder Gegner.'),
        row(lbl('set-phase', 'Tageszeit'), phaseSelect),
        row(lbl('set-wx', 'Wetter'), weatherSelect),
        row(lbl('set-season', 'Jahreszeit', 'Laub, kahle Bäume, Schnee und später die Bodenbilder je Jahreszeit'), seasonSelect),
        row(lbl('set-instant', 'Ohne Bauzeit bauen', 'Zu Hause ist alles sofort fertig, auch was gerade im Bau ist. Nur zum Ausprobieren; im echten Spiel braucht Bauen Zeit.'), buildToggle),
        row(lbl('set-gift', 'Sammelkarte bekommen', 'Zum Ansehen: kommt in den Rucksack und ins Sammelbuch'), h('div', { class: 'gift-row' }, giftSelect, giftBtn)),
      ],
    ],
    [
      'account',
      'Konto & Daten',
      [
        row(h('div', { class: 'set-label' }, 'Gast auf diesem Gerät', h('small', null, 'Dein Spielstand liegt nur auf diesem Gerät.')), h('button', { class: 'btn ghost small', type: 'button', disabled: true }, 'Google · bald')),
        h('h2', null, 'Datenschutz'),
        h('p', { class: 'note' }, 'Dein genauer Standort verlässt dein Gerät nicht. Für die echte Karte lädt die App Kartenkacheln von OpenFreeMap; dabei sieht der Kartenserver nur, welcher Kartenausschnitt geladen wird. Für echtes Wetter geht ein auf etwa 10 km gerundeter Ort an Open-Meteo. Das kannst du unter „Karte & Standort“ ausschalten. Den Ort deines Zuhauses speichert nur dieses Gerät; andere Spieler sehen ihn nie.'),
        h('h2', null, 'Spielstand'),
        del,
        h('p', { class: 'version' }, `Version ${GAME_VERSION}${BUILD_STAMP ? ` (Stand ${BUILD_STAMP})` : ''} · Kartendaten © OpenStreetMap-Mitwirkende`),
      ],
    ],
  ];
  const tabs = h('nav', { class: 'set-tabs', role: 'tablist', 'aria-label': 'Bereiche' });
  const body = h('section', { class: 'set-group', role: 'tabpanel' });
  const show = (cat: Cat) => {
    lastCat = cat;
    [...tabs.children].forEach((b, i) => b.setAttribute('aria-selected', String(cats[i][0] === cat)));
    body.replaceChildren(...(cats.find((c) => c[0] === cat)![2].filter(Boolean) as HTMLElement[]));
  };
  for (const [cat, name] of cats) tabs.append(h('button', { type: 'button', role: 'tab', class: 'set-tab', onclick: () => show(cat) }, name));
  show(lastCat);
  return h('div', { class: 'settings' }, tabs, body);
}
