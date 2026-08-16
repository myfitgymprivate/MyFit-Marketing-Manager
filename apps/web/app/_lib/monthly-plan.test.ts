import { describe, expect, it } from "vitest";

import {
  createMonthlyPlanDraft,
  planningMonthForDate,
  shouldRemindPlanApproval,
} from "./monthly-plan";

describe("monthly plan", () => {
  it("creates a reviewable plan for any month", () => {
    const result = createMonthlyPlanDraft({
      month: "2026-10",
      theme: "Podzimní klid",
      storyEveryDays: 3,
    });

    expect(result.plan.month).toBe("2026-10");
    expect(result.plan.status).toBe("READY_FOR_REVIEW");
    expect(result.items.every((item) => item.date.startsWith("2026-10"))).toBe(
      true,
    );
    expect(result.summary.stories).toBeGreaterThan(5);
    expect(result.summary.reels + result.summary.posts).toBeGreaterThan(3);
  });

  it("opens the next planning month from the configured day", () => {
    expect(planningMonthForDate("2026-09-19")).toBeNull();
    expect(planningMonthForDate("2026-09-20")).toBe("2026-10");
  });

  it("reminds only when the plan is not approved", () => {
    expect(shouldRemindPlanApproval("2026-09-25", undefined)).toBe(true);
    expect(
      shouldRemindPlanApproval("2026-09-25", {
        id: "plan",
        month: "2026-10",
        goal: "Cíl",
        theme: "Téma",
        status: "APPROVED",
        source: "AI_PLAN",
        version: 1,
        createdAt: "2026-09-20T00:00:00.000Z",
        updatedAt: "2026-09-25T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});
