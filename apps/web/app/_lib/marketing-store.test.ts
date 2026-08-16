import { describe, expect, it } from "vitest";

import {
  applyMarketingProposal,
  approveMonthlyPlan,
  canUndoLastMarketingAction,
  canUndoLatestImport,
  commitMonthlyPlanDraft,
  commitPlanImport,
  createMarketingState,
  monthlyPlanForMonth,
  parseMarketingState,
  summarizePlanImport,
  undoLastMarketingAction,
} from "./marketing-store";
import { createMonthlyPlanDraft } from "./monthly-plan";

const calendar = [
  {
    id: "august-3",
    date: "2026-08-07",
    type: "REEL",
    title: "5 důvodů vzít parťáka",
    state: "ready",
  },
];

describe("Marketing state", () => {
  it("uses a safe fallback for damaged persisted data", () => {
    const state = parseMarketingState("not-json", calendar);
    expect(state.calendarItems).toEqual([
      expect.objectContaining({ ...calendar[0], source: "MANUAL" }),
    ]);
    expect(state.agentMemory.textInstructions).toBeTruthy();
  });

  it("commits a proposal to shared state and audits it", () => {
    const state = applyMarketingProposal(createMarketingState(calendar), {
      id: "proposal-1",
      tool: "reschedule_content",
      args: {
        contentId: "august-3",
        from: "2026-08-07",
        to: "2026-08-09",
      },
    });

    expect(state.calendarItems[0]?.date).toBe("2026-08-09");
    expect(state.audit[0]?.action).toBe("reschedule_content");
  });

  it("restores the previous data with Undo", () => {
    const changed = applyMarketingProposal(createMarketingState(calendar), {
      id: "proposal-2",
      tool: "create_idea",
      args: { text: "Zářijová soutěž" },
    });
    const restored = undoLastMarketingAction(changed);

    expect(restored.ideas).toHaveLength(0);
    expect(restored.audit[0]?.action).toBe("undo");
    expect(canUndoLastMarketingAction(restored)).toBe(false);
  });

  it("generates and approves only the selected month", () => {
    const generated = commitMonthlyPlanDraft(
      createMarketingState(calendar),
      createMonthlyPlanDraft({ month: "2026-10" }),
    );
    const approved = approveMonthlyPlan(generated, "2026-10");

    expect(monthlyPlanForMonth(approved, "2026-10")?.status).toBe("APPROVED");
    expect(
      approved.calendarItems
        .filter((item) => item.date.startsWith("2026-10"))
        .every((item) => item.state === "planned"),
    ).toBe(true);
    expect(approved.calendarItems[0]?.state).toBe("ready");
  });

  it("commits a multi-month import as one undoable audit action", () => {
    const imported = commitPlanImport(createMarketingState(calendar), {
      fileName: "plan.xlsx",
      previewToken: "signed-preview-token",
      source: "XLSX_IMPORT",
      mode: "merge",
      resolutions: {},
      items: [
        {
          rowNumber: 2,
          date: "2026-10-02",
          type: "STORY",
          title: "Podzimní restart",
          platform: "IG Stories",
          formatLabel: "3 stories",
          storySlideCount: 3,
          graphicText: "UDĚLEJ SI ČAS PRO SEBE",
          hashtags: "#myfit #privatefitness",
          warnings: [],
        },
        {
          rowNumber: 3,
          date: "2026-11-03",
          type: "POST",
          title: "Listopad v klidu",
          warnings: [],
        },
      ],
    });

    expect(imported.importBatches[0]?.months).toEqual(["2026-10", "2026-11"]);
    expect(imported.audit[0]?.action).toBe("import_monthly_plan");
    expect(
      canUndoLatestImport(parseMarketingState(JSON.stringify(imported))),
    ).toBe(true);
    expect(
      imported.calendarItems.find((item) => item.title === "Podzimní restart"),
    ).toMatchObject({
      platform: "IG Stories",
      formatLabel: "3 stories",
      storySlideCount: 3,
      graphicText: "UDĚLEJ SI ČAS PRO SEBE",
      hashtags: "#myfit #privatefitness",
    });
    expect(undoLastMarketingAction(imported).calendarItems).toHaveLength(1);
  });

  it("requires confirmation before replacing an approved month", () => {
    const generated = commitMonthlyPlanDraft(
      createMarketingState(calendar),
      createMonthlyPlanDraft({ month: "2026-10" }),
    );
    const approved = approveMonthlyPlan(generated, "2026-10");
    const item = approved.calendarItems.find((entry) =>
      entry.date.startsWith("2026-10"),
    )!;
    const commit = {
      fileName: "replacement.csv",
      previewToken: "signed-preview-token",
      source: "CSV_IMPORT" as const,
      mode: "replace" as const,
      resolutions: { 2: "skip" as const },
      items: [
        {
          rowNumber: 2,
          date: item.date,
          type: item.type as "STORY",
          title: "Nová verze",
          duplicateOf: item.id,
          warnings: ["Možná duplicita stávající položky."],
        },
      ],
    };

    expect(() => commitPlanImport(approved, commit)).toThrow(
      "Nahrazení vyžaduje zvláštní potvrzení",
    );
    const replaced = commitPlanImport(approved, {
      ...commit,
      allowReplaceApproved: true,
    });
    expect(
      replaced.calendarItems.filter((entry) =>
        entry.date.startsWith("2026-10"),
      ),
    ).toEqual([expect.objectContaining({ title: "Nová verze" })]);
  });

  it("keeps an approved plan unchanged when every duplicate is skipped", () => {
    const generated = commitMonthlyPlanDraft(
      createMarketingState(calendar),
      createMonthlyPlanDraft({ month: "2026-10" }),
    );
    const approved = approveMonthlyPlan(generated, "2026-10");
    const octoberItems = approved.calendarItems.filter((item) =>
      item.date.startsWith("2026-10"),
    );
    const commit = {
      fileName: "same.xlsx",
      previewToken: "signed-preview-token",
      source: "XLSX_IMPORT" as const,
      mode: "merge" as const,
      resolutions: Object.fromEntries(
        octoberItems.map((_, index) => [index + 2, "skip" as const]),
      ),
      items: octoberItems.map((item, index) => ({
        rowNumber: index + 2,
        date: item.date,
        type: item.type as "STORY" | "REEL" | "POST" | "ÚKOL",
        title: item.title,
        duplicateOf: item.id,
        warnings: ["Možná duplicita stávající položky."],
      })),
    };

    expect(summarizePlanImport(commit)).toMatchObject({
      changed: 0,
      skipped: octoberItems.length,
      months: [],
    });
    const result = commitPlanImport(approved, commit);
    expect(result).toBe(approved);
    expect(monthlyPlanForMonth(result, "2026-10")).toMatchObject({
      status: "APPROVED",
      version: 1,
    });
    expect(result.audit).toHaveLength(approved.audit.length);
  });

  it("creates one new plan version when one duplicate is updated", () => {
    const generated = commitMonthlyPlanDraft(
      createMarketingState(calendar),
      createMonthlyPlanDraft({ month: "2026-10" }),
    );
    const approved = approveMonthlyPlan(generated, "2026-10");
    const item = approved.calendarItems.find((entry) =>
      entry.date.startsWith("2026-10"),
    )!;
    const result = commitPlanImport(approved, {
      fileName: "update-one.xlsx",
      previewToken: "signed-preview-token",
      source: "XLSX_IMPORT",
      mode: "merge",
      resolutions: { 2: "update" },
      items: [
        {
          rowNumber: 2,
          date: item.date,
          type: item.type as "STORY" | "REEL" | "POST" | "ÚKOL",
          title: `${item.title} · aktualizováno`,
          duplicateOf: item.id,
          warnings: ["Možná duplicita stávající položky."],
        },
      ],
    });

    expect(monthlyPlanForMonth(result, "2026-10")).toMatchObject({
      status: "DRAFT",
      version: 2,
    });
    expect(result.importBatches[0]).toMatchObject({ rowCount: 1 });
    expect(result.audit[0]).toMatchObject({ action: "import_monthly_plan" });
  });

  it("migrates the legacy September flag into a versioned plan", () => {
    const legacy = {
      ...createMarketingState(calendar),
      version: 1,
      septemberPlanApproved: true,
      calendarItems: [
        ...calendar,
        {
          id: "september-item",
          date: "2026-09-02",
          type: "STORY",
          title: "Září",
          state: "planned",
        },
      ],
    };
    delete (legacy as Partial<typeof legacy>).monthlyPlans;
    delete (legacy as Partial<typeof legacy>).planningSettings;
    delete (legacy as Partial<typeof legacy>).importBatches;
    const migrated = parseMarketingState(JSON.stringify(legacy));

    expect(migrated.version).toBe(2);
    expect(monthlyPlanForMonth(migrated, "2026-09")?.status).toBe("APPROVED");
  });
});
