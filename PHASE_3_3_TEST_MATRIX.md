# Phase 3.3 Test Matrix

## Status

Planning and pre-implementation safeguards only. Do not implement Phase 3.3 feature code from this matrix until a separate implementation prompt is approved.

## Phase Title

Phase 3.3 — AI Draft Intake Without Authority

## Core Invariant

AI intake candidates are non-record preview objects. They are not stored, have no IDs, do not appear in queries, are not exportable, and cannot influence any system output unless a librarian/admin explicitly saves them into normal Phase 3 draft records.

At no point prior to librarian/admin save may any value produced by AI intake be addressable by a system identifier, query, route, export, review queue, or audit/event trail.

## Required First Tests

These tests are required before feature implementation can be considered complete:

| Test | Expected result | Required before implementation PR? |
| --- | --- | --- |
| Candidate generation produces zero database inserts/updates | Generating candidates from raw text leaves all database table counts unchanged. | Yes |
| Candidate generation produces no IDs | Candidate objects include no `id`, `claimId`, `sourceId`, `evidenceId`, or event identifiers. | Yes |
| Candidate generation produces no `claim_events` or audit events | Preview generation creates no audit/event rows. | Yes |
| Candidate generation does not affect review queue results | Queue rows, counts, filters, sorting, creator lists, and current reviewer lists are unchanged after preview generation. | Yes |
| Candidate generation does not affect export output | Export output before and after preview generation is byte-for-byte unchanged. | Yes |
| Student/professor cannot access candidate generation or save actions | Non-librarian roles cannot open intake, generate candidates, or save selected candidates. | Yes |
| Librarian/admin save action is the first moment records are created | No records exist before explicit save; selected candidate save creates the first normal Phase 3 rows. | Yes |
| Saved records use existing Phase 3 creation functions and enter as `review_status = draft` | Saved records behave like ordinary Phase 3 drafts with empty current review fields. | Yes |

## Regression Tests

- Phase 2 import still works from a fresh SQLite database.
- Holdings and contributors are unchanged after preview generation.
- Holdings and contributors are unchanged after selected candidate save.
- Phase 3.1 claim/source/evidence/submit/review workflow remains unchanged.
- Phase 3.2 review queue filters and sorting remain unchanged.
- Approved edit rollback still clears current review fields.
- Export remains unchanged and unfiltered.

## Terminology Checks

Test names, UI labels, and docs should use these terms for pre-save output:

- candidate
- preview
- non-persistent
- non-record
- explicitly saved

Do not use these terms for pre-save output:

- temporary record
- staging record
- pre-draft
- AI draft
- stored candidate
- persisted candidate
- saved preview
- created AI draft
