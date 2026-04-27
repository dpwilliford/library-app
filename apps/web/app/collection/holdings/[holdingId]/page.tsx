import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { updateHoldingAction, updateHoldingContributorsAction } from "../../actions";
import { getCollectionAreas, getHolding, getHoldingContributors, getHoldingEditLogs } from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function HoldingDetailPage({
  params,
  searchParams
}: {
  params: { holdingId: string };
  searchParams: { mode?: string };
}) {
  const user = await requireUser();
  if (!canManageHoldings(user.role)) {
    return (
      <AppShell user={user}>
        <section className="panel stack">
          <Badge variant="primary">Placeholder</Badge>
          <h1>Collection Exploration</h1>
          <p>Imported holdings are limited to librarian roles in Phase 2.</p>
        </section>
      </AppShell>
    );
  }

  const holding = getHolding(params.holdingId);
  if (!holding) {
    notFound();
  }

  const areas = getCollectionAreas();
  const logs = getHoldingEditLogs(holding.id);
  const contributors = getHoldingContributors(holding.id);
  const isEditMode = searchParams.mode === "edit";
  const detailFields = [
    ["External Local Identifier", holding.externalLocalIdentifier],
    ["External Identifier Field", holding.externalIdentifierField],
    ["Original Creator / Contributor String", holding.creatorContributor],
    ["Format", holding.format],
    ["ISBN", holding.isbn],
    ["Call Number", holding.callNumber],
    ["Location", holding.location],
    ["Status", holding.status],
    ["Collection Area", holding.collectionAreaName],
    ["Publisher", holding.publisher],
    ["Publication Year", holding.publicationYear],
    ["Import Batch", holding.importBatchId],
    ["Last Updated", new Date(holding.updatedAt).toLocaleString()]
  ];

  return (
    <AppShell user={user}>
      <section className="stack">
        <div className="page-action-header">
          <div>
            <p className="eyebrow">Phase 2 SQLite-backed holding</p>
            <h1>{holding.title}</h1>
            <p className="muted">
              This Phase 2 holding has already been saved. Confirm Import committed this record to SQLite; Save Holding is
              only needed for intentional metadata edits.
            </p>
          </div>
          <div className="action-row page-actions">
            {!isEditMode ? (
              <Link className="button" href={`/collection/holdings/${holding.id}?mode=edit`}>
                Edit Holding
              </Link>
            ) : null}
            <Link className="button secondary" href="/collection">
              Back to Holdings
            </Link>
          </div>
        </div>

        {isEditMode ? (
          <form action={updateHoldingAction} className="panel stack">
            <div>
              <h2>Edit Holding Metadata</h2>
              <p className="muted">
                Saving changes writes field-level entries to the Phase 2 audit log. Cancel returns to the saved detail view
                without changing this holding.
              </p>
            </div>
            <input type="hidden" name="id" value={holding.id} />
            <div className="form-grid">
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" defaultValue={holding.title} required />
              </div>
              <div className="field">
                <label htmlFor="creatorContributor">Original Creator / Contributor String</label>
                <input id="creatorContributor" name="creatorContributor" defaultValue={holding.creatorContributor} />
              </div>
              <div className="field">
                <label htmlFor="format">Format</label>
                <input id="format" name="format" defaultValue={holding.format} />
              </div>
              <div className="field">
                <label htmlFor="isbn">ISBN</label>
                <input id="isbn" name="isbn" defaultValue={holding.isbn} />
              </div>
              <div className="field">
                <label htmlFor="callNumber">Call Number</label>
                <input id="callNumber" name="callNumber" defaultValue={holding.callNumber} />
              </div>
              <div className="field">
                <label htmlFor="location">Location</label>
                <input id="location" name="location" defaultValue={holding.location} />
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <input id="status" name="status" defaultValue={holding.status} required />
              </div>
              <div className="field">
                <label htmlFor="publisher">Publisher</label>
                <input id="publisher" name="publisher" defaultValue={holding.publisher} />
              </div>
              <div className="field">
                <label htmlFor="publicationYear">Publication Year</label>
                <input id="publicationYear" name="publicationYear" defaultValue={holding.publicationYear} />
              </div>
              <div className="field">
                <label htmlFor="collectionAreaId">Collection Area</label>
                <select id="collectionAreaId" name="collectionAreaId" defaultValue={holding.collectionAreaId}>
                  {areas.map((area) => (
                    <option value={area.id} key={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="action-row">
              <button className="button" type="submit">
                Save Metadata
              </button>
              <Link className="button secondary" href={`/collection/holdings/${holding.id}`}>
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          <section className="panel stack">
            <div>
              <Badge variant="success">Saved to SQLite</Badge>
              <h2>Saved Holding Details</h2>
              <p className="muted">
                These fields are read-only until a librarian chooses Edit Holding. Viewing this page does not create audit
                log entries.
              </p>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>Internal System ID</dt>
                <dd>{holding.id}</dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>{holding.title}</dd>
              </div>
              {detailFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Not recorded"}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="panel stack">
          <div>
            <h2>Structured Contributors</h2>
            <p className="muted">
              Contributors are stored as separate Phase 2 metadata rows with roles when those roles are known. The original
              imported creator/contributor string is preserved separately.
            </p>
          </div>
          {isEditMode ? (
            <form action={updateHoldingContributorsAction} className="stack">
              <input type="hidden" name="id" value={holding.id} />
              <div className="form-grid">
                {[...contributors, ...Array.from({ length: 2 }, (_, index) => ({
                  id: `new-${index}`,
                  name: "",
                  role: ""
                }))].map((contributor, index) => (
                  <div className="field contributor-edit-row" key={contributor.id}>
                    <label htmlFor={`contributorName-${index}`}>Contributor {index + 1}</label>
                    <input
                      id={`contributorName-${index}`}
                      name="contributorName"
                      defaultValue={contributor.name}
                      placeholder="Name"
                    />
                    <input name="contributorRole" defaultValue={contributor.role} placeholder="Role, if known" />
                  </div>
                ))}
              </div>
              <div className="action-row">
                <button className="button" type="submit">
                  Save Contributors
                </button>
                <Link className="button secondary" href={`/collection/holdings/${holding.id}`}>
                  Cancel
                </Link>
              </div>
            </form>
          ) : contributors.length > 0 ? (
            <ol className="structured-list">
              {contributors.map((contributor) => (
                <li key={contributor.id}>
                  <strong>{contributor.name}</strong>
                  <span>{contributor.role || "Role not specified"}</span>
                  <small>{contributor.source}</small>
                </li>
              ))}
            </ol>
          ) : (
            <p>No structured contributors recorded yet.</p>
          )}
        </section>

        <section className="panel stack">
          <h2>Phase 2 Audit Log</h2>
          <p className="muted">
            These entries show CSV-created holding records and librarian edits for this Phase 2 SQLite-backed holding. The
            log preserves existing audit behavior; it does not change catalog authority or overwrite source import values.
          </p>
          {logs.length > 0 ? (
            <div className="mock-list">
              {logs.map((log) => (
                <div className="mock-row" key={log.id}>
                  <span>
                    <strong>{log.fieldName}</strong>
                    <small>
                      {log.oldValue || "(blank)"} &rarr; {log.newValue || "(blank)"}
                    </small>
                    <small>{log.reason || "No reason recorded"}</small>
                  </span>
                  <span className="mock-row-meta">
                    {new Date(log.editedAt).toLocaleString()}
                    <br />
                    {log.editedByUserId}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No edits recorded yet.</p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
