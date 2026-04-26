import { AppShell } from "@/components/AppShell";
import { confirmImportBatchAction, remapImportPreviewAction } from "../../actions";
import { getImportBatch } from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

const mappingFields = [
  ["externalLocalIdentifier", "Primary external identifier"],
  ["title", "Title"],
  ["status", "Status"],
  ["creatorContributor", "Creator / Contributor"],
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
          <span className="placeholder-label">Placeholder</span>
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

  const readyCount = batch.rows.filter((row) => row.validationStatus === "valid").length;
  const warningCount = batch.rows.filter((row) => row.validationStatus === "warning").length;
  const invalidCount = batch.rows.filter((row) => row.validationStatus === "invalid").length;
  const duplicateCount = batch.rows.filter((row) => row.validationStatus === "duplicate").length;

  return (
    <AppShell user={user}>
      <section className="stack">
        <div>
          <p className="eyebrow">Import preview</p>
          <h1>{batch.fileName}</h1>
          <p className="muted">Nothing has been saved as holdings yet. Review mapping and validation before confirming.</p>
        </div>

        <div className="summary-grid">
          <div>
            <strong>{batch.rowCount}</strong>
            <span>rows</span>
          </div>
          <div>
            <strong>{readyCount}</strong>
            <span>ready</span>
          </div>
          <div>
            <strong>{warningCount}</strong>
            <span>warnings</span>
          </div>
          <div>
            <strong>{invalidCount}</strong>
            <span>invalid</span>
          </div>
          <div>
            <strong>{duplicateCount}</strong>
            <span>duplicates</span>
          </div>
        </div>

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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batch.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.rowNumber}</td>
                    <td>{row.mappedData.externalLocalIdentifier || "Missing"}</td>
                    <td>{row.mappedData.title || "Missing"}</td>
                    <td>{row.mappedData.status || "Missing"}</td>
                    <td>{row.mappedData.collectionArea || "Unassigned"}</td>
                    <td>
                      <strong>{row.validationStatus}</strong>
                      {row.validationMessages.length > 0 ? (
                        <ul className="plain-list">
                          {row.validationMessages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td>{row.importAction}</td>
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

