# Phase 3.4 Plan

## Status

Second implementation slice in progress. Do not implement additional Phase 3.4 application code from this document until a separate implementation prompt is approved for that slice.

Phase 3.3 is closed. Phase 3.4 now includes additive source normalization fields, data-layer duplicate lookup helpers, and read-only source index/detail routes inside the existing Phase 3 evidence-review workflow.

## Phase Title

Phase 3.4 — External Source And Citation Management

## Core Objective

Phase 3.4 improves reusable source and citation handling for evidence records.

The goal is to let librarians find, inspect, reuse, and cleanly cite existing source records before attaching evidence to claims. This phase supports evidence quality and reduces duplicate source records. It does not make sources, claims, or AI output authoritative without human review.

## Scope

Phase 3.4 includes:

- source index for librarian/admin review
- source detail page with linked evidence and claims
- reusable source selection for evidence creation
- duplicate source detection by normalized URL and normalized citation text
- source metadata quality fields, if needed
- source reliability notes
- source bibliography export
- permission checks for source/citation management
- tests proving source reuse does not mutate holdings, contributors, claims, or existing evidence unexpectedly

## Exact Non-Goals

Phase 3.4 does not include:

- external APIs
- real AI calls
- market search
- vendor links
- price or availability tracking
- recommendations
- analytics
- purchasing workflows
- title genealogy automation
- automatic source approval
- automatic claim approval
- bulk source merge
- destructive source deletion
- public source pages
- student/professor source-management access
- mutation of Phase 2 holdings or contributors
- changing existing claim review states without an explicitly approved source-edit rule

## Proposed Schema Additions

Prefer additive schema changes only. Existing Phase 3 tables should remain compatible.

Existing `sources` fields already include:

- `id`
- `source_title`
- `source_creator`
- `source_type`
- `source_url`
- `citation`
- `publisher`
- `publication_date`
- `created_by_user_id`
- `created_at`
- `updated_at`

Proposed additive fields:

- `source_reliability_note TEXT`
- `source_access_note TEXT`
- `normalized_source_url TEXT`
- `normalized_citation_key TEXT`

Proposed indexes:

- `sources(normalized_source_url)`
- `sources(normalized_citation_key)`
- `sources(source_type)`

Do not add source authority tables, citation-style tables, market listing tables, or source approval tables in the first Phase 3.4 implementation PR.

## Source Reuse Rules

- A source may be linked to many evidence records.
- Evidence records continue to store the excerpt, supporting data, and date accessed separately from source metadata.
- Reusing a source must create a new evidence record and claim-evidence link; it must not duplicate the source row.
- Reusing a source must not change existing evidence records.
- Reusing a source must not change linked claims, review statuses, holdings, or contributors.
- Creating evidence from a reused source must still require excerpt or supporting data.
- Web and publisher-page sources must continue to require date accessed at evidence creation time.
- User-facing language should say "source" and "citation"; do not use vague internal terms like "scope."

## Duplicate Detection Rules

Duplicate detection is advisory in Phase 3.4.

Detect likely duplicate sources when:

- normalized source URLs match exactly
- normalized citation keys match exactly
- source title and creator are both present and match after normalization

Normalization should:

- trim whitespace
- lowercase hostnames
- remove URL fragments
- remove common trailing punctuation from citation keys
- collapse repeated whitespace

Duplicate detection must not:

- merge records automatically
- delete records
- block saving a librarian-confirmed source
- overwrite source metadata
- change evidence links
- change claim review status

## Route And Page Plan

Routes implemented in the second slice:

- `/evidence-review/sources`
  - source index
  - librarian/admin only
  - read-only normalized URL/citation display
  - advisory duplicate candidate counts

- `/evidence-review/sources/[sourceId]`
  - source detail
  - linked evidence records
  - linked claims and review statuses
  - advisory duplicate candidate details
  - export/citation metadata display without export behavior changes

Deferred route enhancements:

- source type, URL present, citation present, duplicate warning, and search filters on the source index

- Existing `/evidence-review/[claimId]/evidence/new`
  - add optional existing-source selector in a later implementation PR
  - preserve current new-source creation path

- Existing `/evidence-review/[claimId]/evidence/[evidenceId]/edit`
  - source metadata display remains controlled
  - source reassignment is deferred unless separately approved

Do not create public source routes.

## Export Expectations

Phase 3.4 may add a source bibliography export after the source index/detail foundation is stable.

Expected export behavior:

- existing `/evidence-review/export` remains compatible unless an export change is explicitly approved
- new source bibliography export, if added, should be separate from claim/evidence export
- bibliography export should include source ID, title, creator, source type, URL, citation, publisher, publication date, reliability note, access note, duplicate-normalization fields if approved, created/updated timestamps, and linked evidence count
- unsaved AI intake candidates remain excluded from all exports

## Permission Model

Allowed:

- librarian
- collection-area librarian
- head librarian
- administrator

Blocked:

- student
- professor
- unauthenticated users

Permission checks must exist at both route and server-action levels.

Students and professors may not see source management routes, reusable-source selectors, duplicate warnings, or source bibliography exports in Phase 3.4.

## Risks

- Duplicate detection could imply automatic authority where none exists.
- Source reuse could accidentally mutate existing evidence.
- Source edits could affect approved claims without forcing review.
- Bibliography export could accidentally change existing claim/evidence export behavior.
- Source management UI could become a backdoor for Phase 4 AI enrichment or Phase 8 market work.
- Normalized URL/citation fields could be treated as permanent identifiers too early.

## Rollback

Implementation should remain additive.

Rollback plan:

- Revert Phase 3.4 app code.
- Leave unused additive source columns and indexes in local SQLite unless a reviewed database cleanup is explicitly approved.
- Do not drop Phase 2 tables.
- Do not drop Phase 3 claims, evidence, claim-evidence, or claim-events tables.
- If a manual local rollback is required, remove only Phase 3.4 additive source columns/indexes after backing up the database.

## Manual QA Checklist

- Start from fresh `main`.
- Use a fresh SQLite database.
- Run `npm test`.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Import `apps/web/fixtures/phase2/valid-holdings.csv`.
- Create a manual claim.
- Create evidence with a new source.
- Confirm source appears on the source index.
- Open source detail.
- Confirm linked evidence and claim appear.
- Create second evidence record by reusing the existing source.
- Confirm only one source row exists for reused source.
- Confirm both evidence records link to the same source.
- Confirm duplicate source warning appears for matching URL/citation but does not block librarian confirmation.
- Confirm existing claim/evidence export remains compatible.
- Confirm source bibliography export, if implemented, is separate.
- Confirm student/professor cannot access source routes or controls.
- Confirm holdings and contributors are unchanged before and after source reuse.

## Minimal PR Sequence

1. Planning docs and test matrix.
2. Additive source schema fields and normalization helpers with data-layer tests only.
3. Source index/detail read-only routes with permission tests.
4. Existing-source reuse on Add Evidence with data-layer and route/action tests.
5. Advisory duplicate detection UI with tests.
6. Source bibliography export, only after reuse and duplicate behavior are stable.

Do not combine all Phase 3.4 capabilities into one PR.

## Recommended First Implementation PR

The first implementation PR should add only additive source normalization fields/helpers and tests. It should not add routes, UI, source reuse controls, export changes, or duplicate-warning UI yet.

Current status: implemented in the local worktree and passing automated checks.

## Second Implementation PR

The second implementation PR should add only read-only source index/detail routes with route-level permission tests and rendering tests for empty, populated, linked-evidence, and duplicate-candidate states. It should not add source reuse UI, export changes, editing, unlinking, merging, deleting, external APIs, or AI calls.

Current status: implemented in the local worktree and passing automated checks. Remaining Phase 3.4 capabilities still require separate approval before implementation.
