# Vývojářský brief — obecný měsíční plán a import Excel/CSV

**Projekt:** MyFit Marketing Manager  
**Verze zadání:** v1  
**Datum:** 16. srpna 2026  
**Priorita:** P1 pro obecný měsíční plán, P2 pro import Excel/CSV

## 1. Cíl

Odstranit současnou vazbu aplikace na pevně připravený zářijový plán a umožnit uživatelce dvě rovnocenné cesty:

1. nechat AI připravit návrh marketingového plánu pro libovolný měsíc;
2. nahrát vlastní marketingový plán z Excelu nebo CSV.

Obě cesty musí skončit ve stejném kalendáři, používat stejný datový model a vyžadovat kontrolu uživatelky před schválením.

## 2. Současný stav a problém

- Kalendář lze přepnout na libovolný měsíc, ale předdefinovaný návrh existuje pouze pro září 2026.
- `septemberDraft`, `septemberPlanApproved`, texty „Zobrazit září“ a `approvePlan()` jsou pevně navázané na září.
- Schválení mění pouze položky s datem začínajícím `2026-09`.
- AI nástroje podporují jednotlivý přesun, zápis publikace a uložení nápadu, nikoliv vytvoření nebo nahrazení celého měsíčního plánu.
- Databázové schéma už obsahuje obecnou tabulku `monthly_plans`, ale UI zatím používá lokální marketingový stav.

Relevantní místa:

- `apps/web/app/_components/calendar-workspace.tsx`
- `apps/web/app/_components/chat-composer.tsx`
- `apps/web/app/_lib/marketing-store.ts`
- `apps/web/app/_lib/myfit-agent.ts`
- `packages/database/src/schema.ts`

## 3. Požadovaný životní cyklus měsíčního plánu

### 3.1 Stavy

Každý měsíc má vlastní plán a stav:

- `DRAFT` — rozpracovaný návrh;
- `READY_FOR_REVIEW` — návrh je připravený ke kontrole;
- `APPROVED` — uživatelka plán schválila;
- `ARCHIVED` — historická verze.

Schválení musí ukládat čas, uživatele a verzi. Změna již schváleného plánu vytvoří novou rozpracovanou verzi nebo auditovatelnou změnu; nesmí tiše přepsat schválenou verzi.

### 3.2 Automatický návrh

Doporučené výchozí chování:

- 20. den předchozího měsíce připravit AI návrh následujícího měsíce;
- 25. den zobrazit připomínku, pokud plán stále není schválený;
- termíny musí být konfigurovatelné a vyhodnocované v `Europe/Prague`;
- automatika vytváří pouze návrh, nikdy plán sama neschválí;
- pokud již existuje ruční nebo importovaný návrh, automatika jej nesmí přepsat a nabídne pouze doplnění.

Příklad: říjnový návrh vznikne 20. září, uživatelka jej upraví a do 25. září schválí.

### 3.3 Podklady pro AI návrh

AI má při sestavení plánu použít:

- ověřená fakta a pravidla z Marketing Brain;
- uživatelskou paměť pro texty a obrázky;
- aktivní a připravované kampaně;
- Idea Bank;
- historii skutečně publikovaného obsahu;
- poslední schválené měsíční plány;
- obsahový rytmus MyFit: přibližně 1 Post/Reel týdně a Story obden;
- dostupné trendy pouze s platným a čerstvým zdrojem;
- případná kapacitní omezení a úkoly.

Výstup musí obsahovat měsíční téma, cíl, doporučený obsahový mix a konkrétní kalendářní položky. AI nesmí vymýšlet ceny, slevy nebo provozní fakta.

## 4. Uživatelský tok — AI plán

1. Uživatelka otevře libovolný měsíc, například říjen 2026.
2. Pokud plán neexistuje, vidí prázdný stav a tlačítko **„Navrhnout plán s AI“**.
3. Před spuštěním může doplnit hlavní cíl, téma, kampaň, omezení a požadovanou četnost.
4. AI vytvoří návrh, nikoliv schválený plán.
5. Aplikace ukáže souhrn dopadu: počet Story, Reelů, Postů a úkolů, termíny a případné konflikty.
6. Uživatelka může jednotlivé položky upravit, přesunout nebo smazat.
7. Tlačítko **„Schválit plán“** změní pouze aktuálně zobrazený měsíc.
8. Schválení se zapíše do auditu a lze jej bezpečně vrátit nebo vytvořit novou verzi.

## 5. Uživatelský tok — import Excel/CSV

V kalendáři přidat akci **„Importovat plán“**.

### 5.1 Podporované soubory

- `.xlsx`
- `.csv`
- maximální velikost pro MVP doporučeně 5 MB;
- jeden import může obsahovat více měsíců;
- u XLSX umožnit výběr listu, pokud jich soubor obsahuje více.

Google Sheets lze později podpořit exportem do XLSX/CSV nebo přímou integrací. Pro první verzi není nutný.

### 5.2 Minimální datová struktura

Povinné sloupce:

| Pole    | Význam                          | Příklad            |
| ------- | ------------------------------- | ------------------ |
| `date`  | datum publikace nebo úkolu      | `2026-10-02`       |
| `type`  | `STORY`, `REEL`, `POST`, `TASK` | `STORY`            |
| `title` | název nebo téma                 | `Podzimní restart` |

Volitelné sloupce:

| Pole                | Význam                                          |
| ------------------- | ----------------------------------------------- |
| `external_id`       | stabilní ID pro opakované importy a deduplikaci |
| `goal`              | marketingový cíl                                |
| `campaign`          | vazba na kampaň                                 |
| `cta`               | požadovaná výzva k akci                         |
| `caption`           | hotový nebo rozpracovaný caption                |
| `status`            | výchozí stav; bez hodnoty vždy `DRAFT`          |
| `notes`             | produkční poznámky                              |
| `story_slide_count` | očekávaný počet slidů Story                     |
| `visual_direction`  | vizuální zadání                                 |
| `source_url`        | zdroj nebo referenční odkaz                     |

Import musí nabídnout mapování běžných českých názvů sloupců, například `Datum`, `Formát`, `Typ`, `Název`, `Téma`, `Cíl`, `CTA`, `Kampaň`, `Poznámka`.

### 5.3 Importní průvodce

1. Vybrat soubor.
2. Vybrat list a řádek hlavičky.
3. Automaticky navrhnout mapování sloupců, ale umožnit jeho ruční opravu.
4. Normalizovat hodnoty a zobrazit náhled.
5. Rozdělit řádky na:
   - připravené k importu;
   - varování;
   - chyby, které se neimportují;
   - možné duplicity.
6. Zvolit režim importu.
7. Ukázat přesný dopad před potvrzením.
8. Po potvrzení provést import jako jednu auditovatelnou operaci.

### 5.4 Režimy importu

Výchozí a doporučená volba:

- **Sloučit se stávajícím plánem** — přidá nové položky a nabídne řešení konfliktů.

Další volby:

- **Aktualizovat podle `external_id`** — vhodné pro opakovaný import stejného souboru;
- **Nahradit měsíc** — odstraní nebo archivuje současný návrh daného měsíce a vyžaduje zvláštní potvrzení. Schválený plán se nesmí přepsat bez výslovného varování a nové verze.

### 5.5 Validace

- přijmout skutečné Excel datum, `YYYY-MM-DD` a české `D.M.YYYY`;
- datum normalizovat v timezone `Europe/Prague`;
- normalizovat české varianty typu (`Story`, `Reel`, `Post`, `Úkol`) na interní enum;
- prázdné povinné pole označit jako chybu řádku;
- nepodporovaný formát obsahu neimportovat;
- stav `PUBLISHED` nesmí vzniknout pouhým importem bez zvláštního potvrzení;
- vzorce v povinných polích musí mít čitelnou výslednou hodnotu, jinak řádek odmítnout;
- odkazy validovat jako `http://` nebo `https://`;
- u finančních údajů nebo slev zachovat povinné samostatné potvrzení.

### 5.6 Duplicity

Primární identita je `external_id`, pokud je v souboru uvedené.

Bez `external_id` označit jako možnou duplicitu shodu:

- normalizované datum;
- typ;
- normalizovaný název.

Průvodce musí umožnit pro každý konflikt zvolit `Přeskočit`, `Aktualizovat` nebo `Přidat jako novou položku`. Opakované nahrání stejného souboru nesmí bez upozornění vytvořit kopie.

## 6. Napojení na tvorbu obsahu

Import plánu nevytváří automaticky placené AI obrázky pro celý měsíc.

Po importu nebo schválení:

- každá položka má detail a stav připravenosti;
- uživatelka může u jedné položky spustit vytvoření textových podkladů;
- u Story se následně vytvoří požadovaný počet samostatných slidů;
- grafiku lze vytvořit ručně nebo automaticky například 7 dní před publikací;
- hromadné generování musí předem ukázat počet výstupů a odhad nákladu;
- neúspěch jedné položky nesmí zrušit ostatní úspěšné výsledky.

## 7. Datový a technický návrh

### 7.1 Generalizace současného stavu

- odstranit `septemberPlanApproved` a nahradit jej stavem konkrétního `monthly_plan`;
- odstranit pevné `septemberDraft` z UI;
- `approvePlan(month)` musí pracovat s právě zobrazeným měsícem;
- karta plánu musí zobrazovat skutečný měsíc, téma, stav a verzi;
- navigace kalendáře musí fungovat stejně pro minulý i budoucí měsíc.

### 7.2 Databáze

Použít existující tabulky:

- `monthly_plans` pro hlavičku, téma, cíl, stav a verzi;
- `content_items` pro jednotlivé kalendářní položky;
- `story_frames` a `reel_scenes` pro rozpracované formáty;
- `audit_log` pro import, generování, schválení a vrácení změny;
- `idempotency_keys` pro bezpečné opakování importu.

Doplnit podle potřeby:

- `import_batches` — soubor, hash, stav, počet řádků, výsledky a uživatel;
- `source` na položce (`MANUAL`, `AI_PLAN`, `XLSX_IMPORT`, `CSV_IMPORT`);
- `external_id` a `import_batch_id` na importovaných položkách.

Neimplementovat finální import pouze nad `localStorage`. Demo režim jej může používat, ale produkční cesta musí mít serverovou validaci, transakční zápis a audit.

### 7.3 Navrhovaná API

- `POST /api/v1/monthly-plans/generate` — připraví AI návrh;
- `GET /api/v1/monthly-plans/:month` — vrátí plán a položky;
- `POST /api/v1/monthly-plans/:month/approve` — schválí konkrétní verzi;
- `POST /api/v1/plan-imports/preview` — načte soubor a vrátí mapování, chyby a duplicity;
- `POST /api/v1/plan-imports/commit` — zapíše potvrzený import;
- `POST /api/v1/plan-imports/:id/undo` — vrátí import, pokud od něj nevznikly kolidující změny.

Import musí používat token nebo hash náhledu, aby server při potvrzení zapsal přesně data, která uživatelka viděla.

## 8. Akceptační kritéria

### Obecný měsíční plán

- [ ] Říjen 2026 ani jiný měsíc není závislý na pevně zakódovaných datech.
- [ ] Na prázdném měsíci lze vytvořit AI návrh.
- [ ] Návrh se bez potvrzení neoznačí jako schválený.
- [ ] Schválení se vztahuje pouze na zvolený měsíc a konkrétní verzi.
- [ ] Existující ruční/importované položky AI bez upozornění nepřepíše.
- [ ] Uživatelka může plán upravit, přesunout položky a následně schválit.
- [ ] Stav plánu se správně zobrazí na Calendaru i Today.
- [ ] Všechny změny mají auditní záznam.

### Excel/CSV import

- [ ] Lze nahrát validní XLSX i CSV.
- [ ] Uživatelka může namapovat české názvy sloupců.
- [ ] Import zobrazí náhled a nic nezapíše před potvrzením.
- [ ] Chybné řádky mají číslo řádku a srozumitelný důvod.
- [ ] Import podporuje Excel datum, ISO datum a české datum.
- [ ] Opakovaný import stejného souboru nevytvoří tiché duplicity.
- [ ] Výchozí režim importu je sloučení.
- [ ] Nahrazení měsíce vyžaduje explicitní potvrzení.
- [ ] Importované položky mají výchozí stav `DRAFT`.
- [ ] Celý import je auditovatelný a lze jej bezpečně vrátit.
- [ ] Import více měsíců správně rozdělí položky mezi jednotlivé plány.
- [ ] Po importu lze z položky vytvořit textové podklady a grafiku.

## 9. Povinné testy

- unit test normalizace typů a tří formátů data;
- unit test mapování českých hlaviček;
- unit test detekce duplicit s `external_id` i bez něj;
- unit test, že import nikdy sám nevytvoří `PUBLISHED`;
- integrační test preview → commit se stejným hashem;
- integrační test rollbacku celé dávky při chybě zápisu;
- integrační test schválení libovolného měsíce;
- E2E test vytvoření říjnového AI návrhu a jeho schválení;
- E2E test XLSX importu, náhledu, sloučení a opakovaného importu;
- E2E test konfliktu se schváleným plánem;
- timezone test pro spuštění 20. a připomínku 25. dne v `Europe/Prague`.

## 10. Doporučené pořadí implementace

1. Generalizovat `monthly_plans` a odstranit zářijové konstanty.
2. Připojit Calendar a Today na databázový měsíční plán.
3. Implementovat ruční vytvoření, úpravu a schválení libovolného měsíce.
4. Přidat AI návrh měsíce s náhledem a potvrzením.
5. Přidat importní parser a preview bez zápisu.
6. Přidat commit, deduplikaci, audit a Undo importu.
7. Přidat plánovanou automatiku 20./25. dne.
8. Doplnit E2E a bezpečnostní testy.

## 11. Definition of Done

Funkce je hotová teprve tehdy, když lze v čistém účtu vytvořit říjnový plán oběma cestami — AI návrhem i importem XLSX — zkontrolovat jeho dopad, upravit jej, schválit a po reloadu vidět stejná data na Calendaru i Today. Opakovaný import nesmí vytvořit duplicity a žádný AI ani importní krok nesmí bez výslovného potvrzení přepsat schválený plán.
