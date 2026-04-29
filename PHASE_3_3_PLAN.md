# Phase 3.3 Plan

## Status

Planning only. Do not implement Phase 3.3 application code from this document until a separate implementation prompt is approved.

Phase 3.2 has been merged, verified, and tagged as `v3.2-review-queue-hardening`.

## Closeout Polish Status

Phase 3.3 implementation has since been merged through the deterministic mock AI intake preview route and selected-candidate save boundary.

Current closeout polish remains part of Phase 3.3. It is limited to evidence-review queue clarity, AI intake preview-only language, saved-draft confirmation after explicit save, and responsive review layout.

Roadmap Phase 3.4 remains External Source And Citation Management and has not started. Phase 3.3 closeout polish must not introduce source reuse UI, citation management, duplicate source detection, new source/citation data models, source bibliography routes, external APIs, or export changes.

## Phase Title

Phase 3.3 — AI Draft Intake Without Authority

## Ground Rules

Phase 3.3 must preserve:

- Phase 2 import stability.
- Phase 3.1 manual claim, source, evidence, review, and audit workflow stability.
- Phase 3.2 review queue filter, sort, rollback, and canonical review-state behavior.
- Existing export behavior unless an export change is explicitly approved.
- Holdings and contributors integrity. Phase 3.3 must not mutate `holdings` or `holding_contributors`.
- Existing role-based permissions. Student and professor routes must not gain AI intake permissions.

## Candidate Non-Record Invariant

AI intake candidates are non-record preview objects. They are not stored, have no IDs, do not appear in queries, are not exportable, and cannot influence any system output unless a librarian/admin explicitly saves them into normal Phase 3 draft records.

This invariant is the controlling rule for Phase 3.3. If any proposed behavior would make an unsaved candidate visible to the review queue, exports, detail pages, audits, APIs, or any other system output, that behavior is out of scope.

## Core Objective

Phase 3.3 introduces a deterministic, mock AI-assisted intake preview workflow for librarians and admins. A librarian/admin can paste raw source or research text, generate non-persistent, non-record candidate objects, review and edit those candidates, select which ones should become records, and explicitly save selected candidates into the existing Phase 3 draft workflow.

The purpose is to test the intake and authority boundary before any real AI model call is added.

Phase 3.3 does not make AI authoritative. It does not create reviewable knowledge until a librarian/admin explicitly saves a selected candidate as a normal Phase 3 draft record.

## User-Facing Problem

Librarians need a faster way to turn raw research notes, citations, excerpts, and source text into structured draft claim/evidence proposals without bypassing human review.

Phase 3.3 solves this by providing a preview workflow:

1. Paste raw text.
2. Generate deterministic candidate objects.
3. Review, edit, and select candidates.
4. Explicitly save selected candidates into regular Phase 3 draft records.
5. Continue through the existing Phase 3.1 and Phase 3.2 workflows.

## Exact Scope

Phase 3.3 includes:

- A librarian/admin-only intake page.
- A raw text input form.
- Deterministic candidate generation from submitted raw text.
- Candidate objects that live only in request/response form state.
- Editable preview candidates.
- Explicit candidate selection.
- Explicit save action for selected candidates.
- Save action permission validation.
- Save action selected-candidate validation.
- Save action that calls existing Phase 3 creation functions only at the moment of librarian/admin save.
- Saved records created as normal Phase 3 draft records.
- Clear UI language that candidates are previews, not records.
- Tests and manual QA proving unsaved candidates do not affect queries, exports, review queue, audit events, claims, sources, or evidence records.

## Implementation Requirements

- Candidate generation is pure/deterministic from submitted raw text.
- Candidate objects live only in request/response form state.
- No database writes during preview generation.
- No `claim_events` during preview generation.
- No review queue visibility during preview generation.
- No export visibility during preview generation.
- No reusable candidate URL/detail page unless it regenerates from user-provided text and still remains unsaved.
- Save action validates permissions.
- Save action validates selected candidate data.
- Save action calls existing Phase 3 creation functions only at the moment of librarian/admin save.

## Pre-Implementation Technical Rules

Allowed function names:

- `generateAICandidates`
- `previewAICandidates`
- `validateSelectedAICandidatesForSave`

Prohibited function names:

- `createAIDraft`
- `saveAIPreview`
- `storeAICandidate`
- `persistAICandidate`
- `createCandidateRecord`

Type boundary:

- Candidate types must not be shaped like claims, sources, or evidence records.
- Candidate types must not be imported into persistence/query modules.
- Candidate generation must be pure/deterministic from submitted raw text.
- Candidate generation must perform zero database writes.

## Explicit Non-Goals

Phase 3.3 does not include:

- Real OpenAI API calls.
- Any external AI/model API call.
- Background processing.
- Automatic publication.
- Automatic approval.
- Automatic submission for review.
- Automatic source reuse.
- Source reuse UI.
- Evidence unlink/removal UI.
- Export changes.
- Export filtering.
- New export columns.
- Candidate persistence.
- Candidate IDs.
- Candidate detail pages backed by stored data.
- Candidate query APIs.
- Student/professor access to AI intake.
- Holdings mutation.
- Contributor mutation.
- Phase 3.4 source/citation management.
- Phase 4 AI-assisted catalog enhancement.
- Market, recommendation, analytics, purchasing, title genealogy, or external API work.

## Stability Boundaries

### Phase 2

Phase 3.3 may read existing holdings and collection areas as optional linked context for saved draft records. It must not update imported holding metadata, original values, import batches, import rows, holding edit logs, or holding contributors.

### Phase 3.1

Phase 3.3 must use existing Phase 3 creation functions when selected candidates are saved. Saved candidates become ordinary draft claims/sources/evidence records and then follow the existing evidence, submit, approve, reject, revision, and audit rules.

### Phase 3.2

Unsaved candidates must not appear in review queue filters, sorting, counts, detail pages, current review fields, or rollback behavior. Once saved, records must behave like any other Phase 3 draft.

### Export

Export remains unchanged. Unsaved candidates are never exportable. Saved draft records may appear only because they are normal Phase 3 records under the existing export behavior.

### Permissions

Only librarian/admin users may access candidate generation and save actions. Student/professor users must not gain AI intake route, action, preview, or save permissions.

## Files Likely Affected

Planning and documentation:

- `PHASE_3_3_PLAN.md`
- `PHASE_3_3_IMPLEMENTATION_PLAN.md`
- `PHASE_3_3_MANUAL_TESTING_GUIDE.md`
- `PHASE_3_3_TEST_MATRIX.md`
- `CHANGELOG.md`

Application files likely affected after implementation is approved:

- `apps/web/app/evidence-review/page.tsx`
- `apps/web/app/evidence-review/ai-draft/page.tsx`
- `apps/web/app/evidence-review/ai-draft/actions.ts`
- `apps/web/lib/phase3/claimsData.ts`
- `apps/web/lib/phase3/models.ts`
- `apps/web/lib/phase3/claimsData.test.ts`
- Possible new helper: `apps/web/lib/phase3/mockAiIntake.ts`
- Possible new tests: `apps/web/lib/phase3/mockAiIntake.test.ts`

Do not create database tables for candidates in Phase 3.3.

## Tests Required

Automated tests must prove:

- Candidate generation produces zero database inserts/updates.
- Candidate generation is deterministic for the same raw text.
- Candidate generation performs no database writes.
- Candidate generation creates no IDs.
- Candidate generation creates no `claims`.
- Candidate generation creates no `sources`.
- Candidate generation creates no `evidence_records`.
- Candidate generation creates no `claim_events`.
- Candidate generation creates no audit events.
- Unsaved candidates do not appear in `listClaims`.
- Candidate generation does not affect review queue results.
- Unsaved candidates do not affect review status counts.
- Unsaved candidates do not appear in export.
- Candidate generation does not affect export output.
- Save action requires librarian/admin permission.
- Student/professor users cannot access candidate generation or save actions.
- Save action rejects invalid selected candidate data.
- Librarian/admin save action is the first moment records are created.
- Save action calls existing Phase 3 creation flow at save time.
- Saved records are `draft`.
- Saved records have empty current review fields.
- Saved records then follow existing Phase 3.1 submit/review behavior.
- Phase 3.2 queue filters/sorting still work after saved drafts exist.
- Export remains unchanged and unfiltered.
- Holdings and contributors are unchanged before and after candidate generation and save.
- Student/professor users cannot access intake routes or actions.

## Manual QA Checklist

- Fresh `main`.
- Fresh install.
- Fresh SQLite database.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` passes.
- Phase 2 import still imports `valid-holdings.csv`.
- Phase 3.1 manual claim/evidence workflow still works.
- Phase 3.2 review queue filters/sorting still work.
- Librarian/admin can open the mock AI intake page.
- Student/professor cannot open the mock AI intake page.
- Pasting raw text and generating preview candidates does not create database rows.
- Preview candidates have no visible IDs.
- Preview candidates do not appear in the review queue.
- Preview candidates do not appear in export.
- Preview candidates do not create audit events.
- Librarian/admin can edit and select candidates.
- Saving selected candidates creates normal draft records.
- Saved draft records can continue through existing evidence review workflow.
- Approved edit rollback still clears current review fields.
- Export remains unchanged and unfiltered.
- Holdings/contributors are unchanged before and after preview generation and save.

## Risks

- Candidate previews could accidentally become hidden records.
- Candidate previews could accidentally appear in queue counts, search, or export.
- Save logic could bypass existing Phase 3 validation.
- UI language could imply that generated candidates are knowledge records.
- Permissions could accidentally expose intake to student/professor roles.
- Future AI implementation could be bolted onto this workflow without preserving the non-record invariant.
- Candidate save could accidentally mutate linked holdings/contributors.

Mitigation:

- Keep candidate generation pure and deterministic.
- Keep candidates in request/response form state only.
- Use existing Phase 3 creation functions only during explicit save.
- Add regression tests for no writes, no IDs, no query visibility, no export visibility, and no Phase 2 mutation.

## Recommended PR Split

Split Phase 3.3 into smaller PRs:

1. Planning/docs PR for Phase 3.3 boundaries and QA documents.
2. Deterministic candidate generator PR with pure-function tests and no app persistence.
3. Librarian/admin intake UI and save-action PR with route/action permission tests and full regression QA.

Do not combine real AI integration with Phase 3.3.
