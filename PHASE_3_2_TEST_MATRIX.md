# Phase 3.2 Test Matrix

## Purpose

This matrix records the pre-PR manual QA audit for Phase 3.2 Evidence Review Queue Hardening.

Phase 3.2 is limited to canonical review-state cleanup and evidence-review queue filters/sorting. It does not include export changes, source reuse UI, evidence unlink/removal UI, holdings/contributor mutation, or Phase 3.3+ work.

## Environment

- Date: 2026-04-28
- Database: `/tmp/library-phase3-2-qa.sqlite`
- Dev command: `LIBRARY_DB_PATH=/tmp/library-phase3-2-qa.sqlite npm run dev`
- App URL: `http://localhost:3000`
- Primary QA role: `librarian@library.test`
- Permission-check roles: `student@library.test`, `professor@library.test`

## Manual QA Matrix

| Test | Expected result | Observed result | Pass/fail | Severity if failed |
| --- | --- | --- | --- | --- |
| 1. Phase 2 import | `valid-holdings.csv` imports `Watchmen` and `Spirited Away`; batch is confirmed with 2 saved, 0 rejected, 0 skipped. | Fresh DB import created 2 holdings: `Watchmen` and `Spirited Away`; import batch `valid-holdings.csv` showed 2 saved, 0 rejected, 0 skipped. | Pass | None |
| 2. Create claim, submit, approve | Claim can be created, evidence attached, submitted to `ready_for_review`, then approved. | Created a Watchmen-linked claim, attached evidence, submitted it, and approved it with note `Phase 3.2 approval note.` | Pass | None |
| 3. Edit approved claim | Editing approved claim returns status to `needs_revision`. | Editing the approved claim returned `review_status` to `needs_revision`. | Pass | None |
| 4. Clear current review fields | After approved edit rollback: `reviewed_at = NULL`, `reviewed_by_user_id = NULL`, `review_note = NULL`. | Data layer returned empty app values for all three fields after rollback, corresponding to database NULL values. | Pass | None |
| 5. Preserve prior approval only in events | Prior approval note, reviewer, and timestamp are preserved in `claim_events`, not active claim fields. | `claim_events` retained the `approved` event with note, reviewer, and timestamp. Active claim fields were cleared. Rollback event recorded `approved -> needs_revision`. | Pass | None |
| 6a. Queue status filter | Status filter returns claims matching persisted `review_status`. | `reviewStatus=approved` returned only the approved claim. | Pass | None |
| 6b. Queue linked-context filter | Linked-context filter distinguishes holding only, collection area only, both, and neither from persisted links. | Holding-only, collection-area-only, both, and neither filters returned the expected claim IDs. | Pass | None |
| 6c. Queue creator filter | Creator filter uses persisted `created_by_user_id`. | `creator-a@library.test` returned the two claims created by that user. | Pass | None |
| 6d. Queue current reviewer filter | Current reviewer filter uses active `reviewed_by_user_id` only. | `admin@library.test` returned only claims with an active review decision by that reviewer. Rolled-back claim was not included after fields cleared. | Pass | None |
| 6e. Queue search | Search uses persisted claim text and linked holding title. | Searching `Watchmen` returned claims with Watchmen linked context and matching claim text. | Pass | None |
| 7. Queue sorting | Queue supports oldest, recently updated, stale/unreviewed first, and review decision date using persisted fields. | Sorting returned deterministic order based on `created_at`, `updated_at`, `review_status`, and `reviewed_at`. Browser spot-check confirmed the sort control renders. | Pass | None |
| 8. Export unchanged/unfiltered | `/evidence-review/export` remains unfiltered and canonical; query string does not filter export. | Export route returned CSV. `/evidence-review/export?reviewStatus=approved` matched plain export and included approved, needs-revision, and ready-for-review rows. | Pass | None |
| 9. Student/professor access | Student/professor cannot access management/detail/edit/evidence/export surfaces. | Detail, edit, and add-evidence routes redirected to `/dashboard`; export returned 404. `/evidence-review` index showed non-management placeholder with no New Claim, Apply, or queue controls. | Pass | None |
| 10. Holdings/contributors unchanged | Claim workflows and queue work do not mutate Phase 2 holdings or contributors. | Watchmen holding and contributor rows were byte-for-byte unchanged before and after claim workflow. | Pass | None |

## Browser Spot Check

Librarian browser route checked:

```text
/evidence-review?reviewStatus=approved&sort=review_decision
```

Observed:

- Status summary rendered.
- Filter controls rendered, including linked context, current reviewer, and sort.
- Approved queue row rendered.
- Review decision column rendered.

## Permission HTTP Check

Observed route behavior:

- Student/professor:
  - `/evidence-review`: 200 placeholder, no management controls
  - `/evidence-review/[claimId]`: 307 to `/dashboard`
  - `/evidence-review/[claimId]/edit`: 307 to `/dashboard`
  - `/evidence-review/[claimId]/evidence/new`: 307 to `/dashboard`
  - `/evidence-review/export`: 404
- Librarian:
  - queue, detail, edit, add evidence: 200
  - export: 200 CSV

## Bugs Found

No Phase 3.2 app behavior blockers were found.

Tooling note:

- The first dev-server export request after previous build output hit a local `.next` dev-cache module error. Clearing `apps/web/.next` and restarting the dev server resolved it, and export passed afterward.
- Severity: Low tooling/cache issue.
- Blocking: No.

## PR Readiness

Phase 3.2 is ready for PR from the manual QA standpoint.

Remaining intentionally deferred items:

- Source reuse UI remains deferred to Phase 3.4.
- Evidence unlink/removal UI remains deferred to Phase 3.4.
- Export filtering remains out of scope.
