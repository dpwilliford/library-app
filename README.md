# README.md

# Project Overview

This project is a private, AI-assisted collection intelligence system for an academic art-and-design library.

It supports evidence-based collection development for comics, manga/anime, illustration, animation, film, video games, and related media.

The system connects:
- local library catalog data
- field and industry knowledge
- title genealogies (works across media and time)
- market availability
- usage and circulation data
- faculty, student, and librarian recommendations
- collection-development policies and decisions

All knowledge must be evidence-based and reviewed by librarians. Final acquisition decisions are made by the head librarian.

---

# Key Principles

- Private, password-protected system
- Role-based access (students, faculty, librarians, head librarian)
- AI assists but does not decide
- All claims must be tied to evidence
- All decisions must be logged
- Collection is selective, not exhaustive
- System must be modular, auditable, and exportable

---

# Documentation Structure

The following files define the system:

- PROJECT_BRIEF.md — full system definition
- ROADMAP.md — phased development plan
- DATA_RULES.md — rules for evidence and data integrity
- AI_BEHAVIOR.md — rules for AI actions
- USER_ROLES.md — permissions and responsibilities
- COLLECTION_POLICY.md — selection philosophy
- TITLE_GENEALOGY_MODEL.md — how works and series are modeled
- ANALYTICS_SPEC.md — metrics and dashboard logic
- RECOMMENDATION_WORKFLOW.md — how items are proposed and approved
- AGENTS.md — AI and development agents
- CODEX_WORKFLOW.md — GitHub and development process
- CHANGELOG.md — record of changes

---

# Development Model

This project is built using:

- GitHub for version control
- Codex for AI-assisted development
- Multiple agents working in parallel on separate branches
- Pull requests for all changes
- Human review before merging

The main branch must remain stable.

---

# System Domains

The system consists of five core domains:

1. Collection Graph — what the library owns
2. Field Knowledge Base — what exists in the wider field
3. Market Layer — what is available for purchase
4. Institutional Layer — users, roles, courses, recommendations
5. Analytics Layer — targets, usage, reports, and decision support

---

# Current Status

Project is in early planning and specification phase.

No production system exists yet.

Next step:
Codex will review documentation and propose initial architecture and Phase 1 implementation.

---

# Instructions for Codex

Before writing code:

1. Read all root-level documentation files.
2. Identify contradictions or missing requirements.
3. Propose system architecture.
4. Propose initial folder structure.
5. Propose minimal Phase 1 implementation.

Do not begin full implementation until this review is complete.
