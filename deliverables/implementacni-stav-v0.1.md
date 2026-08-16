# MyFit Marketing Manager – implementační stav v0.1

**Datum:** 12. srpna 2026  
**Stav:** IN DEV  
**Vstup:** Business Analysis v1 + Technický návrh v1

## Dodaná první verze

- sestavitelná kostra aplikace v Next.js a TypeScriptu,
- responzivní obrazovka Today pro iPhone a Mac,
- API health endpoint s request ID,
- doménová pravidla pro obsah, denní carry-over úkol a potvrzení slevy,
- PostgreSQL/Drizzle schéma 11 core tabulek a první SQL migrace,
- šest automatických testů klíčových business pravidel,
- pět základních architektonických rozhodnutí.

## Ověření

- typová kontrola, lint, formátování a produkční build prošly,
- 6/6 doménových testů prošlo,
- desktop 1280 px a mobil 390 px jsou bez vodorovného přetékání,
- stránka při vizuální kontrole nehlásila chyby v konzoli.

## Následující řez

Připojit Supabase, doplnit RLS a seed Ownera, implementovat magic-link přihlášení a napojit obrazovku Today na živý endpoint. Poté pokračovat ručním Calendar a Content Detail ještě před připojením AI.
