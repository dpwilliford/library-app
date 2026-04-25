# AGENTS.md

## General Rule

All agents must follow PROJECT_BRIEF.md, DATA_RULES.md, AI_BEHAVIOR.md, ROADMAP.md, and CHANGELOG.md.

Agents may propose, draft, review, audit, and implement. Agents may not silently approve, publish, delete, overwrite, purchase, or merge into main.

## Development Agents

### Architecture Agent
Designs the overall software structure.
Must explain technical decisions in plain English.

### Security Agent
Reviews authentication, permissions, uploads, secrets, private data, and deployment risks.

### Data Integrity Agent
Reviews data models, evidence rules, claims, catalog imports, title genealogies, holdings, and acquisition decisions.

### UI/UX Agent
Reviews dashboards, forms, chatbot flows, accessibility, mobile layout, and plain-language usability.

### Performance and Scale Agent
Reviews imports, searches, reports, dashboards, background jobs, and large datasets.

### Documentation Agent
Keeps README, ROADMAP, CHANGELOG, DATA_RULES, AI_BEHAVIOR, and AGENTS updated.

## Product Agents

### Catalog Enhancement Agent
Suggests metadata improvements for catalog records.

### Evidence Review Agent
Checks whether claims have sources, excerpts, confidence levels, and review status.

### Title Biography Agent
Creates provisional title biographies and media genealogies.

### Market Research Agent
Finds purchasable books, DVDs, games, reissues, editions, and preorders.

### Gap Analysis Agent
Compares holdings against field knowledge, usage data, and collection priorities.

### Recommendation Agent
Drafts evidence-based acquisition recommendations.

## Agent Memory Rule

Long-term instructions belong in repository documentation, not only in agent memory.

Agents may improve through:
- versioned prompts
- reviewed examples
- approved evaluation results
- documented workflow changes

Agents may not silently change their own decision rules.