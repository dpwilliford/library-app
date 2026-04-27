# Phase 2 Manual Testing Guide

## Purpose

This guide explains how to manually test Phase 2 Collection Graph behavior: CSV upload, import preview, validation, confirmation, local SQLite storage, holdings review, export, and audit logs.

Phase 2 is librarian-controlled local holdings management only. It does not include AI enrichment, evidence workflow, market search, recommendations, analytics calculations, purchasing approvals, external APIs, or student/professor access to real imported holdings.

## Demo Login

Use a librarian role for real holdings management:

- URL: `http://localhost:3000/login`
- Email: `librarian@library.test`
- Password: `demo123`

Students and professors should see placeholder collection access only. They should not see real imported holdings management in Phase 2.

## Routes To Test

- Upload CSV: `/collection/import`
- Review import batch: `/collection/import/[batchId]`
- Review imported holdings: `/collection`
- Review holding detail and audit log: `/collection/holdings/[holdingId]`
- Export holdings CSV: `/collection/export`

## Controlled Upload/Data Testing Plan

Use controlled probes instead of random CSV uploads. The purpose is to verify whether Phase 2 preserves data integrity and
fails legibly.

Before testing:

1. Record the current number of rows in `holdings`, `import_batches`, `import_rows`, `holding_original_values`, and `holding_edit_logs`.
2. Run one fixture at a time.
3. After each import, capture the import batch URL and database counts.
4. Do not delete or manually repair rows during the test sequence unless the test explicitly calls for a fresh database.

Verify these data-integrity principles:

- identifier stability
- duplicate exclusion
- field normalization
- import-batch traceability
- persistence after confirmation
- audit log accuracy
- export integrity
- original data preservation

### Controlled Test Sequence

1. Duplicate Control: upload `valid-holdings.csv`, confirm it, upload it again, and verify the second batch is skipped as duplicate.
2. Partial Failure Import: upload `invalid-holdings.csv` and verify invalid rows are skipped while valid rows can import.
3. Warning-State Import: upload `unknown-area-holdings.csv` and document the actual unknown collection-area behavior.
4. Messy Real-World Data: upload `messy-real-world-holdings.csv` and verify warnings, invalid rows, punctuation, casing, raw data, and row outcome language.
5. Identifier Collision: upload a temporary row with an existing identifier and a different title, such as `1001,Watchmen Variant,...`.
6. Export Integrity: export after multiple imports and compare the CSV to SQLite state.
7. Contributor Field Baseline: upload a temporary legacy contributor row with `Alan Moore; Dave Gibbons; John Higgins`.
8. Batch Isolation: run three or four separate imports and verify holdings, import rows, and audit logs remain tied to the correct batches.

Record observed results in `PHASE_2_TEST_MATRIX.md`.

## 1. How CSV Upload And Import Currently Works

### Where To Upload

1. Log in as `librarian@library.test`.
2. Open `/collection`.
3. Select `Import CSV`, or go directly to `/collection/import`.
4. Choose a `.csv` file.
5. Select `Preview Import`.

### Expected File Format

Phase 2 supports `.csv` files only.

The parser expects:

- one header row
- comma-separated values
- quoted cells when values contain commas
- UTF-8 text

Blank rows are ignored by the parser.

### Required Columns

The importer must map these fields before rows can become valid holdings:

- Primary external local catalog identifier
- Title
- Status

For the sample/fixture files, the preferred identifier column is `record_id`.

The importer is flexible. It can auto-map common aliases such as:

- `record_id`
- `Item ID`
- `MMS ID`
- `Barcode`
- `Title`
- `Item Status`
- `Permanent Location`

The mapping can be changed on the import preview page before confirmation.

### Optional Columns

Optional or recommended columns include:

- Creator / Contributor
- Format
- ISBN
- Call Number
- Location
- Collection Area
- Publisher
- Publication Year
- Material Type
- Acquisition Date
- Source System Identifier

Extra columns are preserved in raw row data but are not automatically added to the holding record.

### Validation

Each parsed row receives a validation status:

- `valid`: Required mapped fields are present and no review warnings were detected.
- `warning`: The row can import, but a librarian should review something first.
- `invalid`: The row is missing required data and will be skipped on confirmation.
- `duplicate`: The row has a duplicate local identifier in the same CSV or already exists in saved holdings.

Current warning examples:

- unknown collection area
- publication year is not a four-digit year
- status is not recognized in the Phase 2 review list
- format is not in the Phase 2 review list
- location looks suspicious and needs librarian review

Current invalid examples:

- missing primary external local catalog identifier
- missing title
- missing status

Current duplicate examples:

- the same identifier appears more than once in the CSV
- the identifier already exists in the `holdings` table

### Import Actions

Each import row also has an action:

- `pending`: The batch has been previewed but not confirmed yet.
- `imported`: The row became a saved local holding.
- `skipped`: The row did not become a holding.

On confirmation:

- valid rows are imported
- warning rows are imported
- invalid rows are skipped
- duplicate rows are skipped

Phase 2 does not overwrite, merge, update, or delete existing holdings from a CSV import.

## 2. What Happens To Uploaded Data

### Where Data Is Stored

Phase 2 uses local SQLite persistence.

Default local database path:

```text
apps/web/data/library.sqlite
```

The database path comes from `LIBRARY_DB_PATH` if that environment variable is set. Otherwise, the app writes to `data/library.sqlite` relative to the Next.js app runtime.

### Is The Original CSV File Retained?

No. The uploaded CSV file itself is not retained as a file.

The app stores:

- import batch metadata
- detected headers
- selected column mapping
- each parsed raw row as JSON
- each mapped row as JSON
- validation messages
- saved holding records for imported rows
- original imported values for each saved holding
- audit/edit-log entries

### SQLite Tables Involved

Phase 2 uses these tables:

- `collection_areas`
- `import_batches`
- `import_rows`
- `holdings`
- `holding_original_values`
- `holding_edit_logs`

### Import Batches

When a CSV is previewed, the app creates an `import_batches` row.

Important fields:

- `id`
- `file_name`
- `imported_by_user_id`
- `created_at`
- `row_count`
- `saved_count`
- `rejected_count`
- `skipped_count`
- `status`
- `headers_json`
- `mapping_json`

Batch status values include:

- `previewed`
- `confirmed`
- `partially_confirmed`

### Import Rows

Every parsed row creates an `import_rows` row during preview.

Important fields:

- `id`
- `import_batch_id`
- `row_number`
- `raw_data_json`
- `mapped_data_json`
- `validation_status`
- `validation_messages_json`
- `import_action`
- `matched_holding_id`

`matched_holding_id` is used when a row is associated with a duplicate or an imported holding.

### Holding Creation

When the librarian confirms a batch:

1. Rows with `valid` or `warning` status are considered for import.
2. The app checks again for an existing holding with the same `external_local_identifier`.
3. If no existing holding is found, a new `holdings` row is inserted.
4. The row action becomes `imported`.
5. The row receives `matched_holding_id`.

Confirm Import is the commit step. Valid imported holdings are saved to SQLite at this point. Opening a holding detail page
afterward is a read-only review step by default; the librarian does not need to click Save Holding for the imported record
to persist.

Important `holdings` fields:

- `id`
- `external_local_identifier`
- `external_identifier_field`
- `source_system_identifier`
- `title`
- `creator_contributor`
- `publisher`
- `publication_year`
- `format`
- `material_type`
- `isbn`
- `call_number`
- `location`
- `status`
- `acquisition_date`
- `collection_area_id`
- `import_batch_id`
- `created_at`
- `updated_at`
- `updated_by_user_id`

### Structured Contributors

Phase 2 stores contributor metadata in two ways:

- `holdings.creator_contributor` keeps the original flat creator/contributor value for backward compatibility.
- `holding_contributors` stores separate contributor rows with `name`, `role`, `sort_order`, and `source`.

If a CSV provides structured contributor fields, the app imports contributor names and roles from those fields. If a CSV only
provides a legacy flat value such as `Alan Moore; Dave Gibbons`, the app preserves that original string and may split the
semicolon-separated names into structured contributor rows with blank roles. The app does not invent roles.

Contributor source values:

- `csv_structured`: structured contributor field from CSV
- `legacy_flat`: split from the legacy flat creator/contributor string
- `manual`: edited by a librarian

### Duplicate Handling

Duplicates are conservative in Phase 2.

The app flags a row as duplicate if:

- its mapped external local identifier appears more than once in the same CSV
- its mapped external local identifier already exists in saved holdings

Duplicate rows are skipped during confirmation.

No duplicate automation exists yet. The app does not:

- overwrite existing holdings
- merge records
- create versions
- delete records
- update existing holdings from CSV

### Original Imported Values

For each imported holding, the app writes a `holding_original_values` row.

This preserves source context so later librarian edits do not erase what was imported.

### Audit/Edit Logs

When a holding is created from CSV, the app writes a `holding_edit_logs` entry with:

- field name: `created`
- new value: `Imported from CSV preview`
- reason: `Initial import`

When a librarian edits a holding in the app, changed fields are written to `holding_edit_logs` with:

- field name
- old value
- new value
- editor
- timestamp
- reason: `Manual librarian edit`

Save Holding is only for later intentional metadata edits from the holding edit view. Simply opening or reviewing a saved
holding does not create audit/edit-log entries.

Contributor edits are separate from other metadata edits. Saving contributor changes creates a `contributors` audit entry;
viewing contributors does not create audit entries.

### Contributor Test Matrix

Use these cases when auditing Phase 2 contributor behavior:

| Case | Input | Expected Result |
| --- | --- | --- |
| Legacy flat import | `Alan Moore; Dave Gibbons` in the legacy Creator/Contributor field. | Imports as two contributor rows. Roles are blank. Source is `legacy_flat`. Original string is preserved. |
| Structured import | `Alan Moore|writer; Dave Gibbons|illustrator` in the `contributors` field. | Imports as two contributor rows with roles preserved. Source is `csv_structured`. |
| Numbered-column import | `contributor_1_name`, `contributor_1_role`, `contributor_2_name`, `contributor_2_role`. | Imports ordered contributor rows with matching roles. |
| Export | Export a holding with multiple contributors. | Each contributor remains distinguishable. Role is preserved. Holding identity columns repeat so the holding is not lost when rows repeat. |
| Edit behavior | Change contributors from holding edit mode and save with `Save Contributors`. | A `contributors` audit entry is created. Main metadata editing remains separate. |
| Regression | Open an old holding without structured contributor rows. | Page displays safely and does not crash. Existing flat values remain readable. |

Test 7 in `PHASE_2_TEST_MATRIX.md` records the historical pre-structured-contributor baseline. Because structured
contributors are now implemented, current behavior should preserve the original flat contributor string while also allowing
safe legacy splitting into contributor rows with blank roles and `legacy_flat` source. The app should still never invent roles.

## 3. Manual Test Plan

### Test A: Upload A Clean CSV

Recommended first fixture:

```text
apps/web/fixtures/phase2/valid-holdings.csv
```

Steps:

1. Go to `/collection/import`.
2. Upload `valid-holdings.csv`.
3. Confirm the preview shows all rows as `valid`.
4. Confirm the mapping uses `record_id` as the primary identifier.
5. Confirm the import.
6. Go to `/collection`.
7. Confirm the imported holdings appear.
8. Open a holding detail page.
9. Confirm the detail page says `This Phase 2 holding has already been saved.`
10. Confirm the metadata is read-only and no `Save Holding` button appears.
11. Confirm `Structured Contributors` shows each contributor separately.
12. For `Watchmen`, confirm Alan Moore and Dave Gibbons are separate contributor rows with blank roles if using the legacy fixture.
13. Click `Edit Holding` only if you want to test a later metadata edit.
14. Confirm the Phase 2 Audit Log contains the initial import entry.
15. Export from `/collection/export` and confirm contributor columns appear in the CSV.

Expected result:

- rows import successfully
- holdings are created
- original values are stored
- audit log entries are created
- Save Holding is not required for imported records to persist
- contributors are not collapsed into one undifferentiated export field

### Test B: Upload A Messy CSV

Fixture:

```text
apps/web/fixtures/phase2/messy-real-world-holdings.csv
```

This tests:

- alternate headers such as `Item ID`
- quoted values
- blank rows
- inconsistent format
- suspicious location
- unknown collection area
- invalid publication year
- unknown status
- missing required fields

Expected result:

- clean rows are valid
- questionable rows receive warnings
- missing required fields are invalid
- valid/warning rows import after confirmation
- invalid rows are skipped

### Test C: Upload A Duplicate Identifier CSV

Fixture:

```text
apps/web/fixtures/phase2/duplicate-holdings.csv
```

Expected result:

- rows are marked `duplicate`
- rows remain visible in the preview
- confirmation imports zero duplicate rows
- duplicate rows are skipped
- no existing holding is overwritten

### Test D: Upload A CSV With Missing Fields

Fixture:

```text
apps/web/fixtures/phase2/invalid-holdings.csv
```

Expected result:

- rows missing identifier, title, or status are `invalid`
- valid rows can still import
- invalid rows are skipped only after explicit confirmation

### Test E: Upload A Malformed CSV

Fixture:

```text
apps/web/fixtures/phase2/malformed-holdings.csv
```

Expected result:

- short rows are parsed with missing values
- missing required values are flagged as invalid
- valid rows can still import

### Test F: Duplicate Titles Are Not Duplicate Holdings

Fixture:

```text
apps/web/fixtures/phase2/duplicate-title-holdings.csv
```

Expected result:

- duplicate titles with distinct local identifiers are allowed
- both rows can import
- duplicate detection is based on local identifier, not title

### Test G: Filters

On `/collection`, test:

- search by title
- search by identifier
- unassigned collection area
- status
- format
- location

Also test import-row review links:

- Warning Rows
- Invalid Rows
- Duplicate Rows
- Skipped Rows

Expected result:

- holdings filters change the holdings table
- import-row filters show rows needing review
- row links return to the import batch detail page

### Test H: Phase 2 Import Batch Detail

Open a Phase 2 import batch from the Phase 2 Import Batches section or from an import-row review link.

Confirm the batch detail page shows:

- total rows
- valid rows
- warning rows
- invalid rows
- duplicate rows
- skipped rows
- imported rows
- row-level validation messages
- row-level “what happened” explanations

### Test I: Export

Open:

```text
/collection/export
```

Expected export fields include:

- `internal_system_id`
- `external_local_identifier`
- `external_identifier_field`
- `title`
- `creator`
- `format`
- `isbn`
- `call_number`
- `location`
- `collection_area`
- `publisher`
- `publication_year`
- `status`
- `import_batch_id`
- `updated_at`

Skipped and invalid rows should not appear in the holdings export.

### Test J: Audit Logs

1. Open a holding detail page.
2. Change a field such as location, status, title, or collection area.
3. Save.
4. Confirm the Phase 2 Audit Log shows:
   - field changed
   - old value
   - new value
   - editor
   - timestamp
   - reason

## 4. Current CSV Fixtures

### `valid-holdings.csv`

Clean import with two valid rows.

Use this first.

### `invalid-holdings.csv`

Contains one valid row and rows missing required fields.

Tests partial import and skipped invalid rows.

### `duplicate-holdings.csv`

Contains duplicate local identifiers inside the same CSV.

Tests duplicate detection and skip behavior.

### `unknown-area-holdings.csv`

Contains an unapproved collection area and invalid publication year.

Tests warning behavior and import-as-unassigned behavior.

### `extra-columns-holdings.csv`

Contains an extra unmapped column.

Tests raw row preservation.

### `messy-real-world-holdings.csv`

Contains alternate headers, blank rows, inconsistent format, suspicious location, unknown collection area, unknown status, invalid year, and missing required fields.

Tests realistic review behavior.

### `duplicate-title-holdings.csv`

Contains duplicate titles with different identifiers.

Tests that duplicate titles are allowed when local identifiers differ.

### `malformed-holdings.csv`

Contains short rows with missing values.

Tests malformed row handling through required-field validation.

## Safe First Test CSV

If you want to create a tiny CSV manually, use this:

```csv
record_id,title,creator,format,isbn,call_number,location,collection_area,publisher,publication_year,status
SAFE-001,Safe Test Holding,Test Creator,Book,9780000000000,PN1000,Stacks,Books / Other,Test Publisher,2024,Available
SAFE-002,Safe Test DVD,Test Director,DVD,,DVD1000,Media Library,Film / DVD,Test Studio,2023,Available
```

Expected result:

- both rows should preview as valid
- both rows should import
- both rows should appear in `/collection`

## 5. Developer-Only SQLite Inspection

### Locate The Database

Default path:

```bash
ls -lh apps/web/data/library.sqlite
```

If `LIBRARY_DB_PATH` was set when running the app, inspect that path instead.

### Option A: Use `sqlite3` CLI If Installed

Open the database:

```bash
sqlite3 apps/web/data/library.sqlite
```

Show tables:

```sql
.tables
```

Show schema:

```sql
.schema import_batches
.schema import_rows
.schema holdings
.schema holding_original_values
.schema holding_edit_logs
```

### Option B: Use Node And `better-sqlite3`

From the repository root:

```bash
node -e "const Database=require('better-sqlite3'); const db=new Database('apps/web/data/library.sqlite'); console.table(db.prepare('SELECT name FROM sqlite_master WHERE type = ? ORDER BY name').all('table'));"
```

### Useful SQL Queries

Import batches:

```sql
SELECT
  id,
  file_name,
  imported_by_user_id,
  created_at,
  row_count,
  saved_count,
  skipped_count,
  rejected_count,
  status
FROM import_batches
ORDER BY created_at DESC;
```

Import rows by batch:

```sql
SELECT
  row_number,
  validation_status,
  import_action,
  matched_holding_id,
  validation_messages_json,
  mapped_data_json
FROM import_rows
WHERE import_batch_id = 'PASTE_BATCH_ID_HERE'
ORDER BY row_number;
```

Imported holdings:

```sql
SELECT
  h.id,
  h.external_local_identifier,
  h.title,
  h.format,
  h.location,
  h.status,
  ca.name AS collection_area,
  h.import_batch_id,
  h.updated_at
FROM holdings h
LEFT JOIN collection_areas ca ON ca.id = h.collection_area_id
ORDER BY h.updated_at DESC;
```

Original imported values for a holding:

```sql
SELECT
  holding_id,
  original_title,
  original_format,
  original_location,
  original_status,
  original_raw_data_json
FROM holding_original_values
WHERE holding_id = 'PASTE_HOLDING_ID_HERE';
```

Audit/edit logs:

```sql
SELECT
  holding_id,
  edited_by_user_id,
  edited_at,
  field_name,
  old_value,
  new_value,
  reason
FROM holding_edit_logs
ORDER BY edited_at DESC;
```

Find skipped or duplicate rows:

```sql
SELECT
  ib.file_name,
  ir.row_number,
  ir.validation_status,
  ir.import_action,
  ir.validation_messages_json,
  ir.matched_holding_id
FROM import_rows ir
JOIN import_batches ib ON ib.id = ir.import_batch_id
WHERE ir.validation_status = 'duplicate'
   OR ir.import_action = 'skipped'
ORDER BY ib.created_at DESC, ir.row_number;
```

## 6. Data Lifecycle

### 1. Upload

A librarian selects a local CSV at `/collection/import`.

The file is read by the app for parsing. The original CSV file is not retained as a file.

### 2. Preview

The app parses headers and rows, creates an `import_batches` record, and creates `import_rows` records.

At this stage:

- no holdings have been created
- import rows are `pending`
- validation status and messages are visible
- column mapping can still be changed

### 3. Validation

Each import row is mapped and validated.

The app determines whether each row is:

- valid
- warning
- invalid
- duplicate

### 4. Confirmation

The librarian explicitly confirms the import.

Valid and warning rows are eligible to become holdings.

Invalid and duplicate rows are skipped.

### 5. Database Write

For imported rows, the app writes:

- one `holdings` record
- one `holding_original_values` record
- one `holding_edit_logs` initial import entry
- an updated `import_rows` action

The app also updates counts and status on `import_batches`.

### 6. Review

Librarians review records on `/collection`.

They can:

- search holdings
- filter by unassigned area
- filter by status
- filter by format
- filter by location
- review warning, invalid, duplicate, and skipped import rows
- open batch detail pages
- open holding detail pages

### 7. Export

The export route `/collection/export` generates CSV from current saved holdings.

It exports holdings, not skipped import rows.

### 8. Audit Trail

Initial imports and later manual edits are recorded in `holding_edit_logs`.

Original import values remain available in `holding_original_values`.

## Confusing Or Risky Current Behavior

- Warning rows import on confirmation. They are not blocked.
- Duplicate rows are skipped, but there is not yet a duplicate-resolution workflow.
- Existing holdings are never updated from CSV, even if the CSV contains a newer version of the same identifier.
- The original uploaded CSV file is not stored; only parsed raw row JSON is retained.
- The parser handles common CSV quoting, but very unusual spreadsheet exports may still need new fixture coverage.
- Demo authentication is not production security.
- The default SQLite database is local development storage, not a production deployment plan.
