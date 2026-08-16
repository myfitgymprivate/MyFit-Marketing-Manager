# MyFit Marketing Manager — QA report v1

**Datum testu:** 13. srpna 2026  
**Testovaná verze:** lokální obsah složky `03 Vývoj/MyFit-Marketing-Manager`  
**Referenční zadání:** Business Analysis v1 a dostupné úkoly Business/Vývojového agenta  
**Výsledek:** **NEPŘIPRAVENO K AKCEPTACI** — build funguje, ale několik klíčových MVP scénářů pouze simuluje úspěch.

## Shrnutí

- Produkční sestavení, TypeScript, lint a 7 existujících automatických testů prošly.
- Všechny hlavní stránky vracejí HTTP 200; kořen správně přesměruje na `/today`.
- Formátovací kontrola selhává na 4 souborech.
- Potvrzeny 4 zásadní funkční vady (P1), 6 významných vad/mezer (P2) a nedostatečné automatické pokrytí.
- Interaktivní vizuální průchod nešel nezávisle dokončit, protože vestavěný prohlížeč zablokovala bezpečnostní kontrola přístupu. HTTP, build, testy a zdrojový audit proběhly.

## P1 — zásadní vady

### QA-001: Story série generuje a exportuje jen jeden slide

**Očekávání:** Story se 3 obrazovkami připraví 3 samostatné vizuály/PNG (případně balíček) a každý používá text a vizuální pokyn odpovídajícího slidu.  
**Skutečnost:** Generátor vybere pouze text druhého slidu (`frames[1]`), drží jediný `visual` a nabízí jediné stažení `myfit-story-soukromi.png`.  
**Dopad:** Uživatelka nedostane publikovatelnou Story sérii; hlavní Content Detail scénář není dokončený.  
**Důkaz:** `apps/web/app/_components/content-workspace.tsx:342`, `:367`, `:508`, `:544`.

### QA-002: MyFit AI potvrzuje změny, které reálně neprovede

**Očekávání:** Po potvrzení se změna zapíše do Calendaru, Idea Bank nebo historie, je auditovatelná a lze ji vrátit.  
**Skutečnost:** Chat ukládá návrhy jen do `localStorage`. Zápis publikovaného obsahu a nápadu nikde další část aplikace nečte. Přesun ukládá pouze číslo dne a Calendar pak natvrdo přesouvá položku obsahující text „5 důvodů“ v srpnu 2026, bez použití `contentId` a celého cílového data. Přesto tlačítko zobrazí „✓ Provedeno“.  
**Dopad:** Falešná informace o úspěchu, nekonzistentní data a nesplnění FR-AI-04/05/06, MVP-04/05/06 a BR-09.  
**Důkaz:** `apps/web/app/_components/chat-composer.tsx:151`, `:159`, `:167`, `:172`; `apps/web/app/_components/calendar-workspace.tsx:268`.

### QA-003: Denní kontrola zůstane po splnění hotová navždy

**Očekávání:** Akce „Zkontrolováno“ uloží čas, vynuluje počet dní a na další provozní den vytvoří další očekávanou kontrolu.  
**Skutečnost:** Ukládá se pouze řetězec `completed`; datum ani další termín se neukládají a při načtení se nekontrolují.  
**Dopad:** Kritický denní návyk FR-TSK-02/03 přestane po prvním kliknutí fungovat.  
**Důkaz:** `apps/web/app/_components/task-complete-button.tsx:12`, `:19`.

### QA-004: Povinné MVP moduly jsou pouze informační karty

**Očekávání:** Idea Bank, Trend Radar a Campaigns mají funkční end-to-end scénáře; Marketing Brain/Memory mají editaci a historii.  
**Skutečnost:** „Otevřít modul“ pouze rozbalí statický odstavec. Neexistuje seznam, detail, ukládání, klasifikace, zdroje trendů, kampaň, potvrzení slevy ani historie.  
**Dopad:** Nejsou splněny moduly označené v BA jako Must ani MVP-06/07/09.  
**Důkaz:** `apps/web/app/_components/module-grid.tsx:12`, `:27`, `:42`.

## P2 — významné vady a mezery

### QA-005: Today a pracovní data jsou statická a navzájem se neaktualizují

Datum nadpisu je dynamické, ale dnešní Story, skóre 82, počty, upozornění a srpnové termíny jsou pevné demo hodnoty. Dokončení úkolu, potvrzení zářijového plánu nebo záznam publikace neaktualizují související karty. Today proto neodpovídá skutečnému stavu aplikace.

### QA-006: Tři AI endpointy vracejí na neplatné JSON tělo chybu 500

`POST /api/v1/ai/chat`, `/content-kit` a `/visual` volají `request.json()` mimo ošetření chyb. Neplatný JSON vede k 500 bez standardního chybového těla místo 400/422. Reprodukováno na běžícím serveru.  
**Důkaz:** `apps/web/app/api/v1/ai/chat/route.ts:32`; `content-kit/route.ts:88`; `visual/route.ts:31`.

### QA-007: Poškozená lokální data vyvolají neošetřenou chybu

Calendar, Tasks, uložené Story texty a historie agentních akcí používají `JSON.parse` bez validace/obnovy. Jediná chybná hodnota v úložišti způsobí chybu při načítání nebo potvrzení akce. Vizuální stav má ochranu, ostatní nikoli.

### QA-008: Content Detail nepokrývá Reels a Posty

Existuje jediná pevná route pro jednu Story. Chybí Reel hook, scénář podle času, shotlist, texty do videa a plnohodnotný Post detail. Tím není splněno FR-CON-03/04 ani MVP-03.

### QA-009: Tasks neumí termín, prioritu ani opakování

Nový úkol lze jen pojmenovat; dostane pevně „bez termínu“, běžnou prioritu a žádné opakování. Nejsou splněny FR-TSK-01 ani související notifikační scénáře.

### QA-010: Business scope je v konfliktu s implementací rezervací

Business Analysis v1 výslovně uvádí „bez integrace rezervačního systému“ a BR-04 zakazuje, aby na ní MVP záviselo. Kód ale obsahuje hodinový scraper, databázové snapshoty, sloty a notifikace. Pokud jde o novější schválený požadavek, musí se BA verzovat; jinak jde o scope creep a právní/provozní riziko.

## P3 — technický dluh

### QA-011: Formátovací kontrola selhává

`pnpm format:check` selhalo na:

- `packages/database/migrations/meta/_journal.json`
- `packages/database/migrations/meta/0001_snapshot.json`
- `packages/database/migrations/meta/0002_snapshot.json`
- `pnpm-lock.yaml`

### QA-012: Automatické testy jsou nedostatečné

Prošlo pouze 7 testů: 6 doménových a 1 pro parser rezervací. Contracts a Database nemají žádné testy. Chybí testy komponent, API chybových stavů, autentizace, AI potvrzení, persistence, kalendáře, generování/exportu více slidů a end-to-end regresní testy.

### QA-013: PWA je jen částečná

Manifest nemá ikony a projekt neobsahuje service worker/offline chování. Instalovatelnost a offline režim proto nejsou doložené.

### QA-014: Bezpečnostní hlavičky jsou neúplné pro produkci

Jsou nastaveny `nosniff`, `DENY`, referrer a permissions policy, ale chybí zejména Content-Security-Policy. HSTS je vhodné řešit na Netlify vrstvě a ověřit v produkčním prostředí.

## Výsledky automatických kontrol

| Kontrola                            | Výsledek                                  |
| ----------------------------------- | ----------------------------------------- |
| Instalace z lockfile                | PASS                                      |
| TypeScript                          | PASS                                      |
| ESLint                              | PASS                                      |
| Unit testy                          | PASS — 7 testů                            |
| Produkční build                     | PASS — 18 rout                            |
| Formátování                         | FAIL — 4 soubory                          |
| Hlavní stránky                      | PASS na HTTP úrovni                       |
| Health endpoint                     | PASS — 200                                |
| Readiness bez produkčních tajemství | očekávaně 503                             |
| Rezervační job bez secretu          | PASS — 401                                |
| Neplatné JSON do AI API             | FAIL — 500 na 3 endpointech               |
| Vizuální/browser E2E                | BLOCKED bezpečnostní kontrolou prohlížeče |

## Doporučené pořadí oprav

1. Udělat Story pipeline nad polem slidů: samostatný vizuál, stav, regenerace a PNG pro každý slide; export všech slidů.
2. Nahradit falešné `localStorage` potvrzení skutečnými transakčními akcemi nad společnými daty; přidat audit a Undo.
3. Opravit denní opakování podle data a timezone Europe/Prague.
4. Zprovoznit Idea Bank, Campaigns a minimální Marketing Memory; Trend Radar až se schváleným zdrojem/freshness.
5. Napojit Today, Calendar, Tasks a Content Detail na jeden zdroj pravdy.
6. Doplnit validační a regresní testy včetně více-slide Story a chybných vstupů API.
7. Vyjasnit a verzovat změnu scope kolem rezervačního systému.

## Akceptační retest pro více-slide Story

- Série s 1, 3 a 5 slidy vytvoří stejný počet vizuálů.
- Každý vizuál používá text a vizuální pokyn svého slidu.
- Lze regenerovat pouze vybraný slide bez změny ostatních.
- Každý PNG má 1080 × 1920 a lze jej stáhnout samostatně.
- K dispozici je stažení celé série v pořadí 1…N.
- Po reloadu se zachová text, vizuál, verze a vazba na konkrétní slide.
- Selhání jednoho slidu nesmaže úspěšné výsledky ostatních a UI jasně ukáže částečný stav.
- Demo i živý AI režim mají stejný počet a pořadí výstupů.
