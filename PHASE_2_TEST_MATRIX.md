# Phase 2 Test Matrix

## Purpose

This matrix tracks controlled Phase 2 upload and data-integrity probes. The goal is to test whether Phase 2 preserves data integrity and fails legibly, not to accumulate random local data.

Phase 2 remains limited to local SQLite-backed holdings, librarian-controlled import/review/edit/export workflows, audit logs, and metadata corrections. It does not include AI enrichment, market search, recommendations, analytics calculations, purchasing workflows, external APIs, or student/professor access to real imported holdings.

## Testing Principle

Verify:

- identifier stability
- duplicate exclusion
- field normalization
- import-batch traceability
- persistence after confirmation
- audit log accuracy
- export integrity
- original data preservation

## Controlled Upload Matrix

| Test name | Fixture/file | Purpose | Steps | Expected result | Observed result | Pass/fail | Severity if failed | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Test 1: Duplicate Control | `apps/web/fixtures/phase2/valid-holdings.csv` uploaded twice | Verify duplicate exclusion and identifier stability. | Upload and confirm `valid-holdings.csv` once. Upload the same file again. Review preview, confirm import, then query holdings grouped by identifier. | Second preview marks both rows as duplicates. Confirm import skips both rows. No new holdings are created. Duplicate rows remain in `import_rows`. No holding-created audit logs are created for skipped duplicates. Each `external_local_identifier` count is `1`. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection`. First preview: 2 valid, 0 warning, 0 invalid, 0 duplicate. First confirm: 2 imported, 0 skipped. Second preview: 0 valid, 0 warning, 0 invalid, 2 duplicate. Second confirm: 0 imported, 2 skipped. DB identifier counts: `1001=1`, `1002=1`. Duplicate batch rows: 2 duplicate/skipped. Created audit logs added by second batch: 0. | Pass | None | Duplicate detection is based on primary identifier and did not create new holdings. |
| Test 2: Partial Failure Import | `apps/web/fixtures/phase2/invalid-holdings.csv` | Verify valid rows can import while invalid rows fail legibly. | Upload fixture, review preview, confirm import, inspect batch detail and holdings table. | Invalid rows are blocked/skipped. Valid rows, if any, import after confirmation. Batch summary separates valid, invalid, and skipped rows. Invalid rows remain visible in `import_rows`. No holdings are created with missing required fields. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection`. Preview: 1 valid, 0 warning, 3 invalid, 0 duplicate. Confirm: 1 imported, 3 skipped. DB missing-required holdings count: 0. Import rows: 3 invalid/skipped, 1 valid/imported. | Pass | None | Existing automated tests and controlled probe agree. |
| Test 3: Warning-State Import | `apps/web/fixtures/phase2/unknown-area-holdings.csv` | Verify warnings do not become silent corrections. | Upload fixture, review warning state, confirm import, open holding and batch detail. | Row is warning, not invalid. Confirmation is allowed. Warning state remains visible in batch detail. Unknown collection area imports as `Unassigned`; the original raw value remains in import row/original data. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection/holdings/[holdingId]`. Preview: 0 valid, 1 warning, 0 invalid, 0 duplicate. Confirm: 1 imported, 0 skipped. DB holding: `Unknown Area`, `collection_area_id=unassigned`, `collection_area_name=Unassigned`. Import row remains warning/imported with messages for unknown collection area and bad publication year. Original raw data preserves `collection_area=Experimental Media`. | Pass | None | Actual unknown-area behavior: imports as Unassigned while preserving source value in raw/original data. |
| Test 4: Messy Real-World Data | `apps/web/fixtures/phase2/messy-real-world-holdings.csv` | Verify messy exports do not crash or silently lose data. | Upload fixture, review preview messages, confirm import, inspect imported holdings and raw row data. | No crash. No silent truncation. Punctuation/casing are preserved where appropriate. Extra columns/raw row values are preserved. Batch detail explains each row outcome. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection`. Preview: 1 valid, 1 warning, 1 invalid, 0 duplicate. Confirm: 2 imported, 1 skipped. Imported values preserved punctuation/casing: `Collected Essays, Vol. 1`, `BluRay??`, `Unknown shelf ??`, `On shelf`. Row outcomes: row 2 valid/imported, row 3 warning/imported, row 4 invalid/skipped. Raw JSON preserved source row values. | Pass with note | None | Fixture has no extra columns, so extra-column preservation was not proven by this fixture. Existing `extra-columns-holdings.csv` was used in Test 7 to verify raw extra-column preservation. |
| Test 5: Identifier Collision | Temporary CSV: `identifier-collision-1001.csv` with `1001,Watchmen Variant,...` after seeding `1001,Watchmen,...` | Verify primary identifier controls duplicate behavior. | Seed Watchmen with identifier `1001`. Upload a one-row CSV with identifier `1001` and title `Watchmen Variant`. Review preview and confirm. | Row is duplicate based on identifier. Row is skipped. Title similarity does not create, merge, or update records. Existing Watchmen remains unchanged. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection`. Preview: 0 valid, 0 warning, 0 invalid, 1 duplicate. Confirm: 0 imported, 1 skipped. Holdings added: 0. DB query for `1001`: one row only, title remains `Watchmen`, creator remains `Alan Moore; Dave Gibbons`, publisher remains `DC Comics`, year remains `1987`. Duplicate row retained `mapped_data_json` for `Watchmen Variant` and `matched_holding_id` pointing to existing Watchmen. | Pass | None | Duplicate detection is based on primary identifier. Existing record stayed unchanged. |
| Test 6: Export Integrity | `/collection/export` after multiple controlled imports | Verify export reflects SQLite holdings without mock data. | Run several controlled imports, optionally edit one holding, then export CSV. Compare export to database. | All Phase 2 holdings are included. No Phase 1.2 mock records appear. No duplicate holdings are exported. Edited values are reflected. Export fields align with database state. Contributor rows preserve holding identity when rows repeat. | Route coverage: `/collection/export`. Export header includes `internal_system_id`, `external_local_identifier`, `original_creator_contributor`, `contributor_name`, `contributor_role`, `contributor_sort_order`, `contributor_source`. Export line count including header: 8. DB holding count: 6. Distinct exported holding IDs: 6. Duplicate identifier query returned no rows. Phase 1.2 mock names check for `Akira`/`Persepolis`: false. | Pass | None | Repeated export rows are expected only when contributor rows require them; holding identity is preserved by `internal_system_id`. |
| Test 7: Contributor Field Baseline | Temporary CSV: `contributor-baseline-three-names.csv` with `Alan Moore; Dave Gibbons; John Higgins` in legacy creator/contributor field | Verify contributor text integrity and current structured-contributor compatibility. | Upload the row, confirm import, inspect holding detail, `holding_original_values`, `holding_contributors`, and export. | Original flat string is preserved exactly. No truncation. No invented roles. Current structured contributor behavior may split semicolon-delimited names into contributor rows with blank roles and `legacy_flat` source. Export preserves `original_creator_contributor` plus contributor columns. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection/holdings/[holdingId]`, `/collection/export`. Preview: 1 valid, 0 warning, 0 invalid, 0 duplicate. Confirm: 1 imported, 0 skipped. `holdings.creator_contributor` preserved `Alan Moore; Dave Gibbons; John Higgins`. `holding_original_values.original_creator_contributor` preserved the same string. `holding_contributors`: Alan Moore, Dave Gibbons, John Higgins with blank roles, sort orders 1-3, source `legacy_flat`. Export produced three rows for `CBASE-001`, preserving holding identity and one contributor per row. | Pass | None | Confirms current structured-contributor baseline: original string preserved, safe legacy split, no invented roles, export preserves contributor identities. |
| Test 8: Batch Isolation | 3-4 separate imports using controlled fixtures | Verify import-batch traceability. | Run separate imports, then query holdings and import rows grouped by batch. Review audit logs. | Each holding links to the correct `import_batch_id`. No cross-batch contamination. `import_rows` remain tied to the correct batch. Audit logs accurately reflect import origin. | Route coverage: `/collection/import`, `/collection/import/[batchId]`, `/collection`. Holdings by batch: first valid batch=2, invalid batch=1, unknown-area batch=1, messy batch=2, extra-columns batch=1. Duplicate second valid batch produced 0 holdings and 2 duplicate/skipped import rows. Import rows stayed grouped by original batch. Created audit logs by batch matched imported holding counts. | Pass | None | Duplicate-only batches correctly have import rows but no holdings/audit-created rows. |
| Contributor: Structured Delimited Import | Temporary CSV with `contributors` value `Alan Moore|writer; Dave Gibbons|illustrator` | Verify contributor roles import from paired values. | Upload, confirm, open holding, inspect SQLite contributor rows and export. | Two contributor rows are created with roles: Alan Moore/writer and Dave Gibbons/illustrator. Source is `csv_structured`. | Covered by automated test; pending manual run. | Pending | Medium | Complements Test 7. |
| Contributor: Numbered-Column Import | Temporary CSV with `contributor_1_name`, `contributor_1_role`, `contributor_2_name`, `contributor_2_role` | Verify numbered contributor-role columns import in order. | Upload, confirm, open holding, inspect SQLite contributor rows and export. | Ordered contributor rows are created with roles preserved. | Covered by automated test; pending manual run. | Pending | Medium | Useful for EdPort-like exports that provide repeatable columns. |
| Contributor: Edit Behavior | Existing imported holding | Verify contributor editing is audited separately. | Open holding in edit mode, change contributor rows, save with `Save Contributors`, inspect audit log and main metadata. | A `contributors` audit/edit-log entry is created. Main metadata fields remain unchanged unless edited separately. | Pending manual run. | Pending | Medium | Main metadata save and contributor save are intentionally separate actions. |
| Regression: Old Holdings Without Contributors | Existing SQLite row created before `holding_contributors` existed, or a manually prepared legacy database | Verify safe display for legacy data. | Open holding detail after schema initialization. | Page displays safely. Existing flat value remains readable. Backfill may create `legacy_flat` contributor rows when possible. | Pending manual run. | Pending | Medium | Regression check for real local databases created before the structured contributor correction. |

## Required SQL Checks

Duplicate control:

```sql
SELECT external_local_identifier, COUNT(*)
FROM holdings
GROUP BY external_local_identifier;
```

Batch isolation:

```sql
SELECT import_batch_id, COUNT(*)
FROM holdings
GROUP BY import_batch_id;
```

Import rows by batch:

```sql
SELECT import_batch_id, validation_status, import_action, COUNT(*)
FROM import_rows
GROUP BY import_batch_id, validation_status, import_action
ORDER BY import_batch_id;
```

Original data preservation:

```sql
SELECT h.title, h.creator_contributor, hov.original_creator_contributor, hov.original_raw_data_json
FROM holdings h
LEFT JOIN holding_original_values hov ON hov.holding_id = h.id
WHERE h.title LIKE '%Watchmen%';
```

Structured contributors:

```sql
SELECT h.title, hc.name, hc.role, hc.sort_order, hc.source
FROM holding_contributors hc
JOIN holdings h ON h.id = hc.holding_id
ORDER BY h.title, hc.sort_order;
```

Audit logs:

```sql
SELECT h.title, hel.field_name, hel.old_value, hel.new_value, hel.reason, hel.edited_at
FROM holding_edit_logs hel
JOIN holdings h ON h.id = hel.holding_id
ORDER BY hel.edited_at DESC;
```

## Current Status

- Current automated tests cover duplicate detection, partial invalid imports, warning imports, messy-row validation, duplicate-title allowance, contributor import paths, contributor export shape, and basic persistence after confirmation.
- Controlled fixture-only data probes were run against an isolated SQLite database using the same Phase 2 import, confirmation, query, and export code paths as the app.
- Tests 1, 2, 3, 4, 6, and 8 passed in the fixture-only pass.
- Tests 5 and 7 passed in a follow-up isolated run using controlled temporary CSV rows.
- Core controlled Tests 1-8 are complete.
- Documentation mismatch resolved: Test 7 has a historical wording mismatch because structured contributors are now implemented. The current acceptance rule is original string preservation, no truncation, no invented roles, and compatible structured contributor rows with blank roles when the source is legacy flat text.
- No Phase 2 bugs were found in the controlled audit pass.

## Stability Gate For Broader Data Testing

Phase 2 is stable enough for broader controlled data testing.

Before production use or Phase 3:

- Replace demo authentication with production-ready private auth.
- Define duplicate resolution beyond skip-only behavior.
- Decide whether original CSV files must be retained.
- Run broader tests against representative real EdPort exports.
