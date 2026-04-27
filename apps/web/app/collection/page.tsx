import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getTitlesWithOwnership } from "@/lib/mockQueries";
import {
  getHoldingReviewFacets,
  getImportReviewSummary,
  listHoldings,
  listImportBatches,
  listImportRowsForReview,
  type HoldingReviewFilters,
  type ImportRowReviewFilters
} from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";

export default async function CollectionPage({
  searchParams
}: {
  searchParams: {
    q?: string;
    unassigned?: string;
    status?: string;
    format?: string;
    location?: string;
    rowStatus?: ImportRowReviewFilters["validationStatus"];
    rowAction?: ImportRowReviewFilters["importAction"];
  };
}) {
  const user = await requireUser();
  const titlesWithOwnership = getTitlesWithOwnership();
  const canManage = canManageHoldings(user.role);
  const holdingFilters: HoldingReviewFilters = {
    search: searchParams.q,
    unassigned: searchParams.unassigned === "true",
    status: searchParams.status,
    format: searchParams.format,
    location: searchParams.location
  };
  const rowFilters: ImportRowReviewFilters = {
    validationStatus: searchParams.rowStatus,
    importAction: searchParams.rowAction
  };
  const holdings = canManage ? listHoldings(holdingFilters) : [];
  const facets = canManage ? getHoldingReviewFacets() : { statuses: [], formats: [], locations: [] };
  const importBatches = canManage ? listImportBatches() : [];
  const importReviewRows = canManage ? listImportRowsForReview(rowFilters) : [];
  const importReviewSummary = canManage ? getImportReviewSummary() : null;
  const totalHoldingCount = canManage ? listHoldings().length : 0;

  return (
    <AppShell user={user}>
      <div className="stack">
        {canManage ? (
          <section className="panel stack" id="audit-log">
            <div className="page-action-header">
              <div>
                <p className="eyebrow">Phase 2 Collection Graph</p>
                <h1>Phase 2 SQLite-backed Holdings</h1>
                <p className="muted">
                  Librarian-controlled records stored in local SQLite from CSV import batches. No AI enrichment, market
                  search, analytics, or external APIs are used.
                </p>
              </div>
              <div className="action-row page-actions" aria-label="Collection actions">
                <Link className="button" href="/collection/import">
                  Import CSV
                </Link>
                {totalHoldingCount > 0 ? (
                  <Link className="button" href="/collection/export">
                    Export CSV
                  </Link>
                ) : (
                  <span className="export-empty-state">No Phase 2 holdings to export</span>
                )}
              </div>
            </div>
            <form className="panel filter-panel" action="/collection">
              <div className="field">
                <label htmlFor="q">Search holdings</label>
                <input id="q" name="q" defaultValue={searchParams.q ?? ""} placeholder="Title, identifier, creator, call number" />
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={searchParams.status ?? ""}>
                  <option value="">All statuses</option>
                  {facets.statuses.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="format">Format</label>
                <select id="format" name="format" defaultValue={searchParams.format ?? ""}>
                  <option value="">All formats</option>
                  {facets.formats.map((format) => (
                    <option value={format} key={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="location">Location</label>
                <select id="location" name="location" defaultValue={searchParams.location ?? ""}>
                  <option value="">All locations</option>
                  {facets.locations.map((location) => (
                    <option value={location} key={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              <label className="checkbox-row">
                <input name="unassigned" type="checkbox" value="true" defaultChecked={searchParams.unassigned === "true"} />
                Unassigned collection area
              </label>
              <div className="action-row">
                <button className="button" type="submit">
                  Apply Filters
                </button>
                <Link className="button secondary" href="/collection">
                  Clear
                </Link>
              </div>
            </form>
            {holdings.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Identifier</th>
                      <th>Title</th>
                      <th>Format</th>
                      <th>Status</th>
                      <th>Collection Area</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.id}>
                        <td>{holding.externalLocalIdentifier}</td>
                        <td>
                          <Link href={`/collection/holdings/${holding.id}`}>{holding.title}</Link>
                        </td>
                        <td>{holding.format || "Not mapped"}</td>
                        <td>{holding.status}</td>
                        <td>{holding.collectionAreaName || "Unassigned"}</td>
                        <td>{new Date(holding.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="phase-note">No local holdings match this review view. Adjust filters or start with a CSV import preview.</p>
            )}
          </section>
        ) : (
          <PlaceholderPage
            title="Collection Exploration"
            purpose="Provide future view-only collection exploration without exposing real imported holdings to students or professors in Phase 2."
            futureData={[
              "Librarian-approved collection summaries",
              "View-only holdings context when enabled in a later phase",
              "Collection areas and high-level ownership signals",
              "Approved title and format context"
            ]}
            futureActions={[
              "Browse approved collection information",
              "Describe learning, research, or course needs through later recommendation workflows",
              "View librarian-reviewed reports when those are enabled",
              "Avoid access to messy imported holdings management data"
            ]}
            phaseNote="Phase 2 imported holdings management is librarian-only. Students and professors do not see real imported holdings yet."
          />
        )}
        {canManage ? (
          <section className="panel stack">
            <h2>Phase 2 Import Batches</h2>
            {importBatches.length > 0 ? (
              <div className="mock-list">
                {importBatches.map((batch) => (
                  <Link className="mock-row" href={`/collection/import/${batch.id}`} key={batch.id}>
                    <span>
                      <strong>{batch.fileName}</strong>
                      <small>
                        {batch.status}: {batch.savedCount} saved / {batch.skippedCount} skipped
                      </small>
                    </span>
                    <span className="mock-row-meta">{new Date(batch.createdAt).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No import batches yet.</p>
            )}
          </section>
        ) : null}
        {canManage ? (
          <section className="panel stack">
            <div>
              <h2>Import Row Review</h2>
              <p className="muted">
                Review Phase 2 import rows that need librarian attention. Duplicate rows are never used to overwrite
                SQLite-backed holdings in Phase 2.2.
              </p>
            </div>
            {importReviewSummary ? (
              <div className="summary-grid">
                <div>
                  <strong>{importReviewSummary.warningRows}</strong>
                  <span>warning rows</span>
                </div>
                <div>
                  <strong>{importReviewSummary.invalidRows}</strong>
                  <span>invalid rows</span>
                </div>
                <div>
                  <strong>{importReviewSummary.duplicateRows}</strong>
                  <span>duplicate rows</span>
                </div>
                <div>
                  <strong>{importReviewSummary.skippedRows}</strong>
                  <span>skipped rows</span>
                </div>
                <div>
                  <strong>{importReviewSummary.importedRows}</strong>
                  <span>imported rows</span>
                </div>
              </div>
            ) : null}
            <div className="action-row">
              <Link className="button secondary" href="/collection?rowStatus=warning">
                Warning Rows
              </Link>
              <Link className="button secondary" href="/collection?rowStatus=invalid">
                Invalid Rows
              </Link>
              <Link className="button secondary" href="/collection?rowStatus=duplicate">
                Duplicate Rows
              </Link>
              <Link className="button secondary" href="/collection?rowAction=skipped">
                Skipped Rows
              </Link>
            </div>
            {importReviewRows.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Row</th>
                      <th>Identifier</th>
                      <th>Title</th>
                      <th>Validation</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importReviewRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.importBatchId ? (
                            <Link href={`/collection/import/${row.importBatchId}`}>{row.importBatchFileName ?? "Import batch"}</Link>
                          ) : (
                            row.importBatchFileName ?? "Import batch"
                          )}
                        </td>
                        <td>{row.rowNumber}</td>
                        <td>{row.mappedData.externalLocalIdentifier || "Missing"}</td>
                        <td>{row.mappedData.title || "Missing"}</td>
                        <td>
                          <Badge variant={row.validationStatus === "duplicate" || row.validationStatus === "invalid" ? "error" : row.validationStatus === "warning" ? "warning" : "subtle"}>
                            {row.validationStatus}
                          </Badge>
                        </td>
                        <td>{row.importAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="phase-note">No import rows match this review view yet.</p>
            )}
          </section>
        ) : null}
        <section className="panel stack">
          <div>
            <Badge variant="primary">Static Phase 1.2 demo record</Badge>
            <h2>Static Phase 1.2 Title Examples</h2>
            <p className="muted">
              These retained demo records show title, work, instantiation, and mock holding relationships. They are not
              Phase 2 SQLite-backed holdings.
            </p>
          </div>
          <div className="mock-list">
            {titlesWithOwnership.map(({ title, ownedCount, notOwnedCount }) => (
              <Link className="mock-row" href={`/titles/${title.id}`} key={title.id}>
                <span>
                  <strong>{title.name}</strong>
                  <small>{title.summary}</small>
                </span>
                <span className="mock-row-meta">
                  {ownedCount} owned / {notOwnedCount} not owned
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
