# Phase 3.2 Plan

## Status

Planning only. Do not implement Phase 3.2 from this document until a separate implementation prompt is approved.

Phase 3.1 has been merged, verified, and tagged as `v3.1-manual-claims-evidence`.

## Source Documents

This plan is based on:

- `ROADMAP.md`
- `PHASE_3_PLAN.md`
- `PHASE_3_1_IMPLEMENTATION_PLAN.md`
- `PHASE_3_1_MANUAL_TESTING_GUIDE.md`
- `PHASE_3_1_TEST_MATRIX.md`
- `CHANGELOG.md`

## Core Objective

Phase 3.2 hardens review-state semantics first, then uses those stable states to improve the Evidence Review Queue so librarians can reliably find, triage, inspect, and review Phase 3.1 claims without weakening Phase 2 holdings stability or expanding into a new product area.

The contained system for this phase is:

- Evidence review-state cleanup and queue operations

This means Phase 3.2 improves the existing claim review surface. It does not add AI intake, source management, evidence cleanup workflows, recommendations, analytics, purchasing, market work, or external APIs.

## New Capability Beyond Phase 3.1

Phase 3.1 added the manual claim, source, evidence, link, review, audit, and export foundation.

Phase 3.2 adds review-state cleanup and queue hardening:

- Deterministic review-state rules for when `reviewed_at`, `reviewed_by_user_id`, and `review_note` are set, cleared, displayed, or preserved historically.
- Clear `approved` -> edit -> `needs_revision` semantics that preserve audit history without treating the old approval as current.
- Queue filters for review status, confidence level, claim type, collection area, linked holding presence, and reviewer/creator when available.
- Queue sorting for newest, oldest, recently updated, stale/unreviewed, and priority review states.
- Review-state summary counts so librarians can see draft, ready, approved, rejected, and needs-revision workload at a glance.
- A focused stale/unreviewed claims view based on `updated_at`, `reviewed_at`, and current `review_status`.
- Stronger claim audit visibility from the queue and detail pages.
- Review-state display cleanup for Phase 3.1 issues where `reviewed_at` and old approval notes can confuse the current status.

Review-state cleanup is the first priority. Queue filters and sorting are secondary and must derive from stable, deterministic claim state.

The goal is operational confidence: librarians should understand what needs attention, why it needs attention, what changed most recently, and whether a displayed review note is current or historical.

## Explicitly Out Of Scope

Phase 3.2 must not add:

- AI enrichment
- AI draft intake
- model, prompt, or generated-suggestion storage
- automated claim approval
- external APIs
- market search, vendor links, price tracking, availability, or purchasing workflows
- acquisition recommendations
- analytics dashboards or collection-balance calculations
- title genealogy, biography, adaptation, translation, or reissue modeling
- student/professor evidence-review access
- Phase 1.2 mock-title dependencies
- mutation of Phase 2 holdings or holding contributors
- new source reuse UI
- evidence removal or unlink UI
- source bibliography management
- duplicate source detection
- bulk approval, bulk rejection, or bulk status mutation
- export filtering or export column changes

Known deferred Phase 3.1 risks remain deferred unless separately approved:

- Source reuse is not exposed in UI and remains deferred to Phase 3.4.
- Evidence removal/unlink is not exposed in UI and remains deferred to Phase 3.4.
- Npm audit findings are tracked separately.

## Data Model Changes

No new tables are expected for Phase 3.2.

Allowed additive schema work:

- Add indexes only if needed for queue filters or stale/unreviewed queries.
- Add indexes only on existing Phase 3.1 tables.
- Do not alter Phase 2 tables.
- Do not alter or drop Phase 3.1 columns.
- Do not backfill or migrate Phase 2 holdings into Phase 3 records.

Potential additive indexes to evaluate during implementation:

- `claims(review_status, updated_at)`
- `claims(review_status, reviewed_at)`
- `claims(review_status, confidence_level)`
- `claims(review_status, claim_type)`
- `claims(review_status, collection_area_id)`
- `claims(reviewed_by_user_id)`
- `claims(created_by_user_id)`
- `claim_events(claim_id, acted_at)`

Review-state cleanup should prefer deterministic workflow semantics and display rules before schema changes:

- `reviewed_at` and `reviewed_by_user_id` are set only when a librarian makes a review decision: approve, reject, or request revision.
- `reviewed_at` and `reviewed_by_user_id` are not set when a claim is created, edited, or submitted for review.
- `review_note` stores the current active review decision note only when the current status is `approved`, `rejected`, or `needs_revision` because of an explicit review decision.
- When a `draft` or `needs_revision` claim is submitted to `ready_for_review`, active `review_note`, `reviewed_at`, and `reviewed_by_user_id` should not be displayed as current decision context.
- When an `approved` claim is edited, the claim returns to `needs_revision`; `reviewed_at`, `reviewed_by_user_id`, and active `review_note` are set to `NULL`.
- Prior approval note, reviewer, and timestamp are preserved only in `claim_events`.
- Historical notes remain visible in the audit trail.

Canonical field meanings:

- `reviewed_by_user_id` means current active reviewer, not latest historical reviewer.
- `reviewed_at` means current active review timestamp, not latest historical review timestamp.
- `review_note` means current active review note only.
- Historical review data belongs in `claim_events`.

If implementation discovers that note/timestamp cleanup requires a small additive field, it must be proposed in a separate implementation plan before code changes.

## UI And Workflow Changes

### Review-State Cleanup

Review-state cleanup comes before queue filters and sorting.

Required state behavior:

- Create claim: status is `draft`; `reviewed_at`, `reviewed_by_user_id`, and active `review_note` are empty.
- Submit claim: status changes to `ready_for_review`; no review decision timestamp or reviewer is set.
- Approve claim: status changes to `approved`; `reviewed_at`, `reviewed_by_user_id`, and active `review_note` reflect the approval decision.
- Reject claim: status changes to `rejected`; `reviewed_at`, `reviewed_by_user_id`, and active `review_note` reflect the rejection decision.
- Request revision: status changes to `needs_revision`; `reviewed_at`, `reviewed_by_user_id`, and active `review_note` reflect the revision request.
- Edit approved claim: status changes to `needs_revision`; `reviewed_at`, `reviewed_by_user_id`, and active `review_note` are set to `NULL`; the prior approval note, reviewer, and timestamp remain only in audit history.

Required UI behavior:

- Distinguish current decision fields from historical audit notes.
- Avoid showing a `Reviewed` timestamp for `ready_for_review` claims unless there is a current review decision.
- Make `approved` -> edit -> `needs_revision` visible as a rollback requiring renewed review.
- Keep all historical approval, rejection, revision, and rollback notes visible through the event history.

### Evidence Review Queue

After review-state cleanup, improve `/evidence-review` as the main librarian review workspace.

Required queue controls:

- Status filter
- Confidence filter
- Claim type filter
- Collection area filter
- Linked-context filter for linked holding, collection area, both, or neither
- Reviewer/creator filter when data is available
- Sort control
- Search within claim text and linked holding title when supported by existing data access patterns

Queue filters and sorting must use persisted claim fields and explicit joins only, not display-derived state.

Required queue display:

- Claim text preview
- Current review status
- Confidence level
- Claim type
- Linked context summary
- Evidence count
- Last updated date
- Review decision date, only when the current state has an active review decision
- Clear indication for stale or unreviewed claims

Use "linked context" in user-facing text. Do not use "scope" in UI labels.

### Claim Detail

Improve the claim detail page as a review decision surface.

Required detail improvements:

- Make current status and next allowed actions obvious.
- Separate current review state from historical approval/rejection notes.
- Preserve the full claim event history.
- Make rollback-to-`needs_revision` understandable without implying that the old approval is still active.
- Keep evidence, sources, and linked holdings read-only except through existing Phase 3.1 edit routes.

### Audit Visibility

Improve audit review without changing the `claim_events` table contract.

Required audit behavior:

- Show claim lifecycle events in chronological order.
- Include actor, action, old status, new status, note, and timestamp where present.
- Distinguish lifecycle events from source/evidence/link events.
- Ensure every state transition remains traceable.

### Export Behavior

Keep `/evidence-review/export` working as Phase 3.1 defined it.

Phase 3.2 does not change export behavior.

Required export behavior:

- Export remains unfiltered.
- Export reflects canonical data only.
- Do not add query-string filters, reviewed/provisional export modes, filenames for filtered exports, or export column changes in Phase 3.2.

## Permissions And Access

Phase 3.2 must preserve the Phase 3.1 permissions fix.

Required:

- Student and professor users cannot access evidence-review queue, detail, management, review, or export routes.
- Unauthenticated users are redirected to login.
- Librarian and administrator users retain access.
- Server-action permission checks remain in place.
- Route-level checks must cover every new or changed Phase 3.2 route.

## Risks To Phase 3.1 Stability

Primary risks:

- Filtered queue queries could accidentally hide claims that need review.
- Review-state display changes could make historical approval/rejection notes look current.
- Review-state cleanup could accidentally rewrite or hide historical decision context.
- Additional indexes must remain additive and must not alter existing schema behavior.
- Queue actions must not introduce bulk mutation paths or bypass evidence requirements.

Required safeguards:

- Define review-state field behavior before adding queue filters.
- Keep the default queue broad enough to show all actionable claims.
- Preserve an "all statuses" or equivalent librarian view.
- Add tests for filters and default queue visibility.
- Add tests that approved claims edited back to `needs_revision` do not display stale approval context as current.
- Add tests proving full export still includes claims, evidence, sources, relationships, and review state.
- Add tests proving Phase 3.2 does not add filtered export behavior.
- Re-run Phase 3.1 permissions checks after implementation.

## Risks To Phase 2 Stability

Phase 3.2 must not weaken the Phase 2 Collection Graph.

Risks:

- Linked-context filters may join against holdings or collection areas incorrectly.
- Claim detail or queue pages could imply claim edits mutate holdings.
- Export or search work could accidentally depend on Phase 1.2 mock title data.

Required safeguards:

- Claims remain read-only references to holdings and collection areas.
- No Phase 3.2 workflow may write to `holdings`, `holding_contributors`, `holding_edit_logs`, `import_batches`, `import_rows`, or `holding_original_values`.
- Phase 2 import regression must be rerun during implementation QA.
- Data integrity checks must compare holdings and contributors before and after a claim review workflow.

## Implementation Gate

Before Phase 3.2 implementation begins, create a separate `PHASE_3_2_IMPLEMENTATION_PLAN.md` that specifies:

- exact files expected to change
- exact review-state field behavior
- exact query/filter behavior
- any additive indexes
- route-level permission checks
- tests to add
- manual QA sequence
- rollback plan

Do not start Phase 3.3 or source/citation management work from this plan.
