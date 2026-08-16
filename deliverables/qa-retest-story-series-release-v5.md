# QA retest v5 – Story série a release readiness

Datum: 2026-08-16  
Testovaná složka: `/Users/any/Documents/Marketing MyFit App/03 Vývoj/MyFit-Marketing-Manager`

## Výsledek

**PASS – QA-V4-001 i QA-V4-002 jsou opravené.**

V cíleném retestu nebyla nalezena nová funkční regrese ani nový blokující problém.

## QA-V4-001 – převod single Story na tříslidovou sérii

### Samostatné vytváření slidů

1. V čistém úložišti aplikace byla vytvořena single Story `Volné termíny` na 2026-09-01.
2. U single Story byla vytvořena původní grafika.
3. Referenční plán byl importován s volbou `Aktualizovat` pro jedinou duplicitu na řádku 3.
4. Náhled importu: 30 připravených položek, 0 chyb, 1 duplicita.
5. Import: 30 změn, 0 přeskočeno; vznikla Story série se třemi konkrétními framy.
6. Po převodu byl stav `0/3 připraveno`.
7. Bez jakékoli zprávy agentovi byl vytvořen slide 1: `1/3 připraveno`, série ještě nebyla hotová.
8. Byl vytvořen slide 2: `2/3 připraveno`, bez stavu hotovo.
9. Byl vytvořen slide 3: `3/3 připraveno` a `Grafika připravená ✓`.
10. V žádném kroku se neobjevila chyba `Zadání grafiky není platné.`
11. Po reloadu zůstaly všechny tři slidy uložené a detail stále ukázal `3/3 připraveno` a `Grafika připravená ✓`.

### Vytvoření celé série

Scénář byl zopakován v druhém čistém originu aplikace:

- single Story a původní single grafika vytvořeny,
- import `Aktualizovat` převedl událost na sérii ve stavu `0/3`,
- `Vytvořit celou sérii (3 slidů)` doběhlo bez chyby,
- výsledkem bylo `3/3 připraveno`,
- detail obsahoval tři samostatné odkazy `Stáhnout PNG`,
- všechny tři soubory měly platnou PNG signaturu a rozměr **1080 × 1920 px**.

## QA-V4-002 – release kontrola `.next`

- Před buildem byla `.next` rekurzivně bez souborů (obsahovala jen dvě prázdné podsložky) a `pnpm release:check` skončil PASS.
- Po vložení jednoho dočasného souboru bez `BUILD_ID` skončil `pnpm release:check` očekávaně FAIL s hláškou `.next neobsahuje BUILD_ID`.
- Dočasný testovací soubor byl po testu odstraněn.
- Po produkčním buildu skončil `pnpm release:check` znovu PASS jako aktuální build bez konfliktních kopií.
- Nebyly nalezeny konfliktní soubory typu `* 2.ts`, `* 2.tsx`, `* 2.js` ani `* 2.mjs`.

## Automatické kontroly

- Typecheck před buildem: PASS, 4/4 balíčky.
- Web testy: PASS, 13 souborů / 45 testů.
- Domain testy: PASS, 6 testů.
- Release-check testy: PASS, 4 testy.
- ESLint: PASS.
- Prettier: PASS.
- Produkční build: PASS, 23 rout.
- Release check po buildu: PASS.
- Typecheck po buildu: PASS, 4/4 balíčky.

## Úkoly pro vývoj

Žádné nové opravné úkoly. Verze v5 splnila cílená akceptační kritéria a je z pohledu tohoto retestu připravená k dalšímu release kroku.

Poznámka: produkční build vytvořený během QA zanechal běžné build artefakty v `apps/web/.next`; nejde o zdrojový problém ani regresi.
