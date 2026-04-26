# CSV Import Specification: Phase 2

## Purpose

This specification defines how Phase 2 should import local holdings from CSV or EdPort-style spreadsheets.

The import is local, librarian-controlled, and previewed before saving.

## Non-Goals

CSV import must not:

- call external APIs
- enrich metadata with AI
- search markets or vendors
- create recommendations
- calculate analytics
- approve acquisition decisions
- overwrite existing records silently

## Supported File Type

Phase 2 should begin with:

- `.csv`

Later phases may consider:

- `.xlsx`
- `.tsv`

## Import Flow

1. Librarian selects a local CSV file.
2. App reads column headers.
3. App shows detected columns.
4. Librarian confirms or adjusts column mapping.
5. App validates rows.
6. App shows preview with valid rows, warnings, invalid rows, and duplicates.
7. Librarian confirms import.
8. App saves approved rows.
9. App shows import result.

## Required Column Mapping

The import must map at least:

- Primary External Local Catalog Identifier: proposed `record_id` for the inspected sample CSV
- Title
- Status

The app must also create an internal system ID for every saved holding.

The importer must remain flexible and mappable. It may auto-map `record_id` when present, but it must allow librarians to choose a different identifier column for real EdPort exports.

Recommended mappings:

- Source System Identifier
- Creator/Contributor
- Publisher
- Publication Year
- Format
- Material Type
- Call Number
- Barcode
- Location
- Acquisition Date
- Collection Area

## Example Column Names

The app should allow librarians to map columns manually because exports may vary.

Possible source column names:

- `record_id`
- `Title`
- `title`
- `MMS ID`
- `Record ID`
- `Item ID`
- `Barcode`
- `Call Number`
- `Author`
- `Creator`
- `Publisher`
- `Publication Date`
- `Material Type`
- `Format`
- `Location`
- `Item Status`
- `Permanent Location`
- `Acquisition Date`
- `Collection Area`
- `collection_area`

## Sample CSV Mapping

The inspected sample CSV maps as follows:

| Sample column | Phase 2 field | Requirement |
| --- | --- | --- |
| `record_id` | Primary External Local Catalog Identifier | Required |
| `title` | Title | Required |
| `status` | Status | Required |
| `format` | Format | Strongly recommended |
| `location` | Location | Strongly recommended |
| `collection_area` | Collection Area | Strongly recommended |
| `creator` | Creator/Contributor | Optional |
| `isbn` | ISBN | Optional |
| `call_number` | Call Number | Optional |
| `publisher` | Publisher | Optional |
| `publication_year` | Publication Year | Optional |

The sample values indicate `record_id` is complete and unique in the sample. It should be proposed as the default identifier mapping for this file.

## Validation Rules

### Required Fields

A row is invalid if:

- Primary External Local Catalog Identifier is missing.
- Title is missing.
- Status is missing.

### Duplicate Checks

A row should be flagged if:

- Its Primary External Local Catalog Identifier already exists in saved holdings.
- Its Primary External Local Catalog Identifier appears more than once in the same CSV.

Duplicate comparison should normalize by trimming whitespace and comparing exact identifier strings. The app should not coerce identifiers to numbers, because real catalog identifiers may contain leading zeros, prefixes, or mixed characters.

### Date Checks

A row should be flagged if:

- Acquisition Date is present but cannot be parsed.
- Publication Year is present but is not a plausible year.

### Status Checks

A row should be flagged if:

- Status is not mapped to an approved Phase 2 status.

### Collection Area Checks

A row should be flagged if:

- Collection Area is present but does not match an approved collection area.

The librarian may choose to import the row as unassigned if all required fields are otherwise valid.

## Import Preview Behavior

The preview should group rows into:

- Ready to import
- Warnings
- Invalid and skipped
- Duplicates requiring review

Each row should show:

- row number
- mapped identifier
- title
- status
- collection area
- validation messages
- whether it will import or be skipped

The preview must allow the librarian to change column mapping and rerun validation before confirming.

## Preview Requirements

The preview must show:

- file name
- total row count
- detected columns
- mapped fields
- valid row count
- warning row count
- invalid row count
- duplicate row count
- row-level validation messages

The preview must clearly state:

"Nothing has been saved yet."

## Confirmation Requirements

Before saving, the app must show:

- how many rows will be saved
- how many rows will be skipped
- how many rows have warnings
- whether duplicates exist

The librarian must confirm before any records are saved.

## Import Behavior

Confirmed initial behavior:

- Save valid rows.
- Skip invalid rows.
- Block duplicate rows until librarian resolves them.
- Store import batch metadata.
- Store raw row data for traceability.
- Require explicit confirmation before saving valid rows when invalid rows will be skipped.

Do not update existing holdings from CSV in the first Phase 2 build unless explicitly approved.

## Error Messages

Messages should be plain English.

Examples:

- "This row is missing a title."
- "This local catalog identifier already exists."
- "This status is not recognized yet."
- "This collection area is not in the approved list."

## Export Requirements

Phase 2 should export current local holdings as CSV.

Export should include:

- Local Identifier
- Internal System ID
- Title
- Creator/Contributor
- Format
- Material Type
- Location
- Status
- Collection Area
- Source System Identifier
- Import Batch ID
- Updated At

## Test CSVs

Phase 2 implementation should include small local test fixtures:

- valid holdings CSV
- missing required field CSV
- duplicate identifier CSV
- unknown collection area CSV
- extra columns CSV

## Clarifying Questions Before Implementation

1. Should duplicate local identifiers be blocked, update existing records, or create a new version?
   Why this matters: allowing duplicate updates is risky without a stronger review and versioning workflow.

2. Should the original uploaded CSV file be stored, or only the parsed import batch and raw row data?
   Why this matters: source-file storage improves traceability but may store more data than the app needs.
