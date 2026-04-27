# Post-Merge Checklist

## Purpose

Use this checklist after the Phase 2.2 PR is merged to verify that `main` installs, runs, imports, persists, exports, and displays contributors from a fresh local setup.

Do not begin Phase 3 during this verification.

## Fresh Clone And Install

1. Clone the repository from GitHub.
2. Check out `main`.
3. Install dependencies:

```bash
npm install
```

4. Confirm the app builds against a fresh checkout:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Fresh SQLite Database

Use a clean local database path for verification:

```bash
LIBRARY_DB_PATH=/tmp/library-phase2-post-merge.sqlite npm run dev
```

Open:

```text
http://localhost:3000/login
```

Log in as:

- Email: `librarian@library.test`
- Password: `demo123`

## Import CSV

1. Open `/collection/import`.
2. Upload:

```text
apps/web/fixtures/phase2/valid-holdings.csv
```

3. Confirm preview counts:

- 2 valid rows
- 0 warning rows
- 0 invalid rows
- 0 duplicate rows

4. Confirm import.

Expected result:

- 2 holdings imported
- 0 rows skipped
- batch status is `confirmed`

## Verify Holdings

1. Open `/collection`.
2. Confirm imported holdings appear:

- Watchmen
- Spirited Away

3. Open Watchmen.
4. Confirm the page says:

```text
This Phase 2 holding has already been saved.
```

5. Confirm `Save Metadata` does not appear until edit mode.

## Verify Contributors

On the Watchmen holding detail page:

1. Confirm `Structured Contributors` is visible.
2. Confirm separate contributor rows:

- Alan Moore
- Dave Gibbons

3. Confirm roles are blank or shown as role not specified because the fixture uses a legacy flat contributor string.
4. Confirm source is `legacy_flat`.

## Verify Export

1. Open `/collection/export`.
2. Confirm a CSV download is produced.
3. Confirm export includes:

- `internal_system_id`
- `external_local_identifier`
- `original_creator_contributor`
- `contributor_name`
- `contributor_role`
- `contributor_sort_order`
- `contributor_source`

4. Confirm Phase 1.2 mock titles such as `Akira` and `Persepolis` do not appear.
5. Confirm Watchmen contributor rows preserve holding identity while listing contributors separately.

## Verify Database

Run these checks against the fresh database:

```sql
SELECT external_local_identifier, COUNT(*)
FROM holdings
GROUP BY external_local_identifier;
```

Expected:

- `1001` count is `1`
- `1002` count is `1`

```sql
SELECT h.title, hc.name, hc.role, hc.sort_order, hc.source
FROM holding_contributors hc
JOIN holdings h ON h.id = hc.holding_id
ORDER BY h.title, hc.sort_order;
```

Expected:

- Watchmen has Alan Moore and Dave Gibbons as separate contributor rows.
- Legacy fixture contributor roles are blank.
- Source is `legacy_flat`.

```sql
SELECT h.title, hel.field_name, hel.reason
FROM holding_edit_logs hel
JOIN holdings h ON h.id = hel.holding_id
ORDER BY h.title, hel.edited_at;
```

Expected:

- Imported holdings have `created` audit entries with reason `Initial import`.

## Release Tag

After post-merge verification passes on `main`, create the Phase 2.2 stability tag:

```bash
git tag v2.2-phase2-stable
git push origin v2.2-phase2-stable
```

Only tag after the merged `main` branch has passed install, tests, build, import, holdings review, export, and contributor checks.
