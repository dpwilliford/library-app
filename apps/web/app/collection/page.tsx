import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getTitlesWithOwnership } from "@/lib/mockQueries";
import { listHoldings, listImportBatches } from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";

export default async function CollectionPage() {
  const user = await requireUser();
  const titlesWithOwnership = getTitlesWithOwnership();
  const canManage = canManageHoldings(user.role);
  const holdings = canManage ? listHoldings() : [];
  const importBatches = canManage ? listImportBatches() : [];

  return (
    <AppShell user={user}>
      <div className="stack">
        {canManage ? (
          <section className="panel stack">
            <div>
              <p className="eyebrow">Phase 2 Collection Graph</p>
              <h1>Local Holdings</h1>
              <p className="muted">
                Librarian-controlled records imported from local CSV files. No AI enrichment, market search, analytics, or
                external APIs are used.
              </p>
            </div>
            <div className="action-row">
              <Link className="button" href="/collection/import">
                Import CSV
              </Link>
              <Link className="button secondary" href="/collection/export">
                Export CSV
              </Link>
            </div>
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
              <p className="phase-note">No local holdings have been imported yet. Start with a CSV import preview.</p>
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
            <h2>Import History</h2>
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
        <section className="panel stack">
          <div>
            <span className="placeholder-label">Mock data</span>
            <h2>Example Titles</h2>
            <p className="muted">
              Static mock records show how titles connect to works, instantiations, and holdings.
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
