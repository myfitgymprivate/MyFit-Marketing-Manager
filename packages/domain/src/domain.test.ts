import { describe, expect, it } from "vitest";

import {
  canActivateCampaign,
  canTransitionContent,
  daysSinceLocalDate,
  shouldCreateDailyOccurrence,
} from "./index";

describe("content transitions", () => {
  it("allows the standard workflow", () => {
    expect(canTransitionContent("DRAFT", "PLANNED")).toBe(true);
    expect(canTransitionContent("READY", "PUBLISHED")).toBe(true);
  });

  it("requires an explicit backfill for draft to published", () => {
    expect(canTransitionContent("DRAFT", "PUBLISHED")).toBe(false);
    expect(
      canTransitionContent("DRAFT", "PUBLISHED", { isBackfill: true }),
    ).toBe(true);
  });
});

describe("daily carry-over task", () => {
  it("counts local calendar days across the spring DST shift", () => {
    const beforeShift = new Date("2026-03-28T08:00:00Z");
    const afterShift = new Date("2026-03-30T07:00:00Z");

    expect(daysSinceLocalDate(beforeShift, afterShift, "Europe/Prague")).toBe(
      2,
    );
  });

  it("does not create a duplicate while one occurrence is open", () => {
    expect(shouldCreateDailyOccurrence(1)).toBe(false);
    expect(shouldCreateDailyOccurrence(0)).toBe(true);
  });
});

describe("campaign financial guard", () => {
  it("blocks a proposed discount until the owner confirms it", () => {
    expect(
      canActivateCampaign({
        proposedDiscountValue: 15,
        financialConfirmedAt: null,
        financialConfirmedBy: null,
      }),
    ).toBe(false);
  });

  it("allows the campaign after explicit confirmation", () => {
    expect(
      canActivateCampaign({
        proposedDiscountValue: 15,
        financialConfirmedAt: new Date("2026-08-12T10:00:00Z"),
        financialConfirmedBy: "owner-id",
      }),
    ).toBe(true);
  });
});
