# Phase 3 Plan

## Status

Phase 2.2 has been merged, audited, tested, and tagged as `v2.2-phase2-stable`.

This document is planning only. No Phase 3 code has been implemented yet.

## Inputs Reviewed

Planning source documents:

- `ROADMAP.md`
- `PHASE_2_AUDIT_REPORT.md`
- `PHASE_2_TEST_MATRIX.md`
- `PROJECT_BRIEF.md`
- `DATA_RULES.md`
- `AI_BEHAVIOR.md`

## Current Roadmap Phase 3 Items

`ROADMAP.md` currently defines Phase 3 as Evidence and Review Workflow.

Listed Phase 3 deliverables:

- claim records
- evidence records
- confidence levels
- librarian review queue
- approval/rejection workflow
- audit log

## Phase 2 Baseline

Phase 2 is stable under controlled testing for:

- SQLite-backed local holdings
- CSV import preview and explicit confirmation
- required-field validation
- warning-state import behavior
- duplicate detection and duplicate skipping
- import batch traceability
- import row outcome tracking
- holding detail review
- audit/edit-log creation
- original imported value preservation
- CSV export
- structured contributor storage, display, and export
- role-limited holdings management surface

Phase 3 must not weaken any of these guarantees.

## Phase 3 Definition

### Core Objective

Phase 3 adds the Evidence and Review Workflow: a human-reviewed knowledge layer where claims about titles, creators, formats, collection relevance, teaching relevance, historical context, and local collection interpretation can be recorded with evidence, confidence, review state, and audit history.

Phase 3 fundamentally adds reviewed knowledge management. It does not make recommendations, purchase decisions, AI enrichment, market tracking, analytics calculations, or title genealogy automation authoritative.

### Required Systems

Phase 3 includes:

- claim records
- evidence/source records
- claim-evidence relationships
- confidence levels
- review statuses
- librarian review queue
- approval, rejection, and revision-request workflow
- audit log for claim/evidence review actions
- read-only links from claims to existing Phase 2 holdings when relevant
- export of claims, evidence, review state, and audit data

### Explicit Exclusions

Phase 3 does not include:

- AI-generated enrichment as a saved workflow
- automated claim approval
- title biography generation
- title genealogy, adaptation, translation, or reissue graph modeling
- market search, vendor links, prices, availability, or preorder tracking
- acquisition recommendations
- student or professor recommendation forms
- head librarian purchase decision workflow
- analytics dashboards or collection-balance calculations
- duplicate-resolution merge/update workflow for Phase 2 holdings
- production authentication replacement
- external APIs
- automated scheduled research

AI may be discussed in planning, but Phase 3.1 implementation should not call an AI model or store AI-generated suggestions.

## Phase 3 Sub-Phases

### Phase 3.1 — Manual Claims And Evidence Foundation

Build the core local data model and librarian-controlled UI for manually creating, editing, reviewing, approving, rejecting, exporting, and auditing claims and evidence.

This phase is independently testable because all records are created manually and linked only to existing Phase 2 holdings by optional reference. It does not require AI, market data, recommendations, or title genealogies.

### Phase 3.2 — Evidence Review Queue Hardening

Improve review operations after the basic data model exists.

Expected scope:

- queue filters by status, confidence, collection area, claim type, and reviewer
- revision-needed workflow
- bulk-safe review views without bulk approval
- stronger audit views
- stale/unreviewed claim reports
- export filters for reviewed vs provisional knowledge

This phase depends only on Phase 3.1 data and should not add AI or market features.

### Phase 3.3 — AI Draft Intake Without Authority

Add a controlled intake lane for deterministic mock AI-assisted preview candidates.

Expected scope:

- generate non-persistent preview candidates from pasted raw text
- keep candidates as non-record objects with no IDs
- do not store candidates in the database
- do not allow candidates to participate in queries, review queues, counts, or export
- require librarian/admin review, edit, selection, and explicit save before any records are created
- convert selected candidates into normal Phase 3 draft records only at librarian/admin save
- use existing Phase 3 creation functions when selected candidates are saved

This phase must preserve the rule: AI assists, AI does not decide.

### Phase 3.4 — External Source And Citation Management

Improve reusable source handling.

Status note:

- Phase 3.4 first implementation slice has started with additive source normalization fields, helper functions, duplicate candidate lookup by normalized URL/citation, and data-layer tests.
- Current Phase 3.4 work remains limited to source/citation management foundations.
- Phase 3.4 must not add source reuse UI, source management routes, source bibliography routes, external APIs, export changes, market behavior, or automatic approval unless a later slice is separately approved.

Expected scope:

- source records reused across evidence entries
- source type, URL, citation, publisher, author, date, and access date
- source reliability notes
- duplicate source detection by URL/citation
- exportable source bibliography

This phase supports later field knowledge and market work but does not implement market tracking.

### Phase 3.5 — Phase 3 Closeout Audit

Audit the full Phase 3 evidence workflow before moving to Phase 4.

Expected scope:

- controlled fixtures or seed scenarios
- manual QA checklist
- claim/evidence export checks
- audit-log verification
- regression checks proving Phase 2 holdings remain unchanged by claim workflows
- documented limitations and merge recommendation

## Phase 3.1 Specification

### Purpose

Phase 3.1 creates the first evidence-backed review system.

It lets librarians manually record a claim, attach one or more pieces of evidence, assign a confidence level, route the claim through review, and preserve all review actions in an audit log.

The system should make it clear when a claim is provisional, approved, rejected, or needs revision. It should also make clear that Phase 2 holdings remain the authority for ownership and are not overwritten by claims.

### Data Model Changes

Add claim, source, evidence, claim-evidence link, and Phase 3 audit/event tables. Names below are conceptual and can be adjusted during implementation if the codebase pattern suggests clearer names.

All Phase 3.1 schema changes should be additive. Do not alter Phase 2 `holdings`, `holding_contributors`, `holding_edit_logs`, `import_batches`, `import_rows`, or `holding_original_values` tables unless a separate reviewed migration plan is approved.

Phase 3.1 should not use loose polymorphic `scope_type` / `scope_id` references. For this phase, claims may link only through explicit nullable foreign keys:

- `related_holding_id`
- `collection_area_id`

Title, creator, contributor, and person authority scopes are deferred until those entities exist as real reviewed records. Phase 1.2 mock title data must not become a Phase 3.1 foreign-key target.

#### `claims`

Purpose: stores a discrete knowledge claim.

Fields:

- `id`
- `claim_text`
- `claim_type`
- `related_holding_id`
- `collection_area_id`
- `confidence_level`
- `review_status`
- `created_by_user_id`
- `created_at`
- `updated_at`
- `reviewed_by_user_id`
- `reviewed_at`
- `review_note`

Rules:

- `id` is required and should be an app-generated UUID.
- `claim_text` is required and must not be blank.
- `claim_type` is required.
- `confidence_level` is required.
- `review_status` is required.
- `created_by_user_id`, `created_at`, and `updated_at` are required.
- `related_holding_id` is optional and must be a read-only foreign-key reference to `holdings(id)` when present.
- `collection_area_id` is optional and must be a read-only foreign-key reference to `collection_areas(id)` when present.
- A claim may have neither link when it is a general evidence-backed assertion.
- A claim may have both links when it is about a specific holding within a collection area.
- Claim workflows must never update the linked holding or collection-area records.

Suggested `claim_type` values:

- `description`
- `historical_context`
- `creator_context`
- `format_context`
- `teaching_relevance`
- `collection_relevance`
- `other`

Informal notes are not Phase 3.1 claims. A claim is always an evidence-backed assertion. If a librarian wants to preserve a local observation, it must be written as a claim with evidence or deferred to a later annotation/notes feature.

Do not add `local_note` as a claim type in Phase 3.1 unless it is explicitly defined as an evidence-backed assertion and follows the same evidence, confidence, review, export, and audit rules as every other claim.

Allowed `confidence_level` values:

- `low`
- `medium`
- `high`

Allowed `review_status` values:

- `draft`
- `ready_for_review`
- `approved`
- `rejected`
- `needs_revision`

Recommended constraints:

- `claim_text TEXT NOT NULL CHECK (length(trim(claim_text)) > 0)`
- `claim_type TEXT NOT NULL CHECK (claim_type IN (...allowed claim types...))`
- `confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high'))`
- `review_status TEXT NOT NULL CHECK (review_status IN ('draft', 'ready_for_review', 'approved', 'rejected', 'needs_revision'))`
- `related_holding_id TEXT REFERENCES holdings(id) ON DELETE SET NULL`
- `collection_area_id TEXT REFERENCES collection_areas(id) ON DELETE SET NULL`
- `created_by_user_id TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `reviewed_by_user_id TEXT`
- `reviewed_at TEXT`
- `review_note TEXT`

Recommended indexes:

- `claims(review_status)`
- `claims(confidence_level)`
- `claims(claim_type)`
- `claims(related_holding_id)`
- `claims(collection_area_id)`
- `claims(created_at)`

#### `sources`

Purpose: stores reusable source metadata separately from evidence excerpts or supporting data.

Fields:

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

Rules:

- `id` is required and should be an app-generated UUID.
- `source_type` is required.
- At least one of `source_title`, `source_url`, or `citation` is required.
- Source records are not themselves evidence-backed claims.
- Source records may be reused by multiple evidence records.

Allowed `source_type` values:

- `catalog`
- `book`
- `article`
- `publisher_page`
- `institutional_note`
- `course_material`
- `web_page`
- `other`

Recommended constraints:

- `source_type TEXT NOT NULL CHECK (source_type IN (...allowed source types...))`
- `CHECK (length(trim(coalesce(source_title, ''))) > 0 OR length(trim(coalesce(source_url, ''))) > 0 OR length(trim(coalesce(citation, ''))) > 0)`
- `created_by_user_id TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Recommended indexes:

- `sources(source_type)`
- `sources(source_url)`
- `sources(citation)`

#### `evidence_records`

Purpose: stores the specific excerpt, supporting data, or source observation used as evidence.

Fields:

- `id`
- `source_id`
- `excerpt`
- `supporting_data`
- `date_accessed`
- `created_by_user_id`
- `created_at`
- `updated_at`

Rules:

- `id` is required and should be an app-generated UUID.
- `source_id` is required and references `sources(id)`.
- At least one of `excerpt` or `supporting_data` is required.
- `date_accessed` is required when the linked source is a web source or publisher page.
- Evidence does not become authoritative by itself; review state belongs to the claim.
- Evidence may be linked to multiple claims through `claim_evidence`.

Recommended constraints:

- `source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT`
- `CHECK (length(trim(coalesce(excerpt, ''))) > 0 OR length(trim(coalesce(supporting_data, ''))) > 0)`
- `created_by_user_id TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Recommended indexes:

- `evidence_records(source_id)`
- `evidence_records(date_accessed)`

#### `claim_evidence`

Purpose: links claims to evidence.

Fields:

- `id`
- `claim_id`
- `evidence_id`
- `relationship`
- `sort_order`

Rules:

- `claim_id` is required.
- `evidence_id` is required.
- One evidence record may be linked to multiple claims.
- One claim may have many evidence records.
- The same evidence record must not be linked to the same claim more than once.

Allowed `relationship` values:

- `supports`
- `contextualizes`
- `contradicts`
- `requires_followup`

Recommended constraints:

- `claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE`
- `evidence_id TEXT NOT NULL REFERENCES evidence_records(id) ON DELETE RESTRICT`
- `relationship TEXT NOT NULL CHECK (relationship IN ('supports', 'contextualizes', 'contradicts', 'requires_followup'))`
- `sort_order INTEGER NOT NULL DEFAULT 1`
- `UNIQUE(claim_id, evidence_id)`

Recommended indexes:

- `claim_evidence(claim_id)`
- `claim_evidence(evidence_id)`
- `claim_evidence(relationship)`

ON DELETE behavior:

- Deleting a claim may remove its claim-evidence link rows.
- Deleting an evidence record should be restricted while any claim links to it.
- Removing evidence from a claim should remove only the join row and create a Phase 3 audit event.

#### `claim_events`

Purpose: records every Phase 3 claim, evidence, source, and claim-evidence action.

Do not reuse `holding_edit_logs`. Phase 2 holding edit logs are scoped to holding metadata. Phase 3 requires a separate audit/event table because it must cover claims, sources, evidence, and evidence links without implying that holdings changed.

Fields:

- `id`
- `claim_id`
- `entity_type`
- `entity_id`
- `acted_by_user_id`
- `acted_at`
- `action`
- `old_status`
- `new_status`
- `old_value`
- `new_value`
- `note`

Allowed `entity_type` values:

- `claim`
- `source`
- `evidence`
- `claim_evidence`

Suggested `action` values:

- `created`
- `updated`
- `source_created`
- `source_updated`
- `evidence_attached`
- `evidence_updated`
- `evidence_removed`
- `submitted_for_review`
- `approved`
- `rejected`
- `revision_requested`
- `returned_to_revision_after_edit`

Rules:

- `claim_id` is required for claim lifecycle events and evidence-link events.
- `entity_type`, `entity_id`, `acted_by_user_id`, `acted_at`, and `action` are required.
- `old_status` and `new_status` are required for review-status transitions.
- `note` is required for rejection, revision request, and approved-claim edit rollback.
- Phase 3 events must not create or update `holding_edit_logs`.

Recommended constraints:

- `claim_id TEXT REFERENCES claims(id) ON DELETE CASCADE`
- `entity_type TEXT NOT NULL CHECK (entity_type IN ('claim', 'source', 'evidence', 'claim_evidence'))`
- `entity_id TEXT NOT NULL`
- `acted_by_user_id TEXT NOT NULL`
- `acted_at TEXT NOT NULL`
- `action TEXT NOT NULL`

Recommended indexes:

- `claim_events(claim_id)`
- `claim_events(entity_type, entity_id)`
- `claim_events(action)`
- `claim_events(acted_at)`

### Contributor Boundary

`holding_contributors` stores bibliographic contributor data for Phase 2 holdings. Its `role` value describes a person's relationship to a work or holding, for example writer, illustrator, director, or creator.

Phase 3.1 authorship and review fields describe app workflow users, not bibliographic contributors:

- `created_by_user_id`
- `reviewed_by_user_id`
- `acted_by_user_id`

Phase 3.1 must not:

- create person or creator authority records
- infer contributor roles from claims or evidence
- mutate `holding_contributors`
- use `holding_contributors.role` as evidence-review authorship

Claims may mention a contributor in claim text or evidence, but that mention remains plain reviewed knowledge until a later creator/person authority model exists.

### UI Changes

Add evidence workflow UI without changing the Phase 2 holdings workflow.

Required UI surfaces:

- Evidence Review index page
- New Claim form
- Claim detail page
- Claim edit page or edit mode
- Evidence add/edit form
- Review action controls
- Claim export action

The UI must show:

- claim text
- claim type
- linked holding, if any, as read-only context
- collection area, if any
- confidence level
- review status
- evidence count
- evidence excerpts or supporting data
- source/citation/date accessed
- review history
- clear provisional vs approved labels

Phase 3.1 should continue using the shared badge/status component rules documented in `DESIGN_SYSTEM.md`.

Required UI states:

- `draft` without evidence: visibly incomplete, editable, cannot be approved, may not be submitted until at least one evidence record is linked.
- `ready_for_review`: awaiting librarian review, evidence visible, approval/rejection/revision actions available to permitted librarian roles.
- `approved`: locked by default. Editing an approved claim, source, evidence record, or claim-evidence link must return the claim to `needs_revision` and create a Phase 3 audit event.
- `rejected`: visible for audit with rejection reason, not treated as approved knowledge, and not hidden from librarian review history.
- `needs_revision`: visible with required revision note, editable, and eligible to return to `ready_for_review` after changes.
- incomplete evidence: visible warning when evidence lacks required excerpt/supporting data or required web access date; cannot support approval until corrected.
- linked holding context: displays title, external local identifier, collection area, and status from Phase 2 as read-only reference; no Phase 3 controls may update holding metadata or contributors.

### Routes And Pages

Recommended routes:

- `/evidence-review`
  - review queue and claim list
- `/evidence-review/new`
  - create manual claim
- `/evidence-review/[claimId]`
  - claim detail, evidence list, review log, review actions
- `/evidence-review/[claimId]/edit`
  - edit claim metadata and text while preserving audit history
- `/evidence-review/[claimId]/evidence/new`
  - attach new evidence
- `/evidence-review/[claimId]/evidence/[evidenceId]/edit`
  - edit evidence while preserving audit history
- `/evidence-review/export`
  - CSV export of claims, evidence, review state, and audit references

Optional Phase 3.1 route if low risk:

- `/collection/holdings/[holdingId]/claims`
  - filtered view of claims linked to a holding

If this optional route risks disturbing the stable holding detail workflow, defer it to Phase 3.2.

### Workflows

#### Create Manual Claim

1. Librarian opens New Claim.
2. Librarian enters claim text, type, confidence level, optional linked holding, and optional collection area.
3. Claim saves as `draft`.
4. Audit log records `created`.

#### Attach Evidence

1. Librarian opens a claim.
2. Librarian adds source details and excerpt/supporting data.
3. Evidence links to the claim.
4. Audit log records `evidence_attached`.
5. Claim remains in its current status unless explicitly submitted.

#### Submit For Review

1. Librarian confirms the claim has evidence.
2. Claim status changes from `draft` or `needs_revision` to `ready_for_review`.
3. Audit log records `submitted_for_review`.

#### Approve Claim

1. Librarian opens a `ready_for_review` claim.
2. Librarian checks evidence, confidence, and scope.
3. Librarian approves with optional note.
4. Claim status changes to `approved`.
5. Reviewer and reviewed timestamp are saved.
6. Audit log records `approved`.

#### Reject Claim

1. Librarian opens a claim.
2. Librarian rejects with required reason.
3. Claim status changes to `rejected`.
4. Audit log records `rejected`.

#### Request Revision

1. Librarian opens a claim.
2. Librarian requests revision with required note.
3. Claim status changes to `needs_revision`.
4. Audit log records `revision_requested`.

#### Export Claims

1. Librarian opens export route.
2. System exports claims with evidence and review state.
3. Export includes IDs needed to trace claim, evidence, linked holding, status, and review log.

### Review State Transitions

Allowed status transitions:

| From | To | Requirement |
| --- | --- | --- |
| `draft` | `ready_for_review` | Claim has at least one linked evidence record and required fields are complete. |
| `ready_for_review` | `approved` | Claim has at least one linked evidence record, evidence is complete, and reviewer explicitly approves. |
| `ready_for_review` | `rejected` | Reviewer enters a rejection reason. |
| `ready_for_review` | `needs_revision` | Reviewer enters a revision note. |
| `needs_revision` | `ready_for_review` | Required revisions are made and the claim has at least one linked evidence record. |

Disallowed direct transitions:

- `draft` to `approved`
- `draft` to `rejected`
- `needs_revision` to `approved`
- `rejected` to `approved`
- `approved` to `rejected` without first returning to `needs_revision`

Approved edit behavior:

- Approved claims are read-only by default.
- If an approved claim is edited, its status must change to `needs_revision`.
- If evidence linked to an approved claim is edited, removed, or replaced, the claim status must change to `needs_revision`.
- If a source used by evidence linked to an approved claim is edited in a way that changes citation, URL, title, creator, or source type, affected approved claims must change to `needs_revision`.
- Each rollback from `approved` to `needs_revision` must create a `claim_events` row with action `returned_to_revision_after_edit` and a required note explaining what changed.
- The previous approval reviewer and timestamp may remain historically visible, but the current status must no longer be `approved`.

### Constraints

Phase 3.1 must follow these constraints:

- No AI-generated claim workflow.
- No automatic approval.
- No automatic changes to Phase 2 holdings.
- No merge/update/delete behavior for holdings.
- No external APIs.
- No market data.
- No recommendation decisions.
- No analytics calculations.
- Student and professor users must not manage claims in Phase 3.1.
- Demo authentication remains a known limitation unless separately scoped.
- Every approved claim must have at least one evidence record.
- Every claim status change must be logged.
- Rejected claims must remain visible to librarians for audit.
- Exports must preserve provisional vs approved state.
- Informal notes and annotations are not Phase 3.1 records unless they are formal evidence-backed claims.
- Phase 3.1 must not create title, creator, contributor, or person authority records.
- Phase 3.1 must not mutate `holding_contributors`.

### Test Requirements

Automated tests should cover:

- creating a draft claim
- requiring claim text, claim type, confidence level, and review status
- enforcing claim enum/check constraints
- linking only through `related_holding_id` and `collection_area_id`
- attaching evidence to a claim
- creating a reusable source record
- requiring evidence content
- requiring `date_accessed` for web sources
- enforcing `UNIQUE(claim_id, evidence_id)`
- submitting a claim for review
- approving a claim only when evidence exists
- blocking direct `draft` to `approved`
- blocking `needs_revision` to `approved`
- rejecting a claim with a reason
- requesting revision with a note
- returning approved claims to `needs_revision` when claim text, linked evidence, or linked source metadata changes
- writing audit log entries for each state change
- writing audit events for source, evidence, and claim-evidence link changes
- exporting claims and evidence
- linking a claim to a holding without changing the holding
- proving claim workflows do not mutate `holding_contributors`
- role restrictions for student/professor users

Manual QA should cover:

- claim list filtering by status
- visual distinction between draft, ready, approved, rejected, and needs revision
- draft without evidence state
- approved locked state
- rejected reason display
- needs-revision note display
- incomplete evidence warning
- linked holding read-only context
- claim detail readability
- evidence excerpt display
- audit trail readability
- CSV export inspection
- regression check that Phase 2 holdings import/export still passes Test 1 with `valid-holdings.csv`

SQL/data checks should verify:

- approved claims have evidence
- rejected claims remain queryable
- review logs preserve old/new statuses
- linked holdings retain original Phase 2 metadata
- linked holding contributors retain original Phase 2 contributor rows
- `claim_evidence` does not contain duplicate claim/evidence pairs
- evidence records reference valid sources
- source records can support more than one evidence record
- exports include claim IDs and evidence IDs

## Risk Analysis

### Risks To Phase 2 Data Integrity

Risk: claims could be mistaken for catalog authority.

Mitigation: keep claims in separate tables and label them as reviewed knowledge, not holdings data. Phase 2 holdings remain authoritative for ownership.

Risk: linked claim workflows could update holding fields accidentally.

Mitigation: make holding links read-only references. Do not add claim actions that write to holdings.

Risk: approved claims could obscure original imported values.

Mitigation: keep Phase 2 original value preservation unchanged and show claims separately from imported holding metadata.

### Migration Risks

Risk: new schema setup could affect existing SQLite databases.

Mitigation: use additive tables only in Phase 3.1. Do not alter existing Phase 2 holdings/import/contributor tables unless a reviewed migration plan is created.

Risk: source/evidence relationships could become difficult to migrate if source metadata is embedded in evidence records.

Mitigation: normalize `sources`, `evidence_records`, and `claim_evidence` from the start.

Risk: `ON DELETE SET NULL` for linked holdings or collection areas could reduce historical context if a referenced Phase 2 record is removed later.

Mitigation: Phase 2 currently does not silently delete holdings. If deletion is introduced later, require an archival strategy or copied display snapshot before allowing destructive deletes.

### UI Complexity Risks

Risk: evidence review could crowd the existing collection UI.

Mitigation: keep Phase 3.1 primarily under `/evidence-review`. Add holding-linked claim views only if they do not disturb holding review.

Risk: users may confuse evidence-backed claims with informal notes.

Mitigation: do not build informal annotations in Phase 3.1. Every claim must be an evidence-backed assertion with confidence, review status, and exportable audit history.

Risk: review statuses and confidence levels could confuse users.

Mitigation: use consistent badges, plain-language labels, and explicit help text that differentiates provisional, ready, approved, rejected, and needs-revision states.

Risk: too many actions could create accidental approvals.

Mitigation: require explicit review buttons, confirmation language, and required notes for rejection/revision.

### Performance Risks

Risk: evidence and claims could grow faster than the small Phase 2 fixture set.

Mitigation: add basic indexes on `review_status`, `confidence_level`, `claim_type`, `related_holding_id`, `collection_area_id`, and join-table IDs.

Risk: export could become expensive if claim/evidence joins are unbounded.

Mitigation: keep Phase 3.1 export simple and test with enough sample data to catch obvious join duplication problems.

Risk: review queue filters could become slow.

Mitigation: start with server-side queries and indexed fields; avoid client-only filtering over large datasets.

## Phase 3.1 Exit Criteria

Phase 3.1 is complete when:

- manual claims can be created, edited, reviewed, approved, rejected, and exported
- evidence can be attached and displayed
- approved claims require evidence
- review status and confidence are visible everywhere claims appear
- audit logs record claim lifecycle actions
- Phase 2 holdings are unchanged by claim workflows
- Phase 2 post-merge Test 1 still passes
- documentation clearly states that no AI, market, recommendation, analytics, or purchasing workflow has been introduced
