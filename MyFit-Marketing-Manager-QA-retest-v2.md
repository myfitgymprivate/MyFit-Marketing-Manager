# MyFit Marketing Manager — QA retest v2

**Datum retestu:** 14. srpna 2026  
**Testovaná verze:** aktuální lokální verze z vývojového úkolu ve `03 Vývoj/MyFit-Marketing-Manager`  
**Referenční základ:** QA report v1, Business Analysis v1 a BA Change 001  
**Výsledek:** **NEPŘIPRAVENO K FINÁLNÍ AKCEPTACI** — hlavní chyba více-slide Story je opravena, ale jeden původní MVP blocker zůstává a dvě nové/částečné mezery vyžadují opravu.

## Výsledek v kostce

- Více-slide Story: **PASS** — 3 slidy vytvoří 3 samostatné vizuály 1080 × 1920.
- Regenerace jednoho slidu: **PASS** — ostatní slidy se nezmění.
- Persistence po reloadu: **PASS** — zůstaly vizuály i verze jednotlivých slidů.
- Sdílená AI změna: **PASS** — uložený nápad se objevil v Idea Bank a přesunutý Reel v Calendaru.
- Undo bezprostředně po změně: **PASS**; po odchodu z AI a návratu: **FAIL**.
- Denní úkol: **PASS** v UI pro tentýž den a v automatickém testu pro reset po pražské půlnoci.
- API, build, lint, typy a formátování: **PASS**.
- Mobilní produkční průchod osmi hlavních rout: **PASS**, bez horizontálního přetečení a bez chyb v konzoli.
- Reel/Post Content Detail: **FAIL** — routy existují, ale publikovatelné podklady chybějí.
- Trend Radar: **FAIL** validace — trend lze uložit bez povinného zdroje.

## P1 — blokuje finální akceptaci

### QA-008R: Reel a Post mají pouze obecné textové karty, ne požadované výstupy

**Očekávání:** Reel obsahuje skutečný hook, časovaný scénář, shotlist, texty do videa a caption. Post obsahuje finální caption a konkrétní vizuální brief/podklad.  
**Skutečnost:** Nové routy `/content/reel-partak` a `/content/post-benefity` vracejí 200, ale sdílená komponenta zobrazuje jen nadpis, popis a tři univerzální věty. U Reelu je „Scénář · shotlist · caption“ pouze text v poli Formát; samotný scénář, shotlist ani caption nejsou vykreslené.  
**Dopad:** FR-CON-03/04 a MVP-03 nejsou end-to-end hotové. Uživatelka nemá výstup připravený k publikaci.  
**Důkaz:** `apps/web/app/_components/format-content-detail.tsx:17–67`.

## P2 — významné mezery

### QA-015: Undo zmizí po navigaci nebo reloadu

**Očekávání:** Poslední reverzibilní akci uloženou ve společném auditu lze vrátit i po odchodu na jinou stránku a návratu.  
**Skutečnost:** Undo funguje bezprostředně po potvrzení. Stav jeho zobrazení je ale pouze lokální `useState(false)` a při načtení AI stránky se neodvodí ze společného auditu. Po návratu na AI proto tlačítko chybí, přestože reverzibilní auditní záznam zůstává uložený.  
**Důkaz:** `apps/web/app/_components/chat-composer.tsx:106`, `:169–191`, `:243–254`.

### QA-016: Trend Radar dovolí uložit trend bez zdroje

**Očekávání:** Podle BA má mít trend povinný zdroj a datum/freshness; neověřená nebo stará data se nesmí tvářit jako aktuální.  
**Skutečnost:** Formulář validuje pouze název. Prázdný `sourceUrl` se uloží a trend se zobrazí jako běžná položka. Reprodukováno v produkčním UI. Modul je zatím ruční evidence, nikoliv skutečný radar aktuálních trendů.  
**Důkaz:** `apps/web/app/_components/module-grid.tsx:65–83`.

### QA-005R: Today zůstává převážně demo přehledem

Denní kontrola je už sdílená a opravena, ale ostatní skóre, upozornění a část dnešního obsahu stále působí jako pevná demo data. Není prokázané, že se celý přehled automaticky přepočítá ze společného stavu Calendaru, Tasks, kampaní a publikací.

## P3 — technický dluh / nedoložené okraje

### QA-012R: Testů přibylo, ale chybí komponentní a end-to-end regrese

Počet automatických testů vzrostl ze 7 na 18. Nově jsou pokryté Story série, denní termíny, společný marketingový stav a neplatný JSON. Contracts a Database stále nemají testy a chybí automatické ověření browserových scénářů: potvrzení AI akce, persistentní Undo, export PNG, validace modulů a plné Reel/Post detaily.

### QA-013R: PWA je stále pouze částečná

Manifest nemá ikony a v aplikaci nebyla nalezena registrace service workeru ani offline chování. Ve `public` jsou pouze brand podklady a logo. Instalovatelnost/offline provoz nejsou doložené.  
**Důkaz:** `apps/web/app/manifest.ts:3–13`.

### QA-017: Stažení PNG vyžaduje krátký ruční smoke test

U každého ze tří slidů je samostatný odkaz `download` a je přítomné tlačítko „Stáhnout celou sérii (3 PNG)“. Vestavěný automatický prohlížeč ale nezachytil událost stažení datového URL, takže fyzický soubor v Downloads nebylo možné potvrdit. Náhledy, rozměry a unikátní data všech tří PNG byly ověřeny. Před akceptací doporučuji jeden ruční test v Chrome/Safari, zvlášť kvůli případnému blokování více souběžných stažení.

## Stav původních nálezů

| ID                                     | Stav                               | Výsledek retestu                                                              |
| -------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| QA-001 více-slide Story                | **OPRAVENO**                       | 3 unikátní vizuály, samostatná i sériová regenerace, 1080 × 1920, persistence |
| QA-002 skutečné AI změny               | **OPRAVENO ČÁSTEČNĚ**              | společný stav a audit fungují; Undo nepřežije navigaci                        |
| QA-003 denní reset                     | **OPRAVENO**                       | datum a další termín podle Europe/Prague, unit test resetu                    |
| QA-004 povinné moduly                  | **OPRAVENO ČÁSTEČNĚ**              | moduly ukládají data; Trend Radar nevyžaduje zdroj a není automatický         |
| QA-005 statický Today                  | **ČÁSTEČNĚ**                       | denní úkol sdílený, celý dashboard ještě není doložený jako datově živý       |
| QA-006 neplatný JSON = 500             | **OPRAVENO**                       | všechny 3 endpointy vracejí strukturované 400 `INVALID_JSON`                  |
| QA-007 poškozená lokální data          | **OPRAVENO V HLAVNÍCH ÚLOŽIŠTÍCH** | bezpečné načtení společného stavu a Story metadat                             |
| QA-008 Reel/Post detail                | **NEOPRAVENO DOSTATEČNĚ**          | routy přidány, požadovaný publikovatelný obsah chybí                          |
| QA-009 termín/priorita/opakování úkolu | **OPRAVENO**                       | pole a persistence existují; změnu data je vhodné ručně potvrdit              |
| QA-010 scope rezervací                 | **OPRAVENO DOKUMENTAČNĚ**          | přidán BA Change 001; před produkcí stále vyžaduje souhlas provozovatele      |
| QA-011 formátování                     | **OPRAVENO**                       | `format:check` PASS                                                           |
| QA-012 testy                           | **ZLEPŠENO**                       | 18 testů, stále bez komponentního/E2E pokrytí                                 |
| QA-013 PWA                             | **NEOPRAVENO**                     | chybí ikony a service worker                                                  |
| QA-014 CSP                             | **OPRAVENO**                       | produkční CSP přítomná; produkční konzole bez chyb                            |

## Provedené kontroly

| Kontrola                          | Výsledek                                             |
| --------------------------------- | ---------------------------------------------------- |
| Unit testy                        | PASS — 18 testů                                      |
| TypeScript                        | PASS                                                 |
| ESLint                            | PASS                                                 |
| Formátování                       | PASS                                                 |
| Produkční build                   | PASS — 20 rout                                       |
| Health endpoint                   | PASS — HTTP 200                                      |
| Neplatné JSON na 3 AI API         | PASS — HTTP 400 se strukturovanou chybou             |
| Story 3 slidy / 3 vizuály         | PASS                                                 |
| Rozměry Story PNG                 | PASS — všechny 1080 × 1920                           |
| Regenerace celé série             | PASS                                                 |
| Regenerace jediného slidu         | PASS — ostatní verze beze změny                      |
| Persistence Story po reloadu      | PASS                                                 |
| AI nápad → Idea Bank              | PASS                                                 |
| AI přesun → Calendar              | PASS                                                 |
| Okamžité Undo                     | PASS                                                 |
| Undo po návratu na AI             | FAIL                                                 |
| Denní úkol                        | PASS                                                 |
| Mobilní produkční UI              | PASS — 8 hlavních rout, bez horizontálního přetečení |
| Produkční konzole                 | PASS — 0 chyb                                        |
| Reel/Post publikovatelné podklady | FAIL                                                 |
| Trend bez zdroje odmítnut         | FAIL                                                 |
| Fyzické stažení PNG               | NEOVĚŘENO — omezení automatického prohlížeče         |

## Doporučené pořadí oprav

1. Dodat skutečný Reel detail: hook, časovaný scénář, shotlist, overlay texty, caption a jasný export/předání.
2. Dodat skutečný Post detail: finální caption, vizuální brief/podklad a publikační metadata.
3. Hydratovat Undo ze společného auditu při každém otevření AI stránky.
4. V Trend Radaru vyžadovat validní zdroj, zobrazovat datum získání a freshness; oddělit ruční záznam od ověřeného trendu.
5. Přidat browserové regresní testy pro Story, AI akce/Undo a validační chyby modulů.
6. Ručně potvrdit stažení jednoho PNG a celé série v běžném Chrome/Safari.

## Akceptační verdikt

Po opravě QA-008R, QA-015 a QA-016 doporučuji krátký finální retest. Samotná uživatelem hlášená chyba „nevytváří grafiku pro více slidů“ je v této verzi **opravena a reprodukovatelně prošla**.
