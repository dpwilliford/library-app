# Phase 3.2 Implementation Plan

## Status

Planning only. Do not implement Phase 3.2 from this document until a separate implementation prompt is approved.

This plan is based strictly on:

- `PHASE_3_2_PLAN.md`
- `PHASE_3_1_MANUAL_TESTING_GUIDE.md`
- `PHASE_3_1_TEST_MATRIX.md`

## Phase 3.2 Boundary

Phase 3.2 implements Evidence Review Queue Hardening with review-state cleanup first.

Implementation priority:

1. Make review-state fields deterministic and canonical.
2. Update claim detail and queue display to use those canonical fields.
3. Add queue filters and sorting derived from persisted claim fields and explicit joins only.

Phase 3.2 does not change export behavior and does not add new evidence/source management capabilities.

## Explicit Exclusions

Do not implement:

- export changes
- export filtering
- export column changes
- source reuse UI
- evidence unlink/removal UI
- source bibliography management
- duplicate source detection
- holdings mutation
- contributor mutation
- Phase 3.3 AI draft intake
- Phase 3.4 citation/source management
- Phase 3.5 closeout audit
- AI enrichment
- market, recommendation, analytics, purchasing, or external API work
- student/professor evidence-review access
- bulk approval, bulk rejection, or bulk status mutation

## Exact Files Likely To Change

### Data And Review Logic

- `apps/web/lib/phase3/claimsData.ts`
  - update review-state transition behavior
  - ensure approved-claim edits clear current review fields
  - add queue filter/sort query support
  - keep export data behavior unchanged

- `apps/web/lib/phase3/models.ts`
  - add filter/sort types if needed
  - clarify canonical review-state typing if existing types need refinement

- `apps/web/lib/phase3/claimsData.test.ts`
  - add regression tests for review-state cleanup
  - add queue filter/sort tests
  - add export unchanged regression tests
  - add holdings/contributors non-mutation regression coverage if not already sufficient

- `apps/web/lib/phase2/db.ts`
  - optional additive indexes only, if implementation shows they are needed for queue filters or stale/unreviewed queries
  - no table changes
  - no Phase 2 table alterations

### Server Actions

- `apps/web/app/evidence-review/actions.ts`
  - update action behavior only where needed to enforce canonical review-state transitions
  - preserve server-action permission checks
  - do not add unlink/remove/source-reuse actions
  - do not add export actions

### Routes And Pages

- `apps/web/app/evidence-review/page.tsx`
  - add queue summary counts, filters, sorting, stale/unreviewed indicators
  - ensure filters use query parameters and persisted fields/joins only
  - preserve route-level librarian/admin access

- `apps/web/app/evidence-review/[claimId]/page.tsx`
  - separate current active review fields from historical claim events
  - remove misleading current approval display after approved-claim edit rollback
  - preserve route-level librarian/admin access

- `apps/web/app/evidence-review/[claimId]/edit/page.tsx`
  - preserve approved-claim edit warning
  - ensure saved approved edits produce canonical `needs_revision` state
  - preserve route-level librarian/admin access

### Components

Only create or update components if they keep page code clear and match existing UI patterns.

Likely candidates:

- `apps/web/components/ClaimStatusBadge.tsx`
  - update only if status display needs canonical current-state handling

Optional new components:

- `apps/web/components/ClaimReviewStateSummary.tsx`
- `apps/web/components/EvidenceReviewQueueFilters.tsx`
- `apps/web/components/ClaimEventHistory.tsx`

Do not create components for source reuse, evidence unlink/removal, export filtering, or Phase 3.3+ work.

### Documentation

- `PHASE_3_2_IMPLEMENTATION_PLAN.md`
  - this file

Implementation may later update manual QA documentation only if explicitly requested as part of implementation.

## Review-State Cleanup Steps

### Canonical Field Meanings

Implement these meanings exactly:

- `claims.reviewed_by_user_id` means current active reviewer.
- `claims.reviewed_at` means current active review timestamp.
- `claims.review_note` means current active review note.
- Historical reviewer, timestamp, and note data belongs in `claim_events`.

### Required Transition Behavior

Create claim:

- `review_status = draft`
- `reviewed_at = NULL`
- `reviewed_by_user_id = NULL`
- `review_note = NULL`
- write `claim_events.created`

Submit claim:

- allowed from `draft` or `needs_revision` when evidence requirements are met
- `review_status = ready_for_review`
- `reviewed_at = NULL`
- `reviewed_by_user_id = NULL`
- `review_note = NULL`
- write `claim_events.submitted_for_review`

Approve claim:

- allowed from `ready_for_review`
- `review_status = approved`
- `reviewed_at = current timestamp`
- `reviewed_by_user_id = reviewer user id`
- `review_note = approval note or NULL`
- write `claim_events.approved`

Reject claim:

- allowed from `ready_for_review`
- `review_status = rejected`
- `reviewed_at = current timestamp`
- `reviewed_by_user_id = reviewer user id`
- `review_note = rejection reason`
- write `claim_events.rejected`

Request revision:

- allowed from `ready_for_review`
- `review_status = needs_revision`
- `reviewed_at = current timestamp`
- `reviewed_by_user_id = reviewer user id`
- `review_note = revision note`
- write `claim_events.revision_requested`

Edit approved claim:

- `review_status = needs_revision`
- `reviewed_at = NULL`
- `reviewed_by_user_id = NULL`
- `review_note = NULL`
- preserve prior approval note, reviewer, and timestamp only in `claim_events`
- write `claim_events.updated`
- write `claim_events.returned_to_revision_after_edit`

Edit draft, ready-for-review, rejected, or needs-revision claim:

- update claim content and `updated_at`
- do not set `reviewed_at` or `reviewed_by_user_id`
- do not create current review fields unless a true review action occurred
- write the existing update event pattern

### UI Cleanup

Claim detail must:

- display current review fields only when they are active for the current status
- avoid showing a `Reviewed` timestamp for `ready_for_review`
- avoid showing old approval notes as current after approved-claim edit rollback
- preserve historical approval, rejection, revision, and rollback notes in the event history

Queue display must:

- use canonical `review_status`, `reviewed_at`, `reviewed_by_user_id`, and `review_note`
- show review decision date only when the current state has an active review decision
- avoid deriving current review state from badges, labels, event text, or other display-only values

## Queue Filter And Sort Additions

### Filter Inputs

Add queue filters for:

- `review_status`
- `confidence_level`
- `claim_type`
- `collection_area_id`
- linked context:
  - linked holding
  - linked collection area
  - both
  - neither
- `reviewed_by_user_id`
- `created_by_user_id`

Search may be added only if it uses persisted fields and explicit joins:

- `claims.claim_text`
- linked `holdings.title`

Use "linked context" in user-facing text. Do not use "scope" in UI labels.

### Sorting

Add sorting for:

- newest created
- oldest created
- recently updated
- stale/unreviewed first
- review decision date when a current active review decision exists

Sorting must use persisted columns only:

- `claims.created_at`
- `claims.updated_at`
- `claims.reviewed_at`
- `claims.review_status`
- explicit joins needed for linked context display

### Summary Counts

Add review queue counts for:

- `draft`
- `ready_for_review`
- `approved`
- `rejected`
- `needs_revision`

Counts must come from persisted `claims.review_status`.

### Stale/Unreviewed Logic

Define stale/unreviewed using canonical state only.

Recommended initial rule:

- unreviewed: `review_status = ready_for_review` and `reviewed_at IS NULL`
- stale: `review_status IN ('ready_for_review', 'needs_revision')` and `updated_at` is older than a fixed threshold chosen in implementation planning or code comments

If the stale threshold is not already established in the codebase, keep the threshold simple and document it in tests.

## Required Tests

Add or update tests in `apps/web/lib/phase3/claimsData.test.ts`.

### Review-State Tests

Required:

- creating a claim leaves `reviewed_at`, `reviewed_by_user_id`, and `review_note` empty
- submitting a claim leaves `reviewed_at`, `reviewed_by_user_id`, and `review_note` empty
- approving a claim sets current reviewer, current review timestamp, and active note
- rejecting a claim sets current reviewer, current review timestamp, and active note
- requesting revision sets current reviewer, current review timestamp, and active note
- editing an approved claim returns it to `needs_revision`
- editing an approved claim clears `reviewed_at`, `reviewed_by_user_id`, and `review_note`
- editing an approved claim preserves prior approval data only in `claim_events`
- event history includes `updated` and `returned_to_revision_after_edit`

### Queue Tests

Required:

- default queue includes all relevant statuses needed for librarian review
- status filter returns only matching `review_status`
- confidence filter returns only matching `confidence_level`
- claim type filter returns only matching `claim_type`
- collection area filter returns only matching `collection_area_id`
- linked-context filter distinguishes holding, collection area, both, and neither
- reviewer filter uses `reviewed_by_user_id` as current active reviewer only
- creator filter uses `created_by_user_id`
- stale/unreviewed query uses canonical fields only
- sorting by updated date uses `claims.updated_at`
- sorting by review decision date uses `claims.reviewed_at`

### Regression Tests

Required:

- export output remains available and unfiltered
- export columns remain compatible with Phase 3.1 expectations
- source reuse UI/data flow is not introduced
- evidence unlink/removal UI/data flow is not introduced
- claim workflow does not mutate `holdings`
- claim workflow does not mutate `holding_contributors`
- student and professor route/action access remains blocked where covered by existing test patterns

## Manual QA Checklist

Use a fresh SQLite database:

```bash
LIBRARY_DB_PATH=/tmp/library-phase3-2-qa.sqlite npm run dev
```

### 1. Seed Phase 2

- Log in as librarian.
- Import `apps/web/fixtures/phase2/valid-holdings.csv`.
- Confirm `Watchmen` and `Spirited Away` exist in `/collection`.
- Confirm Phase 1.2 mock titles are not mixed into Phase 2 holdings.

Expected:

- Phase 2 import still works.
- Holdings and contributors are present before Phase 3.2 testing.

### 2. Review-State Cleanup

- Create a draft claim linked to `Watchmen`.
- Confirm `reviewed_at`, `reviewed_by_user_id`, and `review_note` are empty.
- Add evidence.
- Submit the claim.
- Confirm status is `ready_for_review`.
- Confirm no current reviewed timestamp, reviewer, or review note displays.
- Approve with a note.
- Confirm status is `approved` and current review fields display.
- Edit the approved claim.
- Confirm status returns to `needs_revision`.
- Confirm current `reviewed_at`, `reviewed_by_user_id`, and `review_note` are cleared.
- Confirm prior approval data appears only in event history.

### 3. Queue Filters And Sorting

- Create or use claims across statuses: `draft`, `ready_for_review`, `approved`, `rejected`, `needs_revision`.
- Verify status filter.
- Verify confidence filter.
- Verify claim type filter.
- Verify collection area filter.
- Verify linked-context filter for linked holding, linked collection area, both, and neither where test data exists.
- Verify reviewer filter uses only current active reviewer.
- Verify creator filter.
- Verify newest, oldest, recently updated, stale/unreviewed, and review-date sorting.
- Confirm queue counts match persisted statuses.

### 4. Permissions

- Log in as student and professor.
- Confirm direct access redirects or blocks:
  - `/evidence-review`
  - `/evidence-review/new`
  - `/evidence-review/[claimId]`
  - `/evidence-review/[claimId]/edit`
  - `/evidence-review/[claimId]/evidence/new`
  - `/evidence-review/[claimId]/evidence/[evidenceId]/edit`
  - `/evidence-review/export`
- Log in as librarian and administrator.
- Confirm Phase 3.2 queue/detail pages remain accessible.

### 5. Export Regression

- Open `/evidence-review/export` as librarian.
- Confirm export still downloads.
- Confirm export is unfiltered.
- Confirm export includes Phase 3.1 fields for claims, evidence, source, relationship, status, confidence, and linked context.
- Confirm no new export filtering UI or query behavior is required for Phase 3.2.

### 6. Data Integrity

Before and after the Phase 3.2 workflow, verify:

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

- No Phase 3.2 workflow changes `holdings`.
- No Phase 3.2 workflow changes `holding_contributors`.

### 7. Deferred Risk Check

Confirm these remain deferred and documented:

- Source reuse UI is not added.
- Evidence unlink/removal UI is not added.
- Npm audit findings remain tracked separately.

## Commands To Run After Implementation

After implementation only, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not run implementation gates as part of this planning-only step unless separately requested.

## Rollback Plan

Because Phase 3.2 should be additive and mostly behavioral:

1. Revert Phase 3.2 code changes.
2. Leave additive indexes in place if they were added; unused indexes are safe for local rollback.
3. If a manual local database rollback is needed, drop only Phase 3.2-added indexes.
4. Do not drop Phase 3.1 tables.
5. Do not alter or drop Phase 2 tables.
6. Re-run Phase 3.1 manual workflow checks after rollback:
   - create claim
   - add evidence
   - submit
   - approve
   - edit approved claim back to `needs_revision`
   - verify audit trail
   - verify export
   - verify permissions
7. Re-run Phase 2 import regression with `valid-holdings.csv`.

If rollback is needed after current review fields were cleared by approved-claim edit behavior, preserve historical approval information from `claim_events`; do not attempt to reconstruct old current fields from history unless a separate migration plan is approved.
