# Phase 2.2 Manual QA Checklist: Collection Graph Review Hardening

## Scope

Use this checklist to verify librarian-controlled import, review, edit, and export workflows after Phase 2.

Phase 2.2 does not include AI enrichment, evidence workflow, market search, recommendations, analytics calculations, purchasing approvals, external APIs, or student/professor access to real imported holdings.

## CSV Preview

- Log in as `librarian@library.test`.
- Open `/collection/import`.
- Upload a valid CSV fixture and confirm the preview shows detected columns, mapped fields, row counts, and validation counts.
- Upload a messy CSV with blank rows, missing fields, inconsistent formats, and bad locations.
- Confirm blank rows do not create empty holdings.
- Confirm invalid rows remain visible and are clearly marked.
- Confirm warning rows explain what needs librarian review.
- Confirm duplicate rows are labeled as suspected duplicates.
- Confirm the page states that nothing is saved before confirmation.

## Import Confirmation

- Confirm a preview that contains valid, warning, invalid, and duplicate rows.
- Confirm valid and warning rows are imported.
- Confirm invalid and duplicate rows are skipped.
- Confirm skipped rows remain visible in the batch detail page.
- Confirm duplicate rows do not update, merge, overwrite, or delete existing holdings.

## Holdings Review

- Open `/collection`.
- Test search by title, local identifier, creator, and call number.
- Filter by unassigned collection area.
- Filter by status.
- Filter by format.
- Filter by location.
- Confirm filter results do not expose real imported holdings to student or professor roles.

## Duplicate And Skipped Row Review

- Use the Import Row Review section on `/collection`.
- Open Warning Rows, Invalid Rows, Duplicate Rows, and Skipped Rows.
- Confirm each row links back to its import batch.
- Confirm duplicate language says Phase 2.2 does not overwrite existing holdings.
- Confirm row-level outcome language explains what happened.

## Export

- Export local holdings from `/collection/export`.
- Confirm the CSV includes internal system ID, external identifier, title, creator, format, location, collection area, status, import batch ID, and updated timestamp.
- Confirm skipped or invalid import rows are not exported as holdings.

## Audit Log Verification

- Open a holding detail page.
- Edit a field such as collection area, location, status, or title.
- Confirm the Phase 2 Audit Log shows the changed field, old value, new value, editor, timestamp, and reason.
- Confirm initial import entries remain visible.

## Remaining Risks

- Duplicate resolution is review-only; there is no merge or update workflow yet.
- CSV source files are not retained as files.
- Demo authentication remains local-only and is not production security.
- Real EdPort exports may need more column aliases after additional samples.
