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
