# Phase 2 Checklist: Collection Graph Foundation

## Goal

Create the first real local holdings layer for the private app.

Phase 2 proves that librarians can bring catalog-style spreadsheet data into the app, review it, correct it, assign collection areas, and export it again without AI, external services, market data, analytics, or recommendation workflows.

## In Scope

- Local holdings data model
- CSV import preview
- CSV column mapping
- Required-field validation
- Duplicate detection
- Librarian confirmation before saving
- Manual record editing
- Collection-area assignment
- Local holdings list view
- Local holding detail view
- Export to CSV
- Import batch history
- Clear labels for local holdings authority

## Out Of Scope

- AI enrichment
- AI claim generation
- Field knowledge base
- Market search
- Vendor search
- External APIs
- Recommendation engine
- Student/professor recommendation workflows
- Purchasing workflows
- Analytics calculations
- Checkout trend reports
- Head librarian approval workflow
- Production deployment

## Required Roles

### Librarian

Can import, preview, confirm, edit, assign collection areas, and export local holdings.

### Collection-Area Librarian

Can view local holdings and update assigned collection-area information.

### Head Librarian

Can view local holdings and collection-area coverage, without Phase 2 analytics or purchase decisions.

### Administrator

Can support system access, but should not override collection meaning.

### Student And Professor

Can see placeholder holdings or exploration pages only. They must not see real imported holdings in Phase 2 unless explicitly enabled in a later phase.

## Required Placeholder Updates

Phase 2 should replace the Collection Graph placeholder with working local holdings screens.

Other areas must remain placeholders:

- Recommendations
- Analytics
- Title Genealogies beyond existing mock/static examples
- Market Alerts
- Evidence Review
- Admin/System Settings beyond existing Phase 1 behavior

## Import Checklist

- CSV file can be selected locally.
- CSV is parsed without external services.
- App shows file name, row count, and detected columns.
- App shows column mapping before save.
- App proposes `record_id` as the default identifier when that sample column is present.
- App allows librarian-controlled remapping when real exports use different identifier columns.
- Required fields are identified.
- Missing required values are flagged.
- Duplicate local identifiers are flagged.
- Invalid statuses or formats are flagged.
- Nothing is saved until a librarian confirms.
- Valid rows can be imported while invalid rows are skipped, after explicit confirmation.
- Import result shows saved, skipped, and rejected counts.
- Import batch is recorded.

## Data Checklist

- Holding records distinguish original import values from current edited values where possible.
- Each holding has an internal system ID.
- Each holding has a primary external local catalog identifier once the source field is verified.
- Each holding has title or display name.
- Each holding has format or material type when available.
- Each holding has location when available.
- Each holding has status.
- Each holding has collection area or unassigned state.
- Each holding references its import batch.
- Manual edits record at least updated timestamp and updating role/user where possible.

## UI Checklist

- Collection Graph clearly says it represents local holdings.
- Import screen explains that no AI or external APIs are used.
- Preview screen is readable and filterable enough for review.
- Validation messages are plain English.
- Records with problems are not hidden.
- Owned status is clear.
- Unassigned collection areas are easy to find.
- Manual edits are explicit and save/cancel behavior is clear.
- Export action is clearly labeled.

## Security And Privacy Checklist

- Collection pages remain behind login.
- Import tools are visible only to approved librarian roles.
- Real imported holdings are visible only to librarian roles in Phase 2.
- Students and professors see placeholder holdings/exploration pages only.
- No CSV data is sent to external APIs.
- Demo authentication limitations remain documented if still in use.
- No source files are stored unless explicitly approved.
- No destructive delete behavior is added without separate confirmation design.

## Testing Checklist

- Import a valid CSV.
- Import a CSV with missing required fields.
- Import a CSV with duplicate local identifiers.
- Import a CSV with extra unknown columns.
- Confirm valid rows can be saved after preview.
- Confirm valid rows can import while invalid rows are skipped only after explicit confirmation.
- Confirm invalid rows are flagged before save.
- Confirm saved holdings appear in Collection Graph.
- Confirm a librarian can edit a holding.
- Confirm a librarian can assign a collection area.
- Confirm export produces a CSV.
- Confirm logged-out users cannot reach Collection Graph.
- Confirm students and professors cannot see real imported holdings.

## Completion Criteria

Phase 2 is complete when:

- Local holdings can be imported from CSV with preview and validation.
- Saved holdings can be viewed, edited, assigned, and exported.
- Data authority and local-only boundaries are clear.
- All out-of-scope features remain absent.
- Documentation reflects how to run, test, import, and export.

## Clarifying Questions Before Implementation

1. Should duplicate imports update existing records, create a new version, or be blocked?
   Why this matters: duplicate behavior is the biggest data integrity risk in Phase 2.

2. Should the app store uploaded CSV files themselves, or only parsed import batches and row data?
   Why this matters: storing files improves traceability but increases storage and privacy considerations.
