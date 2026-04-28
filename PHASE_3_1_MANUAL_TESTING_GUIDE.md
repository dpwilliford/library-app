# Phase 3.1 Manual Testing Guide

## Purpose

This guide covers manual QA for Phase 3.1 Manual Claims And Evidence Foundation.

Phase 3.1 is limited to librarian-controlled manual claims, sources, evidence records, claim-evidence links, review states, CSV export, and Phase 3 claim audit events. It does not include AI enrichment, market search, recommendations, analytics calculations, purchasing workflows, external APIs, title genealogy automation, or mutation of Phase 2 holdings/contributors.

## Fresh Database Setup

Use a fresh SQLite database:

```bash
LIBRARY_DB_PATH=/tmp/library-phase3-1-qa.sqlite npm run dev
```

Open:

```text
http://localhost:3000/login
```

Primary librarian login:

- Email: `librarian@library.test`
- Password: `demo123`

Permission-check logins:

- Student: `student@library.test` / `demo123`
- Professor: `professor@library.test` / `demo123`

## Routes To Test

- Phase 2 seed import: `/collection/import`
- Holdings review: `/collection`
- Evidence queue: `/evidence-review`
- New claim: `/evidence-review/new`
- Claim detail: `/evidence-review/[claimId]`
- Claim edit: `/evidence-review/[claimId]/edit`
- Add evidence: `/evidence-review/[claimId]/evidence/new`
- Edit evidence: `/evidence-review/[claimId]/evidence/[evidenceId]/edit`
- Export: `/evidence-review/export`

## Manual Test Sequence

### 1. Seed Phase 2

1. Log in as `librarian@library.test`.
2. Open `/collection/import`.
3. Upload `apps/web/fixtures/phase2/valid-holdings.csv`.
4. Preview and confirm the import.
5. Open `/collection`.

Expected:

- `Watchmen` and `Spirited Away` appear as Phase 2 SQLite-backed holdings.
- Import batch shows `valid-holdings.csv`, `2 saved`, `0 skipped`.
- No Phase 1.2 mock titles are mixed into the Phase 2 holdings table.

QA note from 2026-04-27 run:

- The in-app browser automation could not attach a local file through the file chooser. The database was seeded with the two exact `valid-holdings.csv` rows in Phase 2 table shape, then verified through `/collection`. This leaves a manual browser upload gap for this specific audit run.

### 2. Draft Claim Without Evidence

1. Open `/evidence-review/new`.
2. Create a claim linked to `Watchmen (1001)`.
3. Leave evidence empty.
4. Open the claim detail page.
5. Select `Submit For Review`.

Expected:

- Claim is created as `draft`.
- Linked context shows `Watchmen (1001), Comics / Graphic Novels, Available`.
- Submission is blocked with `Claim requires evidence before review.`
- Status remains `draft`.
- `claim_events` includes `created`.

### 3. Add Evidence

1. Open `Add Evidence` for the draft claim.
2. Create a source.
3. Add excerpt or supporting data.
4. Save evidence with relationship `supports`.

Expected:

- Claim detail shows evidence.
- Relationship is preserved as `supports`.
- Claim can now be submitted.
- `claim_events` includes `source_created` and `evidence_attached`.

### 4. Review Workflow

1. Submit the claim.
2. Confirm status changes to `ready_for_review`.
3. Approve the claim with an approval note.
4. Confirm status changes to `approved`.
5. Edit the approved claim.
6. Save.

Expected:

- Submit writes `submitted_for_review`.
- Approval writes `approved`.
- Editing approved claim returns status to `needs_revision`.
- Rollback writes `returned_to_revision_after_edit`.

Observed UX issue from 2026-04-27 run:

- `Reviewed` timestamp appears immediately after submit to `ready_for_review`, before approval/rejection/revision review.
- After approved-claim edit, the old approval note still displays while status is `needs_revision`.

### 5. Data Integrity

Verify Phase 2 holdings and contributors after the Phase 3 claim workflow.

Suggested SQL:

```sql
SELECT external_local_identifier, title, creator_contributor, publisher,
       publication_year, format, isbn, call_number, location, status, collection_area_id
FROM holdings
ORDER BY external_local_identifier;
```

```sql
SELECT h.external_local_identifier, hc.name, hc.role, hc.sort_order, hc.source
FROM holding_contributors hc
JOIN holdings h ON h.id = hc.holding_id
ORDER BY h.external_local_identifier, hc.sort_order;
```

Expected:

- `Watchmen` remains `1001`, `Alan Moore; Dave Gibbons`, `DC Comics`, `1987`, `Book`, `Available`, `comics-graphic-novels`.
- Watchmen contributors remain `Alan Moore` and `Dave Gibbons`, blank roles, `legacy_flat`.
- No Phase 3 action updates `holdings` or `holding_contributors`.

### 6. Audit Trail

Suggested SQL:

```sql
SELECT action, old_status, new_status, note
FROM claim_events
ORDER BY acted_at;
```

Expected core actions:

- `created`
- `submitted_for_review`
- `approved`
- `updated`
- `returned_to_revision_after_edit`

Recommended supporting actions:

- `source_created`
- `evidence_attached`

### 7. Permissions

1. Log in as `student@library.test`.
2. Try direct URLs:
   - `/evidence-review`
   - `/evidence-review/new`
   - `/evidence-review/[claimId]`
   - `/evidence-review/[claimId]/edit`
   - `/evidence-review/[claimId]/evidence/new`
3. Repeat as `professor@library.test`.

Expected:

- Student and professor accounts should not access evidence-review management routes.
- Direct management URLs should redirect, return not found, or show a non-management placeholder.

Observed issue from 2026-04-27 run:

- Student and professor accounts could open direct management URLs and view claim/evidence forms and claim details.
- Server actions still appear protected, but route-level read/form access fails the Phase 3.1 permission expectation.

Fixed behavior from 2026-04-28 rerun:

- Student and professor direct access to Phase 3.1 management/detail routes redirects to `/dashboard`.
- Librarian and administrator accounts can still access Phase 3.1 management/detail routes.
- Server-action permission checks remain in place.

### 8. Export

1. Open `/evidence-review/export` while logged in as librarian.
2. Confirm CSV downloads.
3. Verify fields for claims, evidence, source, relationship, status, and confidence.

Expected:

- Claim appears in export.
- Evidence appears in export.
- Relationship appears as `supports`.
- Review state is preserved.

## Known Risk Validation

### Source Reuse Not Exposed In UI

Observed:

- The Add Evidence page only creates a new source; it does not expose a selector for existing sources.

Risk:

- Librarians may create duplicate source records for repeated citations.

Severity:

- Medium for data cleanliness.
- Not a blocker for the core Phase 3.1 foundation if documented.

### Evidence Removal Not Exposed In UI

Observed:

- Claim detail and evidence edit pages do not expose a remove/unlink control.

Risk:

- Incorrectly attached evidence cannot be removed through the UI, even though the data layer has removal support.

Severity:

- Medium for correction workflows.
- Not a blocker for read/create/review foundation, but should be addressed before heavier review use.

## Current QA Status

Phase 3.1 is ready for PR from the permissions-blocker standpoint after the 2026-04-28 focused rerun.

Do not add Phase 3.2 work until the remaining non-blocking risks are explicitly triaged.
