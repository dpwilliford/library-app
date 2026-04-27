# Design System

## Design Direction

The interface is Ringling-inspired, not copied.

Reference traits:

- bold black-and-white institutional layout
- large sans-serif headings
- high-contrast navigation
- strong spacing
- card and grid structure
- clear calls to action

The app must not copy Ringling logos, images, proprietary CSS, or page assets. The design is recreated with original local components and CSS for this private collection-management app.

## Core Principle

The interface must prioritize clarity, legibility, and structured librarian review.

This is a data-rich system used by nontechnical experts. Design must reduce cognitive load, make authority clear, and keep unfinished phases visibly separate from working Phase 2 collection tools.

## Tokens

### Typography

- Font stack: `Inter`, `Helvetica Neue`, `Arial`, system sans-serif.
- H1: oversized, bold, institutional page title.
- H2: section title for review areas.
- Body: readable 16px base with generous line height.
- Labels and navigation: uppercase, bold, compact.

### Color

- Primary background: white.
- Primary text: near-black.
- Primary navigation and CTAs: black.
- Accent: restrained warm institutional accent for review emphasis only.
- Muted text: neutral gray.
- Warnings and duplicate states: restrained review colors, never decorative.

### Spacing

- Use the spacing scale in `globals.css`: `--space-1` through `--space-8`.
- Prefer larger section spacing and compact controls.
- Keep dense tables readable with clear row separators.

### Borders

- Cards and panels use square, high-contrast borders.
- Dividers should support scanning and review.
- Badges/tags are the only common rounded UI element.

## Components

### App Shell

- Institutional black top navigation.
- Compact primary links for Phase 2 work:
  - Dashboard
  - Holdings
  - Import CSV
  - Export
  - Audit Log
- Secondary links live under More.
- Signed-in role remains visible in the main content header.

### Mobile Navigation

- Header is compact on mobile.
- Menu opens on demand.
- Secondary links are collapsed under More.
- Menu is scrollable when needed.
- Tap targets remain at least 40px high.
- Navigation uses clear labels and ARIA landmarks.

### Page Hero

- Use large H1 headings and a short muted explanation.
- Eyebrow text identifies phase, role, or review context.
- Avoid marketing copy; use operational language.

### Cards And Grids

- Panels group related review work.
- Summary blocks use high-contrast count cards.
- Holding rows and mock rows use square bordered cards or tables.

### Badge / Tag

Badges and tags are a core component. All phase labels, role labels, ownership labels, validation labels, and import-state labels must use the shared `Badge` component from `apps/web/components/Badge.tsx`.

Shape and spacing:

- fully rounded pill shape with `border-radius: 9999px`
- inline-flex layout
- consistent vertical and horizontal padding
- visible spacing from surrounding text
- no cramped square or rectangular tags
- no inline badge styles

Variants:

- `primary`: black background, white text
- `subtle`: white or quiet surface with black text
- `warning`: review-needed state
- `error`: invalid or duplicate state
- `success`: owned/imported/positive state

Correct usage:

```tsx
<Badge variant="primary">Static Phase 1.2 demo record</Badge>
<Badge variant="error">duplicate</Badge>
```

Incorrect usage:

```tsx
<span className="placeholder-label">Static Phase 1.2 demo record</span>
<span className="status-pill duplicate">duplicate</span>
```

Rule: no raw `<span>` badges. If a label visually behaves like a badge, it must use `<Badge />`.

### Forms And Filters

- Filters are compact, aligned, and easy to scan.
- Inputs use visible borders.
- Buttons use institutional CTA styling.
- Clear/reset actions must be available when filters are applied.

### Import Batch Review

- Show summary counts.
- Show row-level status and human-readable outcome.
- Duplicate rows must clearly state that no overwrite, merge, update, or delete automation occurs in Phase 2.

### Holding Detail

- Editable metadata appears first.
- Audit/edit logs are visible below the form.
- Audit entries show field, old value, new value, editor, timestamp, and reason.

## Role-Based UI

- Student and professor roles do not see real imported holdings in Phase 2.
- Librarian roles see operational import/review/export tools.
- Head librarian can view Phase 2 holdings coverage without Phase 3 decisions or analytics.
- Administrator sees system placeholders only until access management is implemented.

## Accessibility

- Maintain high contrast.
- Keep keyboard-visible focus states.
- Use semantic navigation landmarks.
- Use native controls for forms, filters, and disclosure menus.
- Preserve large mobile tap targets.

## Anti-Patterns

- Copying external brand assets or CSS.
- Starting Phase 3 evidence, AI, market, analytics, recommendation, or purchasing workflows.
- Hiding review risk behind vague labels.
- Fullscreen mobile navigation that blocks the working view by default.
- Decorative color palettes that distract from librarian review.
