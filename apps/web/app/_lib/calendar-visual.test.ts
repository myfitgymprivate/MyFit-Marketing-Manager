import { describe, expect, it } from "vitest";

import {
  calendarVisualReady,
  createCalendarVisualRequestCopy,
  createPostCarouselSlides,
  createSeriesSlideContentKit,
  createStorySlideContentKit,
  type CalendarContentKit,
} from "./calendar-visual";

const oldSingleVisual = {
  generatedAt: "2026-08-16T10:00:00.000Z",
  mode: "demo" as const,
};

describe("calendar visual readiness", () => {
  it("ignores an old single visual after Story changes to a series", () => {
    const item = { type: "STORY", storySlideCount: 3 };

    expect(calendarVisualReady(item, oldSingleVisual)).toBe(false);
    expect(calendarVisualReady(item, oldSingleVisual, 0)).toBe(false);
    expect(calendarVisualReady(item, oldSingleVisual, 2)).toBe(false);
    expect(calendarVisualReady(item, oldSingleVisual, 3)).toBe(true);
  });

  it("uses regular visual metadata for single graphics", () => {
    expect(
      calendarVisualReady(
        { type: "POST", storySlideCount: undefined },
        oldSingleVisual,
      ),
    ).toBe(true);
  });

  it("requires every page of a Post carousel", () => {
    const item = { type: "POST", storySlideCount: undefined };

    expect(calendarVisualReady(item, oldSingleVisual, 1, 4)).toBe(false);
    expect(calendarVisualReady(item, oldSingleVisual, 3, 4)).toBe(false);
    expect(calendarVisualReady(item, oldSingleVisual, 4, 4)).toBe(true);
  });
});

describe("calendar visual request compatibility", () => {
  const longSingleStoryKit: CalendarContentKit = {
    headline: "Volné termíny",
    message: "Celé fitness jen pro tebe.",
    caption: "Vyber si svůj čas v soukromí.",
    cta: "Rezervovat termín",
    theme: "Soukromé fitness a klidný víkend".repeat(6),
    visualDirection:
      "Světlá boutique fotografie s teplým sluncem, krémovým prostorem a černými stroji. ".repeat(
        6,
      ),
    textVariants: [],
  };

  it("converts a long saved single Story kit into a valid series slide request", () => {
    const slideKit = createStorySlideContentKit(
      longSingleStoryKit,
      {
        position: 2,
        text: "SOBOTA 22. 8.\nVOLNÉ TERMÍNY ČEKAJÍ",
        direction:
          "Druhý slide, otevřené okno, jemné sluneční paprsky a kalendář jako tenká outline ikona.",
      },
      { title: "Volné termíny", totalSlides: 3 },
    );
    const requestCopy = createCalendarVisualRequestCopy(slideKit);

    expect(slideKit.visualDirection.length).toBeLessThanOrEqual(400);
    expect(slideKit.message.length).toBeLessThanOrEqual(180);
    expect(slideKit.visualDirection).toContain("Druhý slide");
    expect(requestCopy.headline.length).toBeLessThanOrEqual(160);
    expect(requestCopy.theme.length).toBeLessThanOrEqual(240);
    expect(requestCopy.theme).toContain("Druhý slide");
  });

  it("keeps the final-series CTA within the content kit contract", () => {
    const slideKit = createStorySlideContentKit(
      longSingleStoryKit,
      { position: 3, text: "UDĚLEJ SI ČAS PRO SEBE", direction: "CTA slide" },
      {
        title: "Volné termíny",
        cta: "Vyber si svůj termín v klidu a bez čekání ještě během tohoto víkendu".repeat(
          2,
        ),
        totalSlides: 3,
      },
    );

    expect(slideKit.cta.length).toBeLessThanOrEqual(60);
    expect(
      createCalendarVisualRequestCopy(slideKit).theme.length,
    ).toBeLessThanOrEqual(240);
  });
});

describe("Post carousel plan", () => {
  const kit: CalendarContentKit = {
    headline: "Tvůj prostor. Tvé tempo.",
    message: "Klid, soukromí a čas pro sebe.",
    caption: "Dopřej si trénink v klidu.",
    cta: "Vyber si svůj termín",
    theme: "Soukromé fitness",
    visualDirection: "Světlý boutique editorial",
    textVariants: [],
  };

  it("creates four concrete Canva-ready pages for an old single Post", () => {
    const slides = createPostCarouselSlides("Benefity MyFit", kit);

    expect(slides).toHaveLength(4);
    expect(slides.map((slide) => slide.position)).toEqual([1, 2, 3, 4]);
    expect(slides[0]?.role).toBe("hook");
    expect(slides[3]?.role).toBe("cta");
    expect(slides[3]?.cta).toBe("Vyber si svůj termín");
    expect(slides.every((slide) => slide.visualDirection.length > 20)).toBe(
      true,
    );
  });

  it("creates a valid visual request for every carousel page", () => {
    const slides = createPostCarouselSlides("Benefity MyFit", kit);

    for (const slide of slides) {
      const slideKit = createSeriesSlideContentKit(kit, slide, {
        title: "Benefity MyFit",
        totalSlides: slides.length,
      });
      const request = createCalendarVisualRequestCopy(slideKit);
      expect(request.headline.length).toBeLessThanOrEqual(160);
      expect(request.theme.length).toBeLessThanOrEqual(240);
    }
  });
});
