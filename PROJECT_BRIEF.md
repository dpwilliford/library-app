# Project Brief

## Project Summary

This project is a private, password-protected, AI-forward collection intelligence system for an academic art-and-design library.

The system supports evidence-based collection development for comics, graphic novels, manga, anime, illustration, animation, film, video games, DVDs, books, and related media arts.

The software is designed to be built and maintained through plain-language instructions. The project owner is not expected to define all technical details. Codex may propose technical architecture, data structures, implementation plans, and code, but it must explain decisions in plain English before or while implementing them.

The system must help librarians understand:

1. What the library owns.
2. What exists in the wider field, industry, and market.
3. What is currently available for purchase.
4. What faculty, students, librarians, and staff recommend.
5. What gaps, redundancies, strengths, and priorities exist in the collection.

## Core Purpose

The system must continuously connect:

- local catalog data
- field and industry knowledge
- title biographies and media genealogies
- market availability
- checkout and usage data
- user recommendations
- collection-development policies
- librarian review and approval

The goal is not automated purchasing. The goal is evidence-based collection-development support.

## Non-Negotiable Rules

1. This is a private web application, not a public website.
2. All users must log in.
3. Access must be role-based.
4. AI may propose, draft, enrich, classify, summarize, and recommend.
5. AI may not silently approve, publish, overwrite, delete, or purchase.
6. Every knowledge claim must be tied to evidence.
7. Every evidence-backed claim must store source, excerpt or supporting data, date accessed, confidence level, and review status.
8. Librarians review and approve knowledge claims.
9. The head librarian makes final collection-development decisions.
10. All decisions must be logged.
11. All data must be exportable.
12. All AI processing must be auditable.
13. The system must distinguish local holdings from external knowledge.
14. The system must distinguish original works, editions, translations, adaptations, reissues, special editions, and specific library holdings.
15. The system must be modular and future-proof.
16. Prompts, workflows, data rules, and agent behavior must be documented in the repository.
17. Do not build features that depend on unverifiable AI claims.
18. Do not make the chatbot the authority. The dashboard and review system are the authority.

## Main System Domains

### 1. Collection Graph

Represents what the library owns.

Includes:
- catalog records
- holdings
- local identifiers
- item format
- location
- acquisition date
- circulation or usage data
- collection area
- current status

This layer is authoritative for ownership.

### 2. Field Knowledge Base

Represents the wider field, industry, history, and cultural context.

Includes:
- works
- title clusters
- creators
- publishers
- studios
- genres
- subgenres
- movements
- countries of origin
- influence relationships
- adaptation histories
- translation histories
- release histories
- critical reception
- teaching significance

This layer is evidentiary and review-based.

### 3. Market Layer

Represents what is currently available for purchase.

Includes:
- vendor
- publisher-direct links
- Amazon links when available
- price
- format
- condition
- availability
- preorder status
- date checked
- source URL

Market data is unstable and must always be timestamped.

### 4. Institutional Knowledge Layer

Represents the school, staff, faculty, students, courses, programs, and recommendation activity.

Includes:
- users
- roles
- departments
- programs
- courses
- faculty expertise
- student recommendations
- professor recommendations
- librarian review activity
- collection-area assignments

### 5. Operational Analytics Layer

Represents targets, usage, activity, and collection-development performance.

Includes:
- monthly acquisition targets
- collection-area percentage targets
- number of items added
- checkout statistics
- recommendation statistics
- pending review counts
- collection balance reports
- market alerts
- activity reports