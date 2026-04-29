import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ClaimStatusBadge, ConfidenceBadge } from "@/components/ClaimStatusBadge";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getCollectionAreas, listHoldings } from "@/lib/phase2/collectionData";
import {
  claimTypes,
  confidenceLevels,
  getClaimStatusCounts,
  listClaimReviewUsers,
  listClaims,
  reviewStatuses,
  type ClaimFilters,
  type ClaimSort
} from "@/lib/phase3/claimsData";
import { listSavedAIDraftConfirmationItems } from "@/lib/phase3/mockAiIntake";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";

const sortOptions: { value: ClaimSort; label: string }[] = [
  { value: "newest", label: "Newest created" },
  { value: "oldest", label: "Oldest created" },
  { value: "recently_updated", label: "Recently updated" },
  { value: "stale_unreviewed", label: "Stale / unreviewed first" },
  { value: "review_decision", label: "Review decision date" }
];

export default async function EvidenceReviewPage({
  searchParams
}: {
  searchParams: ClaimFilters & { aiSavedDraftId?: string | string[] };
}) {
  const user = await requireUser();
  const canManage = canManageEvidence(user.role);
  const filters: ClaimFilters = {
    reviewStatus: searchParams.reviewStatus,
    confidenceLevel: searchParams.confidenceLevel,
    claimType: searchParams.claimType,
    relatedHoldingId: searchParams.relatedHoldingId,
    collectionAreaId: searchParams.collectionAreaId,
    linkedContext: searchParams.linkedContext,
    reviewedByUserId: searchParams.reviewedByUserId,
    createdByUserId: searchParams.createdByUserId,
    search: searchParams.search,
    sort: searchParams.sort ?? "newest"
  };
  const claims = canManage ? listClaims(filters) : [];
  const holdings = canManage ? listHoldings() : [];
  const collectionAreas = canManage ? getCollectionAreas() : [];
  const statusCounts = canManage ? getClaimStatusCounts() : null;
  const creators = canManage ? listClaimReviewUsers("created_by_user_id") : [];
  const reviewers = canManage ? listClaimReviewUsers("reviewed_by_user_id") : [];
  const savedDrafts = canManage ? listSavedAIDraftConfirmationItems(searchParams.aiSavedDraftId) : [];
  const hasActiveFilters = Boolean(
    filters.reviewStatus ||
      filters.confidenceLevel ||
      filters.claimType ||
      filters.relatedHoldingId ||
      filters.collectionAreaId ||
      filters.linkedContext ||
      filters.reviewedByUserId ||
      filters.createdByUserId ||
      filters.search
  );

  return (
    <AppShell user={user}>
      {canManage ? (
        <section className="panel stack evidence-review-workflow">
          <div className="page-action-header">
            <div>
              <p className="eyebrow">Phase 3.1 Manual Claims</p>
              <h1>Evidence Review</h1>
              <p className="muted">
                Librarian-controlled manual claims with canonical review state, evidence, and audit events.
              </p>
            </div>
            <div className="action-row page-actions">
              <Link className="button secondary" href="/evidence-review/ai-draft">
                AI Intake
              </Link>
              <Link className="button" href="/evidence-review/new">
                New Claim
              </Link>
              <Link className="button secondary" href="/evidence-review/export">
                Export CSV
              </Link>
            </div>
          </div>
          {savedDrafts.length > 0 ? (
            <div className="confirmation-panel" role="status" aria-live="polite">
              <div>
                <p className="eyebrow">Draft records saved</p>
                <h2>AI intake candidates are ready for review</h2>
                <p className="muted">
                  These saved results were loaded from the draft records created on the server. Review each record before changing
                  its status.
                </p>
              </div>
              <ul className="confirmation-list">
                {savedDrafts.map((draft) => (
                  <li key={draft.id}>
                    <Link href={`/evidence-review/${draft.id}`}>{draft.title}</Link>
                    <small>Draft record identifier: {draft.id}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {statusCounts?.draft === 0 ? (
            <div className="empty-state" role="status">
              <p className="eyebrow">No draft records waiting</p>
              <h2>Evidence review queue is clear</h2>
              <p>
                This queue is where newly created claim and evidence drafts wait for librarian review. Create a manual claim or
                use AI Intake to preview pasted notes, then explicitly save selected candidates into draft records.
              </p>
            </div>
          ) : null}
          {statusCounts ? (
            <div className="mock-list evidence-status-summary" aria-label="Review status summary">
              {reviewStatuses.map((status) => (
                <div className="mock-row" key={status}>
                  <span>
                    <strong>{status.replaceAll("_", " ")}</strong>
                    <small>{statusCounts[status]} claims</small>
                  </span>
                  <ClaimStatusBadge status={status} />
                </div>
              ))}
            </div>
          ) : null}
          <form className="panel filter-panel evidence-review-filter" action="/evidence-review">
            <div className="field">
              <label htmlFor="search">Search</label>
              <input id="search" name="search" defaultValue={searchParams.search ?? ""} placeholder="Claim text or linked holding" />
            </div>
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
              <label htmlFor="linkedContext">Linked context</label>
              <select id="linkedContext" name="linkedContext" defaultValue={searchParams.linkedContext ?? ""}>
                <option value="">Any linked context</option>
                <option value="holding">Linked holding only</option>
                <option value="collection_area">Linked collection area only</option>
                <option value="both">Holding and collection area</option>
                <option value="neither">No linked context</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="relatedHoldingId">Specific holding</label>
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
              <label htmlFor="collectionAreaId">Specific collection area</label>
              <select id="collectionAreaId" name="collectionAreaId" defaultValue={searchParams.collectionAreaId ?? ""}>
                <option value="">Any area</option>
                {collectionAreas.map((area) => (
                  <option value={area.id} key={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="createdByUserId">Creator</label>
              <select id="createdByUserId" name="createdByUserId" defaultValue={searchParams.createdByUserId ?? ""}>
                <option value="">Any creator</option>
                {creators.map((creator) => (
                  <option value={creator} key={creator}>
                    {creator}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="reviewedByUserId">Current reviewer</label>
              <select id="reviewedByUserId" name="reviewedByUserId" defaultValue={searchParams.reviewedByUserId ?? ""}>
                <option value="">Any current reviewer</option>
                {reviewers.map((reviewer) => (
                  <option value={reviewer} key={reviewer}>
                    {reviewer}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sort">Sort</label>
              <select id="sort" name="sort" defaultValue={searchParams.sort ?? "newest"}>
                {sortOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="action-row">
              <button className="button" type="submit">
                Apply
              </button>
              <Link className="button secondary" href="/evidence-review">
                Clear
              </Link>
            </div>
          </form>
          {claims.length > 0 ? (
            <div className="table-wrap review-table-wrap">
              <table className="responsive-review-table">
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Evidence</th>
                    <th>Linked context</th>
                    <th>Updated</th>
                    <th>Review decision</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td data-label="Claim">
                        <Link href={`/evidence-review/${claim.id}`}>{claim.claimText}</Link>
                        <div className="muted">{claim.claimType.replaceAll("_", " ")}</div>
                      </td>
                      <td data-label="Status">
                        <ClaimStatusBadge status={claim.reviewStatus} />
                      </td>
                      <td data-label="Confidence">
                        <ConfidenceBadge level={claim.confidenceLevel} />
                      </td>
                      <td data-label="Evidence">{claim.evidenceCount}</td>
                      <td data-label="Linked context">{linkedContextText(claim)}</td>
                      <td data-label="Updated">{new Date(claim.updatedAt).toLocaleString()}</td>
                      <td data-label="Review decision">{activeReviewDecisionText(claim)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" role="status">
              <p className="eyebrow">{hasActiveFilters ? "No matching records" : "No review records yet"}</p>
              <h2>{hasActiveFilters ? "No records match the current queue filters" : "Evidence review has no records yet"}</h2>
              <p>
                {hasActiveFilters
                  ? "Adjust or clear the filters to return to the full review queue."
                  : "Draft claim and evidence records will appear here after a librarian creates them manually or saves selected AI intake candidates."}
              </p>
              {hasActiveFilters ? (
                <Link className="button secondary" href="/evidence-review">
                  Clear Filters
                </Link>
              ) : null}
            </div>
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

function activeReviewDecisionText(claim: { reviewStatus: string; reviewedAt: string; reviewedByUserId: string }) {
  if (!["approved", "rejected", "needs_revision"].includes(claim.reviewStatus) || !claim.reviewedAt) {
    return "No active decision";
  }
  return `${new Date(claim.reviewedAt).toLocaleString()}${claim.reviewedByUserId ? ` by ${claim.reviewedByUserId}` : ""}`;
}
