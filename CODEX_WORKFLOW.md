# Codex Workflow

## Governing Rule

Codex is a bounded executor, not a continuous collaborator.

All implementation work must be planned before Codex is asked to write code. The repository documentation is the source of authority. Codex must not infer broad project scope from conversation history when a narrower written slice exists.

This workflow exists because Codex usage is quota-limited. Large prompts, broad codebase analysis, repeated test execution, and exploratory implementation loops consume the available allotment quickly. The project must therefore use small, pre-specified PR slices that can be executed with minimal back-and-forth.

## Required Work Cycle

Every development task must follow this sequence:

1. Offline planning
2. PR slice specification
3. Single bounded Codex execution
4. Local human verification where possible
5. Targeted Codex correction only if a concrete failure is supplied
6. Pull request review
7. Human-approved merge

Codex must stop after completing the assigned slice and reporting verification results. It must not continue into the next slice unless explicitly instructed in a new task.

## Offline Planning Requirements

Before implementation, the relevant plan or PR slice must define:

- objective
- phase
- files allowed to change
- files forbidden to change
- exact behavioral requirements
- acceptance criteria
- required tests
- non-goals
- stop condition

Use `PR_SLICE_TEMPLATE.md` for this work.

## Execution Rules

Codex may implement only the current written slice.

Codex must not:

- expand the feature beyond the slice
- combine multiple PR slices into one implementation
- refactor unrelated code
- redesign the UI while doing data-layer work
- alter data rules while doing UI work
- run broad exploratory changes to see what happens
- decide the next phase during implementation
- merge into `main`

Codex must:

- read the named project documents before editing
- state the intended files before implementation when practical
- keep the diff small
- add or update tests required by the slice
- update `CHANGELOG.md` when behavior or documentation changes
- open a pull request for review
- stop after the requested verification summary

## Branch Pattern

Use names like:

- `codex/phase-3-4-source-reuse-action`
- `codex/phase-3-4-source-reuse-ui`
- `codex/phase-3-4-source-reuse-tests`
- `codex/docs-quota-aware-workflow`
- `audit/security-review`
- `audit/performance-review`

Branch names should identify the phase and one bounded purpose.

## Pull Request Requirements

Every pull request must include:

1. Goal
2. Phase and slice identifier
3. Files changed
4. Files intentionally not changed
5. Plain-English explanation
6. Acceptance criteria satisfied
7. Tests run
8. Tests not run, with reason
9. Risks
10. Rollback notes
11. Documentation updates
12. Changelog update
13. Confirmation that no out-of-scope work was included

## Testing Rules

Codex should write or update tests required by the slice.

Codex should not repeatedly run the full test suite unless the slice explicitly requires it. Preferred verification order:

1. targeted tests for changed behavior
2. typecheck if types or interfaces changed
3. lint if files were edited in linted areas
4. build only for route, layout, or integration changes
5. full test suite only at phase closeout or before merge when required

When possible, the human runs verification locally and gives Codex only the concrete failure output. Codex should then make a targeted correction rather than re-analyzing the entire project.

## Multiple-Agent Rules

Multiple agents may work at the same time only if their files and responsibilities are separated.

Agents must not edit the same files unless explicitly assigned.

Specialist agents may review important pull requests before merging:

- Security Agent
- Data Integrity Agent
- UI/UX Agent
- Performance and Scale Agent
- Documentation Agent

Specialist review must not expand the implementation scope. It may identify defects, risks, or future slices.

## Stop Conditions

Codex must stop when:

- the slice is complete
- tests required by the slice pass or fail with a reportable error
- the task would require a decision not specified in documentation
- implementation would cross into a different phase or layer
- the next step would be exploratory rather than required

When stopped, Codex should report what was completed, what was not completed, and the exact next recommended slice.