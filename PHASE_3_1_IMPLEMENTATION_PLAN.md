# Phase 3.1 Implementation Plan

## Status

This is an implementation plan only. No Phase 3.1 code has been implemented yet.

Phase 2.2 is the stable baseline and is tagged `v2.2-phase2-stable`.

## Source Documents

This plan is based strictly on:

- `PHASE_3_PLAN.md`
- `ROADMAP.md`
- `PHASE_2_AUDIT_REPORT.md`
- `PHASE_2_TEST_MATRIX.md`

## Phase 3.1 Boundary

Phase 3.1 implements Manual Claims And Evidence Foundation.

It adds a librarian-controlled evidence workflow for manual claims, sources, evidence records, claim-evidence links, review states, and Phase 3 audit events.

Phase 3.1 does not add:

- AI enrichment
- AI draft intake
- market search
- recommendations
- analytics calculations
- purchasing workflows
- external APIs
- title genealogy automation
- title, creator, contributor, or person authority records
- mutation of Phase 2 holdings or holding contributors

Use "linked context" in user-facing copy. Do not use "scope" in UI labels.

## 1. Exact Files Likely To Change

### Documentation

- `PHASE_3_1_IMPLEMENTATION_PLAN.md`
- `CHANGELOG.md`
- `README.md`, only if new local test instructions are needed

### Shared Types

- `apps/web/lib/phase3/models.ts`, new
- `apps/web/lib/phase3/claimsData.ts`, new
- `apps/web/lib/phase3/claimsData.test.ts`, new
- `apps/web/lib/phase3/permissions.ts`, new if Phase 2 permissions are not reused directly
- `apps/web/lib/phase2/db.ts`, additive schema only

### Server Actions

- `apps/web/app/evidence-review/actions.ts`, new

### Routes And Pages

- `apps/web/app/evidence-review/page.tsx`, replace placeholder with Phase 3.1 review queue
- `apps/web/app/evidence-review/new/page.tsx`, new
- `apps/web/app/evidence-review/[claimId]/page.tsx`, new
- `apps/web/app/evidence-review/[claimId]/edit/page.tsx`, new
- `apps/web/app/evidence-review/[claimId]/evidence/new/page.tsx`, new
- `apps/web/app/evidence-review/[claimId]/evidence/[evidenceId]/edit/page.tsx`, new
- `apps/web/app/evidence-review/export/route.ts`, new

Optional, only if low risk and explicitly kept read-only:

- `apps/web/app/collection/holdings/[holdingId]/page.tsx`, add linked-claims read-only section or link

Preferred Phase 3.1 approach: defer optional holding-detail changes until after the core evidence workflow passes tests.

### Components

- `apps/web/components/Badge.tsx`, reuse only; no change expected
- `apps/web/components/PlaceholderPage.tsx`, no expected change
- `apps/web/components/AppShell.tsx`, no expected change unless navigation text needs to remove placeholder language
- `apps/web/app/globals.css`, minimal additive styles only if existing classes are insufficient
- `apps/web/components/ClaimStatusBadge.tsx`, optional new helper if repeated status rendering becomes noisy
- `apps/web/components/ClaimForm.tsx`, optional new component if server pages become too large
- `apps/web/components/EvidenceForm.tsx`, optional new component if server pages become too large

### Fixtures

- `apps/web/fixtures/phase3/claims-basic.csv`, optional export comparison fixture
- `apps/web/fixtures/phase3/manual-claim-scenarios.md`, optional manual QA fixture notes

## 2. Database Migration Plan

The current app initializes SQLite schema in `apps/web/lib/phase2/db.ts` using `CREATE TABLE IF NOT EXISTS`.

Phase 3.1 migration should be additive:

1. Add new `CREATE TABLE IF NOT EXISTS` statements for:
   - `claims`
   - `sources`
   - `evidence_records`
   - `claim_evidence`
   - `claim_events`
2. Add new `CREATE INDEX IF NOT EXISTS` statements for review queue and join lookups.
3. Do not alter or drop existing Phase 2 tables.
4. Do not backfill Phase 2 data into Phase 3 tables automatically.
5. Do not create triggers unless app-level validation cannot safely enforce a rule.

Required SQLite setup remains:

- `PRAGMA journal_mode = WAL`
- `PRAGMA foreign_keys = ON`

The `date_accessed` requirement for web sources and publisher pages depends on linked `sources.source_type`. Prefer app-level validation in `claimsData.ts`. A SQLite trigger can be considered later only if app-level validation proves insufficient.

Rollback migration strategy:

- Because schema changes are additive, app rollback can be done by deploying the previous code and leaving unused Phase 3 tables in place.
- If a manual database rollback is required during local testing, drop only Phase 3 tables in this order:
  1. `claim_events`
  2. `claim_evidence`
  3. `evidence_records`
  4. `sources`
  5. `claims`
- Never drop or modify Phase 2 holdings/import/contributor tables as part of Phase 3.1 rollback.

## 3. Schema Definitions

### `claims`

```sql
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  claim_text TEXT NOT NULL CHECK (length(trim(claim_text)) > 0),
  claim_type TEXT NOT NULL CHECK (claim_type IN (
    'description',
    'historical_context',
    'creator_context',
    'format_context',
    'teaching_relevance',
    'collection_relevance',
    'other'
  )),
  related_holding_id TEXT REFERENCES holdings(id) ON DELETE SET NULL,
  collection_area_id TEXT REFERENCES collection_areas(id) ON DELETE SET NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  review_status TEXT NOT NULL CHECK (review_status IN (
    'draft',
    'ready_for_review',
    'approved',
    'rejected',
    'needs_revision'
  )),
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_by_user_id TEXT,
  reviewed_at TEXT,
  review_note TEXT
);
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_claims_review_status ON claims(review_status);
CREATE INDEX IF NOT EXISTS idx_claims_confidence_level ON claims(confidence_level);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_related_holding_id ON claims(related_holding_id);
CREATE INDEX IF NOT EXISTS idx_claims_collection_area_id ON claims(collection_area_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
```

### `sources`

```sql
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  source_title TEXT,
  source_creator TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'catalog',
    'book',
    'article',
    'publisher_page',
    'institutional_note',
    'course_material',
    'web_page',
    'other'
  )),
  source_url TEXT,
  citation TEXT,
  publisher TEXT,
  publication_date TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    length(trim(coalesce(source_title, ''))) > 0
    OR length(trim(coalesce(source_url, ''))) > 0
    OR length(trim(coalesce(citation, ''))) > 0
  )
);
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_sources_source_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_source_url ON sources(source_url);
CREATE INDEX IF NOT EXISTS idx_sources_citation ON sources(citation);
```

### `evidence_records`

```sql
CREATE TABLE IF NOT EXISTS evidence_records (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  excerpt TEXT,
  supporting_data TEXT,
  date_accessed TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    length(trim(coalesce(excerpt, ''))) > 0
    OR length(trim(coalesce(supporting_data, ''))) > 0
  )
);
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_evidence_records_source_id ON evidence_records(source_id);
CREATE INDEX IF NOT EXISTS idx_evidence_records_date_accessed ON evidence_records(date_accessed);
```

App-level validation:

- If linked `sources.source_type` is `web_page` or `publisher_page`, `date_accessed` is required.

### `claim_evidence`

```sql
CREATE TABLE IF NOT EXISTS claim_evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence_records(id) ON DELETE RESTRICT,
  relationship TEXT NOT NULL CHECK (relationship IN (
    'supports',
    'contextualizes',
    'contradicts',
    'requires_followup'
  )),
  sort_order INTEGER NOT NULL DEFAULT 1,
  UNIQUE(claim_id, evidence_id)
);
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_evidence_id ON claim_evidence(evidence_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_relationship ON claim_evidence(relationship);
```

Delete behavior:

- Claim deletion may cascade link rows.
- Evidence deletion is restricted while linked.
- Removing evidence from a claim deletes only the `claim_evidence` row and writes a `claim_events` event.

### `claim_events`

Define `claim_events.action` values before implementation:

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

```sql
CREATE TABLE IF NOT EXISTS claim_events (
  id TEXT PRIMARY KEY,
  claim_id TEXT REFERENCES claims(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'claim',
    'source',
    'evidence',
    'claim_evidence'
  )),
  entity_id TEXT NOT NULL,
  acted_by_user_id TEXT NOT NULL,
  acted_at TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created',
    'updated',
    'source_created',
    'source_updated',
    'evidence_attached',
    'evidence_updated',
    'evidence_removed',
    'submitted_for_review',
    'approved',
    'rejected',
    'revision_requested',
    'returned_to_revision_after_edit'
  )),
  old_status TEXT,
  new_status TEXT,
  old_value TEXT,
  new_value TEXT,
  note TEXT
);
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_claim_events_claim_id ON claim_events(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_entity ON claim_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_action ON claim_events(action);
CREATE INDEX IF NOT EXISTS idx_claim_events_acted_at ON claim_events(acted_at);
```

Future note:

- `entity_type` / `entity_id` is acceptable for Phase 3.1 audit flexibility.
- If audit referential integrity becomes a hard database requirement, replace it later with explicit nullable references such as `claim_entity_id`, `source_entity_id`, `evidence_entity_id`, and `claim_evidence_entity_id`.
- Do not implement that replacement in Phase 3.1 unless necessary.

## 4. Backend/Data-Layer Functions

Create `apps/web/lib/phase3/claimsData.ts`.

Expected constants/types:

- `claimTypes`
- `confidenceLevels`
- `reviewStatuses`
- `sourceTypes`
- `evidenceRelationships`
- `claimEventActions`
- `Claim`
- `Source`
- `EvidenceRecord`
- `ClaimEvidence`
- `ClaimEvent`
- `ClaimDetail`
- `ClaimFilters`
- `CreateClaimInput`
- `UpdateClaimInput`
- `CreateEvidenceInput`
- `UpdateEvidenceInput`

Expected query functions:

- `listClaims(filters?: ClaimFilters)`
- `getClaim(claimId: string)`
- `getClaimDetail(claimId: string)`
- `getClaimEvents(claimId: string)`
- `getClaimEvidence(claimId: string)`
- `listSources()`
- `getSource(sourceId: string)`
- `getEvidenceRecord(evidenceId: string)`
- `getEvidenceForClaim(claimId: string)`
- `exportClaimsCsv()`

Expected mutation functions:

- `createClaim(input: CreateClaimInput, userId: string)`
- `updateClaim(claimId: string, input: UpdateClaimInput, userId: string)`
- `createSource(input, userId: string)`
- `updateSource(sourceId: string, input, userId: string)`
- `createEvidenceRecord(input: CreateEvidenceInput, userId: string)`
- `updateEvidenceRecord(evidenceId: string, input: UpdateEvidenceInput, userId: string)`
- `attachEvidenceToClaim(claimId: string, evidenceId: string, relationship: string, userId: string)`
- `removeEvidenceFromClaim(claimId: string, evidenceId: string, userId: string)`
- `submitClaimForReview(claimId: string, userId: string)`
- `approveClaim(claimId: string, note: string, userId: string)`
- `rejectClaim(claimId: string, reason: string, userId: string)`
- `requestClaimRevision(claimId: string, note: string, userId: string)`

Expected validation helpers:

- `validateClaimInput(input)`
- `validateSourceInput(input)`
- `validateEvidenceInput(input, source)`
- `assertAllowedTransition(fromStatus, toStatus)`
- `assertClaimHasCompleteEvidence(claimId)`
- `returnApprovedClaimToRevisionIfNeeded(claimId, userId, note)`
- `insertClaimEvent(event)`

Important behavior:

- Any edit to an approved claim returns it to `needs_revision`.
- Any edit/removal/replacement of evidence linked to an approved claim returns it to `needs_revision`.
- Any edit to source title, URL, citation, creator, or type for a source used by approved claims returns affected approved claims to `needs_revision`.
- Phase 3 functions must not call Phase 2 update functions for holdings or contributors.

## 5. Routes/Pages Needed

### `/evidence-review`

Purpose:

- Claim review queue and list.

Required display:

- filters for review status, confidence, claim type, linked holding, and collection area where feasible
- visible status badges
- evidence counts
- linked context summary
- created/reviewed timestamps

### `/evidence-review/new`

Purpose:

- Create a manual claim.

Required fields:

- claim text
- claim type
- confidence level
- optional linked holding
- optional collection area

User-facing copy:

- use "linked context"
- do not use "scope"

### `/evidence-review/[claimId]`

Purpose:

- Claim detail and review actions.

Required display:

- claim text
- status and confidence
- linked context
- evidence list
- sources/citations
- event history
- review controls based on status

### `/evidence-review/[claimId]/edit`

Purpose:

- Edit draft or needs-revision claim metadata/text.
- Approved claims show locked behavior. If edit is allowed, page must warn that saving returns the claim to `needs_revision`.

### `/evidence-review/[claimId]/evidence/new`

Purpose:

- Add source/evidence and attach to claim.

Implementation choice:

- Either create source and evidence in one form for Phase 3.1 simplicity, or allow selecting an existing source.

### `/evidence-review/[claimId]/evidence/[evidenceId]/edit`

Purpose:

- Edit evidence record and possibly linked source metadata.

Required behavior:

- Warn when editing evidence/source used by an approved claim.

### `/evidence-review/export`

Purpose:

- Export claims, sources, evidence, claim-evidence links, and review state as CSV.

## 6. UI Components Needed

Reuse:

- `Badge`
- existing button, panel, form, grid, and stack CSS classes in `globals.css`
- `AppShell`

Potential new components:

- `ClaimStatusBadge`
- `ConfidenceBadge`
- `ClaimForm`
- `EvidenceForm`
- `LinkedContextSummary`
- `ClaimEventList`
- `EvidenceList`
- `ReviewActionPanel`

Required UI states:

- draft without evidence
- ready for review
- approved and locked
- rejected with reason
- needs revision with note
- incomplete evidence warning
- linked holding as read-only context

## 7. Audit/Event Actions

Use only `claim_events` for Phase 3 audit behavior.

Do not reuse or write to `holding_edit_logs`.

Required actions:

- `created`: claim created
- `updated`: claim text or metadata changed
- `source_created`: source created
- `source_updated`: source metadata changed
- `evidence_attached`: evidence linked to claim
- `evidence_updated`: evidence record changed
- `evidence_removed`: claim-evidence link removed
- `submitted_for_review`: status changed to `ready_for_review`
- `approved`: status changed to `approved`
- `rejected`: status changed to `rejected`
- `revision_requested`: status changed to `needs_revision` by reviewer
- `returned_to_revision_after_edit`: approved claim moved back to `needs_revision` because claim, evidence, source, or link changed

Audit requirements:

- Every status transition records old/new status.
- Rejection requires a note.
- Revision request requires a note.
- Approved-edit rollback requires a note.
- Evidence attachment/removal records the affected entity.
- Source/evidence edits record enough old/new value summary for review.

## 8. Tests Required

Create `apps/web/lib/phase3/claimsData.test.ts`.

Automated data-layer tests:

- creates a draft claim
- rejects blank claim text
- enforces valid claim type
- enforces valid confidence level
- enforces valid review status
- links claim to `related_holding_id`
- links claim to `collection_area_id`
- does not mutate linked holding
- does not mutate `holding_contributors`
- creates reusable source
- rejects source without title, URL, or citation
- creates evidence with source
- rejects evidence without excerpt or supporting data
- requires `date_accessed` for `web_page`
- requires `date_accessed` for `publisher_page`
- allows missing `date_accessed` for non-web source types
- attaches evidence to claim
- enforces `UNIQUE(claim_id, evidence_id)`
- blocks submit without evidence
- allows `draft -> ready_for_review`
- blocks `draft -> approved`
- allows `ready_for_review -> approved`
- allows `ready_for_review -> rejected` with reason
- blocks rejection without reason
- allows `ready_for_review -> needs_revision` with note
- blocks revision request without note
- allows `needs_revision -> ready_for_review`
- blocks `needs_revision -> approved`
- returns approved claim to `needs_revision` after claim edit
- returns approved claim to `needs_revision` after evidence edit
- returns approved claim to `needs_revision` after source metadata edit
- writes `claim_events` for all state transitions
- exports claims, sources, evidence, and review state

Regression tests:

- existing Phase 2 tests still pass
- Phase 2 valid holdings import still produces two holdings
- Phase 2 export still excludes Phase 1.2 mock titles
- Phase 2 contributor rows remain unchanged after linked claim workflow

Command gate:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 9. Manual QA Checklist

Use a fresh SQLite database.

Setup:

1. Run `npm install` if dependencies are missing.
2. Start dev server with a fresh database:

```bash
LIBRARY_DB_PATH=/tmp/library-phase3-1.sqlite npm run dev
```

3. Log in as `librarian@library.test`.
4. Import `apps/web/fixtures/phase2/valid-holdings.csv`.
5. Confirm Phase 2 Test 1 still behaves as documented.

Claim workflow:

1. Open `/evidence-review`.
2. Create a new claim with no linked context.
3. Confirm it appears as `draft`.
4. Confirm draft without evidence cannot be submitted.
5. Add source and evidence.
6. Submit claim for review.
7. Approve claim.
8. Confirm approved claim is locked by default.
9. Edit approved claim or evidence.
10. Confirm status returns to `needs_revision`.
11. Confirm `returned_to_revision_after_edit` event appears.
12. Return claim to `ready_for_review`.
13. Reject a separate claim with a reason.
14. Request revision on a separate ready claim with a note.

Linked context:

1. Create a claim linked to Watchmen.
2. Confirm linked context displays holding title, local identifier, collection area, and status.
3. Confirm no controls update holding metadata.
4. Confirm Watchmen holding data is unchanged.
5. Confirm Watchmen contributor rows are unchanged.

Export:

1. Open `/evidence-review/export`.
2. Confirm CSV includes claim IDs, source IDs, evidence IDs, relationship, status, confidence, linked holding ID, and collection area ID.
3. Confirm provisional vs approved state is preserved.

Role checks:

1. Log in as student.
2. Confirm student cannot manage claims.
3. Log in as professor.
4. Confirm professor cannot manage claims.

## 10. Rollback Plan

### Code Rollback

If implementation causes a regression before merge:

1. Stop and do not proceed to Phase 3.2.
2. Revert only Phase 3.1 branch changes.
3. Re-run Phase 2 post-merge verification from `POST_MERGE_CHECKLIST.md`.

If implementation is merged and must be disabled:

1. Revert the Phase 3.1 merge commit.
2. Leave additive Phase 3 tables unused unless a manual database cleanup is explicitly approved.
3. Re-run Phase 2 Test 1 with `valid-holdings.csv`.

### Database Rollback

For local development databases only, and only with explicit approval:

```sql
DROP TABLE IF EXISTS claim_events;
DROP TABLE IF EXISTS claim_evidence;
DROP TABLE IF EXISTS evidence_records;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS claims;
```

Never include Phase 2 tables in Phase 3.1 rollback:

- `holdings`
- `holding_contributors`
- `holding_edit_logs`
- `holding_original_values`
- `import_batches`
- `import_rows`
- `collection_areas`

### Stability Gate After Rollback

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Then repeat Phase 2 post-merge Test 1:

- fresh SQLite database
- import `valid-holdings.csv`
- confirm 2 valid rows
- confirm 2 imported, 0 skipped
- confirm Watchmen and Spirited Away holdings
- confirm Watchmen contributors
- confirm export columns and no Phase 1.2 mock titles

## Implementation Order

1. Add additive schema and indexes in `db.ts`.
2. Add Phase 3 models/types.
3. Add data-layer validation and tests.
4. Add create/list/detail data functions.
5. Add evidence/source/link functions.
6. Add review transition functions and audit events.
7. Add export function.
8. Add server actions.
9. Replace `/evidence-review` placeholder with queue page.
10. Add claim create/detail/edit pages.
11. Add evidence create/edit pages.
12. Add export route.
13. Run full automated gate.
14. Run manual QA checklist.

Stop after Phase 3.1. Do not begin Phase 3.2 until Phase 3.1 is reviewed, tested, and explicitly approved.
