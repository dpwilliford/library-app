# Phase 3.2 Manual Testing Guide

## Purpose

This guide covers manual QA for Phase 3.2 Evidence Review Queue Hardening.

Phase 3.2 verifies:

- canonical review-state cleanup
- queue filters and sorting
- unchanged export behavior
- preserved permissions
- no Phase 2 holdings or contributor mutation

Phase 3.2 does not include source reuse UI, evidence unlink/removal UI, export filtering, or Phase 3.3+ work.

## Fresh Database Setup

Use a fresh SQLite database:

```bash
LIBRARY_DB_PATH=/tmp/library-phase3-2-qa.sqlite npm run dev
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

## Manual Test Sequence

### 1. Seed Phase 2

1. Log in as librarian.
2. Open `/collection/import`.
3. Upload `apps/web/fixtures/phase2/valid-holdings.csv`.
4. Preview and confirm the import.
5. Open `/collection`.

Expected:

- `Watchmen` and `Spirited Away` appear.
- Import batch is confirmed.
- Batch shows 2 saved, 0 rejected, 0 skipped.

### 2. Create, Submit, And Approve Claim

1. Open `/evidence-review/new`.
2. Create a claim linked to `Watchmen`.
3. Add evidence through `/evidence-review/[claimId]/evidence/new`.
4. Submit the claim for review.
5. Approve it with a note.

Expected:

- Submit changes status to `ready_for_review`.
- Submit does not set active `reviewed_at`, `reviewed_by_user_id`, or `review_note`.
- Approve changes status to `approved`.
- Approve sets current active reviewer, timestamp, and note.
- `claim_events` includes `created`, `evidence_attached`, `submitted_for_review`, and `approved`.

### 3. Edit Approved Claim

1. Open the approved claim edit page.
2. Save a change.
3. Return to claim detail.

Expected:

- Status changes to `needs_revision`.
- Current active review decision fields are cleared:
  - `reviewed_at = NULL`
  - `reviewed_by_user_id = NULL`
  - `review_note = NULL`
- Claim detail does not display the prior approval note as current.
- Event history still shows the prior approval event.
- Event history includes `returned_to_revision_after_edit`.

Suggested SQL:

```sql
SELECT review_status, reviewed_at, reviewed_by_user_id, review_note
FROM claims
WHERE id = '<claimId>';
```

```sql
SELECT action, acted_by_user_id, acted_at, old_status, new_status, note
FROM claim_events
WHERE claim_id = '<claimId>'
ORDER BY acted_at;
```

### 4. Queue Filters

Create or use claims across statuses and linked-context combinations.

Open `/evidence-review` and verify:

- Status filter
- Linked context filter
- Creator filter
- Current reviewer filter
- Search by claim text or linked holding title

Expected:

- Filters use persisted claim fields and explicit joins only.
- Current reviewer filter uses active `reviewed_by_user_id`, not historical event reviewers.
- Rolled-back approved claims with cleared reviewer fields do not appear under the prior reviewer filter.

### 5. Queue Sorting

Verify sort controls:

- Newest created
- Oldest created
- Recently updated
- Stale / unreviewed first
- Review decision date

Expected:

- Sorts are deterministic.
- Sorts use persisted `claims` fields.
- Review decision date sort uses active `reviewed_at`.

### 6. Export Regression

Open:

```text
/evidence-review/export
```

Also check:

```text
/evidence-review/export?reviewStatus=approved
```

Expected:

- Export downloads CSV.
- Export remains unfiltered.
- Query-string filters do not change export output.
- CSV still includes Phase 3.1 claim, evidence, source, relationship, review status, confidence, and linked-context fields.

### 7. Permissions

Log in as student and professor.

Check:

- `/evidence-review`
- `/evidence-review/[claimId]`
- `/evidence-review/[claimId]/edit`
- `/evidence-review/[claimId]/evidence/new`
- `/evidence-review/export`

Expected:

- `/evidence-review` may show a non-management placeholder.
- Student/professor must not see queue controls, claim detail, edit forms, evidence forms, or export data.
- Detail/edit/evidence routes redirect or block.
- Export returns not found.

### 8. Phase 2 Data Integrity

Before and after Phase 3.2 workflow, compare:

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

- No claim workflow updates `holdings`.
- No claim workflow updates `holding_contributors`.

## 2026-04-28 QA Result

All required Phase 3.2 manual QA checks passed.

Known non-blocking note:

- A local `.next` dev cache issue caused an initial export-route module error after prior build output. Clearing `apps/web/.next` and restarting the dev server resolved it. Export passed after restart.

Phase 3.2 is ready for PR from manual QA.
