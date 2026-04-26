import { describe, expect, it } from "vitest";
import { hasPermission } from "./roles";

describe("role permissions", () => {
  it("allows administrators to view the dashboard", () => {
    expect(hasPermission(["administrator"], "viewDashboard")).toBe(true);
  });

  it("allows students to view placeholder pages in Phase 1", () => {
    expect(hasPermission(["student"], "viewPlaceholders")).toBe(true);
  });
});
