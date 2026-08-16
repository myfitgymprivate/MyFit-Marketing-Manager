# MyFit Marketing Manager – předání P1 oprav k retestu v3

Datum: 2026-08-16  
Stav: READY FOR QA

## QA-MPI-001 – víceslidová Story

- Import XLSX nyní načítá i list `Stories scénáře`.
- Scénáře se párují s událostmi podle názvu a bezpečných tematických shod.
- Referenční událost `Volné termíny` dostává tři samostatné framy v pořadí 1–3.
- Každý frame má vlastní text a režii z workbooku.
- Detail události zobrazuje každý slide samostatně.
- Každý slide lze vytvořit nebo regenerovat samostatně.
- Každý slide má vlastní verzi a samostatné PNG 1080 × 1920.
- Celou dokončenou sérii lze stáhnout jako tři PNG v zachovaném pořadí.
- Série je uložená ke konkrétní události v IndexedDB a přežije reload.

### Ověření referenčního workbooku

- položek: 30
- chyb: 0
- `Volné termíny.storySlideCount`: 3
- slide 1: `MÁŠ DNES CHVÍLI PRO SEBE?`
- slide 2: `VOLNÉ TERMÍNY DNES` + zástupné časy
- slide 3: `VYBER SI SVŮJ TERMÍN →`

## QA-MPI-002 – no-op import duplicit

- Import nejprve počítá skutečný change set.
- Pokud jsou všechny duplicity nastavené na `Přeskočit`, vrátí původní stav beze změny.
- Nevznikne auditní mutace ani import batch.
- Schválená verze 1 zůstane schválená jako verze 1.
- UI zobrazí `Import dokončen: 0 změn, 30 přeskočeno.`
- Pokud se jedna duplicita nastaví na `Aktualizovat`, vznikne verze 2 s jednou změnou.

## Další UX oprava

- Po skutečném importu je přímo v Calendaru dostupné tlačítko `Vrátit import`.

## Automatické kontroly

- TypeScript: PASS
- ESLint: PASS
- Testy: PASS, 12 souborů / 41 testů
- Prettier: PASS
- Produkční build: PASS, 23 rout

## Povinný retest

1. Importovat `deliverables/preview.xlsx` do čistého stavu.
2. Otevřít `Volné termíny` a ověřit tři samostatné slidy.
3. Vytvořit celou sérii, regenerovat jen slide 2 a ověřit jeho vyšší verzi.
4. Stáhnout každý PNG a následně celou sérii.
5. Obnovit stránku a ověřit persistenci všech tří slidů.
6. Schválit zářijový plán verze 1.
7. Opakovat import, ponechat 30× `Přeskočit` a potvrdit.
8. Ověřit hlášku `0 změn, 30 přeskočeno`, stále schválenou verzi 1 a žádný nový auditní change set.
9. Nastavit jednu duplicitu na `Aktualizovat` a ověřit verzi 2 s jednou změnou.
10. Ověřit `Vrátit import` přímo v Calendaru.
