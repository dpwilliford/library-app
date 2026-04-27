import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { getDemoUserByEmail } from "@/lib/demoUsers";
import { getLibrarianReviewItems, getMockCollectionSummary, getTitlesWithOwnership } from "@/lib/mockQueries";
import { requireUser } from "@/lib/session";
import { roleLabels, type RoleName } from "@library-app/shared";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const demoUser = getDemoUserByEmail(user.email);
  const role = user.role as RoleName;
  const summary = getMockCollectionSummary();
  const titlesWithOwnership = getTitlesWithOwnership();
  const reviewItems = getLibrarianReviewItems();

  return (
    <AppShell user={user}>
      <section className="stack">
        <div>
          <p className="eyebrow">Active role: {roleLabels[role]}</p>
          <h1>{demoUser?.dashboardTitle ?? "Dashboard"}</h1>
          <p className="muted">{demoUser?.dashboardSummary ?? "Phase 1 private workspace."}</p>
        </div>
        {demoUser ? (
          <div className="role-banner">
            <div>
              <span className="role-banner-label">Role responsibility</span>
              <p>{demoUser.responsibility}</p>
            </div>
            <strong>{roleLabels[role]}</strong>
          </div>
        ) : null}
        <div className="grid">
          {(demoUser?.panels ?? []).map((panel) => (
            <article className="panel" key={panel.title}>
              <Badge variant="primary">Placeholder</Badge>
              <h2>{panel.title}</h2>
              <dl className="dashboard-definition-list">
                <div>
                  <dt>Responsibility</dt>
                  <dd>{panel.responsibility}</dd>
                </div>
                <div>
                  <dt>Later actions</dt>
                  <dd>{panel.actions}</dd>
                </div>
                <div>
                  <dt>Later information</dt>
                  <dd>{panel.futureData}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <section className="panel stack">
          <div>
            <Badge variant="primary">Static Phase 1.2 demo record</Badge>
            <h2>Static Phase 1.2 Demo Records</h2>
            <p className="muted">
              These records are retained to show structure and relationships. They are not Phase 2 SQLite-backed holdings or
              import batches.
            </p>
          </div>
          {role === "student" ? (
            <div className="mock-list">
              <h3>Browse Titles</h3>
              {titlesWithOwnership.map(({ title, ownedCount, notOwnedCount }) => (
                <Link className="mock-row" href={`/titles/${title.id}`} key={title.id}>
                  <span>
                    <strong>{title.name}</strong>
                    <small>{title.collectionArea}</small>
                  </span>
                  <span className="mock-row-meta">
                    {ownedCount} owned / {notOwnedCount} not owned
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
          {role === "librarian" || role === "collection_area_librarian" ? (
            <div className="mock-list">
              <h3>Review Items</h3>
              {reviewItems.map(({ claim, title, evidence }) => (
                <div className="mock-row" key={claim.id}>
                  <span>
                    <strong>{title?.name ?? "Unknown title"}</strong>
                    <small>{claim.statement}</small>
                  </span>
                  <span className="mock-row-meta">{evidence.length} evidence record(s)</span>
                </div>
              ))}
            </div>
          ) : null}
          {role === "head_librarian" ? (
            <div className="summary-grid">
              <div>
                <strong>{summary.titleCount}</strong>
                <span>mock titles</span>
              </div>
              <div>
                <strong>{summary.instantiationCount}</strong>
                <span>instantiations</span>
              </div>
              <div>
                <strong>{summary.ownedInstantiationCount}</strong>
                <span>owned instantiations</span>
              </div>
              <div>
                <strong>{summary.notOwnedInstantiationCount}</strong>
                <span>not owned</span>
              </div>
              <div>
                <strong>{summary.pendingClaimCount}</strong>
                <span>claims needing review</span>
              </div>
              <div>
                <strong>{summary.activeRecommendationCount}</strong>
                <span>active recommendations</span>
              </div>
            </div>
          ) : null}
          {role === "professor" || role === "administrator" ? (
            <p className="phase-note">
              Static Phase 1.2 demo records are present for reference, but this role view does not add new Phase 2 actions.
            </p>
          ) : null}
        </section>
        <div className="panel">
          <h2>Phase Boundaries</h2>
          <p>
            Phase 1 provides login, demo users, protected dashboards, and role-aware navigation. Static Phase 1.2 demo
            records remain for reference. Phase 2 collection work happens in SQLite-backed holdings, import batches,
            exports, and audit logs.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
