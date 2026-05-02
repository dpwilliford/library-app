# Phase 3.4 Test Matrix

## Status

Source reuse proposal planning in progress. Treat only the "Recommended First Implementation PR Tests" and "Second Implementation PR Tests" sections as active implementation QA until additional Phase 3.4 slices are separately approved and built. Treat "Proposed Third Implementation PR Tests" as planning only.

## Phase Title

Phase 3.4 — External Source And Citation Management

## Core Guardrail

Phase 3.4 improves source and citation management only. It must not add external APIs, real AI calls, market tracking, recommendations, analytics, purchasing workflows, title genealogy automation, automatic approval, or Phase 2 holdings mutation.

## Required Automated Tests

| Area | Test | Expected result |
| --- | --- | --- |
| Schema | Additive source fields initialize on a fresh database | Existing Phase 2 and Phase 3 tables remain compatible. |
| Schema | Existing databases initialize without data loss | Existing sources, evidence, claims, and holdings remain readable. |
| Normalization | URL normalization trims whitespace, lowercases host, removes fragments | Duplicate detection uses stable normalized URL values. |
| Normalization | Citation normalization trims, lowercases, removes trailing punctuation, and collapses whitespace | Duplicate detection uses stable normalized citation keys. |
| Source reuse | Reusing a source creates a new evidence record and claim-evidence link | No duplicate source row is created. |
| Source reuse | Reusing a source does not mutate existing evidence | Existing evidence excerpt, supporting data, and date accessed remain unchanged. |
| Source reuse | Reusing a source does not mutate claims | Claim text, review status, reviewer fields, and events remain stable except for the new evidence attach event. |
| Source reuse | Reusing a source does not mutate holdings or contributors | Phase 2 holdings and contributor rows remain unchanged. |
| Validation | Evidence with reused web or publisher-page source still requires date accessed | Save is rejected without required date accessed. |
| Validation | Evidence with reused source still requires excerpt or supporting data | Save is rejected when both are blank. |
| Duplicate detection | Matching normalized URL produces advisory duplicate warning | Warning appears without automatic merge or overwrite. |
| Duplicate detection | Matching normalized citation key produces advisory duplicate warning | Warning appears without automatic merge or overwrite. |
| Duplicate detection | Duplicate warning does not block librarian-confirmed source creation | Source can still be saved deliberately. |
| Permissions | Librarian/admin roles can access source index/detail | Routes return source management UI. |
| Permissions | Student/professor users cannot access source index/detail | Routes redirect, return not found, or show no management controls. |
| Permissions | Source reuse actions reject student/professor users | No database writes occur. |
| Export | Existing evidence-review export remains compatible | Existing columns and unfiltered behavior remain stable unless separately approved. |
| Export | Source bibliography export is separate, if implemented | Source export does not replace claim/evidence export. |

## Required Manual QA

| Test | Expected result | Pass/fail | Notes |
| --- | --- | --- | --- |
| Fresh setup | App installs and runs from fresh `main` with fresh SQLite database. | Pending |  |
| Baseline checks | `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass. | Pending |  |
| Phase 2 seed import | `valid-holdings.csv` imports Watchmen and Spirited Away. | Pending |  |
| Create manual claim | Librarian can create a draft claim. | Pending |  |
| Add new source/evidence | Librarian can attach evidence with a new source. | Pending |  |
| Source index | New source appears on source index. | Pending |  |
| Source detail | Source detail shows source metadata, linked evidence, and linked claim. | Pending |  |
| Reuse source | Librarian can attach second evidence record using existing source. | Pending |  |
| No duplicate source on reuse | Source table still has one row for reused source. | Pending |  |
| Duplicate warning by URL | Creating a source with same normalized URL shows advisory warning. | Pending |  |
| Duplicate warning by citation | Creating a source with same normalized citation shows advisory warning. | Pending |  |
| Duplicate warning is not automatic merge | Librarian remains in control; no automatic merge, delete, or overwrite occurs. | Pending |  |
| Export compatibility | Existing `/evidence-review/export` remains compatible. | Pending |  |
| Source bibliography export | Separate source bibliography export works if implemented in the tested PR. | Pending |  |
| Student/professor access | Student/professor cannot access source routes or controls. | Pending |  |
| Holdings integrity | Holdings are unchanged after source reuse and duplicate checks. | Pending |  |
| Contributor integrity | Contributors are unchanged after source reuse and duplicate checks. | Pending |  |

## Non-Goal Regression Checks

Confirm Phase 3.4 implementation does not introduce:

- external API calls
- real AI/model calls
- market/vendor lookup
- prices or availability
- recommendations
- analytics calculations
- purchasing workflow
- title genealogy automation
- public source pages
- bulk source merge
- destructive source deletion
- student/professor source management

## PR Readiness Criteria

A Phase 3.4 implementation PR is ready for review only when:

- scope matches the approved PR slice
- tests cover new data behavior
- route/action permissions are covered where routes/actions changed
- existing Phase 2 and Phase 3 regression tests pass
- manual QA notes identify any untested browser behavior
- docs and changelog are updated only for the implemented slice

## Recommended First Implementation PR Tests

For the first implementation PR, cover only:

- additive source fields initialize on a fresh database
- existing source rows remain readable
- URL normalization helper behavior
- citation normalization helper behavior
- duplicate candidate query by normalized URL
- duplicate candidate query by normalized citation key
- no Phase 2 holdings/contributor mutation

Do not include route, UI, export, or source-reuse tests until those implementation slices exist.

## Second Implementation PR Tests

For the second implementation PR, cover only:

- librarian/admin users can access the read-only source index route
- student/professor users are redirected or blocked from the source index route
- librarian/admin users can access the read-only source detail route
- student/professor users are redirected or blocked from the source detail route
- missing source detail records return not found
- source index empty state renders
- source index populated state renders normalized URL/citation values and duplicate candidate counts
- source detail renders source metadata
- source detail renders linked evidence, linked claims, review status, and confidence
- source detail renders advisory duplicate candidates
- no source reuse UI, export behavior, editing, unlinking, merging, deleting, external API, or AI behavior is introduced

## Proposed Third Implementation PR Tests

Planning only. Do not treat these as implementation QA until source reuse is separately approved and built.

For the proposed third implementation PR, cover only:

- librarian/admin users can see a reusable-source selection path in the Add Evidence workflow
- student/professor users cannot see reusable-source selectors
- source reuse actions reject student/professor users
- source reuse action rejects missing source IDs
- source reuse action rejects source IDs that do not exist
- source reuse action rejects missing claim IDs
- source reuse action rejects claim IDs that do not exist
- source reuse attaches by the explicitly selected existing source ID only
- source reuse rejects evidence creation without a source ID
- source reuse stores exactly one source ID on each new evidence record
- reused web page and publisher page sources still require date accessed
- reused sources still require excerpt or supporting data on the new evidence record
- source reuse creates one new evidence record
- source reuse creates one new claim-evidence link for the target claim
- source reuse does not create a new source row
- source reuse does not mutate the reused source row
- source reuse does not mutate existing evidence rows
- source reuse does not edit, clear, unlink, or replace source IDs on existing evidence rows
- source reuse does not mutate unrelated claims
- source reuse preserves existing approved-claim revision behavior when adding evidence to an approved claim
- source reuse does not mutate Phase 2 holdings, contributors, import rows, import batches, or holding audit logs
- multiple sources with equivalent normalized URL or citation data may coexist
- duplicate-candidate signals do not auto-select, auto-attach, replace, merge, or deduplicate sources
- duplicate-candidate information remains advisory during source selection
- no export behavior, source editing, source mutation, unlinking, merging, auto-deduplication, deleting, external API, AI behavior, or Phase 2 table restructuring is introduced
