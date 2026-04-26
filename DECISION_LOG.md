# Decision Log

This file records major project decisions.

## Format

### Decision

### Date

### Context

### Options Considered

### Decision Made

### Rationale

### Risks

### Follow-up Actions

---

## Initial State

No decisions recorded yet.

---

## Decision: Keep Phase 1.2 Mock Scaffolding Inside Phase 1 Foundation

### Date
2026-04-26

### Context
The current workspace includes Phase 1.2 mock-only data models, sample records, dashboard summaries, and title relationship pages. A later instruction asked to complete Phase 1 only, which created ambiguity about whether the Phase 1.2 mock scaffolding should be removed, hidden, or kept.

### Options Considered
1. Remove Phase 1.2 mock scaffolding and return to a strict Phase 1 shell.
2. Hide Phase 1.2 mock scaffolding from navigation while keeping code in place.
3. Keep Phase 1.2 mock scaffolding visible, clearly labeled as mock/static data, and continue completing the Phase 1 foundation around it.

### Decision Made
Keep Phase 1.2 mock scaffolding visible as the most recent accepted state, while preserving Phase 1 boundaries against real data, ingestion, AI enrichment, market search, analytics, recommendations, purchasing, external APIs, and production authentication.

### Rationale
The project owner confirmed that Phase 1.2 is fine and should be treated as the most recent state. Keeping it avoids churn while still requiring explicit labels and status language so testers do not mistake mock records for working system features.

### Risks
- Testers may assume mock records are real data unless labels remain visible.
- Future work must avoid building workflow behavior on top of static examples without a reviewed Phase 2 or later plan.
- Demo authentication remains local-only and unsuitable for production.

### Follow-up Actions
- Keep all mock records clearly labeled.
- Continue documenting Phase 1 and Phase 1.2 boundaries in README and placeholder pages.
- Revisit data persistence, imports, and review workflows only in later approved phases.

---

## Decision: Phase 2 Collection Graph Foundation Scope

### Date
2026-04-26

### Context
Phase 2 is being proposed as the Collection Graph Foundation. The project owner provided decisions about persistence, identifier strategy, invalid CSV row behavior, permissions, and collection-area seed values before any implementation begins.

### Options Considered
1. Use lightweight local file storage and defer structured persistence.
2. Use local SQLite persistence for reliable records, duplicate checks, edits, exports, audit logs, and future migration.
3. Let all roles browse imported holdings immediately.
4. Keep real imported holdings management limited to librarian roles during Phase 2.

### Decision Made
Phase 2 will use local SQLite persistence. Every holding will have an internal system ID and a primary external local catalog identifier. After inspecting the provided sample CSV, `record_id` is the proposed primary external identifier because it is present on every sample row and unique across the sample. The importer must remain flexible and mappable because real EdPort exports may vary. Invalid CSV rows will not block the entire import: the app will preview all rows, allow valid rows to import, skip invalid rows, and require explicit confirmation. Real imported holdings management is librarian-only in Phase 2. Students and professors may see placeholders only. Collection areas begin as configurable seed values: Comics / Graphic Novels, Manga / Anime, Illustration, Animation, Film / DVD, Video Games, and Books / Other.

### Rationale
SQLite gives Phase 2 enough structure for duplicate detection, edit tracking, export, audit logs, and future migration without introducing external services. Inspecting the sample CSV avoids guessing the field that controls duplicate safety. Partial import balances usability with clear validation and confirmation. Librarian-only access keeps messy imported holdings data out of student and professor views until explicitly enabled later.

### Risks
- Real production EdPort exports may differ from the inspected sample and require remapping.
- Partial imports require careful result summaries so skipped rows are not forgotten.
- Seed collection areas may need adjustment after real catalog data reveals edge cases.
- SQLite remains local development persistence unless a later deployment plan migrates it.

### Follow-up Actions
- Use `record_id` as the proposed default identifier for this sample.
- Keep identifier mapping flexible for real EdPort export variations.
- Keep AI enrichment, market search, analytics calculations, recommendations, external APIs, and purchasing workflows out of Phase 2.
- Treat collection areas as configurable seed data during implementation.
