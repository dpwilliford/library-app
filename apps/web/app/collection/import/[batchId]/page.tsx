import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { confirmImportBatchAction, remapImportPreviewAction } from "../../actions";
import { describeImportRowOutcome, getImportBatch, getImportBatchSummary } from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

const mappingFields = [
  ["externalLocalIdentifier", "Primary external identifier"],
  ["title", "Title"],
  ["status", "Status"],
  ["creatorContributor", "Creator / Contributor"],
  ["contributorName", "Contributor Name"],
  ["contributorRole", "Contributor Role"],
  ["contributors", "Contributor Pairs"],
  ["format", "Format"],
  ["isbn", "ISBN"],
  ["callNumber", "Call Number"],
  ["location", "Location"],
  ["collectionArea", "Collection Area"],
  ["publisher", "Publisher"],
  ["publicationYear", "Publication Year"]
] as const;

export default async function ImportPreviewPage({ params }: { params: { batchId: string } }) {
  const user = await requireUser();
  if (!canManageHoldings(user.role)) {
    return (
      <AppShell user={user}>
        <section className="panel stack">
          <Badge variant="primary">Placeholder</Badge>
          <h1>Collection Exploration</h1>
          <p>Imported holdings management is limited to librarian roles in Phase 2.</p>
        </section>
      </AppShell>
    );
  }

  const batch = getImportBatch(params.batchId);
  if (!batch) {
    notFound();
  }

  const summary = getImportBatchSummary(batch);

  return (
    <AppShell user={user}>
      <section className="stack">
        <div>
          <p className="eyebrow">Phase 2 CSV import preview</p>
          <h1>{batch.fileName}</h1>
          <p className="muted">
            Review this Phase 2 import batch before it writes SQLite-backed holdings. Duplicate rows are held for librarian
            review and do not overwrite saved holdings.
          </p>
        </div>

        <div className="summary-grid">
          <div>
            <strong>{batch.rowCount}</strong>
            <span>rows</span>
          </div>
          <div>
            <strong>{summary.validRows}</strong>
            <span>valid rows</span>
          </div>
          <div>
            <strong>{summary.warningRows}</strong>
            <span>warning rows</span>
          </div>
          <div>
            <strong>{summary.invalidRows}</strong>
            <span>invalid rows</span>
          </div>
          <div>
            <strong>{summary.duplicateRows}</strong>
            <span>duplicate rows</span>
          </div>
          <div>
            <strong>{summary.skippedRows}</strong>
            <span>skipped rows</span>
          </div>
          <div>
            <strong>{summary.importedRows}</strong>
            <span>imported rows</span>
          </div>
        </div>

        <section className="panel stack">
          <h2>Phase 2 Import Batch Review Notes</h2>
          {batch.status === "previewed" ? (
            <p className="phase-note">Nothing has been saved yet. Confirmation imports valid and warning rows only.</p>
          ) : (
            <p className="phase-note">
              This batch is {batch.status}. {batch.savedCount} row(s) became local holdings and {batch.skippedCount} row(s)
              were skipped for review or correction.
            </p>
          )}
          <p className="muted">
            Duplicate behavior: Phase 2.2 only identifies suspected duplicates. It does not merge, update, replace, or delete
            existing holdings from a CSV import.
          </p>
        </section>

        {batch.status === "previewed" ? (
          <form action={remapImportPreviewAction} className="panel stack">
            <input type="hidden" name="batchId" value={batch.id} />
            <h2>Column Mapping</h2>
            <div className="form-grid">
              {mappingFields.map(([field, label]) => (
                <div className="field" key={field}>
                  <label htmlFor={field}>{label}</label>
                  <select id={field} name={field} defaultValue={batch.mapping[field] ?? ""}>
                    <option value="">Not mapped</option>
                    {batch.headers.map((header) => (
                      <option value={header} key={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button className="button secondary" type="submit">
              Re-run Validation
            </button>
          </form>
        ) : null}

        <section className="panel stack">
          <h2>Rows</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Identifier</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Collection Area</th>
                  <th>Validation</th>
                  <th>What happened</th>
                </tr>
              </thead>
              <tbody>
                {batch.rows.map((row) => (
                  <tr className={row.validationStatus === "duplicate" ? "review-attention" : undefined} key={row.id}>
                    <td>{row.rowNumber}</td>
                    <td>{row.mappedData.externalLocalIdentifier || "Missing"}</td>
                    <td>{row.mappedData.title || "Missing"}</td>
                    <td>{row.mappedData.status || "Missing"}</td>
                    <td>{row.mappedData.collectionArea || "Unassigned"}</td>
                    <td>
                      <Badge variant={row.validationStatus === "duplicate" || row.validationStatus === "invalid" ? "error" : row.validationStatus === "warning" ? "warning" : "subtle"}>
                        {row.validationStatus}
                      </Badge>
                      {row.validationMessages.length > 0 ? (
                        <ul className="plain-list">
                          {row.validationMessages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      ) : null}
                      {row.matchedHoldingId ? (
                        <p className="muted">
                          Possible existing holding:{" "}
                          <Link href={`/collection/holdings/${row.matchedHoldingId}`}>{row.matchedHoldingId}</Link>
                        </p>
                      ) : null}
                    </td>
                    <td>{describeImportRowOutcome(row, batch.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {batch.status === "previewed" ? (
          <form action={confirmImportBatchAction} className="panel stack">
            <input type="hidden" name="batchId" value={batch.id} />
            <h2>Explicit Confirmation</h2>
            <p>
              Confirming will import valid and warning rows. Invalid and duplicate rows will be skipped and remain visible in
              this batch history.
            </p>
            {summary.duplicateRows > 0 ? (
              <p className="phase-note">
                This preview contains suspected duplicates. They will be skipped; no existing holdings will be updated.
              </p>
            ) : null}
            <button className="button" type="submit">
              Confirm Import
            </button>
          </form>
        ) : (
          <section className="panel">
            <h2>Import Result</h2>
            <p>
              Saved {batch.savedCount} row(s). Skipped {batch.skippedCount} row(s).
            </p>
          </section>
        )}

        <Link className="button secondary" href="/collection">
          Back to Collection Graph
        </Link>
      </section>
    </AppShell>
  );
}
