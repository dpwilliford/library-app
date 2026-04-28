import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateAICandidates, previewAICandidates, validateSelectedAICandidatesForSave } from "./mockAiIntake";

const userId = "librarian@library.test";

async function loadModules(dbPath: string) {
  process.env.LIBRARY_DB_PATH = dbPath;
  const db = await import("../phase2/db");
  db.resetDbForTests();
  return {
    db,
    phase3: await import("./claimsData")
  };
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
    const validation = validateSelectedAICandidatesForSave(candidates);

    expect(validation).toHaveLength(1);
    expect(validation[0]?.candidate).toEqual(candidates[0]);
    expect(tableCounts(db.getDb())).toEqual(beforeCounts);
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
