# MyFit AI marketingový junior – provozní model

## Zdroj pravdy

Produkční záznamy budou uloženy v PostgreSQL přes Supabase. Lokální úložiště v prohlížeči slouží pouze jako dočasná cache pro rychlost a offline náhled; není zdrojem pravdy.

- PostgreSQL: plán, obsah, textové varianty, úkoly, kampaně, historie, trendy, rezervace, notifikace a audit AI akcí.
- Supabase Storage: zdrojové fotografie, generované podklady, finální PNG a videa.
- Worker nad PostgreSQL frontou: hodinové a denní kontroly, příprava obsahu před termínem a připomínky.
- OpenAI provider adapter: obsahový agent, vizuální agent a interpretace trendů. Model a verze promptu se ukládají ke každému běhu.

## Co si agent pamatuje

Agent odděluje čtyři typy paměti:

1. Ověřené skutečnosti – provozní informace, nabídka, odkazy a potvrzená pravidla.
2. Brand pravidla – vizuální styl, tón komunikace, zakázané formulace a práce s logem.
3. Preference uživatelky – schválené volby tónu, délky, kompozice a náročnosti realizace.
4. Naučené vzorce – odvozené doporučení s uvedeným zdrojem a mírou jistoty.

Odvozený vzorec se nikdy netváří jako ověřený fakt. Každý záznam má zdroj, platnost, jistotu, historii změn a možnost smazání.

## Pravidelné pracovní cykly

### Každou hodinu – vytíženost fitness

- načíst rezervační kalendář,
- uložit snapshot jednotlivých slotů,
- porovnat příští 3–4 dny s obvyklou obsazeností stejného dne a hodiny,
- vytvořit upozornění pouze při významné odchylce,
- navrhnout vhodný obsah nebo akci, ale slevu nikdy neaktivovat bez potvrzení.

Prahy nejsou pevně domyšlené. Budou konfigurovatelné a po nasbírání historie se budou opírat o vlastní baseline MyFit.

### Každé ráno – denní brief

- nejvyšší dnešní priorita,
- obsah k publikaci nebo dokončení,
- chybějící podklady,
- stav rezervací na 3–4 dny,
- důležité upozornění a jeden doporučený další krok.

### Obsah před zveřejněním

- T−14 dní: potvrdit koncept a náročnost realizace.
- T−7 dní: připravit tři textové varianty a vizuální návrh; pokud chybí fotografie, upozornit nebo nabídnout generovaný podklad.
- T−3 dny: kontrola finálního textu, CTA a návaznosti kampaně.
- Den publikace: připomenout ruční zveřejnění.
- D+1: vyžádat potvrzení publikace a uložit skutečnost do historie.

Grafiku lze ručně vygenerovat kdykoliv dříve. Sedmidenní pravidlo určuje nejzazší okamžik, kdy ji agent začne aktivně požadovat.

### Trendy

- sbírat trendy pouze z povolených zdrojů a ukládat odkaz, datum a důkaz,
- hodnotit relevanci pro MyFit, životnost trendu a náročnost realizace,
- každý trend převést na konkrétní MyFit variantu,
- nezařadit trend do kalendáře bez kontroly proti plánu, historii a kapacitě.

### Týdenní plánování

- vyhodnotit plán versus skutečně publikovaný obsah,
- kontrolovat pestrost témat a formátů,
- upozornit na překomunikovaná a dlouho nepoužitá témata,
- navrhnout další mini-kampaň a rozpad práce,
- vytvořit úkoly a termíny až po odpovídajícím potvrzení.

## Historie a audit

U každé události se ukládá:

- konverzace s agentem,
- všechny tři textové varianty a vybraná varianta,
- zdrojové a výsledné vizuály,
- model, verze promptu, stav, náklady a chyby AI běhu,
- přesuny termínu a změny stavu,
- kdo změnu navrhl, kdo ji potvrdil a možnost vrácení, pokud je bezpečná.

## Hranice samostatnosti

- Bez potvrzení: čtení dat, analýza, návrhy textu a vizuálu, připomínky, uložení konceptu.
- S potvrzením: přesun obsahu, zápis publikace, změna plánu a složené změny.
- Vždy s explicitním potvrzením hodnoty: sleva, cena a jiné obchodní parametry.
- Mimo MVP: automatické publikování na Instagram a změny v rezervačním systému.

## Provozní stav

Datový model a workflow jsou připravené v repozitáři. Pro skutečný produkční provoz ještě musí být založen a připojen Supabase projekt, privátní Storage, Owner autentizace, RLS politiky a samostatný worker. Do té doby běží UI jako lokální demo a nesmí být vydáváno za trvalou produkční paměť.
