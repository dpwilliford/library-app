# Phase 2 Audit Report

## Summary

Phase 2 Collection Graph Foundation was audited as a local, librarian-controlled holdings workflow.

Systems tested:

- SQLite persistence for local holdings
- CSV import preview and confirmation
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

Out of scope for this audit:

- AI enrichment
- market search
- recommendations
- analytics calculations
- purchasing workflows
- external APIs
- student/professor access to real imported holdings

## Final Test Status

| Test | Status | Notes |
| --- | --- | --- |
| Test 1: Duplicate Control | Pass | Uploading `valid-holdings.csv` twice caused the second batch to mark both rows duplicate and skip both rows. |
| Test 2: Partial Failure Import | Pass | `invalid-holdings.csv` imported the valid row and skipped invalid rows. No holdings were created with missing required fields. |
| Test 3: Warning-State Import | Pass | `unknown-area-holdings.csv` imported as warning, preserved warning state, and saved unknown area as `Unassigned` without losing raw source value. |
| Test 4: Messy Real-World Data | Pass with note | Messy rows did not crash. Punctuation/casing were preserved. The fixture itself does not include extra columns; extra-column preservation was checked with `extra-columns-holdings.csv`. |
| Test 5: Identifier Collision | Pass | A temporary `1001,Watchmen Variant,...` row was skipped as duplicate by identifier. Existing Watchmen stayed unchanged. |
| Test 6: Export Integrity | Pass | Export included Phase 2 holdings, excluded Phase 1.2 mock records, preserved contributor columns, and had no duplicate holding identifiers. |
| Test 7: Contributor Field Baseline | Pass | `Alan Moore; Dave Gibbons; John Higgins` was preserved exactly, split safely into `legacy_flat` contributor rows, and exported without invented roles. |
| Test 8: Batch Isolation | Pass | Holdings, import rows, and created audit logs stayed tied to the correct import batches. |

## Confirmations

Duplicate handling is identifier-based.

- Duplicate checks use the primary external local identifier.
- Title similarity does not create, merge, or update records.
- Duplicate confirmation is skip-only.
- Duplicate rows remain visible in `import_rows`.

Confirmed imports persist automatically.

- `Confirm Import` writes valid and warning rows to SQLite.
- Opening a holding after import is review-only by default.
- `Save Metadata` or `Save Contributors` is only needed for later edits.

Structured contributors work.

- Legacy flat strings are preserved.
- Semicolon-delimited legacy names split into contributor rows with blank roles and `legacy_flat` source.
- Structured contributor-role values import with roles when provided.
- Export includes contributor-specific columns and preserves holding identity when rows repeat.

Export excludes Phase 1.2 mock data.

- Controlled export checks found no Phase 1.2 mock titles such as `Akira` or `Persepolis`.
- Export is generated from Phase 2 SQLite-backed holdings only.

## Known Limitations

- Demo authentication is not production authentication.
- Duplicate resolution is skip-only; there is no merge, overwrite, update, or versioning workflow yet.
- Original CSV files are not retained as files. Parsed raw row data and original mapped values are retained in SQLite.
- Playwright screenshots are not installed as a project-level visual regression workflow.
- Contributor roles are not inferred. When roles are absent, roles remain blank.
- Structured contributor export repeats holding identity across contributor rows; this is intentional but should be documented for downstream users.

## Remaining Phase 2 Risks

- Real EdPort exports may use column names or contributor layouts not covered by current fixtures.
- Duplicate resolution may need a librarian review workflow before larger imports.
- Demo auth should be replaced before production use or real private data.
- Original file retention may be needed if audit requirements demand full source-file preservation.
- Larger CSV files may expose performance or usability limits not covered by the small fixture set.

## Merge Recommendation

Phase 2 is ready to merge for controlled local testing and continued Phase 2 hardening.

Recommendation: merge with the known limitations documented above. Do not proceed to Phase 3 until duplicate-resolution policy, production authentication, and broader real-export testing are explicitly reviewed.
