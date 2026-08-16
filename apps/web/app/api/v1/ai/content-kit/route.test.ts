import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("content kit API", () => {
  it("uses the imported monthly-plan brief in demo mode", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/ai/content-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "content-1",
          title: "Volné termíny",
          type: "STORY",
          date: "2026-09-02",
          brief: {
            platform: "IG Stories",
            formatLabel: "3 stories",
            goal: "Konverze",
            cta: "Klikni na rezervaci",
            caption: "Použít jeden odkaz na rezervační systém.",
            graphicText: "MÁŠ DNES CHVÍLI PRO SEBE?",
            visualDirection: "Světlé béžové pozadí a jemný přechod.",
          },
        }),
      }),
    );
    const body = (await response.json()) as {
      data: {
        kit: {
          headline: string;
          caption: string;
          cta: string;
          visualDirection: string;
          slides: Array<{
            position: number;
            headline: string;
            message: string;
          }>;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(body.data.kit).toMatchObject({
      headline: "MÁŠ DNES CHVÍLI PRO SEBE?",
      caption: "Použít jeden odkaz na rezervační systém.",
      cta: "Klikni na rezervaci",
      visualDirection: "Světlé béžové pozadí a jemný přechod.",
    });
    expect(body.data.kit.slides).toHaveLength(3);
    expect(body.data.kit.slides.map((slide) => slide.position)).toEqual([
      1, 2, 3,
    ]);
  });

  it("prepares four distinct pages for a Post carousel", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/ai/content-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "post-1",
          title: "Community anketa",
          type: "POST",
          date: "2026-09-08",
          brief: {
            goal: "Zapojení komunity",
            cta: "Napiš nám svůj názor",
          },
        }),
      }),
    );
    const body = (await response.json()) as {
      data: {
        kit: {
          slides: Array<{
            position: number;
            role: string;
            headline: string;
            message: string;
            visualDirection: string;
            cta?: string;
          }>;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(body.data.kit.slides).toHaveLength(4);
    expect(body.data.kit.slides.map((slide) => slide.position)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(body.data.kit.slides[0]?.role).toBe("hook");
    expect(body.data.kit.slides[3]?.role).toBe("cta");
    expect(body.data.kit.slides[3]?.cta).toBe("Napiš nám svůj názor");
    expect(
      new Set(body.data.kit.slides.map((slide) => slide.headline)).size,
    ).toBeGreaterThan(2);
  });
});
