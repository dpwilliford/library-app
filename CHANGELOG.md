# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Added Phase 1 private web application scaffold.
- Added mock demo login for all required Phase 1 roles.
- Added role-specific dashboard content and active role labels.
- Added protected placeholder navigation pages.
- Added local testing documentation and demo credentials.
- Added CI workflow for install, linting, type checking, tests, and build.
- Refined Phase 1.1 dashboard language, role responsibilities, placeholder explanations, navigation labels, and visual hierarchy.
- Added Phase 1.1 role-aware navigation visibility with clear authority labels for view-only, librarian-review, and head-librarian-only areas.
- Refactored placeholder pages into consistent Purpose, Future Data, and Future Actions sections.
- Aligned Phase 1.1 typography, color, spacing, and authority language with the design system.
- Added Phase 1.2 mock-only data model scaffolding, sample title data, dashboard summaries, and title relationship pages.
- Tightened Phase 1 completion language, Current Phase Status placeholder sections, local run/test instructions, and Phase 1.2 mock-data boundaries.
- Proposed Phase 2 Collection Graph Foundation planning, checklist, data model, CSV import spec, and collection-area seed values.
- Implemented Phase 2 SQLite-backed local holdings management for librarian roles, including flexible CSV mapping, import preview, validation, duplicate detection, explicit confirmation, holding edits, audit logs, CSV export, and CSV fixture tests.
- Replaced the Phase 2 SQLite runtime adapter with a Node 20-compatible SQLite dependency so CI and local persistence use the same supported runtime path.
- Added Phase 2.2 Collection Graph review hardening for holdings filters, import row review states, clearer duplicate/skipped row language, audit-log visibility, messy CSV fixtures, and manual QA coverage.
- Aligned the app UI with an original Ringling-inspired institutional design direction and replaced the mobile-heavy sidebar with compact on-demand navigation.
- Added a Phase 2 manual testing guide for CSV upload, import lifecycle, SQLite inspection, fixture usage, export checks, and audit-log verification.
- Clarified UI and documentation language so Phase 1 foundation, static Phase 1.2 demo records, and Phase 2 SQLite-backed holdings are visibly distinct during testing.
- Standardized all app badges/tags through a shared pill-shaped Badge component and documented the system-level no raw badge rule.
- Added Phase 2 structured contributor metadata for holdings, including contributor rows with names, roles, sort order, source tracking, separate contributor editing, structured display, and non-collapsed export columns.
- Completed the Phase 2 audit closeout with controlled import/export test results, known limitations, remaining risks, and merge recommendation.
