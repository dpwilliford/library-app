# Data Model: Phase 2 Collection Graph Foundation

## Purpose

This document defines the proposed Phase 2 data model for local holdings and librarian-controlled collection data.

It is limited to records that represent what the library owns or is reviewing as local catalog-derived data.

## Model Principles

- Local holdings are distinct from external field knowledge.
- Imported values should remain traceable.
- Librarian edits should be explicit.
- Collection areas should use controlled values.
- People and contributors should be distinguishable as separate entries with roles, not collapsed into a single display string.
- Nothing in Phase 2 should depend on AI-generated claims.
- No market, analytics, recommendation, or purchasing models should be added in Phase 2.

## Core Entities

### ImportBatch

Represents one CSV import attempt.

Fields:

- `id`
- `fileName`
- `importedByUserId`
- `createdAt`
- `rowCount`
- `savedCount`
- `rejectedCount`
- `skippedCount`
- `status`
- `notes`

Status values:

- `previewed`
- `confirmed`
- `partially_confirmed`
- `rejected`

### ImportRow

Represents a parsed CSV row before or after confirmation.

Fields:

- `id`
- `importBatchId`
- `rowNumber`
- `rawData`
- `validationStatus`
- `validationMessages`
- `matchedHoldingId`

Validation status values:

- `valid`
- `warning`
- `invalid`
- `duplicate`

### Holding

Represents a local library holding in the app.

Fields:

- `id`
- `externalLocalIdentifier`
- `externalIdentifierField`
- `sourceSystemIdentifier`
- `title`
- `creatorContributor`
- `publisher`
- `publicationYear`
- `format`
- `materialType`
- `callNumber`
- `barcode`
- `location`
- `status`
- `acquisitionDate`
- `collectionAreaId`
- `importBatchId`
- `createdAt`
- `updatedAt`
- `updatedByUserId`

Required fields:

- `id`
- `externalLocalIdentifier`
- `title`
- `status`
- `createdAt`
- `updatedAt`

Recommended fields:

- `format`
- `location`
- `collectionAreaId`
- `sourceSystemIdentifier`

Structured contributor implementation note:

- `creatorContributor` remains in `holdings.creator_contributor` for backward compatibility and original imported display context.
- Structured contributor entries are stored separately in `holding_contributors`.
- Multiple contributors can be represented separately for one holding.
- Contributor roles can be stored per contributor when roles are explicitly imported or manually entered.
- The importer must not invent roles when the source CSV does not provide them.

Implemented Phase 2 fix:

- Add structured contributor records that supplement the flat imported display value.
- Each contributor entry should include at minimum `holdingId`, `name`, `role`, `sortOrder`, and `source`.
- Preserve the original imported contributor string in `HoldingOriginalValues.originalCreatorContributor`.
- Display structured contributors separately on holding detail pages.
- Export both normalized contributor data and the original imported contributor string where feasible.
- Avoid collapsing distinct people into one string once structured contributor data exists.

### HoldingContributor

Represents one contributor associated with one local holding.

Fields:

- `id`
- `holdingId`
- `name`
- `role`
- `sortOrder`
- `source`
- `createdAt`
- `updatedAt`

Examples:

- `Alan Moore` — `writer`
- `Dave Gibbons` — `illustrator`

Source values:

- `csv_structured`: contributor name and role came from structured CSV fields.
- `legacy_flat`: contributor name was split from a legacy flat creator/contributor string; role remains blank.
- `manual`: contributor was entered or edited by a librarian.

### HoldingOriginalValues

Stores the first imported values for a holding, so librarian edits do not erase source context.

Fields:

- `holdingId`
- `originalRawData`
- `originalTitle`
- `originalCreatorContributor`
- `originalPublisher`
- `originalPublicationYear`
- `originalFormat`
- `originalMaterialType`
- `originalCallNumber`
- `originalBarcode`
- `originalLocation`
- `originalStatus`
- `originalAcquisitionDate`

### CollectionArea

Represents a controlled collection grouping.

Fields:

- `id`
- `name`
- `description`
- `isActive`
- `sortOrder`

### HoldingEditLog

Records meaningful manual changes to holdings.

Fields:

- `id`
- `holdingId`
- `editedByUserId`
- `editedAt`
- `fieldName`
- `oldValue`
- `newValue`
- `reason`

This log is recommended for Phase 2 if implementation effort allows. If not built immediately, it should remain a near-term requirement before larger imports.

### User

Phase 2 may continue using demo users from Phase 1 unless real invite-only auth is approved separately.

Fields used by Phase 2:

- `id`
- `name`
- `email`
- `role`

## Relationships

- One `ImportBatch` has many `ImportRows`.
- One `ImportBatch` can create or update many `Holdings`.
- One `Holding` belongs to zero or one `CollectionArea`.
- One `Holding` has one `HoldingOriginalValues` record.
- One `Holding` can have many `HoldingEditLog` entries.
- One `Holding` can have many `HoldingContributor` entries.
- One `User` can create many `ImportBatches`.
- One `User` can create many `HoldingEditLog` entries.

## Local Identifier Rule

Every holding must have:

- an internal system ID generated by the app
- a primary external local catalog identifier imported from the catalog CSV

The primary external identifier must use the strongest available imported local catalog identifier.

After inspecting the provided sample CSV, `record_id` is the proposed primary external local catalog identifier because it is present on every sample row and unique across all sample rows.

Implementation must still store the selected source column name as `externalIdentifierField`, because real EdPort exports may vary.

Candidate identifiers to verify from the CSV:

- barcode
- item ID
- MMS ID
- catalog record ID
- call number plus title fallback
- EdPort-provided unique row identifier

If no stable item-level or holding-level ID exists in the spreadsheet, implementation must stop and ask for a mapping decision before importing.

## Required And Optional Imported Fields

### Required For Import

- `record_id` or mapped primary external local catalog identifier
- `title`
- `status`

### Strongly Recommended

- `format`
- `location`
- `collection_area`

### Optional

- `creator`
- `isbn`
- `call_number`
- `publisher`
- `publication_year`

The importer should allow these fields to be mapped from alternate column names.

Contributor handling clarification:

- The current Phase 2 importer maps `creator`, `author`, `contributor`, or `creator/contributor` into the flat `creatorContributor` field.
- The Phase 2 importer also accepts structured contributor fields, including contributor name and contributor role mappings, numbered pairs such as `contributor_1_name` and `contributor_1_role`, and delimited pairs in `contributors`.
- If only the flat field exists, the app preserves the original string and may split semicolon-separated names into structured contributor rows with blank roles and `legacy_flat` source.
- The app does not infer roles from names or titles.

## Ownership Rule

Every saved `Holding` in Phase 2 represents an owned or locally tracked item.

Not-owned instantiations belong to later title genealogy and field knowledge phases, not the Phase 2 local holdings model, except for existing Phase 1.2 mock examples that remain clearly labeled as mock data.

## Status Values

Recommended initial holding statuses:

- `available`
- `checked_out`
- `in_process`
- `missing`
- `withdrawn`
- `unknown`

If the catalog export uses different values, Phase 2 should map them through a preview step rather than silently changing them.

## Collection Area Assignment

Collection area should be controlled by `CollectionArea`, not free text.

Records may be saved as unassigned if the librarian has not reviewed them yet.

## Export Model

The export should include:

- current holding values
- collection area
- local identifier
- source system identifier
- import batch ID
- updated timestamp

Contributor export clarification:

- Export includes the original imported contributor string and normalized contributor fields.
- Holdings with multiple contributors export as repeatable contributor rows so `contributor_name`, `contributor_role`, `contributor_sort_order`, and `contributor_source` are not collapsed into one undifferentiated string.

Optional export fields:

- original imported values
- edit-log summary
- validation warnings

## Data Integrity Risks

- Duplicate local identifiers could merge different items incorrectly.
- Missing title or identifier fields could produce unusable records.
- CSV column changes across exports could break imports.
- Manual edits could obscure original catalog values.
- Free-text collection areas could fragment reporting later.
- Source files may contain more data than Phase 2 needs.

## Clarifying Questions Before Implementation

1. What identifier does the CSV/EdPort export provide that is stable at the item or holding level?
   Why this matters: this determines duplicate detection and whether future imports can safely update existing records.

2. Should Phase 2 support multiple holdings for the same title?
   Why this matters: libraries often own multiple copies, formats, or locations, and the model should not collapse them.

3. Should withdrawn or missing items remain in the Collection Graph?
   Why this matters: including them supports history; excluding them makes current ownership clearer.
