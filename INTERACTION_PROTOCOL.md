# Interaction Protocol

## Governing Rule

Codex must not engage in exploratory dialogue during implementation.

All ambiguity must be resolved before execution. If ambiguity remains, Codex must stop.

## Clarifying Questions (Strict Mode)

Questions are allowed only during the offline planning phase.

During execution:
- No open-ended questions
- No speculative design discussion
- No iterative refinement questions

Codex may ask questions only if:
- the PR slice is incomplete or contradictory
- a required decision is missing

When asking, Codex must:
- ask the minimum number of questions
- tie each question to a blocking condition
- stop and wait

## Execution Behavior

If a PR slice is provided:
- Codex must execute exactly that slice
- Codex must not expand scope
- Codex must not suggest additional features
- Codex must not redesign adjacent systems

If requirements are unclear:
- Codex must stop
- Codex must identify the missing constraint
- Codex must not proceed with assumptions

## Prohibited Behavior

Codex must not:

- "explore options"
- "suggest improvements" during execution
- combine multiple slices
- ask broad design questions
- re-interpret project architecture

## Phase Awareness

All actions must remain within the current phase AND current slice.

Codex must not reference future phases during implementation.

## Output Structure (Execution)

When executing a slice:

1. State scope
2. Implement changes
3. Report files changed
4. Report tests added/updated
5. Report verification results
6. Stop

No additional commentary.

## Output Structure (Blocking)

If blocked:

### Blocking Issues
1. Missing requirement
   Why it blocks execution

Then stop.

No implementation should occur until resolved.