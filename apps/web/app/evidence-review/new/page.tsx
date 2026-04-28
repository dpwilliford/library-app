import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCollectionAreas, listHoldings } from "@/lib/phase2/collectionData";
import { claimTypes, confidenceLevels } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";
import { createClaimAction } from "../actions";

export default async function NewClaimPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }
  const holdings = listHoldings();
  const collectionAreas = getCollectionAreas();

  return (
    <AppShell user={user}>
      <section className="panel stack">
        <div>
          <p className="eyebrow">Manual Claim</p>
          <h1>New Claim</h1>
          <p className="muted">Create a provisional librarian-authored claim. Evidence is attached after the claim is saved.</p>
        </div>
        {searchParams.error ? <p className="error">{searchParams.error}</p> : null}
        <form className="stack" action={createClaimAction}>
          <div className="field">
            <label htmlFor="claimText">Claim text</label>
            <textarea id="claimText" name="claimText" required />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="claimType">Claim type</label>
              <select id="claimType" name="claimType" defaultValue="description">
                {claimTypes.map((type) => (
                  <option value={type} key={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="confidenceLevel">Confidence level</label>
              <select id="confidenceLevel" name="confidenceLevel" defaultValue="medium">
                {confidenceLevels.map((level) => (
                  <option value={level} key={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="relatedHoldingId">Linked context: holding</label>
              <select id="relatedHoldingId" name="relatedHoldingId" defaultValue="">
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
              <select id="collectionAreaId" name="collectionAreaId" defaultValue="">
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
            <Link className="button secondary" href="/evidence-review">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
