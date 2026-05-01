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
    expect(claim?.reviewedAt).toBe("");
    expect(claim?.reviewedByUserId).toBe("");
    expect(claim?.reviewNote).toBe("");
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

  it("adds source normalization fields and keeps existing source rows readable", async () => {
    const { default: DatabaseConstructor } = await import("better-sqlite3");
    const legacyDb = new DatabaseConstructor(dbPath);
    legacyDb
      .prepare(
        `CREATE TABLE sources (
          id TEXT PRIMARY KEY,
          source_title TEXT,
          source_creator TEXT,
          source_type TEXT NOT NULL,
          source_url TEXT,
          citation TEXT,
          publisher TEXT,
          publication_date TEXT,
          created_by_user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`
      )
      .run();
    legacyDb
      .prepare(
        `INSERT INTO sources
         (id, source_title, source_creator, source_type, source_url, citation, publisher, publication_date,
          created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "legacy-source",
        "Legacy Source",
        "",
        "web_page",
        " HTTPS://Example.Test/source#section ",
        " Legacy Citation. ",
        "",
        "",
        userId,
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z"
      );
    legacyDb.close();

    const { db, phase3 } = await loadModules(dbPath);
    const columns = db
      .getDb()
      .prepare("PRAGMA table_info(sources)")
      .all()
      .map((row) => String(row.name));

    expect(columns).toContain("source_reliability_note");
    expect(columns).toContain("source_access_note");
    expect(columns).toContain("normalized_source_url");
    expect(columns).toContain("normalized_citation_key");
    expect(phase3.getSource("legacy-source")).toMatchObject({
      sourceTitle: "Legacy Source",
      normalizedSourceUrl: "https://example.test/source",
      normalizedCitationKey: "legacy citation"
    });
  });

  it("normalizes source URLs and citations for duplicate candidate lookups", async () => {
    const { phase3 } = await loadModules(dbPath);

    expect(phase3.normalizeSourceUrl(" HTTPS://Example.Test/Source#details ")).toBe("https://example.test/Source");
    expect(phase3.normalizeCitationKey("  The  Citation  Text.;  ")).toBe("the citation text");

    const urlSource = phase3.createSource(
      { sourceTitle: "URL source", sourceType: "web_page", sourceUrl: "HTTPS://Example.Test/Source#details" },
      userId
    );
    const citationSource = phase3.createSource(
      { sourceTitle: "Citation source", sourceType: "book", citation: "  The  Citation  Text.;  " },
      userId
    );

    expect(urlSource).toMatchObject({
      normalizedSourceUrl: "https://example.test/Source",
      normalizedCitationKey: ""
    });
    expect(citationSource).toMatchObject({
      normalizedSourceUrl: "",
      normalizedCitationKey: "the citation text"
    });
    expect(phase3.listSourceDuplicateCandidates({ sourceUrl: "https://example.test/Source#other" }).map((source) => source.id)).toEqual([
      urlSource!.id
    ]);
    expect(phase3.listSourceDuplicateCandidates({ citation: "The Citation Text." }).map((source) => source.id)).toEqual([
      citationSource!.id
    ]);
    expect(phase3.listSourceDuplicateCandidates({})).toEqual([]);
  });

  it("does not mutate holdings or contributors when source normalization fields are written", async () => {
    const { phase2, phase3 } = await loadModules(dbPath);
    const holding = await seedHolding(phase2);
    const beforeHolding = phase2.getHolding(holding.id);
    const beforeContributors = phase2.getHoldingContributors(holding.id);

    const source = phase3.createSource(
      { sourceTitle: "Normalization integrity source", sourceType: "web_page", sourceUrl: "HTTPS://Example.Test/Integrity#note" },
      userId
    );
    phase3.updateSource(source!.id, { citation: "Integrity Citation." }, userId);

    expect(phase2.getHolding(holding.id)).toEqual(beforeHolding);
    expect(phase2.getHoldingContributors(holding.id)).toEqual(beforeContributors);
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

  it("creates claim evidence from an existing source without creating or mutating sources", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Reuse existing source claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource(
      {
        sourceTitle: "Reusable source",
        sourceCreator: "Source Creator",
        sourceType: "book",
        citation: "Reusable citation."
      },
      userId
    );
    const beforeSource = phase3.getSource(source!.id);
    const sourceCountBefore = db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count;

    const evidence = phase3.createEvidenceFromExistingSourceForClaim(
      claim!.id,
      source!.id,
      { excerpt: "New claim-specific excerpt." },
      "supports",
      userId
    );

    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      claimId: claim!.id,
      sourceId: source!.id,
      excerpt: "New claim-specific excerpt.",
      relationship: "supports"
    });
    expect(phase3.getEvidenceRecord(evidence[0].evidenceId)).toMatchObject({
      sourceId: source!.id
    });
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(sourceCountBefore);
    expect(phase3.getSource(source!.id)).toEqual(beforeSource);
  });

  it("rejects missing or nonexistent source and claim IDs before source reuse writes", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Reuse validation claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Reusable validation source", sourceType: "book" }, userId);

    expect(() =>
      phase3.createEvidenceFromExistingSourceForClaim(claim!.id, "", { excerpt: "Excerpt." }, "supports", userId)
    ).toThrow("Source is required.");
    expect(() =>
      phase3.createEvidenceFromExistingSourceForClaim(claim!.id, "missing-source", { excerpt: "Excerpt." }, "supports", userId)
    ).toThrow("Source not found.");
    expect(() =>
      phase3.createEvidenceFromExistingSourceForClaim("", source!.id, { excerpt: "Excerpt." }, "supports", userId)
    ).toThrow("Claim not found.");
    expect(() =>
      phase3.createEvidenceFromExistingSourceForClaim("missing-claim", source!.id, { excerpt: "Excerpt." }, "supports", userId)
    ).toThrow("Claim not found.");

    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(0);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(0);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(1);
  });

  it("keeps existing new-source evidence creation behavior unchanged", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "New source behavior claim.", claimType: "description", confidenceLevel: "medium" }, userId);

    const evidence = phase3.createSourceEvidenceForClaim(
      claim!.id,
      { sourceTitle: "New source path", sourceType: "book", citation: "New source citation." },
      { excerpt: "New source excerpt." },
      "supports",
      userId
    );

    expect(evidence).toHaveLength(1);
    expect(evidence[0].source).toMatchObject({
      sourceTitle: "New source path",
      sourceType: "book",
      citation: "New source citation."
    });
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM sources").get()?.count).toBe(1);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM evidence_records").get()?.count).toBe(1);
    expect(db.getDb().prepare("SELECT COUNT(*) AS count FROM claim_evidence").get()?.count).toBe(1);
  });

  it("does not mutate Phase 2 holdings, contributors, imports, or audit logs during source reuse", async () => {
    const { phase2, phase3 } = await loadModules(dbPath);
    const holding = await seedHolding(phase2);
    const beforeHolding = phase2.getHolding(holding.id);
    const beforeContributors = phase2.getHoldingContributors(holding.id);
    const beforeBatch = phase2.getImportBatch(holding.importBatchId);
    const beforeReviewRows = phase2.listImportRowsForReview();
    const beforeReviewSummary = phase2.getImportReviewSummary();
    const beforeEditLogs = phase2.getHoldingEditLogs(holding.id);
    const claim = phase3.createClaim(
      {
        claimText: "Source reuse should not mutate Phase 2 records.",
        claimType: "collection_relevance",
        confidenceLevel: "medium",
        relatedHoldingId: holding.id,
        collectionAreaId: holding.collectionAreaId
      },
      userId
    );
    const source = phase3.createSource({ sourceTitle: "Reusable Phase 2 integrity source", sourceType: "book" }, userId);

    phase3.createEvidenceFromExistingSourceForClaim(claim!.id, source!.id, { excerpt: "Integrity excerpt." }, "supports", userId);

    expect(phase2.getHolding(holding.id)).toEqual(beforeHolding);
    expect(phase2.getHoldingContributors(holding.id)).toEqual(beforeContributors);
    expect(phase2.getImportBatch(holding.importBatchId)).toEqual(beforeBatch);
    expect(phase2.listImportRowsForReview()).toEqual(beforeReviewRows);
    expect(phase2.getImportReviewSummary()).toEqual(beforeReviewSummary);
    expect(phase2.getHoldingEditLogs(holding.id)).toEqual(beforeEditLogs);
  });

  it("enforces review transitions and writes audit events", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Reviewable claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);

    expect(() => phase3.approveClaim(claim!.id, "", userId)).toThrow("Cannot change claim from draft to approved.");
    const submitted = phase3.submitClaimForReview(claim!.id, userId);
    expect(submitted?.reviewStatus).toBe("ready_for_review");
    expect(submitted?.reviewedAt).toBe("");
    expect(submitted?.reviewedByUserId).toBe("");
    expect(submitted?.reviewNote).toBe("");
    expect(() => phase3.rejectClaim(claim!.id, "", userId)).toThrow("Rejection requires a note.");
    expect(() => phase3.requestClaimRevision(claim!.id, "", userId)).toThrow("Revision request requires a note.");
    const revision = phase3.requestClaimRevision(claim!.id, "Needs more detail.", userId);
    expect(revision?.reviewStatus).toBe("needs_revision");
    expect(revision?.reviewedAt).not.toBe("");
    expect(revision?.reviewedByUserId).toBe(userId);
    expect(revision?.reviewNote).toBe("Needs more detail.");
    expect(() => phase3.approveClaim(claim!.id, "", userId)).toThrow("Cannot change claim from needs_revision to approved.");
    const resubmitted = phase3.submitClaimForReview(claim!.id, userId);
    expect(resubmitted?.reviewStatus).toBe("ready_for_review");
    expect(resubmitted?.reviewedAt).toBe("");
    expect(resubmitted?.reviewedByUserId).toBe("");
    expect(resubmitted?.reviewNote).toBe("");
    const approved = phase3.approveClaim(claim!.id, "Approved.", userId);
    expect(approved?.reviewStatus).toBe("approved");
    expect(approved?.reviewedAt).not.toBe("");
    expect(approved?.reviewedByUserId).toBe(userId);
    expect(approved?.reviewNote).toBe("Approved.");

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

    const rejected = phase3.rejectClaim(claim!.id, "Insufficient evidence.", userId);
    expect(rejected?.reviewStatus).toBe("rejected");
    expect(rejected?.reviewedAt).not.toBe("");
    expect(rejected?.reviewedByUserId).toBe(userId);
    expect(rejected?.reviewNote).toBe("Insufficient evidence.");
  });

  it("returns approved claims to needs revision after claim, evidence, or source edits", async () => {
    const { phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Approved claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Approved.", userId);

    const editedClaim = phase3.updateClaim(claim!.id, { claimText: "Edited approved claim." }, userId);
    expect(editedClaim?.reviewStatus).toBe("needs_revision");
    expect(editedClaim?.reviewedAt).toBe("");
    expect(editedClaim?.reviewedByUserId).toBe("");
    expect(editedClaim?.reviewNote).toBe("");
    expect(phase3.getClaimEvents(claim!.id).find((event) => event.action === "approved")?.note).toBe("Approved.");
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Approved again.", userId);
    phase3.updateEvidenceRecord(evidence!.id, { excerpt: "Edited excerpt." }, userId);
    expect(phase3.getClaim(claim!.id)).toMatchObject({
      reviewStatus: "needs_revision",
      reviewedAt: "",
      reviewedByUserId: "",
      reviewNote: ""
    });
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Approved again.", userId);
    phase3.updateSource(source!.id, { sourceTitle: "Edited source" }, userId);
    expect(phase3.getClaim(claim!.id)).toMatchObject({
      reviewStatus: "needs_revision",
      reviewedAt: "",
      reviewedByUserId: "",
      reviewNote: ""
    });
    expect(phase3.getClaimEvents(claim!.id).map((event) => event.action)).toContain("returned_to_revision_after_edit");
  });

  it("filters and sorts the review queue from persisted claim fields and joins", async () => {
    const { db, phase2, phase3 } = await loadModules(dbPath);
    const holding = await seedHolding(phase2);

    const draft = phase3.createClaim(
      { claimText: "Draft linked holding claim.", claimType: "description", confidenceLevel: "low", relatedHoldingId: holding.id },
      "creator-a@library.test"
    );
    const approved = phase3.createClaim(
      {
        claimText: "Approved collection area claim.",
        claimType: "teaching_relevance",
        confidenceLevel: "high",
        collectionAreaId: holding.collectionAreaId
      },
      "creator-b@library.test"
    );
    const both = phase3.createClaim(
      {
        claimText: "Ready claim with both linked context.",
        claimType: "collection_relevance",
        confidenceLevel: "medium",
        relatedHoldingId: holding.id,
        collectionAreaId: holding.collectionAreaId
      },
      "creator-a@library.test"
    );
    const neither = phase3.createClaim(
      { claimText: "No linked context claim.", claimType: "other", confidenceLevel: "medium" },
      "creator-c@library.test"
    );

    for (const claim of [approved, both, neither]) {
      const source = phase3.createSource({ sourceTitle: `Source ${claim!.id}`, sourceType: "book" }, userId);
      const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Excerpt." }, userId);
      phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);
      phase3.submitClaimForReview(claim!.id, userId);
    }
    phase3.approveClaim(approved!.id, "Queue approved.", userId);
    phase3.requestClaimRevision(neither!.id, "Queue revision.", userId);

    const database = db.getDb();
    database.prepare("UPDATE claims SET created_at = ?, updated_at = ? WHERE id = ?").run("2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", draft!.id);
    database.prepare("UPDATE claims SET created_at = ?, updated_at = ? WHERE id = ?").run("2026-01-02T00:00:00.000Z", "2026-01-04T00:00:00.000Z", approved!.id);
    database.prepare("UPDATE claims SET created_at = ?, updated_at = ? WHERE id = ?").run("2026-01-03T00:00:00.000Z", "2026-01-02T00:00:00.000Z", both!.id);

    expect(phase3.getClaimStatusCounts()).toMatchObject({ draft: 1, ready_for_review: 1, approved: 1, needs_revision: 1 });
    expect(phase3.listClaims({ reviewStatus: "approved" }).map((claim) => claim.id)).toEqual([approved!.id]);
    expect(phase3.listClaims({ confidenceLevel: "low" }).map((claim) => claim.id)).toEqual([draft!.id]);
    expect(phase3.listClaims({ claimType: "collection_relevance" }).map((claim) => claim.id)).toEqual([both!.id]);
    expect(phase3.listClaims({ collectionAreaId: holding.collectionAreaId }).map((claim) => claim.id).sort()).toEqual([approved!.id, both!.id].sort());
    expect(phase3.listClaims({ linkedContext: "holding" }).map((claim) => claim.id)).toEqual([draft!.id]);
    expect(phase3.listClaims({ linkedContext: "collection_area" }).map((claim) => claim.id)).toEqual([approved!.id]);
    expect(phase3.listClaims({ linkedContext: "both" }).map((claim) => claim.id)).toEqual([both!.id]);
    expect(phase3.listClaims({ linkedContext: "neither" }).map((claim) => claim.id)).toEqual([neither!.id]);
    expect(phase3.listClaims({ reviewedByUserId: userId }).map((claim) => claim.id).sort()).toEqual([approved!.id, neither!.id].sort());
    expect(phase3.listClaims({ createdByUserId: "creator-a@library.test" }).map((claim) => claim.id).sort()).toEqual([both!.id, draft!.id].sort());
    expect(phase3.listClaims({ search: "Watchmen" }).map((claim) => claim.id).sort()).toEqual([both!.id, draft!.id].sort());
    expect(phase3.listClaims({ sort: "oldest" }).map((claim) => claim.id).slice(0, 3)).toEqual([draft!.id, approved!.id, both!.id]);
    expect(phase3.listClaims({ sort: "recently_updated" })[0]?.id).toBe(neither!.id);
    expect(phase3.listClaims({ sort: "stale_unreviewed" })[0]?.id).toBe(both!.id);
    expect(phase3.listClaims({ sort: "review_decision" })[0]?.reviewedAt).not.toBe("");
  });

  it("does not mutate holdings or contributors during Phase 3 review-state workflows", async () => {
    const { phase2, phase3 } = await loadModules(dbPath);
    const holding = await seedHolding(phase2);
    const beforeHolding = phase2.getHolding(holding.id);
    const beforeContributors = phase2.getHoldingContributors(holding.id);
    const claim = phase3.createClaim(
      {
        claimText: "Review workflow must not mutate linked holding data.",
        claimType: "collection_relevance",
        confidenceLevel: "medium",
        relatedHoldingId: holding.id,
        collectionAreaId: holding.collectionAreaId
      },
      userId
    );
    const source = phase3.createSource({ sourceTitle: "Integrity source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Integrity excerpt." }, userId);

    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);
    phase3.submitClaimForReview(claim!.id, userId);
    phase3.approveClaim(claim!.id, "Integrity approval.", userId);
    phase3.updateClaim(claim!.id, { claimText: "Edited integrity claim." }, userId);

    expect(phase2.getHolding(holding.id)).toEqual(beforeHolding);
    expect(phase2.getHoldingContributors(holding.id)).toEqual(beforeContributors);
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
    expect(phase3.exportClaimsCsv()).toBe(exported);
  });
});
