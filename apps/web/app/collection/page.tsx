import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getTitlesWithOwnership } from "@/lib/mockQueries";
import { requireUser } from "@/lib/session";
import Link from "next/link";

export default async function CollectionPage() {
  const user = await requireUser();
  const titlesWithOwnership = getTitlesWithOwnership();

  return (
    <AppShell user={user}>
      <div className="stack">
        <PlaceholderPage
          title="Collection Graph"
          purpose="Represent what the library owns and keep local holdings distinct from wider field knowledge."
          futureData={[
            "Catalog records and local identifiers",
            "Specific holdings, formats, locations, and current status",
            "Collection-area assignments for comics, manga/anime, illustration, animation, film, games, and related media",
            "Usage or circulation signals when those are added in later phases"
          ]}
          futureActions={[
            "Review local catalog and holdings records",
            "Assign records to collection areas",
            "Compare local ownership against future title and field context",
            "Export collection data when export workflows are added"
          ]}
          phaseNote="Phase 1.2 shows mock relationships only. It does not import catalogs, store holdings, or display real collection data."
        />
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
