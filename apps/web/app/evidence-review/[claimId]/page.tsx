import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ClaimStatusBadge, ConfidenceBadge } from "@/components/ClaimStatusBadge";
import { getClaimDetail } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";
import {
  approveClaimAction,
  rejectClaimAction,
  requestClaimRevisionAction,
  submitClaimForReviewAction
} from "../actions";

export default async function ClaimDetailPage({
  params,
  searchParams
}: {
  params: { claimId: string };
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }
  const detail = getClaimDetail(params.claimId);
  if (!detail) {
    notFound();
  }
  const { claim, evidence, events } = detail;

  return (
    <AppShell user={user}>
      <div className="stack">
        <section className="panel stack">
          <div className="page-action-header">
            <div>
              <p className="eyebrow">Manual Claim</p>
              <h1>{claim.claimText}</h1>
              <div>
                <ClaimStatusBadge status={claim.reviewStatus} />
                <ConfidenceBadge level={claim.confidenceLevel} />
              </div>
            </div>
            <div className="action-row page-actions">
              <Link className="button secondary" href={`/evidence-review/${claim.id}/edit`}>
                Edit Claim
              </Link>
              <Link className="button" href={`/evidence-review/${claim.id}/evidence/new`}>
                Add Evidence
              </Link>
            </div>
          </div>
          {searchParams.error ? <p className="error">{searchParams.error}</p> : null}
          {claim.evidenceCount === 0 ? <p className="phase-note">Draft claims need evidence before review.</p> : null}
          {activeReviewNote(claim) ? <p className="phase-note">Current review note: {claim.reviewNote}</p> : null}
          <dl className="detail-grid">
            <div>
              <dt>Claim type</dt>
              <dd>{claim.claimType.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Linked context</dt>
              <dd>{linkedContext(claim)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(claim.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Current review decision</dt>
              <dd>{activeReviewDecision(claim)}</dd>
            </div>
          </dl>
        </section>
        <section className="panel stack">
          <h2>Evidence</h2>
          {evidence.length > 0 ? (
            <div className="mock-list">
              {evidence.map((item) => (
                <div className="mock-row" key={item.id}>
                  <span>
                    <strong>{item.relationship.replaceAll("_", " ")}</strong>
                    <small>{item.source.sourceTitle || item.source.citation || item.source.sourceUrl}</small>
                    <small>{item.excerpt || item.supportingData}</small>
                    <small>
                      {item.source.sourceType.replaceAll("_", " ")}
                      {item.dateAccessed ? `; accessed ${item.dateAccessed}` : ""}
                    </small>
                  </span>
                  <Link className="button secondary" href={`/evidence-review/${claim.id}/evidence/${item.evidenceId}/edit`}>
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No evidence attached yet.</p>
          )}
        </section>
        <ReviewPanel claimId={claim.id} status={claim.reviewStatus} evidenceCount={claim.evidenceCount} />
        <section className="panel stack">
          <h2>Event History</h2>
          {events.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Entity</th>
                    <th>User</th>
                    <th>Time</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.action.replaceAll("_", " ")}</td>
                      <td>{[event.oldStatus, event.newStatus].filter(Boolean).join(" -> ")}</td>
                      <td>
                        {event.entityType}: {event.entityId}
                      </td>
                      <td>{event.actedByUserId}</td>
                      <td>{new Date(event.actedAt).toLocaleString()}</td>
                      <td>{event.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No events recorded.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ReviewPanel({ claimId, status, evidenceCount }: { claimId: string; status: string; evidenceCount: number }) {
  return (
    <section className="panel stack">
      <h2>Review Actions</h2>
      {evidenceCount === 0 ? <p className="phase-note">Attach evidence before submitting this claim for review.</p> : null}
      <div className="action-row">
        {status === "draft" || status === "needs_revision" ? (
          <form action={submitClaimForReviewAction}>
            <input type="hidden" name="claimId" value={claimId} />
            <button className="button" type="submit">
              Submit For Review
            </button>
          </form>
        ) : null}
      </div>
      {status === "ready_for_review" ? (
        <div className="grid">
          <form className="stack" action={approveClaimAction}>
            <input type="hidden" name="claimId" value={claimId} />
            <div className="field">
              <label htmlFor="approve-note">Approval note</label>
              <textarea id="approve-note" name="note" />
            </div>
            <button className="button" type="submit">
              Approve
            </button>
          </form>
          <form className="stack" action={rejectClaimAction}>
            <input type="hidden" name="claimId" value={claimId} />
            <div className="field">
              <label htmlFor="reject-note">Rejection reason</label>
              <textarea id="reject-note" name="note" required />
            </div>
            <button className="button secondary" type="submit">
              Reject
            </button>
          </form>
          <form className="stack" action={requestClaimRevisionAction}>
            <input type="hidden" name="claimId" value={claimId} />
            <div className="field">
              <label htmlFor="revision-note">Revision note</label>
              <textarea id="revision-note" name="note" required />
            </div>
            <button className="button secondary" type="submit">
              Request Revision
            </button>
          </form>
        </div>
      ) : null}
      {status === "approved" ? <p className="phase-note">Approved claims are locked for review; edits return the claim to needs revision.</p> : null}
    </section>
  );
}

function linkedContext(claim: {
  relatedHoldingTitle: string;
  relatedHoldingIdentifier: string;
  relatedHoldingStatus: string;
  relatedHoldingCollectionAreaName: string;
  collectionAreaName: string;
}) {
  if (claim.relatedHoldingTitle) {
    return `${claim.relatedHoldingTitle} (${claim.relatedHoldingIdentifier || "no identifier"}), ${claim.relatedHoldingCollectionAreaName || "no collection area"}, ${claim.relatedHoldingStatus || "no status"}`;
  }
  return claim.collectionAreaName || "No linked context";
}

function activeReviewNote(claim: { reviewStatus: string; reviewNote: string }) {
  return ["approved", "rejected", "needs_revision"].includes(claim.reviewStatus) && claim.reviewNote;
}

function activeReviewDecision(claim: { reviewStatus: string; reviewedAt: string; reviewedByUserId: string }) {
  if (!["approved", "rejected", "needs_revision"].includes(claim.reviewStatus) || !claim.reviewedAt) {
    return "No active review decision";
  }
  return `${new Date(claim.reviewedAt).toLocaleString()} by ${claim.reviewedByUserId}`;
}
