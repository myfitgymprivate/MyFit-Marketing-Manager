import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { POST as commitPost } from "./commit/route";
import { POST as previewPost } from "./preview/route";

describe("plan import API", () => {
  it("previews Czech CSV and verifies the exact payload", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(
        [
          "Datum,Formát,Název,Cíl\n2.10.2026,Story,Podzimní restart,Akvizice\n7.10.2026,Reel,Trénink v klidu,Komfort",
        ],
        "plan.csv",
        { type: "text/csv" },
      ),
    );
    formData.set("existingItems", "[]");
    const previewResponse = await previewPost(
      new Request("http://localhost/api/v1/plan-imports/preview", {
        method: "POST",
        body: formData,
      }),
    );
    const previewBody = (await previewResponse.json()) as {
      data: {
        previewToken: string;
        preview: { errors: Array<{ rowNumber: number; message: string }> };
        payload: Record<string, unknown> & {
          items: Array<{ date: string; type: string }>;
        };
      };
    };

    expect(previewResponse.status).toBe(200);
    expect(
      previewBody.data.payload.items,
      JSON.stringify(previewBody.data.preview.errors),
    ).toHaveLength(2);
    expect(previewBody.data.payload.items[0]).toMatchObject({
      date: "2026-10-02",
      type: "STORY",
    });

    const commitResponse = await commitPost(
      new Request("http://localhost/api/v1/plan-imports/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewToken: previewBody.data.previewToken,
          payload: previewBody.data.payload,
        }),
      }),
    );
    expect(commitResponse.status).toBe(200);
  });

  it("rejects a payload changed after preview", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["date,type,title\n2026-10-02,Story,Téma"], "plan.csv"),
    );
    const previewResponse = await previewPost(
      new Request("http://localhost/api/v1/plan-imports/preview", {
        method: "POST",
        body: formData,
      }),
    );
    const previewBody = (await previewResponse.json()) as {
      data: { previewToken: string; payload: Record<string, unknown> };
    };
    const changedPayload = {
      ...previewBody.data.payload,
      fileName: "changed.csv",
    };
    const commitResponse = await commitPost(
      new Request("http://localhost/api/v1/plan-imports/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewToken: previewBody.data.previewToken,
          payload: changedPayload,
        }),
      }),
    );

    expect(commitResponse.status).toBe(409);
  });

  it("reads an XLSX workbook and selected sheet", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["Datum", "Typ", "Téma"],
        ["3.11.2026", "Post", "Listopad v soukromí"],
      ]),
      "Listopad",
    );
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const formData = new FormData();
    formData.set("file", new File([bytes], "plan.xlsx"));
    formData.set("sheetName", "Listopad");
    const response = await previewPost(
      new Request("http://localhost/api/v1/plan-imports/preview", {
        method: "POST",
        body: formData,
      }),
    );
    const body = (await response.json()) as {
      data: { payload: { items: Array<{ date: string; type: string }> } };
    };

    expect(response.status).toBe(200);
    expect(body.data.payload.items[0]).toMatchObject({
      date: "2026-11-03",
      type: "POST",
    });
  });

  it("attaches matching rows from the Stories scénáře sheet", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["Datum", "Platforma", "Formát", "Téma"],
        [46267, "IG Stories", "3 stories", "Volné termíny"],
      ]),
      "Září 2026",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["Scénář", "Slide", "Účel", "Vizuál", "Text do grafiky"],
        ["Volné termíny", 1, "Zaujmout", "Studio", "TEASER"],
        ["Volné termíny", 2, "Informovat", "Časy", "TERMÍNY"],
        ["Volné termíny", 3, "Konverze", "CTA", "REZERVUJ"],
      ]),
      "Stories scénáře",
    );
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const formData = new FormData();
    formData.set("file", new File([bytes], "plan.xlsx"));
    const response = await previewPost(
      new Request("http://localhost/api/v1/plan-imports/preview", {
        method: "POST",
        body: formData,
      }),
    );
    const body = (await response.json()) as {
      data: {
        payload: {
          items: Array<{
            storySlideCount?: number;
            storyFrames?: Array<{ position: number; text: string }>;
          }>;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(body.data.payload.items[0]).toMatchObject({
      storySlideCount: 3,
      storyFrames: [
        { position: 1, text: "TEASER" },
        { position: 2, text: "TERMÍNY" },
        { position: 3, text: "REZERVUJ" },
      ],
    });
  });
});
