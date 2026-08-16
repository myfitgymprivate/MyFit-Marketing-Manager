import { describe, expect, it } from "vitest";

import {
  contentPackageToText,
  postBenefitsPackage,
  reelPartnerPackage,
} from "./content-formats";

describe("Publishable Reel and Post packages", () => {
  it("contains a complete Reel handoff", () => {
    const exported = contentPackageToText(reelPartnerPackage);
    expect(reelPartnerPackage.script.length).toBeGreaterThanOrEqual(5);
    expect(reelPartnerPackage.shotlist.length).toBeGreaterThanOrEqual(5);
    expect(exported).toContain("ČASOVANÝ SCÉNÁŘ");
    expect(exported).toContain("CAPTION");
  });

  it("contains a complete Post handoff", () => {
    const exported = contentPackageToText(postBenefitsPackage);
    expect(postBenefitsPackage.slides).toHaveLength(4);
    expect(postBenefitsPackage.visualBrief.length).toBeGreaterThanOrEqual(5);
    expect(exported).toContain("FINÁLNÍ CAPTION");
    expect(exported).toContain("CAROUSEL – TEXTY PO STRÁNKÁCH");
    expect(exported).toContain("VIZUÁLNÍ ZADÁNÍ");
  });
});
