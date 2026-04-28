import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { evidenceRelationships, getClaim, sourceTypes } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";
import { createEvidenceAction } from "../../../actions";

export default async function NewEvidencePage({
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

  return (
    <AppShell user={user}>
      <section className="panel stack">
        <div>
          <p className="eyebrow">Manual Evidence</p>
          <h1>Add Evidence</h1>
          <p className="muted">{claim.claimText}</p>
          {claim.reviewStatus === "approved" ? (
            <p className="phase-note">Adding evidence to an approved claim returns it to needs revision.</p>
          ) : null}
        </div>
        {searchParams.error ? <p className="error">{searchParams.error}</p> : null}
        <form className="stack" action={createEvidenceAction}>
          <input type="hidden" name="claimId" value={claim.id} />
          <EvidenceFields />
          <div className="field">
            <label htmlFor="relationship">Relationship to claim</label>
            <select id="relationship" name="relationship" defaultValue="supports">
              {evidenceRelationships.map((relationship) => (
                <option value={relationship} key={relationship}>
                  {relationship.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="action-row">
            <button className="button" type="submit">
              Save Evidence
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

function EvidenceFields() {
  return (
    <>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="sourceTitle">Source title</label>
          <input id="sourceTitle" name="sourceTitle" />
        </div>
        <div className="field">
          <label htmlFor="sourceCreator">Source creator</label>
          <input id="sourceCreator" name="sourceCreator" />
        </div>
        <div className="field">
          <label htmlFor="sourceType">Source type</label>
          <select id="sourceType" name="sourceType" defaultValue="book">
            {sourceTypes.map((type) => (
              <option value={type} key={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sourceUrl">Source URL</label>
          <input id="sourceUrl" name="sourceUrl" />
        </div>
        <div className="field">
          <label htmlFor="publisher">Publisher</label>
          <input id="publisher" name="publisher" />
        </div>
        <div className="field">
          <label htmlFor="publicationDate">Publication date</label>
          <input id="publicationDate" name="publicationDate" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="citation">Citation</label>
        <textarea id="citation" name="citation" />
      </div>
      <div className="field">
        <label htmlFor="excerpt">Excerpt</label>
        <textarea id="excerpt" name="excerpt" />
      </div>
      <div className="field">
        <label htmlFor="supportingData">Supporting data</label>
        <textarea id="supportingData" name="supportingData" />
      </div>
      <div className="field">
        <label htmlFor="dateAccessed">Date accessed</label>
        <input id="dateAccessed" name="dateAccessed" type="date" />
      </div>
    </>
  );
}
