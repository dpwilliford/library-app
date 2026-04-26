import { AppShell } from "@/components/AppShell";
import { createImportPreviewAction } from "../actions";
import { canManageHoldings } from "@/lib/phase2/permissions";
import { requireUser } from "@/lib/session";
import Link from "next/link";

export default async function ImportHoldingsPage({ searchParams }: { searchParams: { error?: string } }) {
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

  return (
    <AppShell user={user}>
      <section className="stack">
        <div>
          <p className="eyebrow">Phase 2 Collection Graph</p>
          <h1>Import Holdings CSV</h1>
          <p className="muted">
            Upload a local CSV for preview. Nothing is saved as holdings until a librarian confirms the import.
          </p>
        </div>
        {searchParams.error ? <p className="error">Choose a CSV file before previewing.</p> : null}
        <form action={createImportPreviewAction} className="panel stack" encType="multipart/form-data">
          <div className="field">
            <label htmlFor="csvFile">CSV file</label>
            <input id="csvFile" name="csvFile" type="file" accept=".csv,text/csv" required />
          </div>
          <button className="button" type="submit">
            Preview Import
          </button>
        </form>
        <Link className="button secondary" href="/collection">
          Back to Collection Graph
        </Link>
      </section>
    </AppShell>
  );
}
