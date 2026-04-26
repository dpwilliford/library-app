import { AppShell } from "@/components/AppShell";
import { updateHoldingAction } from "../../actions";
import { getCollectionAreas, getHolding, getHoldingEditLogs } from "@/lib/phase2/collectionData";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function HoldingDetailPage({ params }: { params: { holdingId: string } }) {
  const user = await requireUser();
  if (!canManageHoldings(user.role)) {
    return (
      <AppShell user={user}>
        <section className="panel stack">
          <span className="placeholder-label">Placeholder</span>
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

  return (
    <AppShell user={user}>
      <section className="stack">
        <div>
          <p className="eyebrow">Local holding</p>
          <h1>{holding.title}</h1>
          <p className="muted">
            Internal ID: {holding.id}. External ID: {holding.externalLocalIdentifier} from{" "}
            {holding.externalIdentifierField}.
          </p>
        </div>

        <form action={updateHoldingAction} className="panel stack">
          <input type="hidden" name="id" value={holding.id} />
          <div className="form-grid">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" defaultValue={holding.title} required />
            </div>
            <div className="field">
              <label htmlFor="creatorContributor">Creator / Contributor</label>
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
          <button className="button" type="submit">
            Save Holding
          </button>
        </form>

        <section className="panel stack">
          <h2>Audit / Edit Log</h2>
          {logs.length > 0 ? (
            <div className="mock-list">
              {logs.map((log) => (
                <div className="mock-row" key={log.id}>
                  <span>
                    <strong>{log.fieldName}</strong>
                    <small>
                      {log.oldValue || "(blank)"} &rarr; {log.newValue || "(blank)"}
                    </small>
                  </span>
                  <span className="mock-row-meta">{new Date(log.editedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No edits recorded yet.</p>
          )}
        </section>

        <Link className="button secondary" href="/collection">
          Back to Collection Graph
        </Link>
      </section>
    </AppShell>
  );
}
