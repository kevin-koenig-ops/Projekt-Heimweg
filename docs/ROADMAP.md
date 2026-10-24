# Fahrplan

Alle geplanten Features an einer Stelle: erst was für Version 1.0 noch fehlt, dann die Versionen danach, zum Schluss was schon erledigt ist. Dieselbe Planung steht übersichtlich im [Konzeptplan](https://claude.ai/artifact/3VZUUmEiEVBDWWdwN9EpCT). Alle Mechaniken mit Stand und der Weg zu 1.0 in neun Paketen: [Überblick aller Mechaniken](https://claude.ai/artifact/4pbh9xnuaXMgxENYvjNULE). Neue Ideen kommen in die passende Version oder unter „Ideen für irgendwann“.

**Seit 22.10.:** Die Reihenfolge von einfach zu komplex (8 Stufen, mit Aufwand und offenen Entscheidungen) steht im Überblick-Dokument im Tab „Roadmap“. Ganz vorne steht seit dem 22.10. **Stufe 0: Optik, Bauen und Gegner zuerst**: erst die Optik fertig (Texturen fürs Zuhause von Kevin, lebendiges Wasser, ein einheitlicher Look für Möbel, Figur und Gegner, schlanke Fenster), dann das Bauen als Herzstück (besser einrichten, etwa 150 Baupläne mit viel Deko) und alle 11 Gegner. Diese Datei sammelt weiter die Details und was erledigt ist.

## Version 1.0: was noch fehlt

Version 1.0 ist fertig, wenn der ganze Kreislauf ohne Lücken läuft: rausgehen, finden, heimkommen, auspacken, bauen. **Schwerpunkt seit 21.10.: erst ein rundes Kern-Gameplay, danach neue Features.** Pakete 1–9 (Bus raus bis Balancing) sind erledigt, siehe unten.

10. **Einstieg und langsamer Aufbau:** die ersten 10 Minuten geführt, über die Zielleiste. Spielteile schalten sich nach und nach frei (Werktisch, Kampf, Funkgerät, Lagerfeuer …), nichts überschwemmt einen am Anfang. Details im [Konzept](KONZEPT.md).
11. **Klang:** Geräusche für Fund, Bauen, Kampf und Heimkehr.
12. **Draußen-Test und Fehlerrunde:** eine Woche echt spielen, dann alles Hakelige reparieren. Dazu der Taschenmodus: Bildschirm schwarz, GPS läuft weiter, Vibration bei Fundstellen.
13. **Feinschliff nach dem Test:** Zahlen für Beute, Kämpfe und Stufen anhand echter Spielrunden nachstellen (das Rechenmodell dafür gibt es schon).
14. **Drinnen und draußen im Gleichgewicht:** Zu Hause muss es immer etwas zu tun geben, draußen das Besondere. Mehr Startmaterial, „Ums Haus streifen“ ein paarmal am Tag, Ziele auch für zu Hause, das Rechenmodell mit „Stubenhocker“ und „Läufer“. Details im [Konzept](KONZEPT.md).
15. **Grafikstil:** entschieden am 22.10.: gemalt und freundlich wie Kevins neue Bildschirmbilder, kein Comic mit Umrisslinien. Ausprobiert und wieder entfernt: Comic- und Gemalt-Stil per Shader, Quaternius-Modellpakete, 3D-Karte mit Fassaden (liegt in Git, Commit 4cc884c).
15b. **Handy-Oberfläche überarbeiten:** Die Karte ist umgebaut (21.10., nach dem Vorbild von Pokémon Go und Monster Hunter Now). Noch offen: Zuhause, Kampf und die Fenster (Rucksack, Fortschritt) genauso schlank machen.
16. **Wahrzeichen auf der Karte:** echte Apotheken, Supermärkte, Baumärkte, Tankstellen und Haltestellen als 3D-Gebäude aus dem echten Grundriss plus Modell-Teilen (Schild, vernagelte Fenster, Einkaufswagen). Nur in der Nähe geladen, nie an sensiblen Orten. Kommt nach der Entscheidung zur Stilprobe, damit es gleich im richtigen Stil ist. Details im [Konzept](KONZEPT.md).
17. **Gemütliche Rituale, erste Fassung:** Samstagabend am Lagerfeuer mit einem Lagerfeuerlied pro Woche, die Leiste „Heute zu Hause“ mit 2 bis 3 Überraschungen am Tag und „Willkommen zurück“ nach einer Pause. Braucht Klang (Punkt 11). Details im [Konzept](KONZEPT.md).

**Entschieden:** Kampf als kurze Taktik mit Karten statt Echtzeit. **Noch offen:** Grafikstil (Comic-Look nach Referenz), Endziel (Idee aus der Lore: mit deinen Leuten zur Küste aufbrechen), Spieltitel: seit 23.10. „Projekt Heimweg“ (vorher „Home“, davor Platzhalter „Nachhall“).

## Version 1.1: Karten, Klassen, Dungeons

Das Kartensystem wird zum Rückgrat. Erst mehr Karten, dann längere Kämpfe.

- **Kartensammlung:** Kniffe als seltene Funde, Werktisch-Gegenstände als Einmalkarten (Brandflasche, Krähenfüße, Rauchdose), Karten durch den Rang. Deck vor dem Rausgehen zusammenstellen.
- **Klassen:** Vorgeschichte mit 2 bis 3 eigenen Karten, ab dem Rang Streifer Land- oder Stadtstreifer. Höchstens ein Viertel des Decks, zu Hause wechselbar.
- **Rote Zonen als Dungeons:** 3 bis 5 Kämpfe hintereinander, der Atemschutz ist die Uhr, nur vor Ort, abbrechen geht immer.
- **Raids von zu Hause:** wöchentliches Nest über das Funkgerät, zuerst allein gegen einen großen Gegner mit Phasen, mit Konten (Version 2.0) dann für alle gemeinsam.

## Version 1.2: Geschichte und Bewohner

- **Überlebende ziehen ein:** Menschen mit Name, Geschichte und Fähigkeit wohnen sichtbar bei dir zu Hause, wünschen sich Möbel und geben kleine Aufträge. Gut versorgt helfen sie mehr; niemand stirbt, wenn du mal nicht spielst. Sie schreiben Briefe, haben Geburtstag und singen samstags am Lagerfeuer mit.
- **Tauschhändler mit Wochenkurs:** montags einkaufen, unter der Woche zu wechselnden Kursen tauschen (wie der Rübenmarkt bei Animal Crossing), nur mit Spiel-Rohstoffen.
- **Kampagnen (Kevin, 24.10.):** Geschichte und Aufträge kommen als mehrere Kampagnen. Jede ist für sich spielbar und erzählt einen Ausschnitt der Lore, zusammen ergeben sie die Welt. Horizontal erweiterbar: neue Kampagnen kommen als Daten dazu, ohne die alten anzufassen. Details im [Konzept](KONZEPT.md) unter „Kampagnen“.
- **Quests mit Witcher-Anspruch:** wenige, aber gute Aufträge, die in Stadt und Dorf funktionieren, gern mit echten Straßennamen („Bring Medizin aus der Apotheke in der Bahnhofstraße zum Stadtpark“).
- **Funk ausbauen:** Aufträge zu echten Orten in der Nähe, dazu Nachrichten, die das Funkgerät erst nach gelaufenen Kilometern entschlüsselt (das Funkgerät mit Funksprüchen und Versteck-Hinweisen gibt es schon).
- **Der rote Faden:** Kapitel-Reise mit sichtbarem Endziel, jeden Samstag eine neue Funk-Folge auf Kanal 4 (zum Nachhören). Details im [Konzept](KONZEPT.md).
- **Fälle und Rätsel:** Krimi-Fälle mit 3 bis 5 Hinweisen auf der Karte und einer Ermittlungstafel zu Hause (Logikrätsel: wer, wo, womit), dazu Geheimschrift, Funk-Codes und Zahlenschlösser. Falsch raten kostet nichts.
- **Geschichte in Häppchen:** Erinnerungsstücke werden zu zusammenhängenden Kapiteln, dazu Laborzettel, Archivnotizen und Funksprüche aus der Lore. Die Biologie wird nie erklärt.
- **Hund als Begleiter:** erschnüffelt draußen Verstecke, schläft zu Hause am Lagerfeuer. (Mitkämpfen erst als späteres Update, siehe „Ideen für irgendwann“.)

## Version 1.3: Kampf und Gefahr

- **Mehr Karten und Gegner:** neue Waffenkarten (z. B. Feuer gegen Wandler, schwere Schläge gegen die Kalkplatten des Borkenmanns), seltene Karten als Fund, Gegner-Varianten.
- **Statuseffekte und Lärm:** Brennt, Vereist, Geblendet, Verlangsamt, Blutet, Verwundbar, Schwach, Adrenalin. Dazu die Lärm-Leiste (laut lockt Heuler an), Kombos und bessere Treffer-Effekte (Anhalten beim Treffer, Zeitlupe beim letzten Kill). Details im [Konzept](KONZEPT.md).
- **Mehr Kreaturen aus der Lore:** Varianten von Wandlern und Heulern, Fiebergruben, die man ausbrennt. Vorschläge mit Lore und Bild-Prompts stehen im Überblick-Dokument (Seite Gegner).
- ~~**Schusswaffen:** Pistole, Schrotflinte, Gewehr als seltene Funde. Munition ist knapp, Schüsse sind laut und locken Gegner an.~~ Erledigt am 23.10.
- **Gefahrenstufe pro Ausflug:** vorher wählen, mehr Risiko bringt bessere Beute.
- **Horden auf echten Straßen:** umgehen, durchschleichen oder kämpfen. Lärm beim Durchsuchen lockt an, Stammwege werden mit der Zeit sicher.
- **Jagd:** Tiere auf der Karte, manchmal seltene.
- **Vollmond** macht Gegner stärker, dafür gibt es seltenere Beute.

## Version 1.4: Zuhause, Wetter und Jahreszeiten

- **In die Höhe bauen:** zwei bis drei Stockwerke wie bei Die Sims, mit Treppe oder Leiter. Oben nur, wo unten etwas trägt. Das aktuelle Stockwerk ist scharf, darüber ausgeblendet, darunter abgedunkelt. Dach als Ausguck. Details im [Konzept](KONZEPT.md).

- **Wetter treibt Anlagen an:** Regentonne füllt sich bei echtem Regen, Solarpaneel bei Sonne, Windrad bei Wind, bei Gewitter selten ein Blitz-Bauplan.
- **Mehr Anlagen in Stufen:** Lagerfeuer, Apfelbaum und Beete wachsen über Stunden.
- **Gemütlichkeit wirkt sich aus,** z. B. schnellere Erholung.
- **Museum der alten Welt:** Sammelstücke ausstellen, wie das Museum bei Animal Crossing. Ein Archivar erzählt zu jedem Stück ein Stück Lore.
- **Trophäen an der Wand** von harten Kämpfen und seltenen Funden.
- **Heimkehr mit Musik und warmem Licht.**
- **Fotomodus** ohne Bedienelemente, zum Teilen.
- **Jahreszeiten und Feiertage:** Pilze im Herbst, Schnee im Winter, Halloween.

## Version 2.0: Konten und Gemeinschaft

- **Konto** (z. B. Google-Login): Spielstand auf mehreren Geräten, der Gast-Spielstand wird übernommen. Erste Stufe ohne eigenen Server: Spielstand im versteckten App-Ordner des eigenen Google Drive, bei zwei Geräten gewinnt der neuere Stand (mit Rückfrage). Für Mehrspieler (Raids für alle, Ranglisten) später ein Server in der EU, der mit denselben Spielregeln rechnet (`src/core`).
- **Spuren anderer Spieler:** Notizen aus vorgegebenen Bausteinen (wie bei Dark Souls, kein freier Text), Vorratskisten, Warnschilder, Verstecke.
- **Basen besuchen:** nur virtuell über Freundesliste oder Code, nie mit echtem Ort.
- **Saisons:** alle 8 bis 10 Wochen ein neues Kapitel mit neuer Kreatur und neuem Raid-Boss, alte Saisons bleiben spielbar. Nach dem Endziel öffnet sich „Linie 1“.
- **Zeitversetzte Raids für alle:** einmal pro Woche ein Nest (z. B. ein befallener Supermarkt) mit gemeinsamem Lebensbalken. Jeder macht Schaden, wann es passt, auch von zu Hause, die Belohnung gibt es nach Anteil.
- **Tauschen per Funk:** Pakete brauchen echte Stunden, je nach Entfernung. Dörfer liefern Nahrung, Städte Medizin und Technik.
- **Gemeinsam eine Stadt befreien,** Stadtteil für Stadtteil, ohne gleichzeitig online zu sein.

## Vor einem öffentlichen Start (Pflicht)

- **Sensible Orte ausschließen:** erste Fassung steht (keine Fundstellen und Verstecke auf Friedhöfen, Krankenhäusern, Schulen, Kitas, Kirchen und Gedenkstätten, erfundene Fundstellen nicht in Gebäuden). Noch offen: dasselbe auf dem Server prüfen, Gärten und Höfe besser erkennen, Rote Zonen.
- **Kämpfe nur im Stehen:** Durch die Runden ohne Zeitdruck schon entschärft. Noch offen: Wer läuft, dessen Kampf pausiert (GPS-Geschwindigkeit). Niemand soll sich beim Spielen verletzen.

## Technik nebenher

- **Offline-Modus:** Karte der Umgebung zwischenspeichern (Service Worker).
- **Echte App** (Capacitor): Android-APK zum Selbst-Installieren läuft, GitHub baut sie bei jedem Hochladen (Download: Releases, „endstation.apk“). Später Play Store (einmalig 25 $) und App Store (99 €/Jahr, braucht einen Mac). Schritte und Kilometer im Hintergrund über Apple Health / Health Connect (nur Kilometer, keine Orte), optional Hintergrund-GPS.
- **Benachrichtigungen:** freundlich und abschaltbar („Dein Eintopf ist fertig“), nie Druck.
- **Smartwatch-Anzeige.**

## Als Nächstes (Wunsch von Kevin, 21.10. abends)

1. **Reisescheine:** finden (besondere Orte, Ketten, Funk) oder jeden Tag einen geschenkt (höchstens 3 sammeln sich). Damit 30–60 Minuten an einen beliebigen Ort der Welt reisen und dort per Antippen über Straßen und Wege laufen, durchsuchen, kämpfen. Echtes Laufen bleibt besser (Neuland-Bonus, mehr Scheine).
2. **Bestiarium:** Eintrag pro Kreatur beim ersten Treffen (Bild, Lore, wo und wann, was hilft, wie viele erledigt), unbekannte als graue Umrisse.
3. **Tiere:** passend zu Gelände und Tageszeit auf der Karte (Hase, Fasan, Reh, Fuchs, Wildschwein; selten Luchs, ganz selten der weiße Hirsch). Jagen als kurzes Minispiel (Armbrust), bringt Nahrung, Leder, Trophäen. Sammlung zum Vervollständigen.
4. **Glossar:** Begriffe aus der Lore (das Weinen, Flux, Rote Zonen, Elysis, Streifer …), schalten sich frei, sobald sie vorkommen.
5. Jede Sammlung mit Zähler und Belohnung bei 100 %.

## Als Nächstes (Stand 22.10. spät)

1. **Charakter-Level mit Aufnähern** (Plan steht im Doc, Reiter „Level & Freischalten“; entschieden: Aufnäher, Werktisch ab Stufe 2, Freischalten zu Hause an der Pinnwand)
2. **Kartenplan:** 75 Karten für Version 1.0 in fünf Spielstilen, ausgewogen nach dem Vorbild von Slay the Spire (Plan im Doc, Reiter „Kartenplan“). Feuer, Fallen und Abstand, Schwung, Schutz, Tüftler, Raubbau, Kleinkram sowie Ruhe und Wut sind drin (acht Stile); Rudel ruht. Jetzt: testen und bei Bedarf abschwächen
3. **Bestiarium in Wellen** (entschieden am 23.10.: Wirte, wilde Menschen, Tiere, Bosse; Versionen je Gegend und echter Jahreszeit; „Gesucht“-Steckbriefe). Welle 1 (Wirte) und Welle 2 (wilde Menschen) sind drin, als Nächstes Welle 3 Tiere (brauchen neue Körper), danach Versionen, Steckbriefe, Bosse. Ideen im Doc, Reiter „Bestiarium (Ideen)“
4. Danach: eine Woche nichts Neues, draußen testen, Akku und Tempo, Einstieg schleifen

Erledigt am 23.10. (Eigene Gebäudemodelle, Kevin: „jedes bekannte Gebäude ein eigenes Modell“, „Apotheke anders als Praxis, Laden je nach Größe anders“): Jede genaue Art aus den Kartendaten sieht jetzt eigen aus (`map/shopLooks.ts`): Bäckerei (Brezel am Ausleger, Stehtisch), Metzgerei (Kachelsockel, Schwein am Ausleger), Kiosk (Verkaufsklappe, Zeitungsständer, Eis-Aufsteller), Obst & Gemüse (Kistenstände), Feinkost (dunkelgrüne Front, Bistrotisch, Bäumchen), Getränkemarkt (Kistenstapel), Hofladen (Holzfront, Strohballen, Milchkanne, Tafel), Drogerie (helle Glasfront), Lebensmittel, Apotheke (A-Würfel, Notdienstklappe, Stufe), Arzt- und Zahnarztpraxis (keine Schaufenster, Messingschilder, Rampe, beim Zahnarzt ein Zahn am Ausleger), Eisenwaren (Leitern, Schubkarre), Autoteile (Reifen). Große Grundrisse werden eine eigene Halle: Supermarkt klein ohne und groß mit Vordach und Wagenbox, Baumarkt mit eingezäunter Gartenabteilung, Gartencenter als Gewächshaus, Großhandel mit Laderampe, Werkstatt, großer Getränkemarkt, große Drogerie, Hofladen in der Scheune. Tankstelle mit Kassenhäuschen, Busbahnhof mit langem Bussteig, vier Brunnen (Zierbrunnen, Trinkbrunnen, Ziehbrunnen, Schwengelpumpe). Bahnhof mit Bank, Automat und Fahrrädern, Kita mit Zaun und Sandkiste, Post mit Schließfächern, Bücherei mit Rückgabekasten.

Erledigt am 23.10. (Karte und Beute, Kevin: „Tankstellen, wo keine sind“, „Loot ist zu viel“, „keine Boni, Grundmenge verkleinern“, Wasser und Essen „weniger finden“): Fundstellen und 3D-Läden zählen nur noch die genaue Art aus den Kartendaten, deshalb sind Ladesäulen keine Tankstellen und Kaufhäuser oder Wochenmärkte keine Supermärkte mehr. Arzt- und Zahnarztpraxen sind keine Fundstellen mehr, weil sie wie Apotheken aussahen. Kirchen haben hellen Putz. Sandflächen ohne Strand oder Düne (bei uns meist Plätze und Parkplätze) bekommen Kies (bis es ein Bild `kies` gibt, den Grundboden). Beute: Erstfund, Nacht, Wache, Minispiel und Neuland ändern die Menge nicht mehr, die Grundmenge ist um gut ein Drittel kleiner (Medizin nicht), Wasser und Essen gibt es fast nur noch halb so oft, außer dort, wo sie das Wichtigste sind (Brunnen, Supermarkt). Es bleiben: Händlerkiste, satt vom Eintopf, Oase und der Rückkehr-Bonus.

Erledigt am 23.10. (Kampf-Hintergründe, Kevin: „mit einem 2D-Bild die Kampf-Area ändern?“): Im Kampf kann ganz hinten ein gemaltes Bild stehen, wie ein Bühnenbild; Boden, Figuren und ein paar Sachen davor bleiben 3D, eine Reihe Büsche verdeckt die Kante. Je Gegend ein Bild (`src/assets/kampf/kampf-<gegend>[-<jahreszeit>].webp`, gemacht mit `scripts/kampf-hintergrund.py`), fehlt eins, nimmt das Spiel das Dorf, ohne Bild bleibt die 3D-Kulisse. Abend und Nacht tönt das Spiel selbst. Prompt für den Dorfrand steht im Doc (Reiter „Bilder & Ladebildschirme“). Erstes Bild: Kevins Dorfrand (die Bodenlinie je Bild steht in `base/combatBackdrops.ts`). Am 24.10.: alle Gegenden fertig (Kevins Bilder): Dorfrand, Kleinstadt, Wald, Großstadt, Berge und Küste in allen vier Jahreszeiten, Wüste und Schnee je ein Bild fürs ganze Jahr (in der Stadt liegt neben der Straße Pflaster wie auf dem Platz im Bild, im Wald Waldboden, im Winter Schnee); die Prompts stehen jetzt im eigenen Reiter „Kampfhintergründe“, je Gegend vier Jahreszeiten (Wüste und Schnee je ein Bild). Die 3D-Straße davor trägt Kevins Bodenbilder von der Karte (Nebenstraße im Dorf, Hauptstraße in der Stadt, Feldweg in Wald und Bergen, Wiese daneben, alles je Jahreszeit). **Offen:** Büsche und Bäume vor dem Bild sind noch immer grün, auch im Winter; dafür macht Kevin später 3D-Modelle (Meshy).

Erledigt am 23.10. (Waffennamen und Varianten, Kevin: „echte Waffenarten, ausgedachte Modelle“, „Golfschläger ist keine Fernwaffe“): zehn Schusswaffen mit echten Waffenarten und ausgedachten Herstellern (Lindmark, Morhardt, Grauhof, Rennwald), keine echten Marken. Luftpistole (gewöhnlich), Luftgewehr, Taschenpistole, Dienstpistole (selten), Revolver, Doppelflinte, Pumpflinte, Kipplaufbüchse (episch), Repetierbüchse und Drilling (legendär). Je Waffenart eine Munition (alle Büchsen Gewehrpatronen, alle Flinten Schrot); der Drilling braucht beides, seine Läufe werden einzeln leer. Das Modell steht im Sammelbuch und beim Fund. Der Golfschläger ist jetzt eine Nahkampfwaffe (Abschlag stößt weg, dazu zwei Durchschwung); war er als Fernwaffe gewählt, wählt das Spiel neu. Woche 1 im Labor: Brechstange und Schleuder. Der Spaten hat nur noch einen Stich, der zurückstößt (dazu zwei Spatenhiebe), er war viel zu stark. Spielstand Version 22. Kartenbilder-Prompts für alle zehn Schusswaffen stehen im Doc.

Erledigt am 23.10. (Schusswaffen, Kevin: „Munition nur finden“, „je Waffe eigene“, „Lärm nur auf der Karte“, „stark, selten, mehr Varianz“): fünf Schusswaffen als seltene Funde: Luftgewehr und Pistole (selten), Revolver und Schrotflinte (episch), Jagdgewehr (legendär). Jede hat eigene Munition, die man nur draußen findet (Bunker, Konvois, Hochsitze, Zeltlager, Hubschrauber, Hilfsabwürfe; Luftgewehrkugeln in Gartenlauben und Baumärkten); eine gefundene Waffe hat ein paar Schuss drin. Jeder Schuss verbraucht Munition, ist sie alle, werden die Schusskarten zu Kolbenschlägen. Laute Schüsse locken nach dem Kampf für 25 Minuten ein bis drei Trupps zum Kampfort auf der Karte; das Luftgewehr ist leise. Das Lager zeigt die Munition. Spielstand Version 21. Labor: `npm run balance -- --schnell --waffen`. Kartenbilder-Prompts für die fünf Waffen und den Kolbenschlag stehen im Doc.

Erledigt am 23.10. (Bauzeit und Oberflächen-Größe, Kevin: „alles mit Bauzeit“, „etwas kleiner und eine Einstellung“): Zu Hause braucht alles Bauzeit in echter Zeit (Wand 40 s, Stuhl 4 Min., Bett 24 Min., kleines Haus etwa 30 Min., Abschnitt 30 Min. bis 2 Std., Werktisch-Stufe 1 bzw. 3 Std.). Eine Bauliste je Gelände arbeitet alles der Reihe nach ab, auch wenn die App zu ist; Baustellen stehen halb durchsichtig und schimmernd da und wirken erst fertig. Oben im Zuhause zeigt ein Schild die Bauliste mit Restzeiten; fertige Baustellen melden sich, auch auf der Karte. Abreißen, Einlagern und Umstellen gehen sofort und geben alles zurück; Testmodus: „Alles sofort fertig“. Spielstand Version 20. Die Oberfläche ist jetzt etwas kleiner (90 %), unter Einstellungen > Grafik > Oberfläche: Klein, Normal, Groß (wie früher) und Sehr groß. Karte und 3D bleiben gleich groß. Auf der Karte stehen nur noch intakte Häuser (Kevin: keine Ruinen, keine ausgebrannten). Zum Testen: Einstellungen > Testen > „Ohne Bauzeit bauen“.

Erledigt am 23.10. (Böden von Kevin, je vier Jahreszeiten): alle zehn Böden der Siedlung (Hof, Vorgärten, Pflaster, Schutt, Industrie, Gewerbe/Parkplatz, Bahngelände, Steinbruch, Sportplatz, Spielplatz) und vier Naturböden (Wiese neu, Rasen, Waldboden, Grundboden), auf der Karte und im Zuhause. `scripts/textur-nahtlos.py` blendet bei Bildern, die Gemini schon 2 × 2 wiederholt hat, jetzt auch die Naht zwischen den Kopien weg. Straßen, Wege und Gleise laufen an ihren Rändern weich in den Boden aus. Es fehlen noch Sand, Fels, Sumpf, die drei Äcker, Wald von oben und Eis.

Erledigt am 23.10. (Seltenheit und Legenden, Kevin: „wie bei Raid, sammeln, Deck bauen“): Sichtungen geben jetzt 75 % Gewöhnliches, 22 % Seltenes, 2,5 % Episches und 0,5 % Legendäres; spätestens nach 130 Sichtungen kommt eine Legende. Bei einer Stunde am Tag heißt das etwa eine Legende im Monat und etwas Episches alle ein bis zwei Wochen. Fundstellen geben seltene Karten nur noch halb bis ein Drittel so oft. Jeder Stil hat jetzt genau eine Legende mit eigener Wirkung, alle nur aus Notizbüchern: Flammenwand (Feuer), Hinterhalt (Fallen), Durchmarsch (Schwung), Letztes Gefecht (Schutz), Mähroboter (Tüftler), Zweites Leben (Raubbau), Steinhagel (Kleinkram), Fels in der Brandung (Ruhe und Wut), dazu der Rudelführer. Doppelte machen stärker: Episches steigt mit 2 und 4 Exemplaren, Legenden mit jedem Fund bis Stufe V. Granate ist jetzt episch, Zweiter Atem neu (Runde ohne Schaden heilt 1). Labor: Fallen 68 → 93 % mit Hinterhalt, Tüftler 79 → 88 % mit Mähroboter, die anderen Legenden heben ihren Stil leicht. Bild-Prompts im Doc, Reiter „Kartenbilder“; Plan im Reiter „Kartenplan“.

Erledigt am 23.10. (Bestiarium, Welle 2: wilde Menschen): Verwilderter (Wald, auch abseits der Wege; Schleuder aus dem Gebüsch, Schlinge kostet 1 Kraft, kommt kurz vor und verschwindet wieder im Dickicht; wer gewinnt, findet sein Lager), Wegelagerer nur tagsüber (Schildträger hebt den Bretterschild, Armbrustschütze legt an und schießt 5, ein Treffer vorher verzieht ihn; Langfinger klaut eine Medizin und haut ab, erwischt man ihn, ist sie wieder da), Schrotter in der Großstadt (Rüstung 2, Netz: kein Ausweichen, Brandflasche: danach brennst du, außer du rollst dich ab oder löschst), Kalkjünger nur nachts (Treiber lässt Wandler von der Kette und predigt, fällt er, stehen sie planlos herum), Deserteure mit Feldwebel (Speer aus der zweiten Reihe, „Schilde hoch!“) und Fieberkranke (Medizin geben beendet den Kampf als gute Tat, er lässt etwas zum Dank da; zählt im Spielstand, Version 19). Kein Blut, wer fällt, sinkt zu Boden; Menschen stehen aufrecht, eigene Ausrüstung an den Klötzchen-Figuren, eigenes Symbol auf der Karte. Wer sonst hinten bleibt, kommt allein nach vorn. Labor Woche 1: 93 bis 100 %; die volle Deserteur-Formation ist am ersten Tag kaum zu schaffen. Bild-Prompts im Doc, Reiter „Gegner“; Zahlen im Reiter „Balancing“.

Erledigt am 23.10. (neuer Name): Das Spiel heißt jetzt **Projekt Heimweg** (Titelbild: „Projekt“ klein, „Heimweg“ groß; App-Name, Web-Titel, Doc). Das GitHub-Projekt heißt `Projekt-Heimweg`, Web-Version unter kevin-koenig-ops.github.io/Projekt-Heimweg, APK heißt `projekt-heimweg.apk`. Speicher-Schlüssel, App-Kennung und Signatur bleiben, damit Spielstände und Updates weiter klappen.

Probe am 24.10. (Boden selbst malen, Kevin: „Die Ränder sind so hart“, „In kleinen Städten ist alles grün“): Im Demo-Dorf malt das Spiel den Boden jetzt selbst, Kachel für Kachel (`src/map/groundPaint.ts`). Weiche, ausgefranste Ränder, im Wohngebiet Rasen mit Gartenflecken statt überall Büsche, Höfe und Einfahrten an den Häusern, Gehwege an den Straßen im Ort, dichte Ortskerne gepflastert, Texturen fest am Boden (kein Springen beim Zoomen). Schalter: Einstellungen › Grafik › Boden der Karte (Neu/Alt). Am 24.10. auch auf der echten Karte: Das Spiel liest die Kartenkacheln von OpenFreeMap selbst (`map/vectorTiles.ts`) und malt im Hintergrund-Thread (`map/groundWorker.ts`, `map/groundService.ts`), die Karte ruckelt dabei nicht. Aus der Nähe (ab Stufe 15) gemalt, von weitem weiter die Muster. Ohne Hintergrund-Thread (sehr alte Handys) malt der Hauptthread. **Offen:** Parkplätze und Plätze erkennen, am Handy prüfen, wie schnell es in Großstädten ist.

Erledigt am 23.10. (Texturen für alles, was die Karte kennt): Straßen und Wege tragen eigene Bilder je Jahreszeit (Hauptstraße, Nebenstraße, Feldweg, Fußweg und Gehweg von Kevin sind drin, Gleis bis auf den Winter). Neue Plätze für Industrie, Gewerbe/Parkplatz, Bahngelände, Steinbruch, Sportplatz, Spielplatz, Wald von oben und Eis. Fehlt ein Bild, bleibt die bisherige Fläche. Friedhof bleibt bewusst schlicht, Wasser malt der Code. Alle Prompts im Doc, Reiter „Texturen“; Straßenbilder macht `scripts/strasse-nahtlos.py` nahtlos.

Erledigt am 23.10. (neuer Look nach Kevins Vorlagen): Karte und Zuhause in warmem Dunkelbraun mit Kupferrand, kräftige schmale Schrift (Barlow Condensed). Karte: großes Porträt mit Gesundheitsring, Ziel als Banner, oben rechts Windrose (Kompass, Höhe direkt darunter), Erkundung, Gegend, Wetter, Menü; unten Zuhause, Gangart, Zentrieren, gelber Rucksack. Zuhause: Titel ZUHAUSE mit Farbverlauf, Gemütlichkeit als Metalltafel, Lager zum Aufklappen (eine Zeile zum Wischen, das Gerät merkt sich, ob es offen ist), Schild „Zur Karte“ oben rechts, farbige Ansichtsknöpfe mit Beschriftung unten links (mit Joystick oben), großer gelber Knopf BAUEN. Dazu: Nach einem Kampf bleibt die Figur stehen; „Hinlaufen“ löst beim Ankommen gleich aus (Durchsuchen, Kampf bei Wachen, Sichtung einsammeln); Sichtweite und freier Nebelkreis kleiner (Nebel 100 statt 140 m, Kleines ab 110 statt 150 m, Trupps ab 125 statt 170 m); weniger Sichtungen (Chance 15 statt 33 %, Radar 500 statt 700 m) und Weltereignisse (20 statt 35 %). Böden je Jahreszeit jetzt für alle 14 Oberflächen (Dateinamen wie `hof-winter`), auch im Zuhause; Prompts im Doc, Reiter „Texturen“. 12 neue Suno-Prompts für die Karte im Reiter „Musik“.

Erledigt am 23.10. (Bestiarium, Welle 1: acht neue Wirte): Gewohnheitstier (läuft jeden Tag zur selben Sonnenzeit dieselbe Runde, Uhr-Symbol auf der Karte; greift erst an, wenn man ihn trifft; Beute aus seinem Alltag), Leithammel (alle anderen schlagen 1 stärker; fällt er, setzen sie eine Runde aus), Hüne (24 Leben, schwer, packt und wirft für 7), Schläfer (Treffer im Schlaf doppelt, aufgeweckt kommt ein Überfall), Kalkkopf (Kalkhelm 2, Anlauf und Rammstoß 7, danach taumelt er ohne Helm), Erstarrter (nur bei echtem Frost oder Schnee, spröde; Feuer taut ihn auf und macht ihn stärker), Hamsterer (hockt auf seinem Haufen, 3 Stück Kram extra) und Brüller (bleibt hinten, ruft Wandler, brüllt die anderen stark; Steinwurf und Kofferradio machen ihn still). Eigene Hinweise im Kampf, Platzhalter-Modelle aus dem Wandler-Körper, alle im Test-Kampf-Menü. Labor Woche 1: 95 bis 100 % Siege; am ersten Tag ist die Brüller-Gruppe sehr hart (7 %), der Fallen-Stil schwächelt gegen Brüller, Hüne und Erstarrte. Bild-Prompts für die Modelle im Doc, Reiter „Gegner“.

Erledigt am 23.10. (Karten, vier neue Stile): Tüftler (Geräte, die jede Runde wirken: Bewegungsmelder-Lampe blendet, Kofferradio lässt Heuler niemanden rufen, Weidezaungerät verletzt alle vorne; Ladegerät, Bastelkiste), Raubbau (Rohrzange, Zaunlatte, Panzertape, Mit voller Wucht, Werkzeugrolle, Letzter Schlag), Kleinkram (Sack Murmeln, Hosentaschen, Steine aufsammeln, Zielwasser; erzeugte Wurfkarten verfallen am Rundenende) sowie Ruhe und Wut (Haltungen; Durchatmen, Zähne zusammenbeißen, Aus der Ruhe, Innere Ruhe, Raserei). Labor Woche 1: alle Stile in einem ähnlichen Band; Tüftler, Raubbau und Kleinkram tun sich gegen Borkenmann plus Wandler am schwersten (63 bis 76 % Siege), Ruhe und Wut ist dort stark (93 %). Nachgebessert: Weidezaun 2 Schaden, Rohrzange 5, Mit voller Wucht +5. Bildprompts für alle 19 neuen Karten stehen im Doc.

Erledigt am 23.10. (Karten, vierter Stil): Schutz mit Tonnendeckel, Feuerlöscher, Kopfnuss (betäubt beim Ausholen), Deckung, Ausweichrolle, Zurückschlagen, Erste Hilfe (erstes Verbinden ohne Medizin), Schmerzmittel, Feuerwerksbatterie. Labor: Schutz nimmt deutlich weniger Schaden, Kämpfe dauern doppelt so lang. Kevin: Lange Kämpfe gehören zur Taktik, es kommt niemand dazu. Schutz bleibt der Stil für wenig Schaden und lange Kämpfe.

Erledigt am 23.10. (Karten, dritter Stil): Schwung mit Machete (Hieb, Schneise), Vorschlaghammer (Wuchtschlag, Ausholen; statt Kettensäge), Nachsetzen, Wut, Spalten für die Axt. Im Labor solide überall, schnellste Kämpfe, keine Ausreißer. Schutz ist inzwischen auch drin. Rudel ruht (Kevin: der Hund spielt noch keine Rolle).

Erledigt am 23.10. (Karten, zweiter Stil): Fallen und Abstand mit Stolperdraht (Falle), Wecker (holt nach vorn), Mistgabel, Sportbogen, Fallensteller, Ablenken, Werferin; im Labor gegen Feuer und den Allround-Stand verglichen (Fallen stark gegen Borkenmann und Wächter, schwächer gegen Gruppen). Nächster Stil: Schwung (Machete, Nachsetzen, Wut, Vorschlaghammer). Die Kettensäge ist raus (Kevin: zu blutig, lieber geerdet).

Erledigt am 23.10. (Balancing): Balancing-Labor (`npm run balance`); Kämpfe fordernder (Wandler, Kriecher, Borkenmann, Wächter stärker); Medizin halb so oft, Verbinden heilt 4; Fliehen kostet einen letzten Treffer; nicht zweimal hintereinander betäubbar; Bolzen 3 statt 4. Offen: Herausforderung für gut Ausgerüstete über Inhalte (Dungeons, Weltgegner, stärkere Formen).

Erledigt am 23.10.: Kartenplan mit Kevin entschieden; Tasche für Einmal-Karten und 4 Fähigkeiten-Plätze (zu Hause im Lager wählen); Steinwurf macht Heuler still, Axthieb 6 und betäubt, Rundumschlag 1 Kraft, Nagelpistole mit Salve; Feuer-Karten Zunder, Ölkanister, Funkenschlag, Glut, Lauffeuer (Bilder fehlen noch, Prompts im Doc); je eine Nahkampf- und Fernkampfwaffe im Kampf, im Lager wählbar (mit Probe-Simulation: keine Kombination ist zu stark oder zu schwach); Nagelpistole geht durch Rüstung, Salve kostet 1 Kraft.

Erledigt am 22.10. spät: lange Wege über Straßen, Zentrieren zoomt nah ran, Nebel beim Herauszoomen mit gemalter Textur, bekannte Bauwerke in 3D (Kirche mit Turm, Friedhof, Polizei, Feuerwehr, Rathaus, Schule, Kita, Krankenhaus, Bücherei, Museum, Bahnhof, Post), neues Startbild.

## Ideen für irgendwann

- **Erforschung ohne Flecken (offen, Kevin 23.10.: erst mal lassen):** Aufgedeckt wird nur, wo die App offen war; wer sie unterwegs nur ab und zu öffnet, bekommt einzelne Flecken. Möglich: den wahrscheinlichen Fußweg seit dem letzten Öffnen entlang der Straßen ergänzen (nur wenn es zu Fuß passt), Hintergrund-Aufzeichnung als freiwilliger Schalter in der Android-App, oder größere, weiche Flecken (ganze Straßenzüge).

- **Kapitel (Kevin, 22.10.):** große Ereignisse über zwei Wochen, zum Beispiel „Der Vorarbeiter“ jagt dich. Details im Doc, Reiter „Ideen: Kapitel“.
- **Gruppen-Dungeons (Kevin, 23.10.):** 2 bis 4 Leute in einer Roten Zone oder einem Bunker, rundenweise ohne Zeitdruck (jeder zieht, wann er Zeit hat). Rollen mit eigenen Karten (Sanitäterin, Wächter, Späherin, Bastler). Wer nicht zieht, für den spielt ein vorsichtiger Autopilot. Kein freier Chat, nur feste Zurufe. Braucht einen Server. Details im Doc, Reiter „Ideen: Gruppen-Dungeons“.
- **Fahrzeuge (Kevin, 22.10.):** craftbar, Sprit von Tankstellen; abends mal 30 km in die nächste Stadt fahren. Offen: Wie passt das zu „draußen laufen“ und zur Sicherheit (nie während echter Fahrt spielen)?

- **Gegenden mit eigenem Charakter (Kevin, 22.10.):** Varianten der Kreaturen je Gegend mit eigenem Kniff im Kampf (Küsten-Wandler gepanzert, Sumpf-Wandler zieht runter, Kriecher springen in den Bergen) plus Bestiarium; eigene Fundorte, Beute und Sammel-Sets je Gegend; Rohstoffe nur in bestimmten Gegenden (Salz, Harz, Schiefer, Phosphat) für höhere Ausbauten; Atlas der Gegenden; eigene Kampfkulissen, Wetter und Funksprüche. Details im Doc, Tab „Ideen: Gegenden & Kampf“
- **Kampfansicht neu:** Schulterblick als zweite Ansicht eingebaut (22.10., Einstellungen → Grafik → Kampfansicht). Offen: gemalte Kulissen je Gegend mit 3D-Figuren davor
- **Häuser auf der Karte (22.10.):** echte 3D-Häuser aus dem Grundriss mit Kevins gemalten Fassaden (Putz, Klinker, Fachwerk), Satteldach mit Ziegeln, Zeltdach, Flachdach, Schnee im Winter, ausgebrannt und Ruinen ohne Dach. Offen: Plattenbau, Scheune, Halle, dunkles Dach, Flachdach-Bild, Haustüren (Prompts im Doc, Tab „Texturen“); bei sehr vielen Häusern (Großstadt) den Aufbau zwischenspeichern, falls es ruckelt
- **Weiche Bodenübergänge:** verworfen (22.10., Kevin: sieht so oder so meist nicht gut aus)
- **Grafik-Runde (22.10. abends):** echte Orte als Wahrzeichen (Supermarkt mit Vordach und Einkaufswagen, Läden mit Markise und Schild, Apotheke mit A-Würfel, Baumarkt mit Paletten, Werkstatt mit Rolltoren, Tankstelle, Wartehäuschen, Brunnen); Fenster und Türen setzt das Spiel selbst (Türen zur Straße, keine Fenster an Brandwänden, Dachbodenfenster), Wände glatt; dein Zuhause als 3D-Modell, das mit der Gemütlichkeit wächst (Plane, Zelt, Bude, Hütte, Garten, Veranda, Windrad), mit deiner Fahne; farbige Rohstoff-Icons, Kram als Sticker; Kleines (Pilze, Rucksäcke, Verstecke) erst in Sichtweite; Hochsitze nur weit weg von Siedlungen. Offen: Flachdächer und Zelt-/Walmdächer für verwinkelte Grundrisse
- **Musik (22.10. abends):** Kevins Suno-Stücke fürs Hauptmenü, das Zuhause und die Karte, mit Überblenden beim Ortswechsel. Einstellungen → Klang: Dauerschleife, „ab und zu“ (ein Stück, dann ein paar Minuten Stille) oder aus, dazu die Lautstärke. Offen: Geräusche (Krähen, Hunde, Wind) als eigene Ebene
- **Runde 22.10. spät:** Bildrate in den Einstellungen (30/60/90/Max); ausgebrannte Häuser mit verkohltem Dach und Loch statt ohne Dach; Figur bleibt stehen, wenn man unterwegs einen Ort antippt; Porträts statt 3D-Figur (8 zum Aussuchen, auf der Karte läuft das Porträt; gemalte Bilder von Kevin folgen, bis dahin Zeichnungen); Höhenlinien auf der Karte (alle 5 m, kräftig alle 25 m mit Höhe) und Höhenmeter-Anzeige unter dem Kompass; Rucksack-Knopf unten rechts; Gegend nur noch als kleines Symbol mit Hinweis beim Antippen; Niederlage: ganzer Rucksack weg, Aufwachen zu Hause
- **Alle Haus-Texturen (22.10. abends):** neun Dacharten (Ziegel, Biberschwanz, Betonstein, Schiefer, Moos, Wellblech, Teerpappe, grünes Blech, Kies-Flachdach) und drei neue Wände (Plattenbau, Holz-Scheune, Wellblech-Halle mit Fensterband und Rolltor), Kevins Haustüren in sechs Farben. Weil die Kartendaten nicht sagen, was ein Gebäude ist, rät das Spiel aus Größe, Höhe und Lage: Gewerbegebiet → Hallen, draußen → auch Scheunen, hohe Häuser → Plattenbau, Kirchen und Schulen bleiben gemauert

- **Seltene Ereignisse an echten Orten (Wunsch von Kevin, 22.10.):** Ab und zu passiert an einem echten Ort in der Gegend etwas Besonderes, zum Beispiel an der Tankstelle: ein Händler-Konvoi, ein Hilfsabwurf, eine durchziehende Horde, ein Funkspruch mit Hinweis. Selten, zufällig, wichtig und nicht angekündigt: Man muss suchen und entdecken. Weil die Welt aus einem gemeinsamen Startwert entsteht, sehen alle Spieler in der Gegend dasselbe Ereignis zur selben Zeit, auch ohne Server, und Freunde können sich Bescheid sagen („komm zur Tankstelle“). Regeln: läuft ein paar Stunden, damit niemand hetzen muss; verpassen wird nicht bestraft (kein Zwang); nie an heiklen Orten (Friedhof, Schule, Kindergarten, Kirche, Krankenhaus, Privatgrund). Baut auf den besonderen Orten und den wandernden Fundstellen auf.
- **Frei laufen ohne GPS (Gedanke von Kevin, 22.10.):** Das Herumlaufen im Testmodus macht Spaß. Rausgehen mit GPS bleibt der Kern; später überlegen, ob es ein Zuhause-Spiel ohne Rausgehen als Zusatz geben kann.
- **Untergrund im Baumodus (Wunsch von Kevin, 22.10.):** Im Zuhause den Boden selbst setzen, mit dem Pinsel wie Wände: Rasen, Kies, Hofplatten, Erde, Schutt und so weiter, mit Kevins gemalten Bildern. Ein paar gibt es von Anfang an, weitere schaltet man frei (Baupläne, Fundstücke, Rang). Offen: nur auf dem eigenen Grundstück oder auch drumherum; kostet Untergrund Rohstoffe?
- **Tiere beobachten:** Vögel und andere Tiere tauchen zufällig auf (passend zu Gelände, Tageszeit, Jahreszeit), antippen und beobachten, Sammlung im Fundbuch (Details im [Konzept](KONZEPT.md)).
- **Weitere Sprachen:** Das Sprachmenü mit Fahnen steht in den Einstellungen; Englisch, Französisch, Spanisch, Italienisch, Niederländisch, Polnisch, Portugiesisch, Türkisch und Ukrainisch kommen, sobald die Texte fertig sind.
- **Naturkunde und Kräutersammler:** Beim ersten Fund einer Pilz-, Kraut- oder Beerenart wird sie bestimmt (echter Name, wo und wann sie wirklich wächst, giftig oder essbar, Doppelgänger), dazu eine Sammlung übers Jahr. Der Beruf Kräutersammler bringt eine eigene Kartenansicht, die nur Kräuter, Beeren und Pilze zeigt. Mit klarem Hinweis: im echten Leben nie nach dem Spiel sammeln (Details und Startliste im [Konzept](KONZEPT.md)).
- **Legenden einmal im Jahr:** seltene Wesen wie Waldriese, Hungermann, Wolpertinger oder der weiße Hirsch, mit Gerüchten vorab, Spuren und einer Trophäe. Verpassen kostet nichts (Details im [Konzept](KONZEPT.md)).
- **Gelände aus echten Daten:** Höhe für das Spiel nutzen (entschieden 22.10.: ja; Aussicht von Hügeln, bergauf langsamer; sichtbar ist sie schon), Bodenfeuchte und Frost aus dem Wetterdienst, Untergrund aus der Karte (Wald, Acker, Sand, Moor, Schotterweg). Siehe Antwort vom 22.10.
- **Zuhause im echten Gebäude:** Beim Einrichten nimmt das Zuhause den echten Grundriss, die Stockwerke und das Grundstück des Gebäudes an dieser Stelle aus den Kartendaten (Low-Poly, nur auf dem Gerät). So kann man sich überall einrichten: in der Scheune am Dorfrand oder im leeren Laden um die Ecke. (Street View und Googles 3D-Städte gehen nicht: nur zum Anschauen erlaubt, kein Nachbauen, kostet pro Abruf.)
- **Begleiter kämpfen mit (großes Update):** Hund oder Bewohner stehen im Kampf neben dir und bringen eigene Karten ins Deck (heilen, Falle stellen, ablenken).
- Weitere Haustiere, die mitlaufen und in der Basis wohnen
- Bahnhöfe als Handelsposten mit wandernden Händlern
- Aussichtspunkte und Anhöhen decken größere Bereiche der Karte auf
- Fundstellen passend zur Landschaft: im Wald eher Hochsitze, im Feld eher Scheunen
- Mehr Endzeit-Details auf der Karte: Autowracks auf Straßen, Brandflecken, überwucherte Flächen
- Elysis-Felder aus der Lore: Pflanzen, die wie perfekte Nutzpflanzen aussehen. Machen satt, aber sind sie sicher?
- Saison-Events

## Erledigt

### ✅ 22.10. spät: Sammelkarten und Sichtungen

Sichtungen alle 10 Minuten (für alle gleich, nur an Wegen), Fund-Fenster mit umdrehender Karte, Sammelbuch im Charakterfenster (Reiter „Karten“), Einmal-Karten am Werktisch, 26 neue Karten im Kampf mit Feuer, Rauch, Blenden, Verlangsamen und Hund. Kartenfarbe nach Sorte, Leuchtrand nach Seltenheit, erstes Kartenbild (Brandflasche), Testknopf „Sammelkarte bekommen“. Funk-Radar mit Liste statt Dauer-Pfeilen am Kartenrand. Spielstand Version 16.

### ✅ Iteration 1: Prototyp

Logo, Hauptmenü, Einstellungen, Charaktererstellung, Endzeit-Karte (echt + Demo-Dorf), GPS + Simulation, Fundstellen (überall + echte Orte), Durchsuchen mit Abklingzeit, Bus-Ausbau, Erinnerungsstücke, Rückkehr-Bonus, lokales Speichern.

**Jetzt wichtig: draußen testen.**
- Wie fühlt sich die Dichte der Fundstellen an? Zu viele, zu wenige?
- Passt der Suchradius von 45 m zur GPS-Genauigkeit?
- Wird die echte Karte schön dargestellt? Fehlen Ebenen oder sieht etwas komisch aus?
- Wie lange hält der Akku?

### ✅ Iteration 1b: Kartenoptik und Kampf

- 3D-Bäume, abwechslungsreiche Häuser, Autowracks, Strommasten, warmer Dunst, Tiefenunschärfe
- Bewachte Fundstellen, Rundenkampf mit Timing, Gesundheit, Waffen aus der Werkbank

**Draußen testen:** Fühlt sich der Kampf gut an? Mehr Action oder mehr Taktik? Sind die Gegner zu stark oder zu schwach?

### ✅ Iteration 1c: Karte freilaufen, Tageszeit, Wetter

- Kartennebel, dauerhaft aufgedeckte Wege, Sektoren mit Belohnungen
- Tag/Dämmerung/Nacht aus dem Sonnenstand, Nacht mit mehr Gefahr und mehr Beute
- Echtes Wetter mit Regen, Schnee, Nebel, Gewitter

### ✅ Iteration 1d: Die Endstation (Basisbau)

- Eigenen Ort festlegen (bleibt nur auf dem Gerät), bauen nur vor Ort
- 3D-Wartehalle mit Schutt, 20 Möbel- und Deko-Teile, Gemütlichkeit mit Stufen
- Baupläne an passenden Fundstellen, Licht nach echter Tageszeit

**Zu Hause testen:** Macht das Einrichten abends Spaß? Welche Teile fehlen? Ist die Halle zu klein oder zu groß?

### ✅ Iteration 1e: Großer Basisbau und Spielfigur

- Schauplätze: Busdepot, Bauernhof, Seeufer zum Start, Tankstelle und Schrebergarten als Lagepläne, jeweils mit eigener Umgebung
- Gelände 36 × 36 m, Abschnitte zurückerobern, Hindernisse wegräumen
- Frei bauen: Wände, Zäune, Türen, Fenster, Durchgänge, Böden, Dächer, Abreißen mit voller Rückgabe
- Räume mit Dach erkennen (Bonus-Gemütlichkeit), 36 Möbel, Wand-Deko
- Kamera: ein Finger schiebt, zwei zoomen, Drehen nur per Knopf
- Low-Poly-Spielfigur bei der Erstellung, auf der Karte und in der Basis (läuft per Antippen)
- Echtes Wetter auch in der Basis

**Zu Hause testen:** Wie fühlt sich das Bauen am Handy an? Ist das Gelände zu groß, zu klein? Welche Teile fehlen?

### ✅ Iteration 1f: Querformat und Steuerung

- Alle Bildschirme im Querformat, Dreh-Hinweis hochkant, Vollbild/Querformat-Sperre wo möglich
- Steuerung wählbar: Antippen oder Joystick mit Benutzen-Taste (Basis und Simulation)
- Baumodus an/aus mit Seitenleiste, feinere Polygone, Laterne an der Figur bei Nacht

### ✅ Iteration 1g: Kampf 2.0 (Prototyp)

- Tab-Targeting in 3D: Ziel antippen, automatisch angreifen, Wuchtschlag, Ausweichen, Stoß, Verbinden
- Angekündigte Angriffe mit perfektem Ausweichen und Konter, Kreischer ruft Verstärkung
- Treffer-Feedback (Zahlen, Stopp, Rückstoß, Zeitlupe), deterministische Simulation mit Tests

- Zweite Steuerung „Gesten“ zum Vergleichen: Tippen = Schlag/Kombo, Halten = Aufladen, Wischen = Ausweichrolle

**Testen:** Macht es Spaß? Tasten oder Gesten? Zu leicht, zu schwer? Zu lang, zu kurz? Wird Aufladen zu oft unterbrochen?

### ✅ Zwischenschritt: Feinschliff Steuerung und Bauen

- Figur in echter Größe auf der Karte (zoomt mit), Gangart passend zum Tempo
- Steuerung: Umstellen wirkt sofort, flüssiges Laufen ohne Ruckeln, Joystick mit großer Griff-Fläche, Benutzen-Taste reagiert beim Drücken, Kamera folgt nach dem Umschauen wieder
- Baumodus: Leiste fährt beim Auswählen weg, flache Aktionszeile unten

### ✅ Iteration 1h (Teil 1): Rohstoffe, Fundstücke, Werktisch

- „Material“ aufgeteilt in neun Rohstoffe (Holz, Metall, Stein, Stoff, Kunststoff, Glas, Kleber, Schrauben, Elektronik), alle Kosten und Fundorte neu
- 22 Fundstücke mit 3D-Modell: als Deko aufstellen oder am Werktisch zerlegen
- Werktisch zerlegt in echter Zeit, Fertiges wartet, drei Ausbaustufen; Werktisch, Ofen, Solarpaneel, Regentonne nur einmal
- Rucksack-Ansicht, Fundstücke auf dem Fundbeleg, Hinweis am Endstation-Knopf, Spielstand Version 6

**Testen:** Reicht die Menge an Rohstoffen? Was fehlt am häufigsten? Sind die Wartezeiten angenehm?

### ✅ Zwischenschritt: Grafikstil Comic zum Vergleichen

- Umschaltbar in den Einstellungen: Polygon oder Comic (Cel-Shading mit Umrissen)
- **Testen:** Was gefällt besser? Läuft Comic am Handy flüssig?

### ✅ Zwischenschritt: Größeres Gelände

- Gelände 72 × 72 m statt 36 × 36 m, Startfläche 24 × 24 m statt 12 × 12 m, Abschnitte 12 m
- Alte Spielstände: Gebautes rückt in die Mitte, schon Freies bleibt frei (Version 7)

### ✅ Version 1.0, Paket 1–3: Bus raus, Rucksack und Lager, Kram und Sammelstücke

- Der Bus ist kein Ausbau-Ort mehr. Alte Bus-Ausbauten werden zu Rohstoffen, die Regentonne steht jetzt in der Endstation
- Rucksack unterwegs, Lager zu Hause: Auspacken in der Endstation, gebaut wird aus dem Lager, eine Niederlage kostet nur etwas aus dem Rucksack
- Kram (18 Sorten, mehrfach) zum Zerlegen, mit sichtbarem Inhalt wie bei Fallout; 9 neue 3D-Modelle
- Sammelstücke (13, jedes nur einmal) fürs Fundbuch und als Deko; vier Sets mit Bauplan und Rohstoffen als Belohnung
- Fundbuch mit Umrissen und Fundort-Hinweisen, Fundbeleg zeigt „Neu im Fundbuch“ und den Set-Fortschritt
- Anlagen produzieren selbst (Regentonne, Hochbeet), Abholen direkt in der Endstation
- Werktisch baut jetzt auch Waffen; Lager als Seitenleiste (hochkant als Blatt von unten)
- Spielstand Version 8

**Testen:** Ist Auspacken zu Hause ein schöner Moment oder lästig? Findet man genug Sammelstücke? Ist klar, was im Rucksack und was im Lager ist?

### ✅ Zwischenschritt: Stilprobe „Gemalt“

- Dritter Grafikstil zum Vergleichen: weiche, abgerundete Formen, Oberflächen mit Pinselstruktur (Holz, Stein, Rost, Gras, Laub), feine braune Linien, weiche Schatten in Ecken, Leuchten um Feuer und Lampen, warmes Licht
- Gilt für Endstation, Kampf, Figur und Vorschaubilder; die Karte bekommt nur einen wärmeren Farbton
- **Testen:** Polygon, Comic oder Gemalt? Läuft „Gemalt“ am Handy flüssig? Wenn ja: als Nächstes detailliertere Modelle (Ruinen ringsum, Efeu, Fensterrahmen, rundere Figur)

### ✅ Version 1.0, Paket 4–9: rundes Kern-Gameplay

- **Fortschritt:** Zielleiste auf der Karte mit Belohnungen zum Abholen (26 Ziele, führen durch den Einstieg), Fortschritts-Fenster (Ziele, Stufe der Endstation, Ruf). Jede Gemütlichkeits-Stufe bringt einen Vorteil (schnellere Erholung, Werktisch-Platz, Suchradius, Glück, mehr Beute). Streifer-Rang von Neuling bis Legende.
- **Looten:** drei kurze Geschicklichkeitsspiele je nach Fundort (Schloss knacken, Aufhebeln, Durchwühlen), Ergebnis daneben/gut/perfekt verändert die Beute; in den Einstellungen abschaltbar. Erstfund ×2 (grüner Punkt auf der Karte). „Weiter wühlen“ bis zu dreimal, mit Lärm-Anzeige und Überfall-Risiko. Seltenheitsfarben, Marken auf dem Fundbeleg, Funde fliegen in den Rucksack.
- **Kampf als Karten-Taktik:** Seitenansicht, Gegner zeigen ihre Absicht, 3 Kraft pro Runde, 4 Karten auf der Hand, vorne und hinten, Wegtreten unterbricht Ausholen, Waffen bringen eigene Karten und nutzen sich pro Einsatz ab. Gegner aus der Lore: Wandler, Kriecher, Borkenmann (mit Rinde), Heuler (ruft Wandler). Gruppen je nach Ort und Tageszeit.
- **Draußen:** Händlerkisten für zwei Stunden (×2,5 Beute), Verstecke über Kreidezeichen und Funksprüche mit Suchkreis und „kalt, warm, heiß“. Keine Fundstellen an sensiblen Orten.
- **Anlagen:** Holzofen (Eintopf: heilt ganz, 3 Stunden mehr Beute), Sanitätsschrank (Medizin), Funkgerät (Funksprüche aus der Lore, Hinweise auf Verstecke). Die Endstation sagt, was fehlt und wo es das gibt.
- **Balancing:** Rechenmodell über 14 Tage; Holz häufiger, Metall und Vorräte etwas knapper; Kampf-Zahlen mit simulierten Kämpfen abgestimmt.
- Spielstand Version 9

**Testen:** Machen die Minispiele Spaß oder nerven sie? Ist der Kampf verständlich? Lohnt sich das Weiterwühlen? Findet man Verstecke mit „warm und kalt“?

### ✅ 21.10. abends: Android-App, schlanke Karte, Abschied von der Endstation

- **Android-App:** GitHub baut bei jedem Push eine APK (Releases, „endstation.apk“), Vollbild, Querformat, Standort-Rechte
- **Karten-HUD schlank:** oben links Figur mit Gesundheitsring und nächstes Ziel, oben rechts Sektor, Wetter, Menü; unten Zuhause, runder Rucksack-Knopf, Zentrieren mit GPS-Punkt. Vorräte, Name und Tag erst beim Antippen
- **Bleicher Wächter:** neuer Gegner nur nachts, mit Kevins 3D-Modell (fürs Handy auf 260 KB verkleinert). Blick lähmt, weicht ins Dunkel zurück, springt an. Beute aus den Kellern und einmalig das Kellertagebuch
- **Testmodus:** Figur läuft im Ort nur über Straßen und Wege (Strecke als Linie, quer durchs Gelände gepunktet), im Wald abseits der Wege langsamer mit Begegnungen, „Test: Angriff“ im Menü. Spielstand Version 10
- **Erkunden:** besondere Orte (6 Arten, einmal pro Gegend), Hinweise am Horizont mit Pfeilen, Spuren und Zettel-Ketten, Neuland-Bonus, Fundbuch der Orte, Stimmungssätze, Kompass. Testmodus: im Ort nur Straßen, raus aufs Feld über den Ortsrand. Spielstand Version 11
- **Endstation-Geschichte raus:** keine Linie 0, kein eigener Bus, die Basis heißt jetzt „Zuhause“. Bus-Look raus (LED-Schrift, Linienplan-Menü, LED-Icon). Platzhalter-Titel „Nachhall“ mit neuem Icon
- **Charakterfenster:** Der Rucksack-Knopf sitzt jetzt rechts am Rand. Er öffnet links die Ausrüstung (Gesundheit, Waffen, Karten), in der Mitte die Figur in 3D mit der Waffe in der Hand (zum Drehen), rechts den Rucksack als Fächer; ein Fach antippen zeigt, was drinsteckt. Daneben das Fundbuch
- **Kram wie bei Fallout:** 250 Sorten Kram statt 18 (erst 150, dann noch 100 dazu, zum Beispiel Gartenzwerg, Diaprojektor, Geigerzähler, Rollator, Feldtelefon), je nach Ort (Autoradio im Auto, Blutdruckmessgerät in der Apotheke, Heckenschere im Schuppen …), jede mit Spruch und 3D-Bild. 9 neue Bauteile (Gummi, Leder, Federn, Zahnräder, Kupfer, Öl, Batteriezellen, Desinfektionsmittel, Phosphat), die in Rezepten gebraucht werden. Fundstellen geben öfter Kram. Fehlt ein Bauteil, sagt das Spiel, in welchem Kram es steckt. Spielstand Version 12
- **Startbild und Anmelden:** Kevins Bild mit dem Bleichen Wächter im Nebel, darüber ziehender Nebel und Niesel, „Zum Starten berühren“. Danach Anmelden: Gast geht, Google und Apple stehen als Platzhalter da. Im Hauptmenü unten „Abmelden“
- **Wandernde Fundstellen:** Die kleinen Fundstellen würfeln etwa einmal am Tag neu (Ort, Art, Anzahl), jede Ecke zu ihrer eigenen Uhrzeit. 20 Minuten Nachfrist, Erstfund zählt pro Ecke. Echte und besondere Orte bleiben
- **Bitte kurz lesen:** Bei jedem neuen Spiel erklärt ein Bildschirm, dass vieles bewusst erst nach und nach freigeschaltet wird, und zeigt als Vorgeschmack Raids, Berufe, Rote Zonen, Bewohner, Kanal 4 und Legenden
- **Schönere Karte:** 12 gemalte Untergründe von Kevin (Wiese, Waldboden, Rasen, Grundboden, Hof, Schutt, Sand, Fels, Sumpf, drei Sorten Acker), auch im Zuhause auf und um das Grundstück; freundlichere Farben, Ufer an Seen und Bächen. Bäume als echte 3D-Modelle (Laub, Nadel, Birke, tot, im Herbst bunt), dazu Büsche, Unterholz und Steine; kein Baum mehr im Wasser. Auf der echten Karte sieht man Hügel und Täler als Schattierung
- **Pilzstellen:** nur im Wald, wandern wie die anderen Fundstellen, im Herbst am meisten, im Winter kaum. Geben Nahrung, selten Heilkräuter, nie bewacht
- **Testmodus:** Die Figur läuft nicht mehr durch Flüsse, Bäche und Seen
- **Kampf: Ziel anvisieren:** Einen Gegner einmal antippen, dann treffen alle Karten ihn, bis man einen anderen antippt oder er fällt (Fadenkreuz am Namen, fester Kreis am Boden). Kann eine Karte ihn nicht erreichen (er steht hinten), fragt das Spiel wie bisher nach dem Ziel
- **Findlinge:** Ab und zu liegt ein großer Stein im Wald und auf Wiesen (eigene einfache Steine). Ausprobiert und wieder entfernt (22.10.): Steine, Farn, Gras, Pilze und Bäume aus dem Quaternius-Paket „Stylized Nature MegaKit“, der Stil passt nicht (Stand in Git, Commit 8b4ebe5)
- **Karte beim Laufen verschieben:** Läuft die Figur, ließ sich die Karte nur zoomen, nicht ziehen (das Nachführen hat jedes Ziehen abgebrochen). Jetzt pausiert das Nachführen, solange ein Finger auf der Karte liegt
- **Einstellung „Bewegtes Wasser“:** Wellen und Glitzern lassen sich ausschalten (spart etwas Akku)
- **Neue Bildschirmbilder von Kevin (gemalt, freundlich):** Startbild Feldweg, Anmelden (Wanderer am Hügel), Hauptmenü (Lager am Abend), Figur, Intro (Kleinstadt), Kampf, Zuhause wählen. Neu: Ladebildschirm mit Tipp, solange die Karte lädt (Bach, Bahnhof, Tankstelle, Wald, Hügel). Originale in `kunst/bilder`
- **Ausrüstung mit Plätzen:** Im Charakterfenster gibt es Plätze für Kopf, Gesicht, Körper, Hände, Beine, Füße, Rücken und die Waffe. 20 Teile (Mütze, Helme, Staub- und Gasmaske, Jacken, Schutzweste, Handschuhe, Hosen, Schuhe, Rucksäcke), gefunden beim Durchsuchen passender Orte. Abwehr wirkt schon (zu Beginn jedes Kampfs), Wärme, Atemschutz und Rucksack-Fächer zählen später. Alte Spielstände bekommen die Startausrüstung (Spielstand Version 13)
- **Einstellungen in Bereichen:** Allgemein, Karte & Standort, Steuerung, Grafik, Testen, Konto & Daten. Unter „Testen“: Tageszeit, Wetter und neu die Jahreszeit
- **Jahreszeiten (Optik):** Frühling mit frischem Grün, Herbst mit buntem Laub, im Winter kahle Laubbäume, braune Büsche und eine dünne Schneeschicht (Platzhalter, bis es Winterbilder gibt). Bodenbilder je Jahreszeit werden automatisch genommen, sobald es sie gibt (Dateiname wie `wiese-herbst`)
- **Version sichtbar:** Unten in den Einstellungen steht, wann die Version gebaut wurde
- **Zuhause:** beschrifteter Knopf „Zur Karte“ oben rechts statt nur einem X
- **Lebendiges Wasser:** Auf der Karte schaukeln Wellen und glitzern Lichtpunkte (nur wenn Wasser im Bild ist und die App vorne liegt, spart Akku). Der See im Zuhause hat ziehende Wellenkämme, spiegelt den Himmel und funkelt in der Sonne
- **Mehr Leben im Ort:** An Straßen mit Häusern stehen jetzt Laternen, Mülltonnen, Schilder, Bänke, Briefkästen, Container, Betonsperren und Bushaltestellen. Neben Wohnhäusern Gärten mit Gartenhaus, Hochbeet, Trampolin, Schaukel, Gartentisch, Regentonne, Komposter, Wäscheleine, Hecke, Zaun oder Sandkasten, aber nur wo Platz ist (nicht im Haus, nicht auf der Straße, nicht im Wasser). Im Wald liegen Stämme, Baumstümpfe und Reisighaufen abseits der Wege. Alles steht für alle Spieler an derselben Stelle
- **Neue Böden von Kevin:** Wiese in allen vier Jahreszeiten (Frühling hellgrün mit Gänseblümchen, Sommer satt mit Klee, Herbst goldbraun, Winter verschneit) und Vorgärten fürs Wohngebiet (Büsche, Beete, Kieswege) statt der alten Steinplatten. Die weichen Ränder der Flächen nehmen jetzt die Farbe des Bodenbilds an, auch je Jahreszeit. Das Nahtlos-Werkzeug erkennt Bilder, die Gemini schon 2 × 2 gekachelt hat, und nimmt dann ein Viertel aus der Mitte. Alte Wiese entfernt
- **Gelände, Trupps, Gegenden, Weltereignisse (Wunsch von Kevin, 22.10.):** Überall hinlaufen (außer Häuser, Wasser, Sperrgebiete), Gangart Schnell/Leise beim Laufen per Tippen. Trupps mit Sichtkegel ziehen über echte Wege, entdecken dich oder werden von hinten überrascht (Gegner setzen die erste Runde aus). Verstecken durch Stillstehen in Deckung, Korn im Sommer, Spuren im Schnee. Acht Arten Gegend aus den Kartendaten (Großstadt bis Schnee) mit eigenen Trupps, Sicht, Kälte und Hitze; von Hügeln aus siehst du weiter. Weltereignisse für alle gleich: Staubsturm (Atemschutz nötig), Horde, Sperrgebiet, Hilfsabwurf; Gewitter und Sturm übertönen Schritte. Ausrüstung zählt jetzt: Wärme, Atemschutz, leise Turnschuhe, Gummistiefel im Sumpf. Spielstand Version 14
- **Startbild ohne Nebel:** Das Feldweg-Bild bleibt klar, nur feiner Niesel
