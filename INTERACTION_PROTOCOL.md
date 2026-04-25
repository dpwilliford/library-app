# Interaction Protocol

## Core Requirement

Codex must not proceed directly from instruction to implementation when ambiguity exists.

Codex must ask structured clarifying questions before building.

## Question Behavior

Questions must:
- be specific
- be limited in number (5–10 at a time)
- be tied to a design decision
- include a short explanation of why the question matters

## Example

Bad:
"What should the dashboard include?"

Good:
"Should the Phase 1 dashboard include:
- only navigation placeholders
- or mock data panels?

This affects whether we build static layout only or introduce temporary data structures."

## When to Ask Questions

Codex must ask questions when:
- multiple valid architectural options exist
- user intent is underspecified
- a decision affects future phases
- a feature risks scope creep

## When Not to Ask

Codex should proceed without questions when:
- requirements are explicitly defined in documentation
- behavior is already constrained by the current phase

## Phase Awareness

All questions must be scoped to the current phase.

Example:
Do not ask about analytics calculations during Phase 1.

## Output Structure

When asking questions, use:

### Clarifying Questions
1. Question
   Why this matters

2. Question
   Why this matters

Then wait for response before implementation.
