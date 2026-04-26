# Design System

## Source and Authority

This file translates the Ringling College of Art and Design Core Branding Guidelines 2025 into practical interface rules for this private web application.

The brand guide is authoritative for institutional visual identity. This file is authoritative for how that identity is adapted into the software interface.

Primary source:
- Ringling College of Art and Design, Core Branding Guidelines 2025
- URL: https://www.ringling.edu/wp-content/uploads/2022/03/Core_Branding_Guidelines_2025.pdf

Codex must read this file before changing UI, typography, color, layout, dashboard language, or component styling.

---

## Core Principle

The interface must reflect the visual and intellectual identity of Ringling College of Art and Design while serving a private, data-rich, librarian-reviewed collection intelligence system.

The design must feel:

- clear
- intentional
- minimal
- structured
- professional
- creative but restrained
- appropriate for an academic art-and-design context

This is not a generic startup dashboard. It is not a public marketing site. It is a private institutional research, review, and decision-support system.

---

## Ringling Brand Translation

The Ringling guide states that the brand system uses design specifications, fonts, colors, and applications to create a cohesive visual voice across digital and print channels.

For this software, that means:

- use a consistent interface system
- avoid arbitrary styling decisions
- maintain institutional visual discipline
- use restrained color and clear typography
- design for clarity before decoration

---

## Typography

### Primary Typeface

Use Inter wherever possible.

The Ringling brand guide identifies Inter as the institutional typeface and describes the typography system as simple, mature, sophisticated, and oriented toward clear communication.

### Allowed Weights

Use Inter weights deliberately:

- Light: limited use only; never for essential UI text
- Regular: body text
- Medium: labels and metadata
- Semibold: section headings and emphasized interface text
- Bold: page titles and major dashboard numbers
- Italic: limited annotation only

### Typography Rules

- Maintain strong hierarchy.
- Use generous line height for text-heavy sections.
- Avoid long full-width text blocks.
- Keep body text readable before decorative.
- Do not use multiple competing typefaces.
- Do not use display typography unless explicitly justified.

### Practical UI Hierarchy

Use a consistent hierarchy:

1. Page title
2. Role or context banner
3. Section title
4. Card title
5. Body text
6. Metadata label
7. Status text

---

## Color System

### Core Rule

The interface must be anchored in black and white.

The Ringling brand guide states that the college does not have one specific institutional color and that color use should be anchored on black and white with a pop of color that supports the message or imagery.

### Base Colors

Use:

- black
- white
- near-black
- gray values for hierarchy and borders

The UI should remain legible and coherent even if accent colors are removed.

### Ringling Accent Palette

The brand guide includes the following color palette. These colors may be used sparingly as accents, status indicators, or section identifiers:

- Red: `#EF3E2D`
- Orange: `#F7941D`
- Yellow Orange: `#FEBE10`
- Yellow: `#FFE100`
- Green: `#92C83E`
- Teal Green: `#00B475`
- Teal: `#00B1B3`
- Sky Blue: `#00B7F1`
- Blue: `#008CCF`
- Purple: `#765BA7`
- Magenta: `#EC008C`

### Color Rules

- Do not assign one dominant brand color.
- Do not use large saturated color fields unless specifically justified.
- Use accent color to support meaning, not decoration.
- Use color consistently for status or category meaning.
- Maintain accessibility and contrast.
- Do not rely on color alone to communicate state.

### Suggested Status Use

- Review required: restrained red or orange accent
- Pending: yellow or orange accent
- Approved: green accent
- Informational: blue or teal accent
- Administrative/system: gray or purple accent

These mappings are provisional and may be revised, but must remain documented.

---

## Logo and Institutional Identity

Do not improvise the Ringling logo, wordmark, or acronym treatment.

Rules:

- Do not recreate the logo in code unless an approved institutional asset is provided.
- Do not change the logo typography.
- Do not use the logo on top of images.
- Do not use insufficient contrast.
- Do not use “RCAD” as a public-facing identity label.
- If a logo is used later, it must be an approved asset from Ringling.

For Phase 1, the interface should use text identity only:

`Library Collection Intelligence System`

If institutional naming is added later, it must be reviewed.

---

## Layout System

### Structure

The preferred structure is:

- top bar for identity, current user, and session controls
- left sidebar for primary navigation
- main content area for role dashboards and workflow pages
- optional right panel for secondary context in later phases

### Spacing

- Use generous spacing.
- Avoid cramped cards.
- Use whitespace to separate conceptual areas.
- Keep dense information structured with headings, lists, and tables.

### Reading Width

- Avoid full-width paragraph text.
- Use readable content widths for explanatory material.
- Use grids for dashboard cards and metrics.

---

## Component Rules

### Cards

Cards must group related information, not decorate the page.

Use:

- light borders
- restrained backgrounds
- no heavy shadows
- clear headings
- concise body text

### Buttons

Buttons must use action-oriented language.

Use:

- `Review`
- `Submit Recommendation`
- `View Evidence`
- `Open Report`
- `Log Out`

Avoid:

- `Let’s go`
- `Get started`
- `Awesome`
- `Explore now`

### Tables

Tables will be important in later phases.

Rules:

- clear column headings
- readable row spacing
- visible status labels
- sortable/filterable when implemented
- never hide evidence or review status

### Forms

Forms must be linear and explicit.

Rules:

- one clear task per form
- visible required fields
- explanatory helper text where needed
- no hidden submission consequences
- no AI-generated submission without review

---

## Dashboard Design

Dashboards must be role-specific and authority-aware.

### Student

Emphasize:

- exploration
- recommendations
- course or research need

Do not imply approval authority.

### Professor

Emphasize:

- course support
- curriculum gaps
- recommended titles
- program relevance

Do not imply final purchasing authority.

### Librarian

Emphasize:

- evidence review
- collection review
- metadata quality
- recommendation assessment

### Collection-Area Librarian

Emphasize:

- assigned collection area
- activity
- gaps
- proposed acquisitions
- escalation to head librarian

### Head Librarian

Emphasize:

- analytics
- targets
- approvals
- policy-based decisions
- final acquisition authority

### Administrator

Emphasize:

- users
- permissions
- system settings
- configuration

---

## Placeholder Design

Phase 1 placeholders must not feel empty or generic.

Each placeholder page must use this structure:

1. Title
2. Purpose
3. Future Data
4. Future Actions
5. Current Phase Status

Example:

### Collection Graph

Purpose:
Represents what the library owns.

Future Data:

- catalog records
- holdings
- formats
- locations
- collection areas

Future Actions:

- browse collection
- review holdings
- identify gaps

Current Phase Status:
Placeholder only. No catalog data has been imported yet.

---

## Voice and Interface Language

The interface must be direct, precise, and institutional.

Use:

- `Collection Graph`
- `Evidence Review`
- `Pending Recommendations`
- `Acquisition Targets`
- `Review Required`
- `Head Librarian Decision Queue`

Avoid:

- casual startup language
- motivational filler
- vague labels
- overfriendly copy
- unreviewed certainty

Do not use phrases such as:

- `Welcome back!`
- `Let’s get started!`
- `You’re all set!`
- `Discover amazing insights`

---

## Accessibility

Accessibility is mandatory, not optional.

Rules:

- high contrast
- keyboard-accessible navigation
- visible focus states
- meaningful headings
- semantic HTML
- no color-only state indicators
- forms must have labels
- navigation must be understandable by screen reader users

---

## Phase 1 and Phase 1.1 Constraints

Current design work may refine:

- language
- role dashboards
- placeholder structure
- navigation labels
- spacing
- typography
- restrained color usage

Current design work must not add:

- real authentication
- database
- catalog ingestion
- AI features
- market search
- real analytics
- purchase workflows
- external APIs

---

## Design Review Checklist

Before any UI pull request is accepted, confirm:

- Does the interface use Inter or an appropriate Inter fallback?
- Is the design anchored in black and white?
- Are accent colors restrained and meaningful?
- Are roles visually and textually distinct?
- Does the UI avoid implying authority where none exists?
- Are placeholders structured and honest?
- Is the language clear and professional?
- Are unfinished features clearly labeled?
- Is the page readable on desktop and usable on mobile?
- Are accessibility basics preserved?

---

## Anti-Patterns

Do not use:

- generic SaaS dashboard styling
- heavy shadows
- gratuitous gradients
- cluttered cards
- excessive color
- vague onboarding language
- decorative icons without meaning
- hidden navigation
- ambiguous role authority
- UI claims not backed by actual data

---

## Evolution Rule

Agents must propose and justify design changes before implementation.

Any deviation from this design system must be documented in `TECHNICAL_DECISIONS.md` or an equivalent decision log.
