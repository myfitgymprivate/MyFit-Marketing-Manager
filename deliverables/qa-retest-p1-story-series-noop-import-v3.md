# MyFit Marketing Manager – QA retest v3

Datum: 2026-08-16  
Testovaná složka: `/Users/any/Documents/Marketing MyFit App/03 Vývoj/MyFit-Marketing-Manager`  
Referenční soubor: `deliverables/preview.xlsx`  
Výsledek: **Původní blokery QA-MPI-001 a QA-MPI-002 jsou funkčně opravené. Verzi zatím nelze uzavřít jako čisté PASS kvůli jednomu P1 problému předání/build artefaktů a dvěma P2 UX regresím.**

## Ověřené PASS scénáře

- Import rozpoznal 4 listy a hlavní list zpracoval jako 30 položek, 0 chyb.
- `Volné termíny` po aktualizaci z referenčního XLSX obsahuje 3 samostatné framy:
  1. `MÁŠ DNES CHVÍLI PRO SEBE?`
  2. `VOLNÉ TERMÍNY DNES [ČAS] [ČAS] [ČAS]`
  3. `VYBER SI SVŮJ TERMÍN →`
- Celá Story série se vytvořila jako 3/3 slidů.
- Každý slide má samostatné ovládání a samostatný PNG export.
- Všechny tři PNG mají platnou PNG signaturu a rozměr 1080 × 1920.
- Regenerace pouze slidu 2 změnila verze na `1 / 2 / 1`.
- Série i verze slidů přežily obnovení stránky.
- Schválená zářijová verze 1 po no-op reimportu zůstala schválenou verzí 1.
- No-op import zobrazil přesně `Import dokončen: 0 změn, 30 přeskočeno.` a nevytvořil novou verzi ani dostupné Undo.
- Jedna duplicita nastavená na `Aktualizovat` vytvořila verzi 2 čekající na kontrolu a hlášku `1 změn, 29 přeskočeno.`
- `Vrátit import` je ihned po skutečném importu dostupné přímo v Kalendáři a úspěšně vrátilo verzi 3 zpět na verzi 2.
- Automatické kontroly: testy PASS (12 souborů / 41 testů), lint PASS, format PASS, čerstvý produkční build PASS (23 rout).

## Nálezy k opravě

### QA-V3-001 — P1 — předaná produkční sestava byla starší než zdrojová v3 a typecheck není reprodukovatelně čistý

**Důkaz**

- Před spuštěním retestu měl `apps/web/.next/BUILD_ID` čas `2026-08-16 12:20:31`, zatímco opravené soubory `calendar-workspace.tsx` a `plan-import.ts` byly z `12:44:38`.
- `next start` proto skutečně servíroval staré chování v2: jen jednu grafiku Story a starou importní hlášku.
- Až ručně provedený nový `pnpm build` zpřístupnil opravy v3.
- Následný samostatný `pnpm typecheck` selhal na duplicitách v `.next/types`: `cache-life.d 2.ts`, `routes.d 2.ts`, `root-params.d 2.ts`, `validator 2.ts` (staré kopie z 12:20 vedle nových souborů z 12:50).
- `apps/web/tsconfig.json:11` zahrnuje `.next/types/**/*.ts`, takže duplicitní synchronizované build artefakty způsobují TS6200/TS2300.

**Úkol pro vývoj**

1. Nesynchronizovat ani nepředávat `.next` jako zdrojovou součást verze; před buildem ji bezpečně vyčistit.
2. Zajistit, aby předávací protokol vznikal až po poslední synchronizaci zdrojů a po čerstvém buildu.
3. Odstranit kolizní kopie `* 2.ts` z build artefaktů a znovu ověřit `pnpm typecheck` v přesně předané složce.
4. Doplnit jednoduchý release check: žádné soubory s konfliktním suffixem v `.next/types` a `BUILD_ID` novější než poslední změněný zdroj.

**Akceptace**

- Po čistém převzetí složky projdou bez ručního zásahu `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm build`.
- `pnpm start` ihned servíruje v3 se Story sérií a no-op hláškou.

### QA-V3-002 — P2 — `Vrátit import` v Kalendáři zmizí po reloadu

**Reprodukce**

1. Proveď skutečný import s jednou položkou `Aktualizovat`.
2. Tlačítko `Vrátit import` je v Kalendáři vidět (PASS).
3. Obnov stránku a otevři znovu září.
4. Tlačítko v Kalendáři už není, přesto je poslední auditní akce vratný import. V MyFit AI zůstává záložní `Vrátit poslední změnu`.

**Pravděpodobná příčina**

- `calendar-workspace.tsx:277–280` po hydrataci správně nastaví `lastImportUndo`.
- Samotné tlačítko je ale na `calendar-workspace.tsx:1027–1040` celé vnořené do podmínky `notice`; `notice` se po reloadu vrátí na prázdný řetězec.

**Úkol a akceptace**

- Zobrazovat persistentní undo lištu/tlačítko podle `lastImportUndo`, nezávisle na dočasné importní hlášce.
- Po importu, navigaci pryč/zpět i reloadu musí být `Vrátit import` v Kalendáři dostupné, dokud nevznikne jiná auditní změna nebo se Undo nepoužije.

### QA-V3-003 — P2 — rozpor `0/3 připraveno` versus `Grafika připravená ✓`

**Reprodukce**

1. Existující jednodílná Story už má uloženou starou grafiku.
2. Importem `Aktualizovat` ji změň na 3slidovou sérii.
3. Detail správně ukáže `Story série · 3 slidy` a `0/3 připraveno`, současně ale stav tvrdí `Grafika připravená ✓`.

**Pravděpodobná příčina**

- `calendar-workspace.tsx:354–356` počítá readiness jen z `Boolean(visualMeta[editingItem.id])`.
- U série se nezohlední `activeStorySlides.length === editingStoryFrames.length`; starý single-image stav se zachová pod stejným ID.

**Úkol a akceptace**

- Pro Story sérii odvozovat připravenost z počtu hotových slidů, případně při změně single Story → série odstranit/ignorovat starý single visual.
- Při 0/3 nesmí UI zobrazit hotovo; připraveno je až při 3/3.

## Doporučený cílený retest v4

1. Převzít čistou složku bez `.next`, spustit všechny kontroly a build.
2. Ověřit, že `next start` servíruje aktuální kód bez ručního rebuildu QA agentem.
3. Importovat jednu změnu, reloadnout Kalendář a použít persistentní `Vrátit import`.
4. Převést existující Story s jednou grafikou na 3slidovou sérii a ověřit konzistentní stav 0/3 → 3/3.
