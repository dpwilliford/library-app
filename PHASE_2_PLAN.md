# Phase 2 Plan: Collection Graph Foundation

## Purpose

Phase 2 establishes the first real collection data layer: a local, librarian-controlled Collection Graph that represents what the library owns.

This phase is not the full collection intelligence system. It creates the foundation for importing, reviewing, editing, viewing, and exporting local holdings data without AI enrichment, market search, analytics calculations, recommendations, purchasing workflows, or external APIs.

## Scope

Phase 2 includes:

- Local holdings data structure
- CSV import from catalog or EdPort-style spreadsheets
- Import preview before saving
- Librarian-controlled validation and correction
- Manual editing of imported records
- Collection-area assignment
- Basic collection list and detail views
- Owned-holdings indicators
- Export of local holdings data
- Clear import history and current record status

## Explicit Exclusions

Phase 2 does not include:

- AI enrichment
- AI metadata suggestions
- Market search
- Vendor lookup
- External APIs
- Recommendation engine
- Recommendation submission workflows
- Purchasing workflow
- Head librarian acquisition decision workflow
- Analytics calculations
- Checkout trend analysis
- Field knowledge base
- Title biography generation
- Evidence review workflow beyond local catalog-source notes

## Core Principle

Catalog-derived local holdings are authoritative for ownership.

Librarians remain in control of:

- what gets imported
- what gets accepted
- what gets corrected
- what collection area is assigned
- what gets exported

The app may help structure and display records, but it must not infer, enrich, approve, overwrite, or delete collection meaning without librarian action.

## Primary Users

### Librarian

Reviews imports, corrects records, assigns collection areas, and manages local holdings data.

### Collection-Area Librarian

Reviews holdings in assigned areas and helps identify records that need area assignment or correction.

### Head Librarian

Views the local holdings foundation and understands collection coverage, but Phase 2 does not include decision queues or analytics.

### Administrator

Supports access and system setup, but does not control collection meaning.

### Student And Professor

Students and professors may see placeholder holdings or exploration pages only. They must not see real imported holdings in Phase 2 unless explicitly enabled in a later phase.

## Proposed User Flow

1. Librarian opens Collection Graph.
2. Librarian uploads a CSV file locally.
3. App parses the file and shows an import preview.
4. App flags missing required fields, duplicate identifiers, and invalid statuses.
5. Librarian maps CSV columns if needed.
6. Librarian reviews valid, warning, invalid, duplicate, and skipped rows.
7. Librarian explicitly confirms partial import.
8. App saves valid local holding records and skips invalid rows.
9. Librarian reviews records in a collection table.
10. Librarian edits individual records manually.
11. Librarian assigns or updates collection areas.
12. Librarian exports the current local holdings data.

## Sample CSV Finding

The provided sample CSV includes these columns:

- `record_id`
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

In the sample, `record_id` is present on every row and unique across all rows. Phase 2 should therefore propose `record_id` as the stable external local catalog identifier for this sample.

Because real EdPort exports may vary, the importer must not hardcode `record_id`. It should use `record_id` as a preferred auto-mapping when present, then allow librarians to map a different identifier field when a real export uses different column names.

## Data Authority Rules

- Imported catalog rows are the starting source of ownership records.
- A saved holding record represents a local record in this app, not a new catalog authority record.
- Manual librarian edits in the app must be tracked separately from original import values where possible.
- The app must never silently overwrite existing records during import.
- Duplicate records must be previewed and resolved by a librarian.
- Invalid rows must be clearly marked in preview.
- Valid rows may be imported while invalid rows are skipped, but only after explicit librarian confirmation.

## Minimal Architecture

Phase 2 should add a small local data layer inside the existing app.

Recommended approach:

- Use the existing Next.js app.
- Use local SQLite persistence.
- Use a stable Node 20-compatible SQLite package rather than Node's experimental built-in SQLite module.
- Keep data access behind the private app shell.
- Keep import parsing server-side or in a controlled local route.
- Keep source CSV files local; do not upload them to third-party services.
- Keep export simple, likely CSV.

SQLite is the approved Phase 2 persistence choice because the phase needs reliable duplicate checks, edits, exports, audit logs, and future migration.

## Required Screens

### Collection Graph

Shows local holding records and collection-area status.

### Import Holdings

Allows CSV selection, parsing, preview, validation, and librarian confirmation.

### Import Preview

Shows parsed rows, field mappings, validation issues, duplicates, and records ready to import.

### Holding Detail

Shows one local holding record, source/import information, editable fields, and collection-area assignment.

### Collection Areas

Shows the approved list of collection areas and which records are assigned or unassigned.

### Export

Allows export of current local holdings data.

## Acceptance Criteria

Phase 2 is complete when:

- A librarian can import a local CSV file.
- The app previews rows before saving.
- The app validates required fields.
- The app detects duplicate local identifiers.
- The app saves confirmed holdings locally.
- A librarian can view all saved holdings.
- A librarian can edit selected local fields manually.
- A librarian can assign collection areas.
- A librarian can export local holdings.
- All Phase 2 data is clearly local holdings data.
- No AI, market, analytics, recommendation, purchasing, or external API features are added.

## Clarifying Questions Before Implementation

1. Should later imports update existing holdings with the same external identifier, create a new version, or be blocked for manual review?
   Why this matters: update behavior is the biggest overwrite risk in Phase 2.

2. Should the app retain original imported values alongside librarian-edited values?
   Why this matters: retaining originals improves auditability and makes import mistakes easier to reverse.

3. Should uploaded CSV files themselves be stored, or should only parsed row data be saved?
   Why this matters: storing source files improves traceability but increases storage and privacy considerations.

4. Can you provide another sample if the real production EdPort export uses different columns from this sample?
   Why this matters: `record_id` is the proposed identifier for this sample, but the importer must remain mappable for export variations.

## Confirmed Phase 2 Decisions

- Use local SQLite persistence.
- Create an internal system ID for every holding record.
- Use the strongest available imported local catalog identifier as the primary external identifier.
- For the inspected sample CSV, propose `record_id` as the primary external identifier.
- Real EdPort exports may vary, so identifier mapping must remain flexible and librarian-confirmed.
- Preview all rows before import.
- Allow valid rows to import while invalid rows are skipped, with explicit confirmation.
- Keep real imported holdings management librarian-only in Phase 2.
- Treat collection areas as configurable seed values, not hardcoded permanent categories.

## Phase 2 Implementation Plan

1. Add local SQLite persistence and migration/setup scripts.
2. Seed configurable collection areas from `COLLECTION_AREA_SPEC.md`.
3. Define holding, import batch, import row, original values, and edit-log tables.
4. Build CSV parser and column-mapping preview for librarian roles.
5. Auto-map known sample columns, including `record_id`, while allowing manual mapping.
6. Validate all rows before saving.
7. Show import preview with valid, warning, invalid, duplicate, and skipped rows.
8. Require explicit librarian confirmation before importing valid rows and skipping invalid rows.
9. Save confirmed valid holdings with internal IDs and external identifiers.
10. Add librarian-only collection list, holding detail, manual edit, collection-area assignment, and export.
11. Keep student and professor holdings pages as placeholders.
12. Run import tests with valid, invalid, duplicate, unknown-area, and extra-column CSV fixtures.
