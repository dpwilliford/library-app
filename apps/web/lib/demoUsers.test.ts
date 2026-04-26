import { describe, expect, it } from "vitest";
import { demoUsers, findDemoUser } from "./demoUsers";

describe("demo users", () => {
  it("includes one demo user for each Phase 1 role", () => {
    expect(demoUsers.map((user) => user.role)).toEqual([
      "student",
      "professor",
      "librarian",
      "collection_area_librarian",
      "head_librarian",
      "administrator"
    ]);
  });

  it("authenticates a demo user", () => {
    expect(findDemoUser("student@library.test", "demo123")?.role).toBe("student");
  });
});

