# Phase 1 Implementation

## Scope

Phase 1 creates the private application foundation:

- private demo login
- logout
- role-based demo users
- basic dashboard shell
- separate dashboard content for each required role
- protected placeholder navigation pages

Phase 1 does not include AI features, catalog ingestion, market tracking, a recommendation engine, purchasing, real analytics, evidence-review logic, or real collection data.

## Local Setup

1. Run `npm install`.
2. Run `npm run dev`.
3. Open `http://localhost:3000`.

No database or environment variables are required for Phase 1.

## Demo Login Credentials

All demo users use password `demo123`.

| Role | Email |
| --- | --- |
| Student | `student@library.test` |
| Professor | `professor@library.test` |
| Librarian | `librarian@library.test` |
| Collection-Area Librarian | `area@library.test` |
| Head Librarian | `head@library.test` |
| Administrator | `admin@library.test` |

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Manual Test Path

1. Open the app and confirm the login screen appears.
2. Log in as each demo user.
3. Confirm the active role label changes.
4. Confirm each role has different dashboard content.
5. Click every navigation link.
6. Confirm each unfinished area is clearly labeled as a placeholder.
7. Log out.
8. Try opening `/dashboard` while logged out and confirm you are sent back to login.
