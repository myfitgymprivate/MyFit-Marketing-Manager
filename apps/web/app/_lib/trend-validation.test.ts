import { describe, expect, it } from "vitest";

import { isValidTrendSource, trendFreshnessLabel } from "./trend-validation";

describe("Trend source validation", () => {
  it("requires an http or https source", () => {
    expect(isValidTrendSource("")).toBe(false);
    expect(isValidTrendSource("instagram trend")).toBe(false);
    expect(isValidTrendSource("https://example.com/trend")).toBe(true);
  });

  it("marks old trends as stale", () => {
    expect(
      trendFreshnessLabel(
        "2026-07-01T10:00:00.000Z",
        new Date("2026-08-14T10:00:00.000Z"),
      ),
    ).toContain("Neaktuální");
  });
});
