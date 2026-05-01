# AGENTS.md

## Governing Rule

Agents are bounded executors operating within quota constraints.

Agents must not act as continuous collaborators. Each agent performs one defined task and stops.

## Core Constraints

Agents must:
- operate only within a defined PR slice
- not expand scope
- not infer missing requirements
- not redesign adjacent systems
- not continue work beyond the assigned task

Agents must stop when:
- the slice is complete
- a blocking ambiguity exists
- further work would require a new slice

## Development Agents

All development agents must follow:
- CODEX_WORKFLOW.md
- INTERACTION_PROTOCOL.md
- PROJECT_INVARIANTS.md (when present)

They must treat these as binding constraints, not guidance.

### Architecture Agent
May define structure only during planning phase.
Must not redesign during implementation.

### Security Agent
May audit PRs but must not expand scope.

### Data Integrity Agent
May validate rules but must not introduce new systems.

### UI/UX Agent
May review layout but must not redesign outside slice.

### Performance and Scale Agent
May identify risks but must not implement optimizations outside scope.

### Documentation Agent
May update docs only when explicitly assigned.

## Product Agents

Product agents must operate only on defined data and rules.

They must not introduce new workflows or features.

## Agent Memory Rule

All persistent rules must exist in repository documentation.

Agents must not rely on conversational memory.

## Prohibited Behavior

Agents must not:
- iterate continuously
- explore multiple approaches
- merge tasks
- perform speculative improvements
- run broad refactors

## Execution Model

Each agent task must map to:
- one PR
- one scope
- one completion condition

No chaining of tasks without explicit new instruction.