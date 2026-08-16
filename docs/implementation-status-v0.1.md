# MyFit Marketing Manager – implementační stav v0.1

**Datum:** 12. srpna 2026  
**Stav:** IN DEV  
**Vstup:** Business Analysis v1 + Technický návrh v1

## Hotovo

| Oblast                     | Stav         | Poznámka                                                             |
| -------------------------- | ------------ | -------------------------------------------------------------------- |
| DEV-0001 Monorepo          | READY FOR QA | pnpm, Turborepo, strict TypeScript, lint, test, build                |
| DEV-0002 ADR               | READY FOR QA | pět základních rozhodnutí je zaznamenáno                             |
| DEV-0003 Env a DB základ   | IN DEV       | env schema, Drizzle model a SQL migrace; Supabase ještě není založen |
| DEV-0004 Error envelope    | IN DEV       | health endpoint vrací request ID; logger a společný mapper následují |
| DEV-0102 Databázové schéma | IN DEV       | core tabulky pro workspace, content, tasks, campaigns a audit        |
| DEV-0103 Doména            | READY FOR QA | stavy obsahu, finanční guard a denní carry-over pravidlo             |
| DEV-0201 Today             | IN DEV       | responzivní demo obrazovka bez živých dat                            |

## Následující vývojový řez

1. Připojit Supabase lokální nebo bezpečný vývojový projekt.
2. Doplnit migraci o RLS politiky a seed jednoho Owner workspace.
3. Implementovat přihlášení magic linkem a chráněné routy.
4. Nahradit demo Today data agregačním endpointem `GET /api/v1/today`.
5. Přidat ruční Calendar a Content Detail ještě před AI integrací.

## Otevřené vstupy od vlastníka

- produkční doména a odesílací email,
- hosting webu a workeru,
- měsíční limit AI nákladů,
- limity Media Library,
- přesné časy notifikací a délka Undo okna.

## Ověření verze

- TypeScript: všechny čtyři workspace balíčky bez chyby.
- Doménové testy: 6/6 prošlo včetně DST a finančního potvrzení.
- Lint a formátování: bez chyby.
- Produkční Next.js build: úspěšný.
- Vizuální kontrola: desktop 1280 px a mobil 390 px bez vodorovného přetékání a bez chyb v konzoli.
