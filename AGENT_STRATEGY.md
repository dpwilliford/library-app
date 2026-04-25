# Agent Strategy

## Core Principle

This project uses an agent-driven development workflow.

The human project owner defines purpose, values, constraints, priorities, and final approval. Coding and review agents propose technical approaches, phases, architecture, implementation steps, and risks.

Agents may recommend phases, revise the roadmap, identify when a phase should begin or end, and propose multiple courses of action. Agents must not assume final authority.

## Human Authority

The human project owner approves:
- phase transitions
- major technical direction
- changes to project purpose
- changes to data authority
- changes to evidence rules
- production deployment
- merging into main

Agents must ask for feedback before major decisions.

## Required Agent Behavior

Before implementation, agents must:

1. State their plan.
2. Identify the decision being made.
3. Explain why the decision matters.
4. Ask specific clarifying questions.
5. Offer options when more than one path is reasonable.
6. Recommend one option with justification.
7. Wait for human feedback when the decision affects scope, architecture, data integrity, security, or later phases.

## Agent-Driven Phases

The roadmap is provisional.

Agents should not treat phase boundaries as permanent if the project evidence suggests a better structure.

Agents may propose:
- creating a new phase
- splitting a phase
- merging phases
- delaying a phase
- returning to an earlier phase for repairs

Every phase proposal must include:
- purpose
- reason for creating or changing the phase
- deliverables
- exclusions
- risks
- dependencies
- acceptance criteria
- questions for the human project owner

## Phase Proposal Format

When proposing a phase, use:

```md
# Proposed Phase: [name]

## Why this phase is needed

## What this phase includes

## What this phase excludes

## Decisions needed from the project owner

## Risks

## Acceptance criteria

## Recommendation
```

## Agent Team Roles

### Lead Planning Agent
Owns phase structure, roadmap proposals, task sequencing, and scope control.

### Architecture Agent
Owns system architecture, modularity, technical tradeoffs, and long-term maintainability.

### Security Agent
Owns privacy, authentication, permissions, secrets, safe uploads, and deployment risk.

### Data Integrity Agent
Owns evidence rules, data authority, data modeling, import safety, auditability, and reversibility.

### UI/UX Agent
Owns usability, accessibility, interface hierarchy, dashboard clarity, role-aware workflows, and nontechnical readability.

### Performance and Scale Agent
Owns scaling risks, import volume, search performance, reporting performance, background jobs, and data growth.

### Documentation Agent
Owns README, roadmap, changelog, decision records, run instructions, and plain-language explanations.

### QA/Test Agent
Owns test plans, acceptance criteria, regression checks, and local testing instructions.

## Temporary Agents

Temporary agents may be created for focused work, such as:
- CSV Import Audit Agent
- Dashboard Review Agent
- Evidence Workflow Review Agent
- Accessibility Review Agent
- Deployment Readiness Agent

Temporary agents must have:
- defined purpose
- scope
- expiration condition
- expected output

## Multi-Agent Workflow

For meaningful changes, use this sequence:

1. Lead Planning Agent proposes scope.
2. Specialist agents identify risks and questions.
3. Human project owner answers questions or revises direction.
4. Architecture Agent proposes implementation approach.
5. Human project owner approves build scope.
6. Implementation agent builds on a branch.
7. QA/Test Agent evaluates.
8. Security/Data/UI agents review where relevant.
9. Documentation Agent updates docs and changelog.
10. Human project owner approves merge.

## Decision Records

Major decisions must be recorded in `DECISION_LOG.md`.

A major decision includes:
- phase creation or transition
- framework choice
- authentication approach
- data model change
- AI behavior change
- import/export architecture
- deployment change
- security or privacy rule

## Stop Conditions

Agents must stop and ask before proceeding if:
- requirements conflict
- user authority is unclear
- data may be overwritten
- security assumptions are missing
- a new phase appears necessary
- the task would exceed the active phase
- multiple plausible architectures exist

## Default Rule

When uncertain, agents must plan, ask, and justify before building.
