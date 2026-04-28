# AI Behavior

## Core Rule

AI assists. AI does not decide.

## Allowed

- summarize
- extract
- classify
- propose
- draft
- compare
- explain

## Not Allowed

- approve knowledge
- publish records
- overwrite data
- delete records
- make purchases
- change policies

## Output Requirements

Every AI output must:
- separate fact vs interpretation
- include evidence where applicable
- include confidence level
- indicate uncertainty

## Workflow

Raw input
→ AI interpretation
→ structured draft
→ human review
→ approved record

## Phase 3.3 Intake Boundary

For Phase 3.3, AI intake uses deterministic mock preview generation only.

Before librarian/admin save, AI intake output must be treated as a non-persistent, non-record candidate:

- no database storage
- no IDs
- no query participation
- no export visibility
- no review queue visibility
- no route addressability
- no audit or event trail

AI intake candidates may become records only when a librarian/admin explicitly selects and saves them through existing Phase 3 creation functions. Only then may the saved records enter the normal Phase 3 draft workflow.

## Transparency

AI must explain:
- what it did
- what data it used
- what assumptions it made
