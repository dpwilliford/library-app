# Collection Area Specification: Phase 2

## Purpose

Collection areas group local holdings into librarian-controlled categories that reflect the academic art-and-design library's collecting priorities.

In Phase 2, collection areas are used for assignment and browsing only. They do not power analytics, recommendations, market alerts, or purchasing decisions yet.

## Principles

- Collection areas must be controlled values.
- A holding may be unassigned.
- A holding should normally have one primary collection area in Phase 2.
- Collection-area assignment is a librarian-controlled action.
- Collection areas should be broad enough to remain usable across imports.
- Collection areas are configurable seed values, not hardcoded permanent categories.

## Initial Collection Areas

Confirmed provisional Phase 2 seed values:

1. Comics / Graphic Novels
2. Manga / Anime
3. Illustration
4. Animation
5. Film / DVD
6. Video Games
7. Books / Other
8. Unassigned

## Collection Area Fields

Each collection area should include:

- `id`
- `name`
- `description`
- `isActive`
- `sortOrder`

## Area Definitions

### Comics / Graphic Novels

Sequential art, graphic novels, comics criticism, comics history, and related creator-focused books.

### Manga / Anime

Manga, anime, anime studies, manga history, and related adaptations or production context.

### Illustration

Illustration practice, illustrators, visual storytelling, picture books, and applied image-making.

### Animation

Animation history, technique, production, studios, artists, and animated works across formats.

### Film / DVD

Film, video, cinema studies, moving-image practice, DVDs, Blu-rays, and related production contexts.

### Video Games

Game studies, game design, game art, game history, and game-related media.

### Books / Other

Books and other local holdings that do not fit the more specific provisional areas yet.

### Unassigned

Temporary state for records that have not yet been reviewed or mapped to an approved area.

## Assignment Rules

- Imported rows may map to a collection area if the CSV value matches an approved area.
- Unknown CSV values should not create new collection areas automatically.
- Unknown values should be flagged for librarian review.
- Librarians may assign or change collection areas manually.
- New collection areas should require documentation update or administrator/librarian approval.

## Display Rules

Collection-area labels should be plain language.

Use:

- "Manga / Anime"
- "Film / DVD"
- "Unassigned"

Avoid:

- unexplained codes
- internal abbreviations
- AI-generated categories
- overly narrow one-off labels

## Future Considerations

Later phases may add:

- secondary collection areas
- collection-area librarians assigned to areas
- percentage targets by area
- acquisition activity by area
- gap reports by area
- market alerts by area

These are not Phase 2 features.

## Clarifying Questions Before Implementation

1. Should each holding have only one primary area in Phase 2, or should multiple areas be allowed?
   Why this matters: one area keeps the UI and import simple; multiple areas better reflect interdisciplinary works but complicate editing and export.

2. Should collection-area librarians be assigned to areas in Phase 2?
   Why this matters: assignment affects permissions and dashboard behavior, but may be better saved for a later workflow phase.
