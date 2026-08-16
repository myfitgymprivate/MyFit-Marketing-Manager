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
  });
});
