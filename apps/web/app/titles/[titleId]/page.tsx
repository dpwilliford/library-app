import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { getClaimsForTitle, getHoldingForInstantiation, getInstantiationsForTitle, getTitleById, getWorksForTitle } from "@/lib/mockQueries";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TitlePage({ params }: { params: { titleId: string } }) {
  const user = await requireUser();
  const title = getTitleById(params.titleId);

  if (!title) {
    notFound();
  }

  const works = getWorksForTitle(title.id);
  const instantiations = getInstantiationsForTitle(title.id);
  const claims = getClaimsForTitle(title.id);

  return (
    <AppShell user={user}>
      <section className="stack">
        <div>
          <Badge variant="primary">Static Phase 1.2 demo record</Badge>
          <h1>{title.name}</h1>
          <p className="muted">{title.summary}</p>
        </div>

        <section className="panel stack">
          <h2>Title Relationships</h2>
          <p>
            This static Phase 1.2 demo page shows the relationship path: Title to Work to Instantiation to mock Holding. It
            is retained for reference and is not a Phase 2 SQLite-backed holding.
          </p>
          <div className="relationship-chain" aria-label="Mock relationship chain">
            <span>Title</span>
            <span>Work</span>
            <span>Instantiation</span>
            <span>Holding</span>
          </div>
        </section>

        <section className="panel stack">
          <h2>Works</h2>
          <div className="mock-list">
            {works.map((work) => (
              <div className="mock-row" key={work.id}>
                <span>
                  <strong>{work.name}</strong>
                  <small>
                    {work.medium}, {work.originalYear}, {work.originCountry}
                  </small>
                </span>
                <span className="mock-row-meta">{work.creators.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <h2>Instantiations</h2>
          <div className="mock-list">
            {instantiations.map((instantiation) => {
              const holding = getHoldingForInstantiation(instantiation.id);
              return (
                <div className="mock-row" key={instantiation.id}>
                  <span>
                    <strong>{instantiation.label}</strong>
                    <small>
                      {instantiation.format}, {instantiation.year}, {instantiation.relationToWork.replaceAll("_", " ")}
                    </small>
                    {holding ? (
                      <small>
                        Holding: {holding.localIdentifier}, {holding.location}, {holding.status.replaceAll("_", " ")}
                      </small>
                    ) : (
                      <small>No local holding in this static Phase 1.2 demo record.</small>
                    )}
                  </span>
                  <Badge variant={instantiation.ownershipStatus === "owned" ? "success" : "subtle"}>
                    {instantiation.ownershipStatus === "owned" ? "Owned" : "Not owned"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel stack">
          <h2>Claims For Review</h2>
          <div className="mock-list">
            {claims.map((claim) => (
              <div className="mock-row" key={claim.id}>
                <span>
                  <strong>{claim.reviewStatus.replaceAll("_", " ")}</strong>
                  <small>{claim.statement}</small>
                </span>
                <span className="mock-row-meta">{claim.evidenceIds.length} evidence record(s)</span>
              </div>
            ))}
          </div>
        </section>

        <Link className="button secondary" href="/collection">
          Back to Collection Graph
        </Link>
      </section>
    </AppShell>
  );
}
