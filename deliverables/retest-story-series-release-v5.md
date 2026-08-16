# MyFit Marketing Manager – předání v5 k cílenému retestu

Datum: 2026-08-16  
Cílová složka: `/Users/any/Documents/Marketing MyFit App/03 Vývoj/MyFit-Marketing-Manager`

## Opravené body

### QA-V4-001 – převod single Story na 3slidovou sérii

- Každý slide nyní automaticky dostane obsahový kit kompatibilní s limity grafického API.
- Starší dlouhé `visualDirection` už neblokuje vytvoření slidu ani celé série.
- Směr konkrétního slidu má přednost před obecnými podklady původní single Story.
- Stejná normalizace chrání také běžné single Story, Reel a Post požadavky.
- Není potřeba posílat ruční zprávu agentovi pro obnovení content kitu.

### QA-V4-002 – prázdná `.next`

- `release:check` přijímá neexistující i úplně prázdnou `.next` jako čistý zdrojový handoff.
- Neprázdná `.next` bez `BUILD_ID` zůstává blokovaná.
- Zastaralý `BUILD_ID` a konfliktní kopie generovaných souborů zůstávají blokované.
- Předávaná cílová složka neobsahuje `.next`, `.turbo` ani `apps/web/.turbo`.

## Automatické ověření

- `release:check` před buildem: PASS pro zdroj bez `.next`.
- Typecheck před buildem: PASS, 4 balíčky.
- Web testy: PASS, 13 souborů / 45 testů.
- Release-check regresní testy: PASS, 4 testy.
- Domain testy: PASS, 6 testů.
- ESLint: PASS.
- Prettier: PASS.
- Produkční build: PASS, 23 rout.
- `release:check` po buildu: PASS.
- Typecheck po buildu: PASS.
- Ověřovací build byl novější než poslední změna zdrojů; handoff je následně předán jako čistý zdroj bez buildu.

## Cílený retest

1. Ve zdrojové cílové složce spusť `pnpm release:check` před buildem.
2. Vytvoř single Story `Volné termíny` a vygeneruj běžnou grafiku.
3. Importem `Aktualizovat` převeď stejnou událost na tři `storyFrames` s dlouhým vizuálním zadáním.
4. Bez zprávy agentovi vytvoř slide 1 a slide 2 samostatně; očekávání je `2/3 připraveno` bez stavu hotovo.
5. Vytvoř slide 3; očekávání je `3/3 připraveno` a `Grafika připravená ✓`.
6. Reprodukci zopakuj přes `Vytvořit celou sérii`; očekávání jsou tři samostatná PNG 1080 × 1920.
7. Vytvoř úplně prázdnou `apps/web/.next` a spusť `pnpm release:check`; očekávání je PASS.
8. Přidej do `.next` libovolný soubor bez `BUILD_ID` a spusť kontrolu znovu; očekávání je FAIL.
