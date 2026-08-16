# MyFit Marketing Manager – předání oprav v4

Datum: 2026-08-16  
Stav: READY FOR QA

## QA-V3-001 – čistý a reprodukovatelný handoff

- Zdrojová synchronizace výslovně vynechává `.next`, `.turbo` a `node_modules`.
- Stará `.next` byla z cílové předávací složky odstraněna, nikoli ponechána vedle nové verze.
- Přidán příkaz `pnpm release:check`.
- Release kontrola odmítne konfliktní kopie typu `* 2.ts` v `.next`.
- Release kontrola odmítne build, jehož `BUILD_ID` je starší než zdrojové soubory aplikace.
- Bez `.next` release kontrola potvrdí čistou zdrojovou kopii.
- Build artefakty byly před sestavením odstraněny a build proběhl od nuly.

### Ověření přímo v předávané složce

Složka: `/Users/any/Documents/Marketing MyFit App/03 Vývoj/MyFit-Marketing-Manager`

1. Výchozí stav bez `apps/web/.next`: PASS.
2. TypeScript před buildem: PASS.
3. Testy: PASS, 13 souborů / 43 testů.
4. ESLint: PASS.
5. Prettier: PASS.
6. Produkční build: PASS, 23 rout.
7. `pnpm release:check` po buildu: PASS.
8. Konfliktní soubory `apps/web/.next/types/* 2.ts`: 0.
9. Čas nového `BUILD_ID`: `2026-08-16 13:04:36`.
10. Samostatný TypeScript po vytvoření `.next/types`: PASS.

Po tomto ověření byla cílová `.next` znovu odstraněna. Tester tedy přebírá čisté zdroje a vytvoří vlastní aktuální build příkazem `pnpm build`.

## QA-V3-002 – persistentní Vrátit import

- Dostupnost Undo je odvozena z perzistentního auditního stavu přes `canUndoLatestImport`.
- Undo lišta se vykresluje při `lastImportUndo`, i když je dočasná hláška po reloadu prázdná.
- Stav byl regresně ověřen přes serializaci a opětovné načtení marketingového stavu.
- Tlačítko zmizí až po Undo nebo po jiné novější auditní změně.

## QA-V3-003 – readiness víceslidové Story

- Přidána jednotná funkce `calendarVisualReady` pro kalendář i detail události.
- Víceslidová Story je připravená pouze při přesné shodě hotových a očekávaných slidů.
- Stará metadata jednodílné grafiky se po změně na 3slidovou sérii ignorují.
- Ověřené přechody: 0/3 = nepřipraveno, 2/3 = nepřipraveno, 3/3 = připraveno.
- Dokončená série ukládá do metadata také počet hotových slidů.

## Cílený retest v4

1. Ověřit, že předaná složka neobsahuje `apps/web/.next`.
2. Spustit `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check` a `pnpm build`.
3. Spustit `pnpm release:check` a znovu `pnpm typecheck`.
4. Ověřit nula konfliktních souborů v `.next/types`.
5. Po skutečném importu obnovit Calendar a ověřit persistentní `Vrátit import`.
6. Změnit Story se starou single grafikou na 3slidovou sérii.
7. Ověřit konzistentní readiness 0/3 → 2/3 → 3/3.
