# Library AI System

## Project Overview

This project is a private, AI-assisted collection intelligence system for an academic art-and-design library.

It supports evidence-based collection development for comics, manga/anime, illustration, animation, film, video games, DVDs, books, and related media.

The system connects:
- local library catalog data
- field and industry knowledge
- title genealogies across media and time
- market availability
- usage and circulation data
- faculty, student, staff, and librarian recommendations
- collection-development policies and decisions

All knowledge must be evidence-based and reviewed by librarians. Final acquisition decisions are made by the head librarian.

## Key Principles

- Private, password-protected system
- Role-based access for students, professors, librarians, collection-area librarians, the head librarian, and administrators
- AI assists but does not decide
- All claims must be tied to evidence
- All decisions must be logged
- Collection is selective, not exhaustive
- Dashboard and review workflows are authoritative; chatbot-style interfaces are exploratory only
- System must be modular, auditable, reversible, and exportable

## Documentation Structure

The following root-level files define the system and must be read before implementation:

- `PROJECT_BRIEF.md` — full system definition
- `ROADMAP.md` — phased development plan
- `DATA_RULES.md` — rules for evidence, authority, and data integrity
- `AI_BEHAVIOR.md` — rules for AI actions and limits
- `USER_ROLES.md` — permissions and responsibilities
- `COLLECTION_POLICY.md` — selection philosophy and collection priorities
- `TITLE_GENEALOGY_MODEL.md` — how works, title clusters, instantiations, and holdings are modeled
- `ANALYTICS_SPEC.md` — metrics, dashboard logic, and target tracking
- `RECOMMENDATION_WORKFLOW.md` — how items are proposed, reviewed, and approved
- `SYSTEM_ARCHITECTURE.md` — conceptual deployment and modular architecture
- `AGENTS.md` — AI and development agents
- `INTERACTION_PROTOCOL.md` — how Codex must ask clarifying questions before building
- `CODEX_WORKFLOW.md` — GitHub and development process
- `PHASE_1_CHECKLIST.md` — Phase 1 acceptance criteria
- `PHASE_TRANSITION.md` — rules for moving between phases
- `CHANGELOG.md` — record of changes

## Development Model

This project is built using:

- GitHub for version control
- Codex for AI-assisted development
- Separate branches for all work
- Pull requests for review
- Human approval before merging

The `main` branch must remain stable.

## System Domains

The system consists of five core domains:

1. Collection Graph — what the library owns
2. Field Knowledge Base — what exists in the wider field and why it matters
3. Market Layer — what is available for purchase
4. Institutional Layer — users, roles, courses, departments, recommendations, and review authority
5. Analytics Layer — targets, usage, reports, collection balance, and decision support

## Current Status

The project is in Phase 1: private app foundation, with Phase 1.2 mock-only data scaffolding for testing relationships.

Phase 1 must remain limited to:
- local app setup
- login
- role-based demo users
- dashboard shell
- navigation placeholders
- testing instructions

Phase 1 must not add catalog ingestion, AI enrichment, market search, real recommendations, purchasing, analytics calculations, or evidence-review logic.

## Local Install And Run

Install dependencies:

```bash
npm install
```

Run the local web app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Demo Login Credentials

All demo users use this password:

```text
demo123
```

Available demo users:

- Student: `student@library.test`
- Professor: `professor@library.test`
- Librarian: `librarian@library.test`
- Collection-Area Librarian: `area@library.test`
- Head Librarian: `head@library.test`
- Administrator: `admin@library.test`

## Phase 1 Manual Test Checklist

1. Open `http://localhost:3000`.
2. Confirm the login screen appears.
3. Log in as each demo user and confirm the visible role label changes.
4. Confirm each role sees a distinct dashboard shell.
5. Click each visible navigation link and confirm the placeholder page loads.
6. Confirm each placeholder includes Title, Purpose, Future Data, Future Actions, and Current Phase Status.
7. Confirm unfinished areas are labeled as placeholders and do not appear functional.
8. Log out and confirm the app returns to `/login`.
9. Try opening `/dashboard` while logged out and confirm it redirects to `/login`.

## Phase 1 Limitations

- Demo authentication is local-only and not production security.
- Users are fixed in code; there is no invite flow yet.
- Phase 1.2 mock records are static examples, not catalog data.
- There is no catalog import, AI enrichment, external API use, market search, real analytics, purchasing workflow, or recommendation engine.

## Instructions for Codex

Before writing or revising code:

1. Read all root-level documentation files.
2. Follow `INTERACTION_PROTOCOL.md`.
3. Ask specific clarifying questions when requirements are ambiguous.
4. Explain why each question matters.
5. Stay within the active phase scope.
6. Identify contradictions or missing requirements.
7. Propose a plan before implementation.
8. Use a branch and pull request for changes.
9. Update documentation and `CHANGELOG.md`.

Do not merge into `main` without human approval.
