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
};

export type ImportRowPreview = {
  id: string;
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

const fieldAliases: Record<keyof ColumnMapping, string[]> = {
  externalLocalIdentifier: ["record_id", "record id", "item id", "item_id", "barcode", "mms id", "mms_id", "catalog id"],
  title: ["title", "title proper"],
  status: ["status", "item status", "item_status"],
  creatorContributor: ["creator", "author", "contributor", "creator/contributor"],
  format: ["format"],
  isbn: ["isbn"],
  callNumber: ["call_number", "call number", "classification"],
  location: ["location", "permanent location"],
  collectionArea: ["collection_area", "collection area"],
  publisher: ["publisher"],
  publicationYear: ["publication_year", "publication year", "publication date", "date"],
  materialType: ["material_type", "material type"],
  acquisitionDate: ["acquisition_date", "acquisition date"],
  sourceSystemIdentifier: ["source_system_identifier", "source system identifier", "mms id", "mms_id", "record id"]
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

export function listHoldings() {
  return getDb()
    .prepare(
      `SELECT h.*, ca.name AS collection_area_name
       FROM holdings h
       LEFT JOIN collection_areas ca ON ca.id = h.collection_area_id
       ORDER BY h.title COLLATE NOCASE`
    )
    .all()
    .map(holdingFromDb);
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
  return toCsv(
    holdings.map((holding) => ({
      internal_system_id: holding.id,
      external_local_identifier: holding.externalLocalIdentifier,
      external_identifier_field: holding.externalIdentifierField,
      title: holding.title,
      creator: holding.creatorContributor,
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
    }))
  );
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
  return {
    externalLocalIdentifier: valueAt(row, mapping.externalLocalIdentifier),
    title: valueAt(row, mapping.title),
    status: valueAt(row, mapping.status),
    creatorContributor: valueAt(row, mapping.creatorContributor),
    format: valueAt(row, mapping.format),
    isbn: valueAt(row, mapping.isbn),
    callNumber: valueAt(row, mapping.callNumber),
    location: valueAt(row, mapping.location),
    collectionArea: valueAt(row, mapping.collectionArea),
    publisher: valueAt(row, mapping.publisher),
    publicationYear: valueAt(row, mapping.publicationYear),
    materialType: valueAt(row, mapping.materialType),
    acquisitionDate: valueAt(row, mapping.acquisitionDate),
    sourceSystemIdentifier: valueAt(row, mapping.sourceSystemIdentifier)
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

  return { status, messages, matchedHoldingId };
}

function rowFromDb(row: Record<string, unknown>): ImportRowPreview {
  return {
    id: String(row.id),
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

function insertEditLog(holdingId: string, userId: string, fieldName: string, oldValue: string, newValue: string, reason: string) {
  getDb()
    .prepare(
      `INSERT INTO holding_edit_logs
       (id, holding_id, edited_by_user_id, edited_at, field_name, old_value, new_value, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(randomUUID(), holdingId, userId, nowIso(), fieldName, oldValue, newValue, reason);
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

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[-\s]+/g, "_").replaceAll("__", "_");
}

function normalizeIdentifier(value: string) {
  return value.trim();
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
    sourceSystemIdentifier: ""
  };
}
