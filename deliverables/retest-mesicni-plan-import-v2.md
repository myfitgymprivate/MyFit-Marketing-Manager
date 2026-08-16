# MyFit Marketing Manager – předání k retestu

Datum: 2026-08-16  
Stav: READY FOR QA

## Rozsah opravy

- Měsíční plán již není pevně navázaný na září 2026.
- Kalendář podporuje libovolný měsíc, verze plánu, stavy, schválení a audit s Undo.
- AI umí připravit návrh libovolného měsíce a nikdy jej automaticky neschválí.
- Přidán náhled a potvrzení importu XLSX/CSV, volba listu, hlavičky, mapování, duplicity a režimy sloučit, aktualizovat a nahradit.
- Importovaný plán se ukládá do stejného stavu jako kalendář, Today a AI agent události.
- Textový a grafický agent používají importované zadání: platformu, původní formát, cíl, text do grafiky, caption, CTA, hashtagy, vizuální směr a poznámku.
- Přidána databázová struktura pro dávky importu, externí ID a importovaná obsahová pole.

## Ověření referenčního Excelu

Soubor: `preview.xlsx`

- nalezeny listy: `Září 2026`, `Stories scénáře`, `Obsahové pilíře`, `KPI`
- automaticky zvolen hlavní list `Září 2026`
- rozpoznáno 30 obsahových položek
- 0 neplatných řádků
- 0 duplicit proti prázdnému kalendáři
- správně rozpoznány kombinované formáty `Carousel + Stories`, `Post + Stories`, `Q&A sticker`, `Behind the scenes`, `Reel / Video`, `Quiz`, `FAQ` a rozsahy `1–2 stories` / `2–3 stories`
- datumy uložené jako Excel serial jsou převedeny na ISO datum

## Bezpečnost importu

- Soubor se nejprve pouze zobrazí v náhledu.
- Zápis proběhne až po potvrzení.
- Náhled je kryptograficky podepsaný; změněný payload je odmítnut.
- Import do schváleného měsíce vyžaduje zvláštní potvrzení.
- Celý import je jedna auditovaná operace a lze jej vrátit přes Undo.
- Stav `PUBLISHED` ze souboru se neimportuje bez potvrzení jako publikovaný obsah.

## Automatické kontroly

- TypeScript: PASS
- ESLint: PASS
- Testy: PASS, 12 souborů / 36 testů
- Prettier: PASS
- Produkční build: PASS, 23 rout

## Doporučený retest

1. Otevřít Kalendář a zvolit `Importovat plán`.
2. Nahrát referenční `preview.xlsx`.
3. Ověřit výběr listu `Září 2026`, automatické mapování a výsledek 30 / 0 / 0.
4. Potvrdit import v režimu Sloučit.
5. Otevřít zářijovou událost a ověřit text, CTA, vizuální zadání, caption a hashtagy.
6. Nechat agenta připravit tři textové varianty a grafiku; výstup musí vycházet z importovaného briefu.
7. Provést Undo a ověřit návrat kalendáře i verze měsíčního plánu.
8. Opakovat import a ověřit zobrazení duplicit a volby přeskočit / aktualizovat / přidat.
