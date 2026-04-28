# Phase 3.1 Test Matrix

## Purpose

This matrix records the 2026-04-27 manual QA audit for Phase 3.1 Manual Claims And Evidence Foundation, with a 2026-04-28 focused rerun for the route-level permissions blocker.

Environment:

- Database: `/tmp/library-phase3-1-qa.sqlite`
- Dev command: `LIBRARY_DB_PATH=/tmp/library-phase3-1-qa.sqlite npm run dev`
- App URL: `http://localhost:3000`
- Primary role: `librarian@library.test`

## Manual QA Matrix

| Test | Expected result | Observed result | Pass/fail | Severity if failed |
| --- | --- | --- | --- | --- |
| 1. Seed Phase 2 with `valid-holdings.csv` | Import creates `Watchmen` and `Spirited Away`; batch shows 2 saved / 0 skipped; holdings appear on `/collection`. | Browser file chooser could not be automated in this audit. Equivalent `valid-holdings.csv` rows were seeded into the fresh SQLite DB, then `/collection` showed `Watchmen`, `Spirited Away`, and a `valid-holdings.csv` batch with 2 saved / 0 skipped. | Pass with tooling limitation | None for app behavior; manual browser upload remains an audit gap. |
| 2. Draft claim with no evidence | Claim saves as `draft`; linked context displays; submit is blocked; error says evidence is required. | Claim saved as `draft`; linked context showed `Watchmen (1001), Comics / Graphic Novels, Available`; submit returned `Claim requires evidence before review.`; status remained `draft`. | Pass | None |
| 3. Add evidence | Source and evidence save; evidence links to claim; relationship is preserved; claim can be submitted. | Source/evidence saved through Add Evidence form; claim detail displayed relationship `supports`, source title, excerpt, source type `catalog`, and submit button. | Pass | None |
| 4. Submit claim | `draft` changes to `ready_for_review`; event is written. | Claim changed to `ready for review`; event history showed `submitted for review` with `draft -> ready_for_review`. | Pass | None |
| 5. Approve claim | `ready_for_review` changes to `approved`; approval note and event are written. | Claim changed to `approved`; approval note displayed; event history showed `approved` with `ready_for_review -> approved`. | Pass | None |
| 6. Edit approved claim | Saving an approved claim returns it to `needs_revision`; rollback event is written. | Edit page warned that saving returns approved claims to needs revision. After save, detail page showed `needs revision`; event history showed `updated` and `returned to revision after edit`. | Pass | None |
| 7. Linked holding integrity | Phase 3 claim workflow does not mutate linked Phase 2 holding metadata. | SQL after workflow showed Watchmen unchanged: `1001`, `Watchmen`, `Alan Moore; Dave Gibbons`, `DC Comics`, `1987`, `Book`, `Available`, `comics-graphic-novels`. | Pass | None |
| 8. Contributor integrity | Phase 3 claim workflow does not mutate `holding_contributors`. | SQL showed Watchmen contributors unchanged: `Alan Moore`, `Dave Gibbons`, blank roles, sort orders 1 and 2, source `legacy_flat`. | Pass | None |
| 9. Audit trail core actions | `claim_events` includes create, submit, approve, edit, and rollback-to-revision actions. | SQL showed `created`, `submitted_for_review`, `approved`, `updated`, and `returned_to_revision_after_edit`. It also showed `source_created` and `evidence_attached`. | Pass | None |
| 10. Student permissions | Student should not access evidence-review management routes or forms. | 2026-04-28 rerun: direct access to `/evidence-review/new`, claim detail, claim edit, add evidence, and edit evidence redirected to `/dashboard`. No management forms/details were visible. | Pass | None |
| 11. Professor permissions | Professor should not access evidence-review management routes or forms. | 2026-04-28 rerun: direct access to `/evidence-review/new`, claim detail, claim edit, add evidence, and edit evidence redirected to `/dashboard`. No management forms/details were visible. | Pass | None |
| 12. Export | `/evidence-review/export` includes claims, evidence, source fields, relationship, confidence, and review state. | Export CSV included claim ID/text, `needs_revision`, `medium`, evidence ID, `supports`, source ID, source type `catalog`, source title, citation, and excerpt. | Pass | None |
| 13. Known risk: source reuse UI | Document whether source reuse is exposed and whether absence causes confusion/duplication risk. | Add Evidence UI only creates a new source. No existing-source selector is exposed. This can create duplicate source records when librarians reuse the same citation. | Pass, risk documented | Medium data-cleanliness risk |
| 14. Known risk: evidence removal UI | Document whether evidence removal is exposed and whether absence causes correction risk. | Claim detail/evidence edit UI does not expose remove/unlink. Incorrect evidence links cannot be corrected through the UI. | Pass, risk documented | Medium workflow-correction risk |

## SQL Evidence

Data integrity check:

```json
{
  "holdings": [
    {
      "external_local_identifier": "1001",
      "title": "Watchmen",
      "creator_contributor": "Alan Moore; Dave Gibbons",
      "publisher": "DC Comics",
      "publication_year": "1987",
      "format": "Book",
      "isbn": "9780930289232",
      "call_number": "PN6728.W36 M66 1987",
      "location": "Stacks",
      "status": "Available",
      "collection_area_id": "comics-graphic-novels"
    },
    {
      "external_local_identifier": "1002",
      "title": "Spirited Away",
      "creator_contributor": "Hayao Miyazaki",
      "publisher": "Studio Ghibli",
      "publication_year": "2001",
      "format": "DVD",
      "isbn": "9780788857929",
      "call_number": "DVD ANIME SPIR",
      "location": "Media Library",
      "status": "Available",
      "collection_area_id": "manga-anime"
    }
  ],
  "contributors": [
    {
      "external_local_identifier": "1001",
      "name": "Alan Moore",
      "role": "",
      "sort_order": 1,
      "source": "legacy_flat"
    },
    {
      "external_local_identifier": "1001",
      "name": "Dave Gibbons",
      "role": "",
      "sort_order": 2,
      "source": "legacy_flat"
    },
    {
      "external_local_identifier": "1002",
      "name": "Hayao Miyazaki",
      "role": "",
      "sort_order": 1,
      "source": "legacy_flat"
    }
  ]
}
```

Claim event check:

```json
[
  {
    "action": "created",
    "old_status": null,
    "new_status": "draft"
  },
  {
    "action": "source_created",
    "old_status": null,
    "new_status": null
  },
  {
    "action": "evidence_attached",
    "old_status": "draft",
    "new_status": "draft"
  },
  {
    "action": "submitted_for_review",
    "old_status": "draft",
    "new_status": "ready_for_review"
  },
  {
    "action": "approved",
    "old_status": "ready_for_review",
    "new_status": "approved"
  },
  {
    "action": "updated",
    "old_status": "approved",
    "new_status": "needs_revision"
  },
  {
    "action": "returned_to_revision_after_edit",
    "old_status": "approved",
    "new_status": "needs_revision"
  }
]
```

Export check:

```csv
claim_id,claim_text,claim_type,review_status,confidence_level,related_holding_id,related_holding_title,collection_area_id,collection_area_name,evidence_count,claim_created_at,claim_updated_at,reviewed_by_user_id,reviewed_at,review_note,claim_evidence_id,evidence_id,relationship,source_id,source_type,source_title,source_url,citation,excerpt,supporting_data,date_accessed
8bc17d6b-066c-48f0-b377-a621fca8946c,"Watchmen supports comics history instruction in the local collection, with catalog evidence attached.",teaching_relevance,needs_revision,medium,5c4024d0-e805-42a8-b02d-cf207baed9e9,Watchmen,,,1,2026-04-27T18:15:32.261Z,2026-04-27T18:16:35.475Z,,,Evidence is sufficient for Phase 3.1 manual review.,c0e13e43-4d8d-4801-bb4d-b1f373f825bc,f2d084e9-f788-467a-931f-09375f6c144d,supports,901fd0d4-61d3-4e90-b982-5bab4b09d1d9,catalog,valid-holdings.csv catalog import,,valid-holdings.csv row 1001,"Watchmen, Alan Moore; Dave Gibbons, Book, Comics / Graphic Novels, Available.",,
```

## UX Confusion

- The direct Add Evidence form creates a new source every time; source reuse is not visible.
- No UI control removes or unlinks evidence from a claim.
- `Reviewed` displays after submit to `ready_for_review`, before an actual approval/rejection/revision decision.
- After editing an approved claim back to `needs_revision`, the previous approval note still displays.

## Focused Permissions Rerun

2026-04-28 route-level permissions rerun:

```json
{
  "student@library.test": [
    { "requested": "/evidence-review/new", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]/edit", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]/evidence/new", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]/evidence/[evidenceId]/edit", "final": "/dashboard" }
  ],
  "professor@library.test": [
    { "requested": "/evidence-review/new", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]/edit", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]/evidence/new", "final": "/dashboard" },
    { "requested": "/evidence-review/[claimId]/evidence/[evidenceId]/edit", "final": "/dashboard" }
  ],
  "librarian@library.test": "All tested Phase 3.1 management/detail routes remained accessible.",
  "admin@library.test": "All tested Phase 3.1 management/detail routes remained accessible."
}
```

## Data Integrity Risk

- Medium: source duplication is likely because source reuse is not exposed.
- Medium: incorrect evidence links cannot be corrected from the UI because removal is not exposed.
- Medium: stale approval note on `needs_revision` claims can confuse review state interpretation.

## PR Readiness

Phase 3.1 is ready for PR from the permissions-blocker standpoint after the 2026-04-28 rerun.

Remaining non-blocking risks to carry forward:

- Source reuse is not exposed in UI.
- Evidence removal/unlink is not exposed in UI.
- Recheck the two review-state UX issues before deciding whether they block later Phase 3 hardening or can move to Phase 3.2.
