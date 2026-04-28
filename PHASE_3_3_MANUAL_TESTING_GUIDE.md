# Phase 3.3 Manual Testing Guide

## Status

Planning and pre-implementation safeguards only. Do not run this guide as implementation QA until Phase 3.3 feature code is separately approved and built.

## Phase Title

Phase 3.3 — AI Draft Intake Without Authority

## Core Invariant

AI intake candidates are non-record preview objects. They are not stored, have no IDs, do not appear in queries, are not exportable, and cannot influence any system output unless a librarian/admin explicitly saves them into normal Phase 3 draft records.

At no point prior to librarian/admin save may any value produced by AI intake be addressable by a system identifier, query, route, export, review queue, or audit/event trail.

## Fresh Verification Setup

Use:

- fresh `main`
- fresh install
- fresh SQLite database
- no real OpenAI API call
- no external model API call

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Manual QA Checklist

### Baseline Stability

- Import `apps/web/fixtures/phase2/valid-holdings.csv`.
- Confirm Phase 2 import behavior is unchanged.
- Confirm holdings and contributors are recorded as expected.
- Confirm Phase 3.1 manual claim/source/evidence workflow still works.
- Confirm Phase 3.2 review queue filters and sorting still work.
- Confirm export is unchanged and unfiltered.

### Candidate Preview Boundary

- Log in as librarian/admin.
- Open the AI intake preview route.
- Paste raw text.
- Generate preview candidates.
- Confirm candidates are labeled as previews and non-records.
- Confirm candidates have no visible IDs.
- Confirm no database rows are created during preview generation.
- Confirm no `claim_events` or audit events are created during preview generation.
- Confirm candidates do not appear in the review queue.
- Confirm candidates do not affect review queue counts or filters.
- Confirm candidates do not appear in export.
- Confirm export output is unchanged before and after preview generation.
- Confirm there is no reusable candidate URL/detail page backed by stored candidate data.

### Permissions

- Log in as student.
- Confirm student cannot access candidate generation or save actions.
- Log in as professor.
- Confirm professor cannot access candidate generation or save actions.
- Confirm student/professor users do not see AI intake controls.

### Explicit Save Boundary

- Log in as librarian/admin.
- Generate preview candidates.
- Edit candidate fields in form state.
- Select one candidate.
- Explicitly save the selected candidate.
- Confirm this save action is the first moment records are created.
- Confirm unselected candidates are not saved.
- Confirm saved records use existing Phase 3 creation functions.
- Confirm saved records enter as `review_status = draft`.
- Confirm saved draft records have empty current review fields.
- Continue saved records through the existing Phase 3.1 workflow.
- Confirm Phase 3.2 approved edit rollback still clears current review fields.

### Data Integrity

- Compare holdings before and after preview generation.
- Compare holdings after selected candidate save.
- Compare contributors before and after preview generation.
- Compare contributors after selected candidate save.
- Confirm holdings/contributors are not mutated.

## Non-Goals To Recheck During QA

- No real OpenAI API call.
- No candidate persistence.
- No candidate IDs.
- No export changes.
- No source reuse UI.
- No evidence unlink/removal UI.
- No Phase 2 import changes.
- No Phase 3.1 workflow changes.
- No Phase 3.2 queue behavior changes.
