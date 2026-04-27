import { randomUUID } from "node:crypto";
import { parseCsv, toCsv, type CsvRow } from "./csv";
import { getDb, jsonParse, nowIso, slugify } from "./db";

export type ColumnMapping = {
  externalLocalIdentifier: string;
  title: string;
  status: string;
  creatorContributor?: string;
  format?: string;
  isbn?: string;
  callNumber?: string;
  location?: string;
  collectionArea?: string;
  publisher?: string;
  publicationYear?: string;
  materialType?: string;
  acquisitionDate?: string;
  sourceSystemIdentifier?: string;
  contributorName?: string;
  contributorRole?: string;
  contributors?: string;
};

export type ImportRowPreview = {
  id: string;
  importBatchId?: string;
  importBatchFileName?: string;
  rowNumber: number;
  rawData: CsvRow;
  mappedData: MappedHoldingData;
  validationStatus: "valid" | "warning" | "invalid" | "duplicate";
  validationMessages: string[];
  importAction: "pending" | "imported" | "skipped";
  matchedHoldingId?: string;
};

export type MappedHoldingData = {
  externalLocalIdentifier: string;
  title: string;
  status: string;
  creatorContributor: string;
  format: string;
  isbn: string;
  callNumber: string;
  location: string;
  collectionArea: string;
  publisher: string;
  publicationYear: string;
  materialType: string;
  acquisitionDate: string;
  sourceSystemIdentifier: string;
  contributors: HoldingContributorInput[];
};

export type HoldingContributor = {
  id: string;
  holdingId: string;
  name: string;
  role: string;
  sortOrder: number;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type HoldingContributorInput = {
  name: string;
  role: string;
  sortOrder: number;
  source: string;
};

export type ImportBatch = {
  id: string;
  fileName: string;
  importedByUserId: string;
  createdAt: string;
  rowCount: number;
  savedCount: number;
  rejectedCount: number;
  skippedCount: number;
  status: string;
  headers: string[];
  mapping: ColumnMapping;
  rows: ImportRowPreview[];
};

export type ImportBatchSummary = Omit<ImportBatch, "headers" | "mapping" | "rows">;

export type CollectionArea = {
  id: string;
  name: string;
  description: string;
  isActive: number;
  sortOrder: number;
};

export type Holding = {
  id: string;
  externalLocalIdentifier: string;
  externalIdentifierField: string;
  sourceSystemIdentifier: string;
  title: string;
  creatorContributor: string;
  publisher: string;
  publicationYear: string;
  format: string;
  materialType: string;
  isbn: string;
  callNumber: string;
  location: string;
  status: string;
  acquisitionDate: string;
  collectionAreaId: string;
  collectionAreaName: string;
  importBatchId: string;
  createdAt: string;
  updatedAt: string;
  updatedByUserId: string;
};

export type HoldingEditLog = {
  id: string;
  holdingId: string;
  editedByUserId: string;
  editedAt: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
};

export type HoldingReviewFilters = {
  search?: string;
  unassigned?: boolean;
  status?: string;
  format?: string;
  location?: string;
};

export type ImportRowReviewFilters = {
  validationStatus?: ImportRowPreview["validationStatus"];
  importAction?: ImportRowPreview["importAction"];
};

export type ReviewFacetOptions = {
  statuses: string[];
  formats: string[];
  locations: string[];
};

const fieldAliases: Record<keyof ColumnMapping, string[]> = {
  externalLocalIdentifier: ["record_id", "record id", "item id", "item_id", "barcode", "mms id", "mms_id", "catalog id"],
  title: ["title", "title_proper"],
  status: ["status", "item_status"],
  creatorContributor: ["creator", "author", "contributor", "creator/contributor"],
  format: ["format"],
  isbn: ["isbn"],
  callNumber: ["call_number", "classification"],
  location: ["location", "permanent_location"],
  collectionArea: ["collection_area", "collection area"],
  publisher: ["publisher"],
  publicationYear: ["publication_year", "publication_date", "date"],
  materialType: ["material_type", "material type"],
  acquisitionDate: ["acquisition_date"],
  sourceSystemIdentifier: ["source_system_identifier", "mms_id", "record_id"],
  contributorName: ["contributor_name", "creator_name", "author_name"],
  contributorRole: ["contributor_role", "creator_role", "author_role"],
  contributors: ["contributors", "structured_contributors", "contributor_pairs"]
};

export function getCollectionAreas() {
  return getDb()
    .prepare("SELECT id, name, description, is_active AS isActive, sort_order AS sortOrder FROM collection_areas ORDER BY sort_order")
    .all() as CollectionArea[];
}

export function createImportPreview(fileName: string, csvText: string, userId: string) {
  const parsed = parseCsv(csvText);
  const mapping = autoMapColumns(parsed.headers);
  const batchId = randomUUID();
  const createdAt = nowIso();
  const db = getDb();

  db.prepare(
    `INSERT INTO import_batches
     (id, file_name, imported_by_user_id, created_at, row_count, status, headers_json, mapping_json)
     VALUES (?, ?, ?, ?, ?, 'previewed', ?, ?)`
  ).run(batchId, fileName, userId, createdAt, parsed.rows.length, JSON.stringify(parsed.headers), JSON.stringify(mapping));

  saveValidatedRows(batchId, parsed.rows, mapping);
  return batchId;
}

export function remapImportPreview(batchId: string, mapping: ColumnMapping) {
  const batch = getImportBatch(batchId);
  if (!batch || batch.status !== "previewed") {
    return;
  }
  const db = getDb();
  const rows = batch.rows.map((row) => row.rawData);
  db.prepare("UPDATE import_batches SET mapping_json = ? WHERE id = ?").run(JSON.stringify(mapping), batchId);
  db.prepare("DELETE FROM import_rows WHERE import_batch_id = ?").run(batchId);
  saveValidatedRows(batchId, rows, mapping);
}

export function getImportBatch(batchId: string): ImportBatch | null {
  const db = getDb();
  const batch = db.prepare("SELECT * FROM import_batches WHERE id = ?").get(batchId);
  if (!batch) {
    return null;
  }
  const rows = db
    .prepare("SELECT * FROM import_rows WHERE import_batch_id = ? ORDER BY row_number")
    .all(batchId)
    .map(rowFromDb);

  return {
    id: String(batch.id),
    fileName: String(batch.file_name),
    importedByUserId: String(batch.imported_by_user_id),
    createdAt: String(batch.created_at),
    rowCount: Number(batch.row_count),
    savedCount: Number(batch.saved_count),
    rejectedCount: Number(batch.rejected_count),
    skippedCount: Number(batch.skipped_count),
    status: String(batch.status),
    headers: jsonParse<string[]>(batch.headers_json, []),
    mapping: jsonParse<ColumnMapping>(batch.mapping_json, { externalLocalIdentifier: "", title: "", status: "" }),
    rows
  };
}

export function listImportBatches() {
  return getDb()
    .prepare("SELECT * FROM import_batches ORDER BY created_at DESC")
    .all()
    .map((batch) => ({
      id: String(batch.id),
      fileName: String(batch.file_name),
      importedByUserId: String(batch.imported_by_user_id),
      createdAt: String(batch.created_at),
      rowCount: Number(batch.row_count),
      savedCount: Number(batch.saved_count),
      rejectedCount: Number(batch.rejected_count),
      skippedCount: Number(batch.skipped_count),
      status: String(batch.status)
    })) as ImportBatchSummary[];
}

export function confirmImportBatch(batchId: string, userId: string) {
  const batch = getImportBatch(batchId);
  if (!batch || batch.status !== "previewed") {
    return null;
  }

  const db = getDb();
  const rowsToImport = batch.rows.filter((row) => row.validationStatus === "valid" || row.validationStatus === "warning");
  let savedCount = 0;
  let skippedCount = 0;
  const timestamp = nowIso();

  for (const row of batch.rows) {
    if (!rowsToImport.some((item) => item.id === row.id)) {
      skippedCount += 1;
      db.prepare("UPDATE import_rows SET import_action = 'skipped' WHERE id = ?").run(row.id);
      continue;
    }

    const existing = db
      .prepare("SELECT id FROM holdings WHERE external_local_identifier = ?")
      .get(row.mappedData.externalLocalIdentifier);

    if (existing) {
      skippedCount += 1;
      db.prepare(
        "UPDATE import_rows SET import_action = 'skipped', matched_holding_id = ?, validation_status = 'duplicate' WHERE id = ?"
      ).run(String(existing.id), row.id);
      continue;
    }

    const holdingId = randomUUID();
    const collectionAreaId = getCollectionAreaId(row.mappedData.collectionArea) || "unassigned";
    db.prepare(
      `INSERT INTO holdings (
        id, external_local_identifier, external_identifier_field, source_system_identifier, title, creator_contributor,
        publisher, publication_year, format, material_type, isbn, call_number, location, status, acquisition_date,
        collection_area_id, import_batch_id, created_at, updated_at, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      holdingId,
      row.mappedData.externalLocalIdentifier,
      batch.mapping.externalLocalIdentifier,
      row.mappedData.sourceSystemIdentifier,
      row.mappedData.title,
      row.mappedData.creatorContributor,
      row.mappedData.publisher,
      row.mappedData.publicationYear,
      row.mappedData.format,
      row.mappedData.materialType,
      row.mappedData.isbn,
      row.mappedData.callNumber,
      row.mappedData.location,
      row.mappedData.status,
      row.mappedData.acquisitionDate,
      collectionAreaId,
      batch.id,
      timestamp,
      timestamp,
      userId
    );
    db.prepare(
      `INSERT INTO holding_original_values (
        holding_id, original_raw_data_json, original_title, original_creator_contributor, original_publisher,
        original_publication_year, original_format, original_material_type, original_isbn, original_call_number,
        original_location, original_status, original_acquisition_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      holdingId,
      JSON.stringify(row.rawData),
      row.mappedData.title,
      row.mappedData.creatorContributor,
      row.mappedData.publisher,
      row.mappedData.publicationYear,
      row.mappedData.format,
      row.mappedData.materialType,
      row.mappedData.isbn,
      row.mappedData.callNumber,
      row.mappedData.location,
      row.mappedData.status,
      row.mappedData.acquisitionDate
    );
    replaceHoldingContributors(holdingId, row.mappedData.contributors, userId, "Initial import");
    insertEditLog(holdingId, userId, "created", "", "Imported from CSV preview", "Initial import");
    db.prepare("UPDATE import_rows SET import_action = 'imported', matched_holding_id = ? WHERE id = ?").run(holdingId, row.id);
    savedCount += 1;
  }

  db.prepare(
    `UPDATE import_batches
     SET saved_count = ?, skipped_count = ?, rejected_count = ?, status = ?
     WHERE id = ?`
  ).run(savedCount, skippedCount, skippedCount, skippedCount > 0 ? "partially_confirmed" : "confirmed", batch.id);

  return getImportBatch(batch.id);
}

export function listHoldings(filters: HoldingReviewFilters = {}) {
  const clauses: string[] = [];
  const values: string[] = [];

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    clauses.push(
      `(h.title LIKE ? OR h.external_local_identifier LIKE ? OR h.creator_contributor LIKE ? OR h.call_number LIKE ?
        OR EXISTS (SELECT 1 FROM holding_contributors hc WHERE hc.holding_id = h.id AND (hc.name LIKE ? OR hc.role LIKE ?)))`
    );
    values.push(search, search, search, search, search, search);
  }
  if (filters.unassigned) {
    clauses.push("(h.collection_area_id IS NULL OR h.collection_area_id = '' OR h.collection_area_id = 'unassigned')");
  }
  if (filters.status?.trim()) {
    clauses.push("h.status = ?");
    values.push(filters.status.trim());
  }
  if (filters.format?.trim()) {
    clauses.push("h.format = ?");
    values.push(filters.format.trim());
  }
  if (filters.location?.trim()) {
    clauses.push("h.location = ?");
    values.push(filters.location.trim());
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return getDb()
    .prepare(
      `SELECT h.*, ca.name AS collection_area_name
       FROM holdings h
       LEFT JOIN collection_areas ca ON ca.id = h.collection_area_id
       ${where}
       ORDER BY h.title COLLATE NOCASE`
    )
    .all(...values)
    .map(holdingFromDb);
}

export function getHoldingReviewFacets(): ReviewFacetOptions {
  const db = getDb();
  const valuesFor = (field: string) =>
    db
      .prepare(`SELECT DISTINCT ${field} AS value FROM holdings WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field}`)
      .all()
      .map((row) => String(row.value));

  return {
    statuses: valuesFor("status"),
    formats: valuesFor("format"),
    locations: valuesFor("location")
  };
}

export function listImportRowsForReview(filters: ImportRowReviewFilters = {}) {
  const clauses: string[] = [];
  const values: string[] = [];

  if (filters.validationStatus) {
    clauses.push("ir.validation_status = ?");
    values.push(filters.validationStatus);
  }
  if (filters.importAction) {
    clauses.push("ir.import_action = ?");
    values.push(filters.importAction);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return getDb()
    .prepare(
      `SELECT ir.*, ib.file_name AS import_batch_file_name
       FROM import_rows ir
       JOIN import_batches ib ON ib.id = ir.import_batch_id
       ${where}
       ORDER BY ib.created_at DESC, ir.row_number ASC
       LIMIT 50`
    )
    .all(...values)
    .map(rowFromDb);
}

export function getImportReviewSummary() {
  const rows = getDb()
    .prepare(
      `SELECT validation_status, import_action, COUNT(*) AS count
       FROM import_rows
       GROUP BY validation_status, import_action`
    )
    .all();

  const summary = {
    warningRows: 0,
    invalidRows: 0,
    duplicateRows: 0,
    skippedRows: 0,
    importedRows: 0
  };

  for (const row of rows) {
    const count = Number(row.count);
    if (row.validation_status === "warning") {
      summary.warningRows += count;
    }
    if (row.validation_status === "invalid") {
      summary.invalidRows += count;
    }
    if (row.validation_status === "duplicate") {
      summary.duplicateRows += count;
    }
    if (row.import_action === "skipped") {
      summary.skippedRows += count;
    }
    if (row.import_action === "imported") {
      summary.importedRows += count;
    }
  }

  return summary;
}

export function getImportBatchSummary(batch: ImportBatch) {
  return {
    validRows: batch.rows.filter((row) => row.validationStatus === "valid").length,
    warningRows: batch.rows.filter((row) => row.validationStatus === "warning").length,
    invalidRows: batch.rows.filter((row) => row.validationStatus === "invalid").length,
    duplicateRows: batch.rows.filter((row) => row.validationStatus === "duplicate").length,
    skippedRows: batch.rows.filter((row) => row.importAction === "skipped").length,
    importedRows: batch.rows.filter((row) => row.importAction === "imported").length,
    pendingRows: batch.rows.filter((row) => row.importAction === "pending").length
  };
}

export function describeImportRowOutcome(row: ImportRowPreview, batchStatus: string) {
  if (row.importAction === "imported") {
    return "Imported as a local holding.";
  }
  if (row.importAction === "skipped" && row.validationStatus === "duplicate") {
    return "Skipped because the local identifier is a suspected duplicate. No existing holding was overwritten.";
  }
  if (row.importAction === "skipped") {
    return "Skipped during confirmation. Review the validation messages before retrying in a later import.";
  }
  if (row.validationStatus === "duplicate") {
    return "Will be skipped until a librarian resolves the duplicate outside this import. Phase 2.2 does not overwrite holdings.";
  }
  if (row.validationStatus === "invalid") {
    return "Will be skipped unless the row is corrected and the preview is rerun.";
  }
  if (row.validationStatus === "warning") {
    return "Can import, but the warning should be reviewed before confirmation.";
  }
  if (batchStatus === "previewed") {
    return "Ready to import after explicit confirmation.";
  }
  return "No action recorded for this row.";
}

export function getHolding(id: string) {
  const row = getDb()
    .prepare(
      `SELECT h.*, ca.name AS collection_area_name
       FROM holdings h
       LEFT JOIN collection_areas ca ON ca.id = h.collection_area_id
       WHERE h.id = ?`
    )
    .get(id);
  return row ? holdingFromDb(row) : null;
}

export function getHoldingEditLogs(holdingId: string) {
  return getDb()
    .prepare("SELECT * FROM holding_edit_logs WHERE holding_id = ? ORDER BY edited_at DESC")
    .all(holdingId)
    .map((row) => ({
      id: String(row.id),
      holdingId: String(row.holding_id),
      editedByUserId: String(row.edited_by_user_id),
      editedAt: String(row.edited_at),
      fieldName: String(row.field_name),
      oldValue: String(row.old_value ?? ""),
      newValue: String(row.new_value ?? ""),
      reason: String(row.reason ?? "")
    })) as HoldingEditLog[];
}

export function getHoldingContributors(holdingId: string) {
  return getDb()
    .prepare("SELECT * FROM holding_contributors WHERE holding_id = ? ORDER BY sort_order, name COLLATE NOCASE")
    .all(holdingId)
    .map(contributorFromDb);
}

export function updateHoldingContributors(holdingId: string, contributors: HoldingContributorInput[], userId: string) {
  const current = getHoldingContributors(holdingId);
  const next = normalizeContributorInputs(contributors, "manual");
  const currentSummary = summarizeContributors(current);
  const nextSummary = summarizeContributors(next);

  if (currentSummary === nextSummary) {
    return current;
  }

  replaceHoldingContributors(holdingId, next, userId, "Manual contributor edit");
  insertEditLog(holdingId, userId, "contributors", currentSummary, nextSummary, "Manual contributor edit");
  return getHoldingContributors(holdingId);
}

export function updateHolding(
  id: string,
  values: Pick<
    Holding,
    "title" | "creatorContributor" | "format" | "isbn" | "callNumber" | "location" | "status" | "publisher" | "publicationYear"
  > & { collectionAreaId: string },
  userId: string
) {
  const current = getHolding(id);
  if (!current) {
    return null;
  }

  const updates: Array<[string, string, string]> = [
    ["title", current.title, values.title],
    ["creator_contributor", current.creatorContributor, values.creatorContributor],
    ["format", current.format, values.format],
    ["isbn", current.isbn, values.isbn],
    ["call_number", current.callNumber, values.callNumber],
    ["location", current.location, values.location],
    ["status", current.status, values.status],
    ["publisher", current.publisher, values.publisher],
    ["publication_year", current.publicationYear, values.publicationYear],
    ["collection_area_id", current.collectionAreaId, values.collectionAreaId]
  ];

  const timestamp = nowIso();
  getDb()
    .prepare(
      `UPDATE holdings
       SET title = ?, creator_contributor = ?, format = ?, isbn = ?, call_number = ?, location = ?,
           status = ?, publisher = ?, publication_year = ?, collection_area_id = ?, updated_at = ?, updated_by_user_id = ?
       WHERE id = ?`
    )
    .run(
      values.title,
      values.creatorContributor,
      values.format,
      values.isbn,
      values.callNumber,
      values.location,
      values.status,
      values.publisher,
      values.publicationYear,
      values.collectionAreaId || null,
      timestamp,
      userId,
      id
    );

  for (const [field, oldValue, newValue] of updates) {
    if ((oldValue ?? "") !== (newValue ?? "")) {
      insertEditLog(id, userId, field, oldValue ?? "", newValue ?? "", "Manual librarian edit");
    }
  }

  return getHolding(id);
}

export function exportHoldingsCsv() {
  const holdings = listHoldings();
  const rows = holdings.flatMap((holding) => {
    const contributors = getHoldingContributors(holding.id);
    const original = getHoldingOriginalCreatorContributor(holding.id);
    const contributorRows =
      contributors.length > 0
        ? contributors
        : [
            {
              name: "",
              role: "",
              source: "",
              sortOrder: 1
            }
          ];

    return contributorRows.map((contributor) => ({
      internal_system_id: holding.id,
      external_local_identifier: holding.externalLocalIdentifier,
      external_identifier_field: holding.externalIdentifierField,
      title: holding.title,
      original_creator_contributor: original || holding.creatorContributor,
      contributor_name: contributor.name,
      contributor_role: contributor.role,
      contributor_sort_order: contributor.sortOrder,
      contributor_source: contributor.source,
      format: holding.format,
      isbn: holding.isbn,
      call_number: holding.callNumber,
      location: holding.location,
      collection_area: holding.collectionAreaName,
      publisher: holding.publisher,
      publication_year: holding.publicationYear,
      status: holding.status,
      import_batch_id: holding.importBatchId,
      updated_at: holding.updatedAt
    }));
  });
  return toCsv(rows);
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping = {} as ColumnMapping;
  for (const field of Object.keys(fieldAliases) as Array<keyof ColumnMapping>) {
    const match = headers.find((header) => fieldAliases[field].includes(normalizeHeader(header)));
    if (match) {
      mapping[field] = match;
    }
  }
  return {
    ...mapping,
    externalLocalIdentifier: mapping.externalLocalIdentifier ?? "",
    title: mapping.title ?? "",
    status: mapping.status ?? ""
  };
}

export function mapRow(row: CsvRow, mapping: ColumnMapping): MappedHoldingData {
  const creatorContributor = valueAt(row, mapping.creatorContributor);
  return {
    externalLocalIdentifier: valueAt(row, mapping.externalLocalIdentifier),
    title: valueAt(row, mapping.title),
    status: valueAt(row, mapping.status),
    creatorContributor,
    format: valueAt(row, mapping.format),
    isbn: valueAt(row, mapping.isbn),
    callNumber: valueAt(row, mapping.callNumber),
    location: valueAt(row, mapping.location),
    collectionArea: valueAt(row, mapping.collectionArea),
    publisher: valueAt(row, mapping.publisher),
    publicationYear: valueAt(row, mapping.publicationYear),
    materialType: valueAt(row, mapping.materialType),
    acquisitionDate: valueAt(row, mapping.acquisitionDate),
    sourceSystemIdentifier: valueAt(row, mapping.sourceSystemIdentifier),
    contributors: extractContributors(row, mapping, creatorContributor)
  };
}

function saveValidatedRows(batchId: string, rows: CsvRow[], mapping: ColumnMapping) {
  const db = getDb();
  const mappedRows = rows.map((row) => ({ raw: row, mapped: mapRow(row, mapping) }));
  const idCounts = new Map<string, number>();
  for (const row of mappedRows) {
    const identifier = normalizeIdentifier(row.mapped.externalLocalIdentifier);
    if (identifier) {
      idCounts.set(identifier, (idCounts.get(identifier) ?? 0) + 1);
    }
  }

  mappedRows.forEach((row, index) => {
    const validation = validateMappedRow(row.mapped, idCounts);
    db.prepare(
      `INSERT INTO import_rows
       (id, import_batch_id, row_number, raw_data_json, mapped_data_json, validation_status, validation_messages_json, import_action, matched_holding_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    ).run(
      randomUUID(),
      batchId,
      index + 2,
      JSON.stringify(row.raw),
      JSON.stringify(row.mapped),
      validation.status,
      JSON.stringify(validation.messages),
      validation.matchedHoldingId ?? null
    );
  });
}

function validateMappedRow(mapped: MappedHoldingData, idCounts: Map<string, number>) {
  const messages: string[] = [];
  let status: ImportRowPreview["validationStatus"] = "valid";
  let matchedHoldingId: string | undefined;
  const identifier = normalizeIdentifier(mapped.externalLocalIdentifier);

  if (!identifier) {
    messages.push("Missing primary external local catalog identifier.");
    status = "invalid";
  }
  if (!mapped.title.trim()) {
    messages.push("Missing title.");
    status = "invalid";
  }
  if (!mapped.status.trim()) {
    messages.push("Missing status.");
    status = "invalid";
  }
  if (mapped.status.trim() && !isKnownStatus(mapped.status)) {
    messages.push("Status is not recognized in the Phase 2 review list.");
    if (status === "valid") {
      status = "warning";
    }
  }
  if (identifier && (idCounts.get(identifier) ?? 0) > 1) {
    messages.push("Duplicate identifier in this CSV.");
    status = "duplicate";
  }
  if (identifier) {
    const existing = getDb().prepare("SELECT id FROM holdings WHERE external_local_identifier = ?").get(identifier);
    if (existing) {
      messages.push("Identifier already exists in saved holdings.");
      status = "duplicate";
      matchedHoldingId = String(existing.id);
    }
  }
  if (mapped.collectionArea.trim() && !getCollectionAreaId(mapped.collectionArea)) {
    messages.push("Collection area is not in the approved seed list. This row will import as Unassigned if otherwise valid.");
    if (status === "valid") {
      status = "warning";
    }
  }
  if (mapped.publicationYear.trim() && !/^\d{4}$/.test(mapped.publicationYear.trim())) {
    messages.push("Publication year is not a four-digit year.");
    if (status === "valid") {
      status = "warning";
    }
  }
  if (mapped.format.trim() && !isKnownFormat(mapped.format)) {
    messages.push("Format is not in the Phase 2 review list. Keep it for review before relying on grouped format reports.");
    if (status === "valid") {
      status = "warning";
    }
  }
  if (mapped.location.trim() && hasSuspiciousLocation(mapped.location)) {
    messages.push("Location needs librarian review.");
    if (status === "valid") {
      status = "warning";
    }
  }

  return { status, messages, matchedHoldingId };
}

function rowFromDb(row: Record<string, unknown>): ImportRowPreview {
  return {
    id: String(row.id),
    importBatchId: row.import_batch_id ? String(row.import_batch_id) : undefined,
    importBatchFileName: row.import_batch_file_name ? String(row.import_batch_file_name) : undefined,
    rowNumber: Number(row.row_number),
    rawData: jsonParse<CsvRow>(row.raw_data_json, {}),
    mappedData: jsonParse<MappedHoldingData>(row.mapped_data_json, emptyMappedData()),
    validationStatus: String(row.validation_status) as ImportRowPreview["validationStatus"],
    validationMessages: jsonParse<string[]>(row.validation_messages_json, []),
    importAction: String(row.import_action) as ImportRowPreview["importAction"],
    matchedHoldingId: row.matched_holding_id ? String(row.matched_holding_id) : undefined
  };
}

function holdingFromDb(row: Record<string, unknown>): Holding {
  return {
    id: String(row.id),
    externalLocalIdentifier: String(row.external_local_identifier),
    externalIdentifierField: String(row.external_identifier_field),
    sourceSystemIdentifier: String(row.source_system_identifier ?? ""),
    title: String(row.title),
    creatorContributor: String(row.creator_contributor ?? ""),
    publisher: String(row.publisher ?? ""),
    publicationYear: String(row.publication_year ?? ""),
    format: String(row.format ?? ""),
    materialType: String(row.material_type ?? ""),
    isbn: String(row.isbn ?? ""),
    callNumber: String(row.call_number ?? ""),
    location: String(row.location ?? ""),
    status: String(row.status),
    acquisitionDate: String(row.acquisition_date ?? ""),
    collectionAreaId: String(row.collection_area_id ?? ""),
    collectionAreaName: String(row.collection_area_name ?? "Unassigned"),
    importBatchId: String(row.import_batch_id ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    updatedByUserId: String(row.updated_by_user_id)
  };
}

function contributorFromDb(row: Record<string, unknown>): HoldingContributor {
  return {
    id: String(row.id),
    holdingId: String(row.holding_id),
    name: String(row.name),
    role: String(row.role ?? ""),
    sortOrder: Number(row.sort_order),
    source: String(row.source),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function insertEditLog(holdingId: string, userId: string, fieldName: string, oldValue: string, newValue: string, reason: string) {
  getDb()
    .prepare(
      `INSERT INTO holding_edit_logs
       (id, holding_id, edited_by_user_id, edited_at, field_name, old_value, new_value, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(randomUUID(), holdingId, userId, nowIso(), fieldName, oldValue, newValue, reason);
}

function replaceHoldingContributors(
  holdingId: string,
  contributors: HoldingContributorInput[],
  userId: string,
  reason: string
) {
  const timestamp = nowIso();
  const normalized = normalizeContributorInputs(contributors, reason === "Initial import" ? "csv_structured" : "manual");
  const db = getDb();
  db.prepare("DELETE FROM holding_contributors WHERE holding_id = ?").run(holdingId);

  normalized.forEach((contributor, index) => {
    db.prepare(
      `INSERT INTO holding_contributors
       (id, holding_id, name, role, sort_order, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      holdingId,
      contributor.name,
      contributor.role,
      contributor.sortOrder || index + 1,
      contributor.source,
      timestamp,
      timestamp
    );
  });

  if (reason !== "Initial import") {
    db.prepare("UPDATE holdings SET updated_at = ?, updated_by_user_id = ? WHERE id = ?").run(timestamp, userId, holdingId);
  }
}

function getHoldingOriginalCreatorContributor(holdingId: string) {
  const row = getDb()
    .prepare("SELECT original_creator_contributor FROM holding_original_values WHERE holding_id = ?")
    .get(holdingId);
  return row ? String(row.original_creator_contributor ?? "") : "";
}

function getCollectionAreaId(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return slugify("Unassigned");
  }
  const row = getDb().prepare("SELECT id FROM collection_areas WHERE lower(name) = lower(?)").get(trimmed);
  return row ? String(row.id) : "";
}

function valueAt(row: CsvRow, key?: string) {
  return key ? String(row[key] ?? "").trim() : "";
}

function extractContributors(row: CsvRow, mapping: ColumnMapping, creatorContributor: string): HoldingContributorInput[] {
  const contributors: HoldingContributorInput[] = [];
  const mappedName = valueAt(row, mapping.contributorName);
  const mappedRole = valueAt(row, mapping.contributorRole);
  if (mappedName) {
    contributors.push({ name: mappedName, role: mappedRole, sortOrder: 1, source: "csv_structured" });
  }

  const structuredValue = valueAt(row, mapping.contributors);
  contributors.push(...parseDelimitedContributors(structuredValue, contributors.length + 1));
  contributors.push(...extractNumberedContributors(row, contributors.length + 1));

  if (contributors.length === 0 && creatorContributor) {
    return splitLegacyContributorString(creatorContributor);
  }

  return normalizeContributorInputs(contributors, "csv_structured");
}

function parseDelimitedContributors(value: string, startOrder: number): HoldingContributorInput[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(";")
    .map((entry, index) => {
      const [name = "", role = ""] = entry.split("|").map((part) => part.trim());
      return { name, role, sortOrder: startOrder + index, source: "csv_structured" };
    })
    .filter((contributor) => contributor.name);
}

function extractNumberedContributors(row: CsvRow, startOrder: number): HoldingContributorInput[] {
  const byNumber = new Map<string, { name?: string; role?: string }>();
  for (const [header, value] of Object.entries(row)) {
    const normalized = normalizeHeader(header);
    const match = normalized.match(/^contributor_(\d+)_(name|role)$/) ?? normalized.match(/^creator_(\d+)_(name|role)$/);
    if (!match) {
      continue;
    }
    const [, number, field] = match;
    const existing = byNumber.get(number) ?? {};
    existing[field as "name" | "role"] = value.trim();
    byNumber.set(number, existing);
  }

  return [...byNumber.entries()]
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, contributor], index) => ({
      name: contributor.name ?? "",
      role: contributor.role ?? "",
      sortOrder: startOrder + index,
      source: "csv_structured"
    }))
    .filter((contributor) => contributor.name);
}

function splitLegacyContributorString(value: string): HoldingContributorInput[] {
  return value
    .split(";")
    .map((name, index) => ({
      name: name.trim(),
      role: "",
      sortOrder: index + 1,
      source: "legacy_flat"
    }))
    .filter((contributor) => contributor.name);
}

function normalizeContributorInputs(contributors: HoldingContributorInput[], fallbackSource: string) {
  return contributors
    .map((contributor, index) => ({
      name: contributor.name.trim(),
      role: contributor.role.trim(),
      sortOrder: contributor.sortOrder || index + 1,
      source: contributor.source.trim() || fallbackSource
    }))
    .filter((contributor) => contributor.name);
}

function summarizeContributors(contributors: Array<Pick<HoldingContributorInput, "name" | "role" | "sortOrder">>) {
  return contributors
    .map((contributor) => `${contributor.sortOrder}. ${contributor.name}${contributor.role ? ` — ${contributor.role}` : ""}`)
    .join("; ");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[-\s]+/g, "_").replaceAll("__", "_");
}

function normalizeIdentifier(value: string) {
  return value.trim();
}

function isKnownStatus(value: string) {
  const allowed = ["available", "checked_out", "checked out", "in_process", "in process", "missing", "withdrawn", "unknown"];
  return allowed.includes(value.trim().toLowerCase());
}

function isKnownFormat(value: string) {
  const allowed = [
    "book",
    "books",
    "dvd",
    "film",
    "video",
    "manga",
    "comic",
    "graphic novel",
    "game",
    "video game",
    "periodical",
    "zine"
  ];
  return allowed.includes(value.trim().toLowerCase());
}

function hasSuspiciousLocation(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("??") || normalized.includes("unknown") || normalized.includes("tbd") || normalized.includes("bad location");
}

function emptyMappedData(): MappedHoldingData {
  return {
    externalLocalIdentifier: "",
    title: "",
    status: "",
    creatorContributor: "",
    format: "",
    isbn: "",
    callNumber: "",
    location: "",
    collectionArea: "",
    publisher: "",
    publicationYear: "",
    materialType: "",
    acquisitionDate: "",
    sourceSystemIdentifier: "",
    contributors: []
  };
}
