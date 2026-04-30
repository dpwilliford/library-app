import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { listSourceDuplicateCandidates, listSources, type Source } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";

export default async function SourceIndexPage() {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }

  const sources = listSources();
  const rows = sources.map((source) => ({
    source,
    duplicateCandidates: duplicateCandidatesFor(source)
  }));

  return (
    <AppShell user={user}>
      <section className="panel stack">
        <div className="page-action-header">
          <div>
            <p className="eyebrow">Phase 3.4 Sources</p>
            <h1>Source Index</h1>
            <p className="muted">
              Read-only source and citation records with normalized duplicate-candidate signals for librarian review.
            </p>
          </div>
          <div className="action-row page-actions">
            <Link className="button secondary" href="/evidence-review">
              Evidence Review
            </Link>
          </div>
        </div>
        {rows.length > 0 ? (
          <div className="table-wrap review-table-wrap">
            <table className="responsive-review-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Normalized URL</th>
                  <th>Normalized citation</th>
                  <th>Duplicate candidates</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ source, duplicateCandidates }) => (
                  <tr key={source.id}>
                    <td data-label="Source">
                      <Link href={`/evidence-review/sources/${source.id}`}>{sourceLabel(source)}</Link>
                      <div className="muted">{source.sourceCreator || source.publisher || "No creator or publisher recorded"}</div>
                    </td>
                    <td data-label="Type">{source.sourceType.replaceAll("_", " ")}</td>
                    <td data-label="Normalized URL">{source.normalizedSourceUrl || "No normalized URL"}</td>
                    <td data-label="Normalized citation">{source.normalizedCitationKey || "No normalized citation"}</td>
                    <td data-label="Duplicate candidates">{duplicateCandidates.length}</td>
                    <td data-label="Updated">{new Date(source.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" role="status">
            <p className="eyebrow">No sources yet</p>
            <h2>Source index has no records</h2>
            <p>Source records will appear here after librarians attach evidence to manual claims.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function duplicateCandidatesFor(source: Source) {
  return listSourceDuplicateCandidates({ sourceUrl: source.sourceUrl, citation: source.citation }).filter((candidate) => candidate.id !== source.id);
}

function sourceLabel(source: Source) {
  return source.sourceTitle || source.citation || source.sourceUrl || source.id;
}
