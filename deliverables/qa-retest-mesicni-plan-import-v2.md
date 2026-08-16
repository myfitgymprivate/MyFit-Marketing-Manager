# MyFit Marketing Manager — QA retest měsíčního plánu a importu v2

**Datum:** 16. srpna 2026  
**Testovaná verze:** `/Users/any/Documents/Marketing MyFit App/03 Vývoj/MyFit-Marketing-Manager`  
**Předávací protokol:** `deliverables/retest-mesicni-plan-import-v2.md`  
**Referenční soubor:** `deliverables/preview.xlsx`  
**Ověřený SHA-256:** `048c57dd65911ae8dbbe2d82e4951b7449305afc9a2f8f5c588fa90df86a7042`  
**Verdikt:** **NEPŘIPRAVENO K AKCEPTACI** — základ importu je funkční, ale zůstávají dva P1 blokery.

## Shrnutí

Referenční XLSX byl načten v reálném produkčním UI. Aplikace správně našla čtyři listy, automaticky zvolila `Září 2026`, namapovala české hlavičky a zobrazila 30 platných položek, 0 chyb a 0 duplicit proti čistému kalendáři. Import, schválení, propojení s Today, předání importovaného briefu agentovi a Undo celého prvního importu fungují.

Akceptaci blokují:

1. Importovaná Story označená jako `3 stories` vytvoří pouze jeden obrázek, nikoliv tři slidy.
2. Opakovaný import, při kterém je všech 30 duplicit výchozím způsobem přeskočeno, přesto zruší schválení plánu a vytvoří novou verzi.

## P1 — blokující vady

### QA-MPI-001: Importovaná víceslidová Story vytvoří pouze jeden vizuál

**Postup reprodukce:**

1. Importovat `preview.xlsx` v režimu Sloučit.
2. Otevřít 2. září položku `Volné termíny`.
3. Ověřit podklady `IG Stories · 3 stories`.
4. Kliknout `Vygenerovat grafiku s agentem`.

**Očekávání:** Tři samostatné Story slidy 1080 × 1920, odpovídající třem částem importovaného textu a scénáře.

**Skutečnost:** Vznikne pouze jeden obrázek 1080 × 1920. Není dostupné stažení série ani samostatné slidy. Hodnota `storySlideCount: 3` se sice uloží, ale komponenta kalendáře ji při tvorbě obsahu nikde nepoužívá. List `Stories scénáře` je nalezen, ale jeho řádky se nenapojí na události z hlavního listu.

**Dopad:** Vrací se původní klíčový problém aplikace — marketingový plán může požadovat víceslidovou Story, ale uživatelka obdrží jen jednu grafiku.

**Důkaz v UI:** `Volné termíny` → podklady `IG Stories · 3 stories`; po generování 1 obrázek, 0 ovládacích prvků pro sérii.  
**Důkaz v kódu:**

- `apps/web/app/_lib/marketing-store.ts:35` a `:479` — počet slidů se pouze uloží;
- `apps/web/app/_components/calendar-workspace.tsx:449–538` — generátor vytváří jediný `SavedCalendarVisual`;
- `apps/web/app/api/v1/plan-imports/preview/route.ts:87–121` — zpracuje se jen jeden vybraný list, bez propojení listu Story scénářů.

**Požadovaná oprava:** Pro importovanou Story vytvořit `storyFrames` podle explicitního počtu a scénáře. Pokud workbook obsahuje list `Stories scénáře`, spárovat jej podle názvu/scénáře s hlavní položkou. Generování musí používat existující více-slide pipeline: samostatný text, vizuál, regenerace a PNG pro každý slide.

### QA-MPI-002: No-op import duplicit zruší schválení plánu

**Postup reprodukce:**

1. Importovat `preview.xlsx` a schválit zářijový plán verze 1.
2. Nahrát stejný soubor znovu.
3. Náhled správně ukáže 30 duplicit.
4. Ponechat výchozí řešení `Přeskočit` u všech položek a režim `Sloučit`.
5. Kliknout `Potvrdit a importovat`.

**Očekávání:** Import je no-op. Plán zůstane schválený ve verzi 1, žádná nová verze ani auditní mutace nevznikne. UI oznámí, že bylo přidáno/aktualizováno 0 položek.

**Skutečnost:** Aplikace zobrazí `Import dokončen: 30 platných řádků bylo zpracováno`, archivuje schválenou verzi 1 a vytvoří neschválenou verzi 2. Všech 30 položek přitom bylo přeskočeno a počet kalendářních událostí zůstal 30.

**Dopad:** Bez skutečné změny dat se ztratí stav schválení. Uživatelka může nevědomky vrátit hotový plán do rozpracovaného stavu.

**Důkaz v kódu:**

- `apps/web/app/_lib/marketing-store.ts:511–531` — duplicitní řádky se přeskočí;
- `apps/web/app/_lib/marketing-store.ts:533–554` — plán se přesto vždy archivuje a vytvoří nová verze;
- `apps/web/app/_components/plan-import-dialog.tsx:171–174` — hláška používá počet validních řádků místo počtu skutečně přidaných/aktualizovaných.

**Požadovaná oprava:** Nejprve spočítat skutečný change set. Pokud neobsahuje žádné přidání, aktualizaci ani nahrazení, neprovádět auditní mutaci, nezvyšovat verzi a neměnit schválení. Vrátit výsledek `0 změn, 30 přeskočeno`.

## P2 — významné mezery

### QA-MPI-003: Automatika 20./25. dne není samostatně plánovaná

Říjnový AI návrh lze vytvořit a schválit pro libovolný měsíc a v retestu prošel. Automatický návrh po 20. dni ale vzniká pouze při otevření stránky Calendar. Funkce připomínky od 25. dne existuje, ale není napojená do UI ani naplánovaného jobu.

**Důkaz:**

- `apps/web/app/_components/calendar-workspace.tsx:249–268` — návrh vzniká při hydrataci Calendaru;
- `apps/web/app/_lib/monthly-plan.ts:186–193` — logika připomínky existuje, ale mimo testy není použita.

**Dopad:** Pokud uživatelka Calendar po 20. dni neotevře, plán se nevytvoří a 25. den nedostane očekávanou připomínku.

### QA-MPI-004: Import je v produkčním UI stále uložený jen v prohlížeči

Endpoint `commit` ověřuje podpis náhledu, ale samotný zápis plánu provádí klient následně do lokálního marketingového stavu. Nejde o serverovou transakci do Supabase/PostgreSQL.

**Důkaz:**

- `apps/web/app/api/v1/plan-imports/commit/route.ts:23–61` — pouze validace a vrácení ověřeného payloadu;
- `apps/web/app/_components/plan-import-dialog.tsx:160–170` — skutečný commit a uložení probíhá v klientovi.

**Dopad:** Pro klikací prototyp přijatelné, pro produkční akceptaci ne. Data nejsou sdílená mezi zařízeními a server negarantuje transakční zápis celé dávky.

### QA-MPI-005: Undo importu je dostupné pouze přes MyFit AI

Undo funguje a v čistém testu odstranilo všech 30 položek i měsíční plán. V importním dialogu ani Calendaru ale není po importu viditelné tlačítko. Uživatelka musí vědět, že má přejít na MyFit AI a použít `Vrátit poslední změnu`.

**Doporučení:** Po úspěšném importu zobrazit v potvrzovací hlášce přímou akci `Vrátit import` s názvem souboru a počtem skutečných změn.

## Co prošlo

### Referenční workbook

- SHA-256 odpovídá předání.
- 4 listy: `Září 2026`, `Stories scénáře`, `Obsahové pilíře`, `KPI`.
- Hlavní list obsahuje 30 datových řádků a Excel serial datumy.
- Vizuální a datová kontrola workbooku proběhla přes tabulkový runtime.

### Importní náhled

- XLSX upload: PASS.
- Výběr listu: PASS — všechny 4 listy dostupné.
- Automatický výběr `Září 2026`: PASS.
- Řádek hlavičky: PASS.
- České mapování: PASS.
- 30 platných / 0 chyb / 0 duplicit na čistém stavu: PASS.
- Převod Excel datumů: PASS.
- Zachování platformy a původního formátu: PASS.
- Náhled před zápisem: PASS.
- Výchozí režim Sloučit: PASS.

### Import a společný stav

- První commit 30 položek: PASS.
- Kalendář obsahuje přesně 30 zářijových událostí: PASS.
- Vznik měsíčního plánu verze 1 ve stavu ke kontrole: PASS.
- Schválení pouze daného měsíce: PASS.
- Today po schválení ukazuje `Plán na září 2026 je schválený`: PASS.
- Stav přežil reload: PASS.

### Importovaný brief a AI

Na položce `Zpátky do rytmu po létě` byly v UI potvrzeny:

- `IG + FB`;
- původní formát `Carousel + Stories`;
- cíl `Restart měsíce / rezervace`;
- importovaný text do grafiky;
- celý caption;
- CTA;
- hashtagy;
- vizuální zadání.

Agent události připravil 3 textové varianty v demo režimu a použil importovaný headline, caption a CTA. Post grafika vznikla jako 1080 × 1350 a po reloadu zůstala uložená.

### Duplicity a ochrany

- Opakovaný náhled stejného souboru: PASS — 30 duplicit.
- U každé duplicity volby Přeskočit / Aktualizovat / Přidat jako nový: PASS.
- Režim Nahradit schválený plán vyžaduje zvláštní checkbox: PASS.
- Podpis náhledu a odmítnutí změněného payloadu: PASS v automatickém testu.
- Stav PUBLISHED se bezpečně nepřenáší jako publikovaný: PASS v automatickém testu.

### Undo

- Undo prvního importu: PASS — 30 → 0 událostí, měsíční plán odstraněn.
- Undo chybného no-op reimportu: PASS — obnovil schválenou verzi 1 a ponechal 30 položek.
- Undo po navigaci: PASS.

### Obecný měsíční plán

- Ruční vytvoření AI návrhu pro říjen 2026: PASS.
- Návrh vznikl jako verze 1 ke kontrole: PASS.
- Vygenerováno 17 položek: 10 Story, 2 Reely, 2 Posty, 3 úkoly.
- Plán se automaticky neschválil: PASS.
- Explicitní schválení října: PASS.

## Automatické kontroly

| Kontrola                    | Výsledek                     |
| --------------------------- | ---------------------------- |
| TypeScript                  | PASS                         |
| ESLint                      | PASS                         |
| Prettier                    | PASS                         |
| Testy                       | PASS — 12 souborů / 36 testů |
| Produkční build             | PASS — 23 rout               |
| Produkční konzole během E2E | PASS — 0 chyb, 0 varování    |

Poznámka: Contracts a Database stále nemají vlastní testovací soubory; jejich test skripty končí úspěšně přes `--passWithNoTests`.

## Povinný retest po opravě

1. Importovat `preview.xlsx` do čistého stavu.
2. U `Volné termíny` ověřit 3 samostatné Story slidy, jejich texty, rozměry 1080 × 1920, regeneraci a export.
3. Ověřit propojení listu `Stories scénáře` s odpovídajícími Story událostmi.
4. Schválit zářijový plán verze 1.
5. Importovat stejný soubor znovu, všech 30 duplicit ponechat na Přeskočit a potvrdit.
6. Ověřit, že zůstala schválená verze 1, nevznikl nový auditní change set a hláška ukazuje `0 změn, 30 přeskočeno`.
7. Zvolit jednu duplicitu Aktualizovat a ověřit, že vznikne verze 2 pouze s jednou skutečnou změnou.
8. Ověřit Undo importu přímo z Calendaru.

## Finální verdikt

Importní základ je výrazně posunutý a většina předávacího protokolu prošla. K akceptaci je nutné opravit QA-MPI-001 a QA-MPI-002. První přímo porušuje požadavek na víceslidovou grafiku; druhý může bez skutečné změny zrušit už schválený měsíční plán.
