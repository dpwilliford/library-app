# Multi-Agent Review Gate

## Purpose

This project requires multi-agent review before implementation.

No meaningful build work may begin until the proposed task has been reviewed from multiple agent perspectives and approved by the human project owner.

## Core Rule

Plan first. Review second. Ask questions third. Build only after approval.

## Required Review Sequence

For any substantial task, Codex must use this sequence:

1. Lead Planning Agent defines the proposed task and scope.
2. Architecture Agent reviews technical direction and modularity.
3. Data Integrity Agent reviews data authority, evidence, reversibility, and export implications.
4. Security Agent reviews authentication, permissions, privacy, secrets, and unsafe exposure.
5. UI/UX Agent reviews usability, accessibility, role clarity, dashboard clarity, and nontechnical language.
6. Performance and Scale Agent reviews likely bottlenecks, volume risks, and future growth.
7. QA/Test Agent defines acceptance criteria and test steps.
8. Documentation Agent identifies documentation and changelog updates.
9. Codex summarizes conflicts, risks, and questions.
10. Human project owner approves, revises, or rejects the plan.

## Output Format Before Build

Before implementation, Codex must produce:

```md
# Pre-Build Multi-Agent Review

## Proposed Task

## Current Phase or Proposed Phase

## Scope

## Explicit Exclusions

## Agent Reviews

### Lead Planning Agent
- Assessment:
- Questions:

### Architecture Agent
- Assessment:
- Risks:
- Questions:

### Data Integrity Agent
- Assessment:
- Risks:
- Questions:

### Security Agent
- Assessment:
- Risks:
- Questions:

### UI/UX Agent
- Assessment:
- Risks:
- Questions:

### Performance and Scale Agent
- Assessment:
- Risks:
- Questions:

### QA/Test Agent
- Acceptance Criteria:
- Test Steps:

### Documentation Agent
- Documentation Updates Required:

## Conflicts Between Agents

## Decisions Needed From Project Owner

## Recommended Plan

## Wait for Approval
```

## Build Permission

Codex may build only after the project owner explicitly says one of the following:

- Approved: build this plan
- Approved with revisions: build using these changes
- Do not build yet

## Small Change Exception

Codex may make very small corrections without full multi-agent review only when all are true:

- change is documentation-only or typo-level
- no architecture is affected
- no data model is affected
- no permissions are affected
- no phase boundary is affected

Even small changes must update `CHANGELOG.md` when appropriate.

## Phase Changes

Creating, ending, splitting, merging, or renaming phases always requires full multi-agent review.

## Pull Request Requirement

The pull request description must include:

- task goal
- phase or proposed phase
- summary of agent review
- human approval note
- files changed
- risks
- tests
- rollback notes
- documentation updates

## Failure Condition

If Codex implements a substantial task without this review, the work must be treated as provisional and reviewed before it can be accepted.
