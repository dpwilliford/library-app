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

  it("persists confirmed holdings without requiring a later manual save", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "valid-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("valid-holdings.csv", csv, "librarian@library.test");

    data.confirmImportBatch(batchId, "librarian@library.test");

    const watchmen = data.listHoldings({ search: "Watchmen" })[0];
    expect(watchmen.title).toBe("Watchmen");
    expect(data.getHolding(watchmen.id)?.externalLocalIdentifier).toBe(watchmen.externalLocalIdentifier);
    expect(data.getHoldingEditLogs(watchmen.id)).toMatchObject([
      {
        fieldName: "created",
        newValue: "Imported from CSV preview",
        reason: "Initial import"
      }
    ]);
  });

  it("imports one structured contributor with a role", async () => {
    const { data } = await loadModule(dbPath);
    const csv = [
      "record_id,title,contributor_name,contributor_role,format,location,collection_area,publisher,publication_year,status",
      "C-001,Single Contributor Book,One Person,writer,Book,Stacks,Books / Other,Publisher,2024,Available"
    ].join("\n");
    const batchId = data.createImportPreview("one-contributor.csv", csv, "librarian@library.test");

    data.confirmImportBatch(batchId, "librarian@library.test");

    const holding = data.listHoldings({ search: "Single Contributor Book" })[0];
    expect(data.getHoldingContributors(holding.id)).toMatchObject([
      {
        name: "One Person",
        role: "writer",
        sortOrder: 1,
        source: "csv_structured"
      }
    ]);
  });

  it("imports multiple structured contributors with roles", async () => {
    const { data } = await loadModule(dbPath);
    const csv = [
      "record_id,title,contributor_1_name,contributor_1_role,contributor_2_name,contributor_2_role,format,location,collection_area,publisher,publication_year,status",
      "C-002,Structured Contributors,Alan Moore,writer,Dave Gibbons,illustrator,Book,Stacks,Comics / Graphic Novels,DC Comics,1987,Available"
    ].join("\n");
    const batchId = data.createImportPreview("structured-contributors.csv", csv, "librarian@library.test");

    data.confirmImportBatch(batchId, "librarian@library.test");

    const holding = data.listHoldings({ search: "Structured Contributors" })[0];
    expect(data.getHoldingContributors(holding.id).map(({ name, role }) => ({ name, role }))).toEqual([
      { name: "Alan Moore", role: "writer" },
      { name: "Dave Gibbons", role: "illustrator" }
    ]);
  });

  it("keeps legacy flat contributor strings while splitting names without invented roles", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "valid-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("valid-holdings.csv", csv, "librarian@library.test");

    data.confirmImportBatch(batchId, "librarian@library.test");

    const watchmen = data.listHoldings({ search: "Watchmen" })[0];
    expect(watchmen.creatorContributor).toBe("Alan Moore; Dave Gibbons");
    expect(data.getHoldingContributors(watchmen.id).map(({ name, role, source }) => ({ name, role, source }))).toEqual([
      { name: "Alan Moore", role: "", source: "legacy_flat" },
      { name: "Dave Gibbons", role: "", source: "legacy_flat" }
    ]);
  });

  it("exports contributor rows without collapsing people into one undifferentiated string", async () => {
    const { data } = await loadModule(dbPath);
    const csv = [
      "record_id,title,contributor_1_name,contributor_1_role,contributor_2_name,contributor_2_role,creator,format,location,collection_area,publisher,publication_year,status",
      "C-003,Export Contributors,Alan Moore,writer,Dave Gibbons,illustrator,Alan Moore; Dave Gibbons,Book,Stacks,Comics / Graphic Novels,DC Comics,1987,Available"
    ].join("\n");
    const batchId = data.createImportPreview("export-contributors.csv", csv, "librarian@library.test");

    data.confirmImportBatch(batchId, "librarian@library.test");

    const exported = data.exportHoldingsCsv();
    expect(exported).toContain("contributor_name");
    expect(exported).toContain("contributor_role");
    expect(exported).toContain("original_creator_contributor");
    expect(exported).toContain("Alan Moore,writer");
    expect(exported).toContain("Dave Gibbons,illustrator");
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

  it("flags messy real-world exports for review without blocking clean rows", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "messy-real-world-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("messy-real-world-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.mapping.externalLocalIdentifier).toBe("Item ID");
    expect(preview?.rows).toHaveLength(3);
    expect(preview?.rows.map((row) => row.validationStatus)).toEqual(["valid", "warning", "invalid"]);
    expect(preview?.rows[1].validationMessages).toContain("Location needs librarian review.");
    expect(preview?.rows[1].validationMessages).toContain("Status is not recognized in the Phase 2 review list.");

    const result = data.confirmImportBatch(batchId, "librarian@library.test");
    expect(result?.savedCount).toBe(2);
    expect(result?.skippedCount).toBe(1);
  });

  it("allows duplicate titles when local identifiers are distinct", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "duplicate-title-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("duplicate-title-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.rows.every((row) => row.validationStatus === "valid")).toBe(true);

    data.confirmImportBatch(batchId, "librarian@library.test");
    expect(data.listHoldings({ search: "Shared Course Reader" })).toHaveLength(2);
  });

  it("surfaces malformed short rows as missing-field review problems", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "malformed-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("malformed-holdings.csv", csv, "librarian@library.test");
    const preview = data.getImportBatch(batchId);

    expect(preview?.rows).toHaveLength(3);
    expect(preview?.rows.filter((row) => row.validationStatus === "invalid")).toHaveLength(2);
  });

  it("filters holdings and import row review queues for librarian review", async () => {
    const { data } = await loadModule(dbPath);
    const csv = readFileSync(join(fixtureRoot, "messy-real-world-holdings.csv"), "utf8");
    const batchId = data.createImportPreview("messy-real-world-holdings.csv", csv, "librarian@library.test");

    expect(data.listImportRowsForReview({ validationStatus: "warning" })).toHaveLength(1);
    expect(data.listImportRowsForReview({ validationStatus: "invalid" })).toHaveLength(1);

    data.confirmImportBatch(batchId, "librarian@library.test");

    expect(data.listImportRowsForReview({ importAction: "skipped" })).toHaveLength(1);
    expect(data.listHoldings({ status: "Available" })).toHaveLength(1);
    expect(data.listHoldings({ unassigned: true })).toHaveLength(1);
    expect(data.getImportReviewSummary()).toMatchObject({
      warningRows: 1,
      invalidRows: 1,
      skippedRows: 1,
      importedRows: 2
    });
  });
});
