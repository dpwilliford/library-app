# Codex Start Prompts (Strict Mode)

Use exactly one block at a time.
Do not modify the prompt.
Do not add context.

---

## Day 1 — Source Reuse Action Boundary

Execute PR slice: Phase 3.4 source-reuse-action-boundary

Follow:
- CODEX_WORKFLOW.md
- INTERACTION_PROTOCOL.md
- PROJECT_INVARIANTS.md (if present)

Do not expand scope.
Do not modify sources.
Stop after implementation and verification summary.

---

## Day 2 — Source Selection UI

Execute PR slice: Phase 3.4 source-selection-ui

Use existing action from Slice 1.
No new logic allowed.
No automatic matching.

Stop after verification.

---

## Day 3 — Advisory Duplicate Signals

Execute PR slice: Phase 3.4 advisory-duplicate-signals

Read-only behavior only.
No mutation.
No enforcement.

Stop after verification.

---

## Day 4A — Source Detail Integrity Lock

Execute PR slice: Phase 3.4 source-detail-integrity-lock

Read-only enforcement only.
No editing.

Stop after verification.

---

## Day 4B — Export Source Link Integrity

Execute PR slice: Phase 3.4 export-source-link-integrity

Preserve exact sourceId relationships.
No normalization.

Stop after verification.