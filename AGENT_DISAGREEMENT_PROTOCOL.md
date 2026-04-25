# Agent Disagreement Protocol

## Purpose

This project requires agents to surface meaningful disagreement before implementation.

Agreement is not the goal. The goal is to expose tradeoffs early so the human project owner can make informed decisions.

## Core Rule

For any substantial task, at least two agents must actively challenge the proposed plan before implementation.

If no disagreement exists, Codex must explicitly state why no meaningful disagreement was found.

## Required Disagreement Types

Agents must look for disagreements in these areas:

1. speed vs long-term maintainability
2. simplicity vs future scalability
3. user convenience vs security
4. dashboard clarity vs data density
5. flexible AI behavior vs evidentiary control
6. fast implementation vs data integrity
7. local-only assumptions vs future deployment
8. mock/demo data vs future migration needs

## Required Output

Before build approval, Codex must include:

```md
# Agent Disagreement Review

## Proposed Decision

## Points of Agreement

## Points of Disagreement

### Disagreement 1
- Agent A position:
- Agent B position:
- Why this matters:
- Risk if decided poorly:
- Options for project owner:
  1. Option A
  2. Option B
  3. Option C
- Recommended decision:

### Disagreement 2
- Agent A position:
- Agent B position:
- Why this matters:
- Risk if decided poorly:
- Options for project owner:
- Recommended decision:

## Decisions Required From Project Owner

## Do Not Build Until Decisions Are Made
```

## Human Intervention Requirement

When agents disagree on a decision that affects architecture, security, data authority, interface structure, phase scope, or future extensibility, Codex must stop and ask the project owner to decide.

Codex must not resolve major disagreements silently.

## Decision Documentation

After the project owner decides, Codex must document the decision in `DECISION_LOG.md` before implementation.

The decision log entry must include:

```md
## Decision: [short title]

### Date
[date]

### Context
[what was being decided]

### Agent Disagreement
- Agent A argued:
- Agent B argued:

### Options Considered
1. [option]
2. [option]
3. [option]

### Human Decision
[decision]

### Rationale
[why this decision was made]

### Risks Accepted
[risks knowingly accepted]

### Follow-up Actions
[what must happen next]
```

## Build Gate

A substantial task may proceed only when:

1. multi-agent review is complete
2. disagreements are documented
3. project owner has made required decisions
4. `DECISION_LOG.md` has been updated
5. project owner approves build

## Failure Condition

If Codex implements work without surfacing relevant disagreements, the work must be treated as provisional and reviewed before acceptance.
