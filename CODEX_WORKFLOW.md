# Codex Workflow

## GitHub Rules

The GitHub repository is the source of authority for the project.

The main branch must remain stable.

All work must happen on separate branches.

Codex agents must open pull requests for review.

No agent may merge into main without human approval.

## Branch Pattern

Use names like:

- feature/login-roles
- feature/catalog-import
- feature/evidence-review
- feature/title-biography
- feature/head-librarian-dashboard
- audit/security-review
- audit/performance-review

## Pull Request Requirements

Every pull request must include:

1. Goal
2. Files changed
3. Plain-English explanation
4. Risks
5. Testing steps
6. Rollback notes
7. Documentation updates
8. Changelog update

## Multiple-Agent Rules

Multiple agents may work at the same time only if their work is separated.

Agents must not edit the same files unless explicitly assigned.

Specialist agents should review important pull requests before merging:

- Security Agent
- Data Integrity Agent
- UI/UX Agent
- Performance and Scale Agent
- Documentation Agent