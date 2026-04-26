import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const fixtureRoot = join(process.cwd(), "fixtures", "phase2");

async function loadModule(dbPath: string) {
  process.env.LIBRARY_DB_PATH = dbPath;
  const db = await import("./db");
  db.resetDbForTests();
  return {
    db,
    data: await import("./collectionData")
  };
}

describe("Phase 2 collection CSV import", () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "library-phase2-"));
    dbPath = join(tempDir, "test.sqlite");
  });

  afterEach(async () => {
    const { db } = await loadModule(dbPath);
    db.resetDbForTests();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.LIBRARY_DB_PATH;
  });

  it("auto-maps record_id and imports valid rows after confirmation", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "valid-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("valid-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.mapping.externalLocalIdentifier).toBe("record_id");
    expect(preview?.rows.every((row) => row.validationStatus === "valid")).toBe(true);

    data.confirmImportBatch(batchId, "librarian@library.test");
    expect(data.listHoldings()).toHaveLength(2);
  });

  it("skips invalid rows while importing valid rows after confirmation", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "invalid-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("invalid-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.rows.filter((row) => row.validationStatus === "invalid")).toHaveLength(3);

    const result = data.confirmImportBatch(batchId, "librarian@library.test");
    expect(result?.savedCount).toBe(1);
    expect(result?.skippedCount).toBe(3);
    expect(data.listHoldings()).toHaveLength(1);
  });

  it("marks duplicate identifiers and does not import them", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "duplicate-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("duplicate-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.rows.every((row) => row.validationStatus === "duplicate")).toBe(true);

    const result = data.confirmImportBatch(batchId, "librarian@library.test");
    expect(result?.savedCount).toBe(0);
    expect(data.listHoldings()).toHaveLength(0);
  });

  it("keeps unknown collection areas as warnings and imports as unassigned", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "unknown-area-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("unknown-area-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.rows[0].validationStatus).toBe("warning");

    data.confirmImportBatch(batchId, "librarian@library.test");
    expect(data.listHoldings()[0].collectionAreaName).toBe("Unassigned");
  });

  it("preserves extra columns in raw import row data", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "extra-columns-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("extra-columns-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.rows[0].rawData.unexpected_note).toBe("Keep this raw value");
  });
});

