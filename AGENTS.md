<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NMS Corvette Builder – Entwicklungsanweisungen

## Projektüberblick

- Entwickle eine offlinefähige Progressive Web App zum Planen von No Man’s Sky-Korvetten.
- Player-facing UI, Metadaten und README-Texte sind auf **Deutsch**. Neue sichtbare Texte ebenfalls auf Deutsch verfassen.
- Stack: **Next.js 16** (App Router), **React 19**, **TypeScript** im Strict Mode, **Tailwind CSS v4**, **Three.js** und `next-pwa`.
- Die Anwendung ist eine clientseitige Einzelseiten-Erfahrung. Interaktive Komponenten und WebGL-Code benötigen `"use client"`.

## Wichtige Dateien

- `src/app/layout.tsx` – Root-Layout, deutsche Seitensprache, PWA-Metadaten.
- `src/app/page.tsx` – Rendert den Builder.
- `src/app/globals.css` – globale Styles und Tailwind-Import.
- `src/components/CorvetteBuilder.tsx` – Builder-Zustand, Außenraster, Layer, Teilekatalog, Innenraumeditor und Live-Konstruktionsprüfung.
- `src/components/ShipPreview3D.tsx` – Three.js-Szene, Community-GLB-Loader, Draco-Dekodierung, prozedurale Meshes und Hab-Schnittansicht.
- `src/lib/corvetteData.ts` – Rasterkonstanten, Teilekatalog, Teil-/Innenraumtypen und Hab-Slotdefinitionen.
- `src/lib/constructionValidation.ts` – reine, UI-unabhängige Validierung der Konstruktion.
- `src/types/next-pwa.d.ts` – Typ-Shim für das untypisierte `next-pwa`-Paket.
- `public/models/community-corvette/` – versionierte, Draco-komprimierte Community-GLBs, Draco-Decoder und `ATTRIBUTION.txt`.
- `public/manifest.json` – installierbares PWA-Manifest.
- `next.config.ts` – PWA-Konfiguration; Service Worker nur im Produktionsbuild.
- `eslint.config.mjs` – Flat-Config; ignoriert ausschließlich den unveränderten vendorten Draco-Decoder.

## Daten- und Platzierungsmodell

- Außenraster: `GRID_COLS = 30`, `GRID_ROWS = 20`, `GRID_LAYERS = 16` in `corvetteData.ts`. Diese zentralen Konstanten bestimmen Raster, Kollisionen, Validierung und 3D-Bauvolumen.
- Ebenenbeschriftungen erzeugt `getLayerLabel()` in `CorvetteBuilder.tsx` dynamisch aus `GRID_LAYERS`.
- `PartDefinition` beschreibt Katalogteile über stabile `id`, `category`, `maxCount`, ungedrehte Rastermaße `w`/`h`, Farbe und Beschreibung.
- `PlacedPart` beschreibt ein Außenbauteil über `instanceId`, `partId`, `col`, `row`, `layer` und eine dreiachsige `rotation` mit `x`, `y` und `z` (jeweils `0 | 90 | 180 | 270`). `layer` ist dabei die unterste belegte Ebene.
- Außenbauteile belegen ein echtes 3D-Volumen: ungedreht `w × 1 × h`. Bei jeder X-/Y-/Z-Drehung müssen Rastermaße, Ebenenbelegung, Kollisionsprüfung, Validierung und 3D-Darstellung über `getRotatedPartDimensions()` dieselbe gedrehte Ausdehnung verwenden. Die 3D-Baugruppe wird mit XYZ-Euler-Winkeln rotiert.
- Außenbauteile kollidieren nur innerhalb derselben Ebene. Dieselbe Zelle darf auf verschiedenen Ebenen belegt sein.
- Maximalanzahlen gelten global über alle Außenebenen und Innenrauminstanzen.

## Innenräume

- Teile der Kategorie `Interior` dürfen **nicht** im Außenraster platziert werden.
- Sie werden als `PlacedInteriorPart` an `parentInstanceId` eines `Hab` und an einen `InteriorSlotId` gebunden.
- Verwende die zentralen `HAB_INTERIOR_SLOTS` und `INTERIOR_ALLOWED_SURFACES`; der Platzierungshandler und die UI müssen beide inkompatible Boden-/Wand-/Decken-Slots verhindern.
- Beim Löschen eines Habs alle zugehörigen Innenraumteile entfernen. Beim Löschen einer benutzerdefinierten Interior-Definition ebenfalls ihre Instanzen entfernen.
- In der 3D-Ansicht ein bearbeitetes Hab als transparente Schnittansicht anzeigen. Innenraum-GLBs bevorzugen; für Teile ohne Community-Mesh die eigenen detaillierten prozeduralen Fallbacks beibehalten.

## 3D-Assets und Three.js

- `COMMUNITY_MODELS` ordnet Teile-IDs statischen Dateien in `public/models/community-corvette/` zu.
- GLBs sind Draco-komprimiert. Den lokalen Decoder über `/models/community-corvette/draco/` laden; keine externen Decoder-CDNs einführen, damit die PWA offline funktioniert.
- Verwende bei wiederverwendeten geladenen GLBs einen Cache und klone Geometrien/Materialien pro Szene. Sonst beschädigt `disposeObject()` die gecachten Originalobjekte.
- Jede beim Szenenwechsel entfernte Three.js-Geometrie, jedes Material und jede Textur muss durch `disposeObject()` freigegeben werden.
- Behalte prozedurale Darstellungen als Fehler-/Ladefallback, falls ein Community-Asset nicht geladen werden kann.
- Neue Community-Assets nur mit eindeutig kompatibler Lizenz einbinden. Quelle und Lizenz in `README.md` sowie `public/models/community-corvette/ATTRIBUTION.txt` dokumentieren.
- Quellarchive mit STL-Dateien sind lokal unter `zips/` erlaubt, werden aber absichtlich durch `.gitignore` ausgeschlossen. Niemals committen.

## Konstruktionsvalidierung

- `validateConstruction()` ist absichtlich rein und nicht-blockierend: Sie liefert `error`- und `warning`-Einträge, anstatt Platzierungen zu verhindern.
- Der Validator prüft für nicht leere Entwürfe Cockpit, Hab, Antrieb (`Nacelle` oder `Thruster`) und Landebucht; fehlendes Fahrwerk ist ein Hinweis.
- Die Verbindung zum Cockpit wird über orthogonal angrenzende belegte Rasterzellen in allen drei Achsen geprüft.
- Bei neuen Pflichtteilen oder Regeln `constructionValidation.ts` und die Erklärung im Builder gemeinsam aktualisieren.

## Entwicklung und Prüfung

```bash
npm install       # Abhängigkeiten installieren
npm run dev       # Entwicklungsserver auf http://localhost:3000
npm run lint      # ESLint
npm run build     # Produktionsbuild; erzeugt PWA-Service-Worker
```

- Vor Übergabe mindestens `npm run lint` und `npm run build` für relevante Änderungen ausführen.
- `next-pwa` erzeugt `public/sw.js` und `public/workbox-*.js` nur im Produktionsbuild. Diese Dateien sind generiert, ignoriert und dürfen nicht bearbeitet oder committed werden.
- Verwende den Alias `@/*` für Importe aus `src/`.
- Neue TypeScript-Implementierungen strikt typisieren; kein `any` hinzufügen.
- Halte UI-Logik im Builder und reine Berechnungen/Regeln in `src/lib/` getrennt.

## Git- und Dokumentationsregeln

- `CLAUDE.md` re-exportiert diese Datei (`@AGENTS.md`); in `CLAUDE.md` keine doppelten Anweisungen pflegen.
- Nach einem erfolgreich gemergten Pull Request lokalen `master` mit `origin/master` synchronisieren und den zugehörigen lokalen Feature-Branch entfernen.
- Vor dem Commit prüfen, dass `zips/`, `.next/`, erzeugte Service-Worker und andere lokale Artefakte nicht gestaged sind.
- Bei Änderungen an Community-Assets immer Lizenz-/Attributionshinweise mitprüfen.
