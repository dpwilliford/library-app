import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const fixtureRoot = join(process.cwd(), "fixtures", "phase2");
const userId = "librarian@library.test";

async function loadModules(dbPath: string) {
  process.env.LIBRARY_DB_PATH = dbPath;
  const db = await import("../phase2/db");
  db.resetDbForTests();
  return {
    db,
    phase2: await import("../phase2/collectionData"),
    phase3: await import("./claimsData")
  };
}

async function seedHolding(phase2: Awaited<ReturnType<typeof loadModules>>["phase2"]) {
  const csv = readFileSync(join(fixtureRoot, "valid-holdings.csv"), "utf8");
  const batchId = phase2.createImportPreview("valid-holdings.csv", csv, userId);
  phase2.confirmImportBatch(batchId, userId);
  return phase2.listHoldings({ search: "Watchmen" })[0];
}

describe("Phase 3.1 manual claims and evidence data layer", () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "library-phase3-"));
    dbPath = join(tempDir, "test.sqlite");
  });

  afterEach(async () => {
    const { db } = await loadModules(dbPath);
    db.resetDbForTests();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.LIBRARY_DB_PATH;
  });

  it("creates a draft claim and validates claim fields", async () => {
    const { phase3 } = await loadModules(dbPath);

    const claim = phase3.createClaim(
      { claimText: "Important teaching context.", claimType: "teaching_relevance", confidenceLevel: "medium" },
      userId
    );

    expect(claim?.reviewStatus).toBe("draft");
    expect(() => phase3.createClaim({ claimText: " ", claimType: "description", confidenceLevel: "low" }, userId)).toThrow(
      "Claim text is required."
    );
    expect(() => phase3.createClaim({ claimText: "Valid", claimType: "bad", confidenceLevel: "low" }, userId)).toThrow(
      "Invalid claim type."
    );
    expect(() => phase3.createClaim({ claimText: "Valid", claimType: "description", confidenceLevel: "bad" }, userId)).toThrow(
      "Invalid confidence level."
    );
    expect(() => phase3.assertAllowedTransition("draft", "bad")).toThrow("Invalid review status.");
  });

  it("links claims to holdings and collection areas without mutating Phase 2 data", async () => {
    const { phase2, phase3 } = await loadModules(dbPath);
    const holding = await seedHolding(phase2);
    const beforeHolding = phase2.getHolding(holding.id);
    const beforeContributors = phase2.getHoldingContributors(holding.id);

    const claim = phase3.createClaim(
      {
        claimText: "Watchmen has local linked context.",
        claimType: "description",
        confidenceLevel: "high",
        relatedHoldingId: holding.id,
        collectionAreaId: holding.collectionAreaId
      },
      userId
    );

    expect(claim?.relatedHoldingId).toBe(holding.id);
    expect(claim?.collectionAreaId).toBe(holding.collectionAreaId);
    expect(phase2.getHolding(holding.id)).toEqual(beforeHolding);
    expect(phase2.getHoldingContributors(holding.id)).toEqual(beforeContributors);
  });

  it("validates sources and evidence, including date accessed for web source types", async () => {
    const { phase3 } = await loadModules(dbPath);

    expect(() => phase3.createSource({ sourceType: "book" }, userId)).toThrow("Source requires a title, URL, or citation.");
    const book = phase3.createSource({ sourceTitle: "Book source", sourceType: "book" }, userId);
    expect(book?.sourceType).toBe("book");
    expect(() => phase3.createEvidenceRecord({ sourceId: book!.id }, userId)).toThrow(
      "Evidence requires an excerpt or supporting data."
    );
    expect(phase3.createEvidenceRecord({ sourceId: book!.id, excerpt: "Useful excerpt." }, userId)?.dateAccessed).toBe("");

    const web = phase3.createSource({ sourceUrl: "https://example.test/source", sourceType: "web_page" }, userId);
    expect(() => phase3.createEvidenceRecord({ sourceId: web!.id, excerpt: "Web excerpt." }, userId)).toThrow(
      "Web and publisher page evidence requires date accessed."
    );
    const publisher = phase3.createSource({ sourceTitle: "Publisher", sourceType: "publisher_page" }, userId);
    expect(() => phase3.createEvidenceRecord({ sourceId: publisher!.id, excerpt: "Publisher excerpt." }, userId)).toThrow(
      "Web and publisher page evidence requires date accessed."
    );
  });

  it("attaches evidence, enforces unique links, and blocks submit without evidence", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Evidence-backed claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Catalog note", sourceType: "catalog" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, supportingData: "Catalog row." }, userId);
    const emptyClaim = phase3.createClaim({ claimText: "Empty evidence claim.", claimType: "description", confidenceLevel: "low" }, userId);

    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);

    expect(phase3.getEvidenceForClaim(claim!.id)).toHaveLength(1);
    expect(() => phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId)).toThrow();
    expect(() => phase3.submitClaimForReview(emptyClaim!.id, userId)).toThrow("Claim requires evidence before review.");
  });

  it("rolls back source and evidence creation when claim linking fails", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Atomic claim.", claimType: "description", confidenceLevel: "medium" }, userId);

    expect(() =>
      phase3.createSourceEvidenceForClaim(
        claim!.id,
        { sourceTitle: "Atomic source", sourceType: "book" },
        { excerpt: "Valid excerpt." },
        "invalid_relationship",
        userId
      )
    ).toThrow("Invalid evidence relationship.");

    const database = db.getDb();
    expect(database.prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(0);
    expect(database.prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(0);
    expect(database.prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(0);
    expect(database.prepare("SELECT COUNT(*) AS count FROM claim_events WHERE action = 'source_created'").get()?.count).toBe(0);
  });

  it("enforces review transitions and writes audit events", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Reviewable claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);

    expect(() => phase3.approveClaim(claim!.id, "", userId)).toThrow("Cannot change claim from draft to approved.");
    expect(phase3.submitClaimForReview(claim!.id, userId)?.reviewStatus).toBe("ready_for_review");
    expect(() => phase3.rejectClaim(claim!.id, "", userId)).toThrow("Rejection requires a note.");
    expect(() => phase3.requestClaimRevision(claim!.id, "", userId)).toThrow("Revision request requires a note.");
    expect(phase3.requestClaimRevision(claim!.id, "Needs more detail.", userId)?.reviewStatus).toBe("needs_revision");
    expect(() => phase3.approveClaim(claim!.id, "", userId)).toThrow("Cannot change claim from needs_revision to approved.");
    expect(phase3.submitClaimForReview(claim!.id, userId)?.reviewStatus).toBe("ready_for_review");
    expect(phase3.approveClaim(claim!.id, "Approved.", userId)?.reviewStatus).toBe("approved");

    const actions = phase3.getClaimEvents(claim!.id).map((event) => event.action);
    expect(actions).toContain("submitted_for_review");
    expect(actions).toContain("revision_requested");
    expect(actions).toContain("approved");
  });

  it("allows ready claims to be rejected with a reason", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Rejectable claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);
    phase3.submitClaimForReview(claim!.id, userId);

    expect(phase3.rejectClaim(claim!.id, "Insufficient evidence.", userId)?.reviewStatus).toBe("rejected");
  });

  it("returns approved claims to needs revision after claim, evidence, or source edits", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Approved claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Approved.", userId);

    expect(phase3.updateClaim(claim!.id, { claimText: "Edited approved claim." }, userId)?.reviewStatus).toBe("needs_revision");
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Approved again.", userId);
    phase3.updateEvidenceRecord(evidence!.id, { excerpt: "Edited excerpt." }, userId);
    expect(phase3.getClaim(claim!.id)?.reviewStatus).toBe("needs_revision");
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Approved again.", userId);
    phase3.updateSource(source!.id, { sourceTitle: "Edited source" }, userId);
    expect(phase3.getClaim(claim!.id)?.reviewStatus).toBe("needs_revision");
    expect(phase3.getClaimEvents(claim!.id).map((event) => event.action)).toContain("returned_to_revision_after_edit");
  });

  it("exports claims, sources, evidence, links, and review state", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Exported claim.", claimType: "description", confidenceLevel: "high" }, userId);
    const source = phase3.createSource({ sourceTitle: "Export source", sourceType: "book", citation: "Citation" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Export excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);
    phase3.submitClaimForReview(claim!.id, userId);

    const exported = phase3.exportClaimsCsv();

    expect(exported).toContain("claim_id");
    expect(exported).toContain("source_id");
    expect(exported).toContain("evidence_id");
    expect(exported).toContain("relationship");
    expect(exported).toContain("ready_for_review");
    expect(exported).toContain("Export source");
  });
});
