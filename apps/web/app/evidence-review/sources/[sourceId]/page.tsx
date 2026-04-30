import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ClaimStatusBadge, ConfidenceBadge } from "@/components/ClaimStatusBadge";
import { getSourceDetail, type Source } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";

export default async function SourceDetailPage({ params }: { params: { sourceId: string } }) {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }

  const detail = getSourceDetail(params.sourceId);
  if (!detail) {
    notFound();
  }
  const { source, usages, duplicateCandidates } = detail;

  return (
    <AppShell user={user}>
      <div className="stack">
        <section className="panel stack">
          <div className="page-action-header">
            <div>
              <p className="eyebrow">Phase 3.4 Source Detail</p>
              <h1>{sourceLabel(source)}</h1>
              <p className="muted">Read-only citation metadata and linked evidence records.</p>
            </div>
            <div className="action-row page-actions">
              <Link className="button secondary" href="/evidence-review/sources">
                Source Index
              </Link>
            </div>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Source type</dt>
              <dd>{source.sourceType.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Creator</dt>
              <dd>{source.sourceCreator || "No creator recorded"}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd>{source.publisher || "No publisher recorded"}</dd>
            </div>
            <div>
              <dt>Publication date</dt>
              <dd>{source.publicationDate || "No publication date recorded"}</dd>
            </div>
            <div>
              <dt>URL</dt>
              <dd>{source.sourceUrl || "No URL recorded"}</dd>
            </div>
            <div>
              <dt>Citation</dt>
              <dd>{source.citation || "No citation recorded"}</dd>
            </div>
            <div>
              <dt>Normalized URL</dt>
              <dd>{source.normalizedSourceUrl || "No normalized URL"}</dd>
            </div>
            <div>
              <dt>Normalized citation key</dt>
              <dd>{source.normalizedCitationKey || "No normalized citation key"}</dd>
            </div>
            <div>
              <dt>Reliability note</dt>
              <dd>{source.sourceReliabilityNote || "No reliability note recorded"}</dd>
            </div>
            <div>
              <dt>Access note</dt>
              <dd>{source.sourceAccessNote || "No access note recorded"}</dd>
            </div>
          </dl>
        </section>
        <section className="panel stack">
          <h2>Duplicate Candidates</h2>
          {duplicateCandidates.length > 0 ? (
            <div className="mock-list">
              {duplicateCandidates.map((candidate) => (
                <div className="mock-row" key={candidate.id}>
                  <span>
                    <strong>{sourceLabel(candidate)}</strong>
                    <small>{duplicateReason(source, candidate)}</small>
                    <small>{candidate.sourceType.replaceAll("_", " ")}</small>
                  </span>
                  <Link className="button secondary" href={`/evidence-review/sources/${candidate.id}`}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No duplicate candidates found from normalized URL or citation key.</p>
          )}
        </section>
        <section className="panel stack">
          <h2>Linked Evidence And Claims</h2>
          {usages.length > 0 ? (
            <div className="mock-list">
              {usages.map((usage) => (
                <div className="mock-row" key={`${usage.id}-${usage.claimId || "unlinked"}`}>
                  <span>
                    <strong>{usage.claimText || "Unlinked evidence record"}</strong>
                    <small>{usage.relationship ? usage.relationship.replaceAll("_", " ") : "No claim relationship"}</small>
                    <small>{usage.excerpt || usage.supportingData}</small>
                    <small>{usage.dateAccessed ? `Accessed ${usage.dateAccessed}` : "No date accessed recorded"}</small>
                    {usage.reviewStatus ? (
                      <span className="action-row">
                        <ClaimStatusBadge status={usage.reviewStatus} />
                        <ConfidenceBadge level={usage.confidenceLevel || "low"} />
                      </span>
                    ) : null}
                  </span>
                  {usage.claimId ? (
                    <Link className="button secondary" href={`/evidence-review/${usage.claimId}`}>
                      Claim
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p>No evidence records use this source yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function sourceLabel(source: Source) {
  return source.sourceTitle || source.citation || source.sourceUrl || source.id;
}

function duplicateReason(source: Source, candidate: Source) {
  const reasons = [];
  if (source.normalizedSourceUrl && source.normalizedSourceUrl === candidate.normalizedSourceUrl) {
    reasons.push("normalized URL");
  }
  if (source.normalizedCitationKey && source.normalizedCitationKey === candidate.normalizedCitationKey) {
    reasons.push("normalized citation key");
  }
  return reasons.length > 0 ? `Matches by ${reasons.join(" and ")}` : "Potential duplicate";
}
