import { describe, expect, it } from "vitest";
import { mockInstantiations, mockTitles } from "./mockData";
import { getInstantiationsForTitle, getMockCollectionSummary } from "./mockQueries";

describe("Phase 1.2 mock collection graph", () => {
  it("includes at least three example titles", () => {
    expect(mockTitles.length).toBeGreaterThanOrEqual(3);
  });

  it("gives each title multiple instantiations", () => {
    for (const title of mockTitles) {
      expect(getInstantiationsForTitle(title.id).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("includes owned and not-owned instantiations", () => {
    expect(mockInstantiations.some((item) => item.ownershipStatus === "owned")).toBe(true);
    expect(mockInstantiations.some((item) => item.ownershipStatus === "not_owned")).toBe(true);
  });

  it("summarizes mock data without external dependencies", () => {
    expect(getMockCollectionSummary().titleCount).toBe(mockTitles.length);
  });
});

