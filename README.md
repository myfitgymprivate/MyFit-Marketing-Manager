# MyFit Marketing Manager

První implementační verze osobního AI marketingového manažera pro MyFit. Projekt navazuje na Business Analysis v1 a Technický návrh v1.

## Aktuální stav

- Etapa 0: založené monorepo, striktní TypeScript, testy, formátování a build.
- Etapa 1: základ domény, databázové schéma a klíčová bezpečnostní pravidla.
- Etapa 2: klikací prototyp Today, Calendar, Content Detail, MyFit AI, Tasks a dalších MVP modulů.
- Produkční adaptéry pro AI, Supabase Auth, PostgreSQL a Netlify jsou připravené; lokálně bez klíčů aplikace zůstává v demo režimu.

## Spuštění

Požadavky: Node.js 24+ a pnpm 11+.

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm dev
```

Aplikace poběží na `http://localhost:3000/today`. Prototyp lze projít přes hlavní navigaci.

## Ověření

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Databázovou migraci lze po změně schématu připravit příkazem `pnpm db:generate`.

## Produkční nasazení

Cílové prostředí je GitHub → Netlify, databáze a přihlášení běží v Supabase. Hodinová Netlify Scheduled Function kontroluje rezervační web a ukládá snapshoty i upozornění. Kompletní postup je v `docs/netlify-production-runbook.md`.

## Struktura

```text
apps/web/           Next.js PWA a API
packages/domain/    čistá business pravidla
packages/contracts/ validační a API kontrakty
packages/database/  Drizzle schéma a migrace
docs/               ADR a implementační stav
```
