import { describe, expect, it } from "vitest";

import {
  autoMapImportHeaders,
  buildPlanImportPreview,
  buildStoryScenarioMap,
  normalizeImportDate,
  normalizeImportType,
} from "./plan-import";

describe("plan import", () => {
  it("normalizes Excel, ISO and Czech dates", () => {
    expect(normalizeImportDate(46306)).toBe("2026-10-11");
    expect(normalizeImportDate("2026-10-02")).toBe("2026-10-02");
    expect(normalizeImportDate("2.10.2026")).toBe("2026-10-02");
  });

  it("maps Czech headers and content types", () => {
    expect(
      autoMapImportHeaders([
        "Datum",
        "Platforma",
        "Formát",
        "Téma",
        "Cíl",
        "Koncept grafiky / videa",
        "Text do grafiky",
        "Text k příspěvku / Story",
        "CTA",
        "Hashtagy",
      ]),
    ).toEqual({
      date: "Datum",
      type: "Formát",
      title: "Téma",
      platform: "Platforma",
      format_label: "Formát",
      goal: "Cíl",
      cta: "CTA",
      caption: "Text k příspěvku / Story",
      graphic_text: "Text do grafiky",
      hashtags: "Hashtagy",
      visual_direction: "Koncept grafiky / videa",
    });
    expect(normalizeImportType("Úkol")).toBe("ÚKOL");
    expect(normalizeImportType("Carousel + Stories", "IG + FB")).toBe("POST");
    expect(normalizeImportType("Q&A sticker", "IG Stories")).toBe("STORY");
    expect(normalizeImportType("Reel / Video", "IG + FB")).toBe("REEL");
  });

  it("preserves the fields used by the MyFit monthly workbook", () => {
    const preview = buildPlanImportPreview(
      [
        {
          Datum: 46266,
          Platforma: "IG + FB",
          Formát: "Carousel + Stories",
          Téma: "Zpátky do rytmu po létě",
          Cíl: "Restart měsíce / rezervace",
          "Koncept grafiky / videa": "Světlý béžový carousel",
          "Text do grafiky": "ZÁŘÍ = ZPÁTKY DO RYTMU",
          "Text k příspěvku / Story": "Září je ideální chvíle.",
          CTA: "Rezervuj si svůj termín",
          Hashtagy: "#myfit #privatefitness",
          Status: "Plán",
          Poznámka: "Připnout na profil.",
        },
      ],
      [
        "Datum",
        "Platforma",
        "Formát",
        "Téma",
        "Cíl",
        "Koncept grafiky / videa",
        "Text do grafiky",
        "Text k příspěvku / Story",
        "CTA",
        "Hashtagy",
        "Status",
        "Poznámka",
      ],
      [],
    );

    expect(preview.errors).toEqual([]);
    expect(preview.items[0]).toMatchObject({
      date: "2026-09-01",
      type: "POST",
      platform: "IG + FB",
      formatLabel: "Carousel + Stories",
      title: "Zpátky do rytmu po létě",
      goal: "Restart měsíce / rezervace",
      visualDirection: "Světlý béžový carousel",
      graphicText: "ZÁŘÍ = ZPÁTKY DO RYTMU",
      caption: "Září je ideální chvíle.",
      cta: "Rezervuj si svůj termín",
      hashtags: "#myfit #privatefitness",
      notes: "Připnout na profil.",
    });
  });

  it("connects the Stories scénáře sheet to a matching imported event", () => {
    const scenarios = buildStoryScenarioMap([
      {
        Scénář: "Volné termíny",
        Slide: 1,
        Účel: "Zaujmout",
        Vizuál: "Detail studia vpravo",
        "Text do grafiky": "MÁŠ DNES CHVÍLI PRO SEBE?",
      },
      {
        Scénář: "Volné termíny",
        Slide: 2,
        Účel: "Informovat",
        Vizuál: "Seznam časů",
        "Text do grafiky": "VOLNÉ TERMÍNY DNES",
      },
      {
        Scénář: "Volné termíny",
        Slide: 3,
        Účel: "Konverze",
        Vizuál: "Zlaté CTA",
        "Text do grafiky": "VYBER SI SVŮJ TERMÍN →",
      },
    ]);
    const preview = buildPlanImportPreview(
      [
        {
          Datum: 46267,
          Platforma: "IG Stories",
          Formát: "3 stories",
          Téma: "Volné termíny",
          "Text do grafiky": "1: Teaser\n2: Termíny\n3: CTA",
        },
      ],
      ["Datum", "Platforma", "Formát", "Téma", "Text do grafiky"],
      [],
      undefined,
      scenarios,
    );

    expect(preview.items[0]).toMatchObject({
      storySlideCount: 3,
      storyFrames: [
        { position: 1, text: "MÁŠ DNES CHVÍLI PRO SEBE?" },
        { position: 2, text: "VOLNÉ TERMÍNY DNES" },
        { position: 3, text: "VYBER SI SVŮJ TERMÍN →" },
      ],
    });
  });

  it("finds duplicates by external id and normalized fallback key", () => {
    const existing = [
      {
        id: "existing-1",
        externalId: "content-7",
        date: "2026-10-02",
        type: "STORY",
        title: "Podzimní restart",
      },
      {
        id: "existing-2",
        date: "2026-10-07",
        type: "REEL",
        title: "Trénink v klidu",
      },
    ];
    const preview = buildPlanImportPreview(
      [
        {
          Datum: "2.10.2026",
          Formát: "Story",
          Název: "Jiný název",
          ID: "content-7",
        },
        {
          Datum: "2026-10-07",
          Formát: "Reel",
          Název: "  TRÉNINK V KLIDU ",
          ID: "",
        },
      ],
      ["Datum", "Formát", "Název", "ID"],
      existing,
      {
        date: "Datum",
        type: "Formát",
        title: "Název",
        external_id: "ID",
      },
    );

    expect(preview.duplicateCount).toBe(2);
    expect(preview.items[0]?.duplicateOf).toBe("existing-1");
    expect(preview.items[1]?.duplicateOf).toBe("existing-2");
  });

  it("never imports a published state directly", () => {
    const preview = buildPlanImportPreview(
      [
        {
          date: "2026-10-02",
          type: "Story",
          title: "Téma",
          status: "PUBLISHED",
        },
      ],
      ["date", "type", "title", "status"],
      [],
    );
    expect(preview.items[0]?.warnings).toContain(
      "Publikovaný stav byl bezpečně změněn na návrh.",
    );
  });
});
