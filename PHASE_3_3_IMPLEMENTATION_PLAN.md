# Phase 3.3 Implementation Plan

## Status

Planning only. Do not implement application code from this document until implementation is explicitly approved.

Phase 3.3 is limited to deterministic mock AI-assisted intake preview. It must not call a real OpenAI API or any external model API.

## Controlling Invariant

AI intake candidates are non-record preview objects. They are not stored, have no IDs, do not appear in queries, are not exportable, and cannot influence any system output unless a librarian/admin explicitly saves them into normal Phase 3 draft records.

This invariant must be preserved in every implementation decision.

At no point prior to librarian/admin save may any value produced by AI intake be addressable by a system identifier, query, route, export, review queue, or audit/event trail.

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

## Phase Boundary

Phase 3.3 may add a mock AI intake preview workflow, but it must preserve:

- Phase 2 import behavior.
- Phase 3.1 claim/evidence/source/review workflow.
- Phase 3.2 queue filtering, sorting, canonical review state, and approved-edit rollback behavior.
- Existing export behavior.
- Holdings/contributors integrity.
- Existing student/professor permission restrictions.

## Data Model Plan

Do not add candidate tables.

Do not add candidate IDs.

Do not add candidate records to any existing table.

Do not add candidate audit events.

No schema change is expected for Phase 3.3. If implementation discovers that a schema change is needed, stop and propose a revised plan before coding.

Saved candidates should become normal Phase 3 records only after explicit librarian/admin save. At that moment, use existing creation functions for:

- claim draft creation
- source creation when selected candidate data includes source fields
- evidence record creation when selected candidate data includes evidence fields
- claim/evidence relationship creation when both claim and evidence are saved

## Candidate Object Shape

Candidate objects should be plain in-memory/request-response data. They should not include database identity fields.

Suggested candidate fields:

- `claimText`
- `claimType`
- `confidenceLevel`
- `sourceTitle`
- `sourceCreator`
- `sourceType`
- `sourceUrl`
- `citation`
- `publisher`
- `publicationDate`
- `excerpt`
- `supportingData`
- `dateAccessed`
- `relationship`
- `uncertaintyNote`

Do not include:

- `id`
- `claimId`
- `sourceId`
- `evidenceId`
- `reviewStatus`
- `createdAt`
- `updatedAt`
- `reviewedAt`
- `reviewedByUserId`
- `claimEventId`

## Deterministic Generation Rules

Candidate generation should be deterministic and local.

Allowed:

- Split pasted text into candidate blocks using stable delimiters such as blank lines.
- Extract obvious URL-like text as `sourceUrl`.
- Extract quoted text or first sentence-like text as an evidence excerpt.
- Produce conservative default values when raw text is incomplete.
- Mark uncertainty in plain language.

Required:

- Same raw text must produce the same candidate values.
- Empty or whitespace-only raw text must produce a validation error.
- Preview generation must not call `getDb`.
- Preview generation must not call Phase 3 creation functions.
- Preview generation must not write files or database rows.

## Save Flow

The save action should:

1. Require a logged-in user.
2. Verify librarian/admin evidence-management permission.
3. Receive selected edited candidate data from form state.
4. Validate selected candidate data.
5. Reject candidates that cannot form a valid draft claim and evidence/source set.
6. Call existing Phase 3 creation functions only after validation succeeds.
7. Create saved records as normal `draft` Phase 3 records.
8. Return or redirect to the saved claim/detail page or evidence-review queue.

The save action must not trust hidden form fields blindly. It must validate all selected candidate fields as if they came from an untrusted request.

## Permission Plan

Librarian/admin:

- may access intake page
- may generate previews
- may edit candidates in form state
- may save selected candidates

Student/professor:

- may not access intake page
- may not generate previews
- may not save candidates
- must not see AI intake controls on the review queue

Unauthenticated users:

- redirected to login by existing session behavior

## Export Plan

Do not change export.

Unsaved candidates are not exportable because they are not records. Saved draft records participate in export only through existing Phase 3 export behavior.

Do not add export filters, columns, candidate sections, candidate filenames, or candidate metadata.

## Queue Plan

Do not change Phase 3.2 queue semantics.

Unsaved candidates must not affect:

- queue rows
- status counts
- search results
- filters
- sorting
- current reviewer lists
- creator lists

Saved draft records should appear only because they are normal Phase 3 draft claims.

## Audit Plan

Preview generation creates no audit events.

No `claim_events` row should exist before explicit save because no claim exists before explicit save.

After explicit save, existing Phase 3 creation functions may create normal events for saved records. Do not add candidate-specific audit events before save.

If a future implementation wants to mark saved claims as created from mock AI intake, that marker must be proposed carefully so it does not imply unsaved candidate persistence.

## Files Likely To Change After Approval

Likely implementation files:

- `apps/web/app/evidence-review/page.tsx`
- `apps/web/app/evidence-review/ai-draft/page.tsx`
- `apps/web/app/evidence-review/ai-draft/actions.ts`
- `apps/web/lib/phase3/mockAiIntake.ts`
- `apps/web/lib/phase3/mockAiIntake.test.ts`
- `apps/web/lib/phase3/claimsData.test.ts`

Documentation files:

- `PHASE_3_3_PLAN.md`
- `PHASE_3_3_IMPLEMENTATION_PLAN.md`
- `PHASE_3_3_MANUAL_TESTING_GUIDE.md`
- `PHASE_3_3_TEST_MATRIX.md`
- `CHANGELOG.md`

Avoid changing:

- Phase 2 database schema.
- Phase 2 import behavior.
- Phase 2 holdings/contributor mutation functions.
- Existing export route behavior.
- Existing Phase 3 review transition behavior unless a regression requires a scoped fix.

## Tests Required

### Pure Candidate Generation

- Same raw text returns same candidates.
- Whitespace raw text returns validation error.
- Candidate objects have no IDs.
- Candidate objects have no review status.
- Candidate generation does not call database functions.
- Candidate generation does not create claim/source/evidence/event rows.
- Candidate generation produces zero database inserts/updates.
- Candidate generation produces no `claim_events` or audit events.
- Candidate generation does not affect review queue results.
- Candidate generation does not affect export output.

### Save Action

- Librarian/admin can save selected valid candidate data.
- Saved candidate becomes a normal draft claim.
- Saved draft has empty current review fields.
- Save action rejects invalid selected data.
- Save action rejects unselected candidates.
- Save action rejects student/professor users.
- Save action rejects unauthenticated users through existing session behavior.
- Librarian/admin save action is the first moment records are created.
- Saved records use existing Phase 3 creation functions and enter as `review_status = draft`.

### Regression

- Phase 2 import still works.
- Holdings/contributors are unchanged after preview generation.
- Holdings/contributors are unchanged after candidate save.
- Phase 3.1 create/source/evidence/submit/approve/reject/revision workflow still works.
- Phase 3.2 queue filters/sorting still work.
- Approved edit rollback still clears current review fields.
- Export remains unchanged and unfiltered.
- Unsaved candidates never appear in export.
- Unsaved candidates never appear in queue queries or status counts.

## Manual QA Checklist

- Fresh main.
- Fresh install.
- Fresh SQLite database.
- Run lint/typecheck/tests/build.
- Import `apps/web/fixtures/phase2/valid-holdings.csv`.
- Confirm `Watchmen` and `Spirited Away` still import correctly.
- Open mock AI intake as librarian/admin.
- Paste raw text and generate preview candidates.
- Confirm no database rows are created after preview generation.
- Confirm candidates show no IDs.
- Confirm candidates do not appear in review queue.
- Confirm candidates do not appear in export.
- Edit candidate fields in preview.
- Select one candidate and save.
- Confirm saved item is a normal draft Phase 3 record.
- Confirm unselected candidates were not saved.
- Continue saved draft through existing Phase 3.1 evidence review workflow.
- Confirm Phase 3.2 queue filters/sorting still work with saved draft.
- Confirm approved edit rollback still clears current review fields.
- Log in as student/professor and confirm no intake access or controls.
- Compare holdings/contributors before and after preview/save workflow.

## Risks

- Preview candidates accidentally become persisted rows.
- Preview candidates accidentally receive IDs.
- Preview candidates accidentally affect queue counts or exports.
- Save action accidentally bypasses existing Phase 3 validation.
- Save action accidentally creates partial records if later validation fails.
- UI copy makes preview candidates sound like system knowledge.
- Permission checks expose intake to non-librarian roles.
- Later real AI work reuses this workflow without preserving the non-record invariant.

## Implementation Gate

Before coding begins:

- Confirm no real AI/API call will be used.
- Confirm candidate objects remain non-record objects.
- Confirm no schema changes are needed.
- Confirm export remains unchanged.
- Confirm permission behavior remains librarian/admin only.
- Confirm tests will cover no writes during preview generation.

Do not begin Phase 3.4 or Phase 4 work as part of Phase 3.3.
