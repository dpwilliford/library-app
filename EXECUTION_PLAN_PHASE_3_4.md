# Phase 3.4 Execution Plan (Strict Mode)

## Governing Rule

Codex must execute only one slice at a time.

Codex must not:
- select the next slice
- combine slices
- continue after completion
- perform exploratory implementation
- add improvements outside the active slice

## Purpose

This plan exists to conserve Codex usage by converting Phase 3.4 into bounded, reviewable work units.

Each slice must be executed as a separate PR or as a separate commit within an explicitly approved PR, depending on the human instruction. Codex must not decide this structure independently.

## Daily Execution Sequence

### Day 1

Slice:
- `source-reuse-action-boundary`

Goal:
- establish the only Phase 3.4 write boundary for creating evidence from an existing source

Limit:
- no UI
- no route changes
- no source mutation

### Day 2

Slice:
- `source-selection-ui`

Goal:
- allow explicit librarian/admin selection of an existing source

Limit:
- no automatic matching
- no deduplication
- no source editing

### Day 3

Slice:
- `advisory-duplicate-signals`

Goal:
- display possible duplicate sources as read-only advisory information

Limit:
- no enforcement
- no auto-linking
- no source mutation

### Day 4

Slices:
- `source-detail-integrity-lock`
- `export-source-link-integrity`

Goal:
- harden read-only source views and preserve exact source linkage in exports

Limit:
- execute one slice at a time
- stop between slices

## Start Condition

When given a slice name, Codex must:

1. locate the corresponding slice definition in `PHASE_3_4_SLICE_PLAN.md`
2. read `CODEX_WORKFLOW.md`
3. read `INTERACTION_PROTOCOL.md`
4. read `PROJECT_INVARIANTS.md` if present
5. execute only the named slice

If the slice definition is missing, contradictory, or incomplete, Codex must stop and report the blocking issue.

## Stop Condition

After completing a slice, Codex must:

1. report files changed
2. report tests added or updated
3. report verification run
4. report anything not run, with reason
5. stop

Codex must not continue to the next slice.

## Failure Handling

If verification fails, Codex must stop after reporting:

- failing command
- failure summary
- suspected cause if evident
- smallest next corrective slice

Codex must not attempt broad repair unless explicitly instructed.

## Lockout Handling

During quota lockout or cooldown:

- do not ask Codex to implement
- write or revise slice plans only
- collect local test failures for later targeted correction

## Prohibited Behavior

Codex must not:

- batch multiple days
- batch multiple slices
- perform speculative cleanup
- refactor unrelated files
- revise architecture
- infer future requirements
- optimize workflow during implementation

## Human Operating Rule

The human should paste only the relevant line from `CODEX_START.md` when beginning each slice.

No additional context should be supplied unless a blocking failure occurred.