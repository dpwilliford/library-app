import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ClaimStatusBadge, ConfidenceBadge } from "@/components/ClaimStatusBadge";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getCollectionAreas, listHoldings } from "@/lib/phase2/collectionData";
import { claimTypes, confidenceLevels, listClaims, reviewStatuses, type ClaimFilters } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";

export default async function EvidenceReviewPage({
  searchParams
}: {
  searchParams: ClaimFilters;
}) {
  const user = await requireUser();
  const canManage = canManageEvidence(user.role);
  const filters: ClaimFilters = {
    reviewStatus: searchParams.reviewStatus,
    confidenceLevel: searchParams.confidenceLevel,
    claimType: searchParams.claimType,
    relatedHoldingId: searchParams.relatedHoldingId,
    collectionAreaId: searchParams.collectionAreaId
  };
  const claims = canManage ? listClaims(filters) : [];
  const holdings = canManage ? listHoldings() : [];
  const collectionAreas = canManage ? getCollectionAreas() : [];

  return (
    <AppShell user={user}>
      {canManage ? (
        <section className="panel stack">
          <div className="page-action-header">
            <div>
              <p className="eyebrow">Phase 3.1 Manual Claims</p>
              <h1>Evidence Review</h1>
              <p className="muted">
                Librarian-controlled manual claims with sources, evidence, confidence, review state, and audit events.
              </p>
            </div>
            <div className="action-row page-actions">
              <Link className="button" href="/evidence-review/new">
                New Claim
              </Link>
              <Link className="button secondary" href="/evidence-review/export">
                Export CSV
              </Link>
            </div>
          </div>
          <form className="panel filter-panel" action="/evidence-review">
            <div className="field">
              <label htmlFor="reviewStatus">Review status</label>
              <select id="reviewStatus" name="reviewStatus" defaultValue={searchParams.reviewStatus ?? ""}>
                <option value="">All statuses</option>
                {reviewStatuses.map((status) => (
                  <option value={status} key={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="confidenceLevel">Confidence</label>
              <select id="confidenceLevel" name="confidenceLevel" defaultValue={searchParams.confidenceLevel ?? ""}>
                <option value="">All confidence levels</option>
                {confidenceLevels.map((level) => (
                  <option value={level} key={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="claimType">Claim type</label>
              <select id="claimType" name="claimType" defaultValue={searchParams.claimType ?? ""}>
                <option value="">All claim types</option>
                {claimTypes.map((type) => (
                  <option value={type} key={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="relatedHoldingId">Linked holding</label>
              <select id="relatedHoldingId" name="relatedHoldingId" defaultValue={searchParams.relatedHoldingId ?? ""}>
                <option value="">Any holding</option>
                {holdings.map((holding) => (
                  <option value={holding.id} key={holding.id}>
                    {holding.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="collectionAreaId">Collection area</label>
              <select id="collectionAreaId" name="collectionAreaId" defaultValue={searchParams.collectionAreaId ?? ""}>
                <option value="">Any area</option>
                {collectionAreas.map((area) => (
                  <option value={area.id} key={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="action-row">
              <button className="button" type="submit">
                Apply Filters
              </button>
              <Link className="button secondary" href="/evidence-review">
                Clear
              </Link>
            </div>
          </form>
          {claims.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Evidence</th>
                    <th>Linked context</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <Link href={`/evidence-review/${claim.id}`}>{claim.claimText}</Link>
                        <div className="muted">{claim.claimType.replaceAll("_", " ")}</div>
                      </td>
                      <td>
                        <ClaimStatusBadge status={claim.reviewStatus} />
                      </td>
                      <td>
                        <ConfidenceBadge level={claim.confidenceLevel} />
                      </td>
                      <td>{claim.evidenceCount}</td>
                      <td>{linkedContextText(claim)}</td>
                      <td>{new Date(claim.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="phase-note">No manual claims match this review queue yet.</p>
          )}
        </section>
      ) : (
        <PlaceholderPage
          title="Evidence Review"
          purpose="Keep manual claim and evidence review available only to librarian roles."
          futureData={["Reviewed public-facing summaries when later approved for broader roles"]}
          futureActions={["Students and professors cannot manage Phase 3.1 claims or evidence."]}
          phaseNote="Phase 3.1 evidence workflows are librarian-controlled."
        />
      )}
    </AppShell>
  );
}

function linkedContextText(claim: { relatedHoldingTitle: string; relatedHoldingIdentifier: string; collectionAreaName: string }) {
  if (claim.relatedHoldingTitle) {
    return `${claim.relatedHoldingTitle}${claim.relatedHoldingIdentifier ? ` (${claim.relatedHoldingIdentifier})` : ""}`;
  }
  return claim.collectionAreaName || "No linked context";
}
