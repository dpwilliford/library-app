import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ClaimStatusBadge } from "@/components/ClaimStatusBadge";
import { getCollectionAreas, listHoldings } from "@/lib/phase2/collectionData";
import { claimTypes, confidenceLevels, getClaim } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";
import { updateClaimAction } from "../../actions";

export default async function EditClaimPage({
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
  const claim = getClaim(params.claimId);
  if (!claim) {
    notFound();
  }
  const holdings = listHoldings();
  const collectionAreas = getCollectionAreas();

  return (
    <AppShell user={user}>
      <section className="panel stack">
        <div>
          <p className="eyebrow">Manual Claim</p>
          <h1>Edit Claim</h1>
          <ClaimStatusBadge status={claim.reviewStatus} />
          {claim.reviewStatus === "approved" ? (
            <p className="phase-note">Saving changes to an approved claim returns it to needs revision.</p>
          ) : null}
        </div>
        {searchParams.error ? <p className="error">{searchParams.error}</p> : null}
        <form className="stack" action={updateClaimAction}>
          <input type="hidden" name="claimId" value={claim.id} />
          <div className="field">
            <label htmlFor="claimText">Claim text</label>
            <textarea id="claimText" name="claimText" required defaultValue={claim.claimText} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="claimType">Claim type</label>
              <select id="claimType" name="claimType" defaultValue={claim.claimType}>
                {claimTypes.map((type) => (
                  <option value={type} key={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="confidenceLevel">Confidence level</label>
              <select id="confidenceLevel" name="confidenceLevel" defaultValue={claim.confidenceLevel}>
                {confidenceLevels.map((level) => (
                  <option value={level} key={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="relatedHoldingId">Linked context: holding</label>
              <select id="relatedHoldingId" name="relatedHoldingId" defaultValue={claim.relatedHoldingId}>
                <option value="">No linked holding</option>
                {holdings.map((holding) => (
                  <option value={holding.id} key={holding.id}>
                    {holding.title} ({holding.externalLocalIdentifier})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="collectionAreaId">Linked context: collection area</label>
              <select id="collectionAreaId" name="collectionAreaId" defaultValue={claim.collectionAreaId}>
                <option value="">No linked collection area</option>
                {collectionAreas.map((area) => (
                  <option value={area.id} key={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="action-row">
            <button className="button" type="submit">
              Save Claim
            </button>
            <Link className="button secondary" href={`/evidence-review/${claim.id}`}>
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
