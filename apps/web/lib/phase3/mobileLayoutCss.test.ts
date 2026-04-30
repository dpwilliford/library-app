import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase 3.4 evidence-review mobile layout guards", () => {
  it("keeps AI candidate rows in a mobile checkbox/text grid", () => {
    const globalCss = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

    expect(globalCss).toMatch(
      /\.evidence-review-workflow \.candidate-preview-row,\s+\.evidence-review-workflow \.ai-candidate-list \.candidate-preview-row \{\s+display: grid;\s+grid-template-columns: 28px minmax\(0, 1fr\);/m
    );
    expect(globalCss).not.toMatch(/\.evidence-review-workflow \.ai-candidate-list \.mock-row \{\s+display: grid;\s+grid-template-columns: 1fr;/m);
  });

  it("keeps review queue table cells labelled for mobile card layout", () => {
    const queueSource = readFileSync(join(process.cwd(), "app", "evidence-review", "page.tsx"), "utf8");

    for (const label of ["Claim", "Status", "Confidence", "Evidence", "Linked context", "Updated", "Review decision"]) {
      expect(queueSource).toContain(`data-label="${label}"`);
    }
  });
});
