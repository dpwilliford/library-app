import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { canManageEvidence } from "./permissions";
import { generateAICandidates, previewAICandidates, saveSelectedAICandidatesAsDraftRecords, validateSelectedAICandidatesForSave } from "./mockAiIntake";

const userId = "librarian@library.test";
const fixtureRoot = join(process.cwd(), "fixtures", "phase2");

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

describe("Phase 3.3 mock AI intake candidate boundaries", () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "library-phase33-"));
    dbPath = join(tempDir, "test.sqlite");
  });

  afterEach(async () => {
    const { db } = await loadModules(dbPath);
    db.resetDbForTests();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.LIBRARY_DB_PATH;
  });

  it("uses existing evidence manager permissions for AI intake UI access", () => {
    expect(canManageEvidence("librarian")).toBe(true);
    expect(canManageEvidence("collection_area_librarian")).toBe(true);
    expect(canManageEvidence("head_librarian")).toBe(true);
    expect(canManageEvidence("administrator")).toBe(true);
    expect(canManageEvidence("student")).toBe(false);
    expect(canManageEvidence("professor")).toBe(false);
  });

  it("generates deterministic non-record preview candidates without IDs or review state", () => {
    const rawText = [
      'Course note: "Watchmen is frequently assigned in comics history courses." https://example.test/watchmen',
      "",
      "Collection gap note: Spirited Away supports animation studies context and needs source cleanup."
    ].join("\n");

    const first = generateAICandidates(rawText);
    const second = previewAICandidates(rawText);

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first[0]).toMatchObject({
      candidateClaimKind: "candidate_teaching_relevance",
      candidateConfidenceHint: "candidate_high",
      candidateSourceLocator: "https://example.test/watchmen",
      candidateEvidenceLink: "candidate_supports"
    });
    expect(JSON.stringify(first)).not.toMatch(/"id"|"claimId"|"sourceId"|"evidenceId"|"reviewStatus"|"review_status"|"claimEventId"/);
    for (const candidate of first) {
      expect(Object.keys(candidate).every((key) => key.startsWith("candidate"))).toBe(true);
    }
  });

  it("does not insert, update, or expose data through Phase 3 queries, events, or export", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const claim = phase3.createClaim({ claimText: "Existing claim.", claimType: "description", confidenceLevel: "medium" }, userId);
    const source = phase3.createSource({ sourceTitle: "Existing source", sourceType: "book" }, userId);
    const evidence = phase3.createEvidenceRecord({ sourceId: source!.id, excerpt: "Existing excerpt." }, userId);
    phase3.attachEvidenceToClaim(claim!.id, evidence!.id, "supports", userId);

    const beforeCounts = tableCounts(db.getDb());
    const beforeQueue = phase3.listClaims();
    const beforeStatusCounts = phase3.getClaimStatusCounts();
    const beforeEvents = phase3.getClaimEvents(claim!.id);
    const beforeExport = phase3.exportClaimsCsv();

    const candidates = generateAICandidates(
      'Preview only: "This text should never become a record during preview." https://example.test/preview'
    );

    expect(candidates).toHaveLength(1);
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
    expect(phase3.listClaims()).toEqual(beforeQueue);
    expect(phase3.getClaimStatusCounts()).toEqual(beforeStatusCounts);
    expect(phase3.getClaimEvents(claim!.id)).toEqual(beforeEvents);
    expect(phase3.exportClaimsCsv()).toBe(beforeExport);
  });

  it("keeps selected-candidate validation separate from persistence", async () => {
    const { db } = await loadModules(dbPath);
    const beforeCounts = tableCounts(db.getDb());
    const candidates = generateAICandidates("Short note without a source.");
    const validation = validateSelectedAICandidatesForSave(candidates, { email: userId, role: "librarian" });

    expect(validation).toHaveLength(1);
    expect(validation[0]?.candidate).toEqual(candidates[0]);
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
  });

  it("saves selected candidates only and leaves unselected previews non-persistent", async () => {
    const { db, phase3 } = await loadModules(dbPath);
    const candidates = generateAICandidates(
      [
        'Course note: "Selected candidate should become a draft." https://example.test/selected',
        "",
        'Collection note: "Unselected candidate should remain preview only." https://example.test/unselected'
      ].join("\n")
    );
    const beforeCounts = tableCounts(db.getDb());
    const beforeExport = phase3.exportClaimsCsv();

    const saved = saveSelectedAICandidatesAsDraftRecords([candidates[0]!], { email: userId, role: "librarian" });

    expect(saved).toHaveLength(1);
    expect(tableCounts(db.getDb()).claims).toBe(beforeCounts.claims + 1);
    expect(phase3.listClaims().map((claim) => claim.claimText)).toContain("Course note: \"Selected candidate should become a draft.");
    expect(phase3.listClaims().map((claim) => claim.claimText)).not.toContain("Collection note: \"Unselected candidate should remain preview only.");
    expect(phase3.exportClaimsCsv()).not.toBe(beforeExport);
    expect(phase3.exportClaimsCsv()).toContain("Selected candidate should become a draft");
    expect(phase3.exportClaimsCsv()).not.toContain("Unselected candidate should remain preview only");
  });

  it.each([
    ["librarian", "librarian@library.test"],
    ["collection_area_librarian", "area@library.test"],
    ["head_librarian", "head@library.test"],
    ["administrator", "admin@library.test"]
  ])("saves selected candidates as Phase 3 draft records for %s users", async (role, email) => {
    const { db, phase3 } = await loadModules(dbPath);
    const candidates = generateAICandidates(
      'Course note: "Watchmen is frequently assigned in comics history courses." https://example.test/watchmen'
    );
    const beforeCounts = tableCounts(db.getDb());
    const beforeExport = phase3.exportClaimsCsv();

    const saved = saveSelectedAICandidatesAsDraftRecords(candidates, { email, role });

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      claimText: "Course note: \"Watchmen is frequently assigned in comics history courses.",
      claimType: "teaching_relevance",
      confidenceLevel: "high",
      reviewStatus: "draft",
      evidenceCount: 1,
      reviewedAt: "",
      reviewedByUserId: "",
      reviewNote: ""
    });
    expect(tableCounts(db.getDb())).toMatchObject({
      claims: beforeCounts.claims + 1,
      sources: beforeCounts.sources + 1,
      evidence_records: beforeCounts.evidence_records + 1,
      claim_evidence: beforeCounts.claim_evidence + 1,
      claim_events: beforeCounts.claim_events + 3
    });
    expect(phase3.listClaims({ reviewStatus: "draft" }).map((claim) => claim.id)).toContain(saved[0]!.id);
    expect(phase3.exportClaimsCsv()).not.toBe(beforeExport);
    expect(phase3.exportClaimsCsv()).toContain(saved[0]!.id);
    expect(phase3.getEvidenceForClaim(saved[0]!.id)[0]).toMatchObject({
      relationship: "supports",
      excerpt: "Watchmen is frequently assigned in comics history courses.",
      source: {
        sourceTitle: "Course note: \"Watchmen is frequently assigned in comics history courses.\"",
        sourceType: "web_page",
        sourceUrl: "https://example.test/watchmen"
      }
    });
    expect(phase3.getClaimEvents(saved[0]!.id).map((event) => event.action)).toEqual(["created", "evidence_attached"]);
    expect(
      db
        .getDb()
        .prepare("SELECT action FROM claim_events WHERE entity_type = 'source'")
        .all()
        .map((row) => row.action)
    ).toEqual(["source_created"]);
  });

  it("rejects student and professor save attempts before any database write", async () => {
    const { db } = await loadModules(dbPath);
    const candidates = generateAICandidates('Preview: "Evidence text." https://example.test/source');
    const beforeCounts = tableCounts(db.getDb());

    for (const role of ["student", "professor"]) {
      expect(() => saveSelectedAICandidatesAsDraftRecords(candidates, { email: `${role}@library.test`, role })).toThrow(
        "Only evidence manager roles can save AI intake candidates."
      );
    }

    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
  });

  it("rejects malformed candidates and candidates that assume record IDs", async () => {
    const { db } = await loadModules(dbPath);
    const beforeCounts = tableCounts(db.getDb());
    const malformed = [
      {
        id: "not-a-record-id",
        candidateClaimText: "",
        candidateClaimKind: "candidate_description",
        candidateConfidenceHint: "candidate_medium",
        candidateSourceLabel: "",
        candidateSourceLocator: "",
        candidateEvidenceText: "",
        candidateEvidenceLink: "candidate_supports",
        candidateUncertaintyNote: "Malformed."
      }
    ];

    const validation = validateSelectedAICandidatesForSave(malformed as never, { email: userId, role: "librarian" });

    expect(validation[0]?.isValidForSave).toBe(false);
    expect(validation[0]?.validationMessages).toContain("Candidate must not include record field id.");
    expect(validation[0]?.validationMessages).toContain("Candidate requires claim text before save.");
    expect(validation[0]?.validationMessages).toContain("Candidate requires evidence text before save.");
    expect(() => saveSelectedAICandidatesAsDraftRecords(malformed as never, { email: userId, role: "librarian" })).toThrow(
      "Candidate must not include record field id."
    );
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
  });

  it("rejects duplicate selected candidate payloads before any database write", async () => {
    const { db } = await loadModules(dbPath);
    const candidates = generateAICandidates('Course note: "Duplicate payload should not save twice." https://example.test/duplicate');
    const beforeCounts = tableCounts(db.getDb());

    const validation = validateSelectedAICandidatesForSave([candidates[0]!, candidates[0]!], { email: userId, role: "librarian" });

    expect(validation[1]?.isValidForSave).toBe(false);
    expect(validation[1]?.validationMessages).toContain("Duplicate selected AI intake candidate.");
    expect(() => saveSelectedAICandidatesAsDraftRecords([candidates[0]!, candidates[0]!], { email: userId, role: "librarian" })).toThrow(
      "Duplicate selected AI intake candidate."
    );
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
  });

  it("rejects non-text selected candidate fields before any database write", async () => {
    const { db } = await loadModules(dbPath);
    const beforeCounts = tableCounts(db.getDb());
    const malformed = {
      candidateClaimText: "Malformed candidate must not create a partial claim.",
      candidateClaimKind: "candidate_description",
      candidateConfidenceHint: "candidate_medium",
      candidateSourceLabel: "Source label is text",
      candidateSourceLocator: 123,
      candidateEvidenceText: "Evidence text is present.",
      candidateEvidenceLink: "candidate_supports",
      candidateUncertaintyNote: "Malformed source locator."
    };

    const validation = validateSelectedAICandidatesForSave([malformed as never], { email: userId, role: "librarian" });

    expect(validation[0]?.isValidForSave).toBe(false);
    expect(validation[0]?.validationMessages).toContain("Candidate candidateSourceLocator must be text.");
    expect(() => saveSelectedAICandidatesAsDraftRecords([malformed as never], { email: userId, role: "librarian" })).toThrow(
      "Candidate candidateSourceLocator must be text."
    );
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
  });

  it("does not mutate holdings or contributors when selected candidates are saved", async () => {
    const { db, phase2 } = await loadModules(dbPath);
    const holding = await seedHolding(phase2);
    const beforeHolding = phase2.getHolding(holding.id);
    const beforeContributors = phase2.getHoldingContributors(holding.id);
    const beforeCounts = tableCounts(db.getDb());
    const candidates = generateAICandidates('Collection note: "This save must not edit holdings." https://example.test/holding');

    saveSelectedAICandidatesAsDraftRecords(candidates, { email: userId, role: "librarian" });

    expect(phase2.getHolding(holding.id)).toEqual(beforeHolding);
    expect(phase2.getHoldingContributors(holding.id)).toEqual(beforeContributors);
    expect(tableCounts(db.getDb()).holdings).toBe(beforeCounts.holdings);
    expect(tableCounts(db.getDb()).holding_contributors).toBe(beforeCounts.holding_contributors);
  });

  it("does not contain an OpenAI API call in Phase 3.3 intake code", () => {
    const intakeSource = readFileSync(join(process.cwd(), "lib", "phase3", "mockAiIntake.ts"), "utf8");
    const pageSource = readFileSync(join(process.cwd(), "app", "evidence-review", "ai-draft", "page.tsx"), "utf8");
    const actionSource = readFileSync(join(process.cwd(), "app", "evidence-review", "ai-draft", "actions.ts"), "utf8");

    expect(`${intakeSource}\n${pageSource}\n${actionSource}`).not.toMatch(/openai|api\.openai|fetch\(/i);
  });

  it("returns no candidates for blank input without touching the database", async () => {
    const { db } = await loadModules(dbPath);
    const beforeCounts = tableCounts(db.getDb());

    expect(generateAICandidates(" \n\t ")).toEqual([]);
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
  });
});

function tableCounts(database: ReturnType<(typeof import("../phase2/db"))["getDb"]>) {
  return Object.fromEntries(
    [
      "claims",
      "sources",
      "evidence_records",
      "claim_evidence",
      "claim_events",
      "holdings",
      "holding_contributors",
      "import_batches",
      "import_rows"
    ].map((table) => [table, Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count)])
  );
}
