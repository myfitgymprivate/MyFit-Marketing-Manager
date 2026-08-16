# MyFit Marketing Manager – QA retest v4

Datum: 2026-08-16  
Testovaná složka: `/Users/any/Documents/Marketing MyFit App/03 Vývoj/MyFit-Marketing-Manager`  
Protokol: `deliverables/retest-release-undo-readiness-v4.md`  
Výsledek: **NOT PASS – persistentní Undo a samotná readiness logika jsou opravené, ale převod staré jednodílné Story na sérii nově blokuje generování všech slidů. Čistý handoff má navíc jednu reprodukovatelnou hraniční chybu.**

## Automatické kontroly

- `pnpm typecheck` před buildem: PASS.
- Testy: PASS, 13 souborů / 43 testů.
- ESLint: PASS.
- Prettier: PASS.
- Čerstvý produkční build: PASS, 23 rout.
- `pnpm release:check` po buildu: PASS.
- Konfliktní soubory `apps/web/.next/types/* 2.ts`: 0.
- `BUILD_ID` po QA buildu: `2026-08-16 13:08:27`, novější než testovaný zdroj `calendar-workspace.tsx` z `13:01:46`.
- `pnpm typecheck` po buildu: PASS.

## Ověřené opravy

### QA-V3-002 – persistentní `Vrátit import`: PASS

- Po skutečném importu bylo `Vrátit import` dostupné v Kalendáři.
- Po reloadu stránky a opětovném otevření září tlačítko zůstalo dostupné.
- Undo bylo provedeno přímo z Kalendáře.
- Importované položky byly odstraněny, původní jedna Story zůstala a tlačítko po Undo zmizelo.

### QA-V3-003 – zobrazení readiness série: PASS s blokujícím souvisejícím nálezem níže

- Po změně staré single Story na 3slidovou sérii UI správně ukázalo `0/3 připraveno` a nezobrazilo `Grafika připravená`.
- Po obnovení AI podkladů bylo ověřeno:
  - `2/3 připraveno` bez stavu hotovo,
  - `3/3 připraveno` se stavem `Grafika připravená ✓`.
- Stará single metadata tedy už readiness série falešně neoznačují jako hotovou.

## Nálezy k opravě

### QA-V4-001 — P1 — po převodu staré single Story na sérii nelze vytvořit žádný slide

**Reprodukce**

1. V čistém stavu vytvoř Story `Volné termíny` a vygeneruj jí běžnou jednodílnou grafiku.
2. Importem `Aktualizovat` změň stejnou událost na 3slidovou sérii s `storyFrames`.
3. Detail správně ukáže `0/3 připraveno`.
4. Klikni na kterékoliv `Vytvořit slide` nebo `Vytvořit celou sérii`.

**Skutečnost**

- Stav zůstane `0/3`.
- Aplikace zobrazí `Zadání grafiky není platné.`
- Nefunguje jednotlivý slide ani celá série.
- Pokud uživatel nejprve pošle zprávu agentovi události a tím obnoví content kit, následné generování funguje a readiness přejde 1/3 → 2/3 → 3/3. To je pouze workaround, ne přijatelné běžné chování.

**Pravděpodobná příčina**

- Uložený content kit z původní single Story může mít delší `visualDirection` (content-kit schema dovoluje až 400 znaků).
- `calendar-workspace.tsx:625` k němu připojí režii konkrétního framu.
- `calendar-workspace.tsx:638–640` odešle složený text jako `theme`.
- `/api/v1/ai/visual/route.ts:11–18` však dovoluje `theme` maximálně 240 znaků, takže request skončí 422 `INVALID_VISUAL_REQUEST`.
- Po obnovení kitu agentem je visualDirection kratší a request projde, což příčinu podporuje.

**Úkol pro vývoj**

1. Před odesláním do visual API bezpečně zkrátit/normalizovat složený `theme` na limit API, nebo oddělit `theme` a `visualDirection` do samostatných validovaných polí.
2. Nepoužívat starý single content kit beze změny pro nový formát série; při změně struktury obsahu připravit kompatibilní kit automaticky.
3. Chybu neřešit tichým návratem: tlačítko musí vytvořit slide bez nutnosti ruční zprávy agentovi.
4. Doplnit regresní test s delším uloženým `visualDirection` a přechodem single Story → `storyFrames`.

**Akceptace**

- Ihned po importní aktualizaci lze bez dalšího kroku vytvořit slide 1, slide 2 i slide 3.
- Funguje také `Vytvořit celou sérii`.
- Readiness přechází přímo 0/3 → 1/3 → 2/3 → 3/3 bez validační chyby.

### QA-V4-002 — P2 — zdrojový `release:check` selže na prázdné `.next`

**Důkaz**

- Ještě před prvním QA příkazem obsahovala předaná složka prázdné adresáře `apps/web/.next` a `.turbo`, přestože protokol uvádí jejich nepřítomnost.
- `pnpm release:check` před buildem skončil chybou `Release check: .next neobsahuje BUILD_ID.`
- Adresář `.next` v tu chvíli neobsahoval žádné soubory ani starý build; po skutečném QA buildu stejný check správně prošel.

**Úkol pro vývoj**

- Buď garantovat fyzickou nepřítomnost prázdných build adresářů v okamžiku předání, nebo upravit `scripts/release-check.mjs`, aby prázdnou `.next` považoval za čistou zdrojovou kopii.
- Stále musí selhat stav, kdy `.next` obsahuje soubory, ale chybí `BUILD_ID`, a stav se zastaralým `BUILD_ID`.

**Akceptace**

- `release:check` před buildem projde pro neexistující i úplně prázdnou `.next`.
- Po buildu projde pouze s aktuálním `BUILD_ID` a bez konfliktních kopií.

## Cílený retest v5

1. Převzít zdrojovou složku a spustit `release:check` ještě před ostatními příkazy.
2. Vytvořit single Story s uloženou grafikou a běžným/delším content kitem.
3. Aktualizovat ji importem na 3slidovou sérii.
4. Bez zprávy agentovi vytvořit slide 1 a 2 samostatně, poté ověřit 2/3 bez hotového stavu.
5. Vytvořit slide 3, ověřit 3/3 a hotový stav.
6. Zopakovat převod pomocí `Vytvořit celou sérii`.
