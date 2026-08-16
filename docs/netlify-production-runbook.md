# Produkční provoz MyFit

## Kde co běží

- GitHub je zdroj kódu a historie změn.
- Netlify sestavuje a provozuje Next.js web, serverové API a hodinovou Scheduled Function.
- Supabase provozuje PostgreSQL, přihlášení a privátní úložiště médií.
- OpenAI běží pouze na serveru; klíč se nikdy neposílá do prohlížeče.
- Apps Script není potřeba pro základní provoz. Může později zajišťovat exporty do Google Sheets nebo Drive.

## První nasazení

1. Vytvořit privátní GitHub repozitář a nahrát projekt.
2. V Supabase vytvořit projekt v evropském regionu.
3. Nastavit produkční připojení v terminálu `export DATABASE_URL='...'` a spustit databázové migrace `pnpm db:migrate`.
4. V Supabase Auth vytvořit účet majitelky MyFit.
5. Zkopírovat UUID uživatelky z Auth a zvolit UUID workspace; nahradit je v `packages/database/production-bootstrap.sql` a skript spustit v SQL Editoru.
6. V Netlify zvolit **Add new project → Import an existing project → GitHub**.
7. Netlify načte `netlify.toml`; produkční větev nastavit na `main`.
8. Doplnit všechny proměnné níže a zveřejnit první deploy.
9. Ověřit `/api/v1/health` a `/api/v1/ready`.
10. Ve Functions otevřít `check-reservations`, spustit **Run now** a zkontrolovat první snapshot v databázi.
11. V Netlify nastavit Functions region co nejblíže evropskému Supabase projektu.

## Proměnné v Netlify

Povinné a tajné hodnoty se vkládají pouze v Netlify UI:

- `APP_URL` – produkční URL aplikace.
- `DATABASE_URL` – Supabase pooler connection string pro serverless provoz.
- `MYFIT_WORKSPACE_ID` – UUID použité v bootstrap skriptu.
- `NEXT_PUBLIC_SUPABASE_URL` – URL projektu.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` – veřejný publishable key.
- `OPENAI_API_KEY` – tajný serverový klíč.
- `CRON_SECRET` – náhodný tajný řetězec alespoň 32 znaků.

Volitelné:

- `OPENAI_TEXT_MODEL=gpt-5.6-sol`
- `OPENAI_IMAGE_MODEL=gpt-image-2`
- `RESERVATION_MONITOR_START_HOUR=6`
- `RESERVATION_MONITOR_END_HOUR=23`
- `RESERVATION_FREE_RATIO_ALERT=0.45`

## Bezpečnost

- V produkci chrání stránky a API Supabase Auth.
- Placené AI endpointy znovu ověřují přihlášení.
- Hodinový monitor přijímá pouze požadavky se správným `CRON_SECRET`.
- Databázové tabulky mají RLS politiky podle členství ve workspace.
- Auth odpovědi se nesmí ukládat do veřejné CDN cache.

## Před ostrým spuštěním

- Nastavit vlastní doménu a HTTPS.
- V Supabase Auth povolit pouze pozvané uživatele; veřejnou registraci vypnout.
- Nastavit rozpočtové limity OpenAI a Netlify.
- Ověřit obnovu databáze a export důležitých médií.
- Provést jeden celý týden ve staging režimu bez automatického publikování.
