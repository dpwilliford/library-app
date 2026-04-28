import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getClaim, getEvidenceForClaim, sourceTypes } from "@/lib/phase3/claimsData";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";
import { updateEvidenceAction } from "../../../../actions";

export default async function EditEvidencePage({
  params,
  searchParams
}: {
  params: { claimId: string; evidenceId: string };
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }
  const claim = getClaim(params.claimId);
  const evidence = getEvidenceForClaim(params.claimId).find((item) => item.evidenceId === params.evidenceId);
  if (!claim || !evidence) {
    notFound();
  }

  return (
    <AppShell user={user}>
      <section className="panel stack">
        <div>
          <p className="eyebrow">Manual Evidence</p>
          <h1>Edit Evidence</h1>
          <p className="muted">{claim.claimText}</p>
          {claim.reviewStatus === "approved" ? (
            <p className="phase-note">Editing evidence or source metadata for an approved claim returns it to needs revision.</p>
          ) : null}
        </div>
        {searchParams.error ? <p className="error">{searchParams.error}</p> : null}
        <form className="stack" action={updateEvidenceAction}>
          <input type="hidden" name="claimId" value={claim.id} />
          <input type="hidden" name="evidenceId" value={evidence.evidenceId} />
          <input type="hidden" name="sourceId" value={evidence.source.id} />
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sourceTitle">Source title</label>
              <input id="sourceTitle" name="sourceTitle" defaultValue={evidence.source.sourceTitle} />
            </div>
            <div className="field">
              <label htmlFor="sourceCreator">Source creator</label>
              <input id="sourceCreator" name="sourceCreator" defaultValue={evidence.source.sourceCreator} />
            </div>
            <div className="field">
              <label htmlFor="sourceType">Source type</label>
              <select id="sourceType" name="sourceType" defaultValue={evidence.source.sourceType}>
                {sourceTypes.map((type) => (
                  <option value={type} key={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sourceUrl">Source URL</label>
              <input id="sourceUrl" name="sourceUrl" defaultValue={evidence.source.sourceUrl} />
            </div>
            <div className="field">
              <label htmlFor="publisher">Publisher</label>
              <input id="publisher" name="publisher" defaultValue={evidence.source.publisher} />
            </div>
            <div className="field">
              <label htmlFor="publicationDate">Publication date</label>
              <input id="publicationDate" name="publicationDate" defaultValue={evidence.source.publicationDate} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="citation">Citation</label>
            <textarea id="citation" name="citation" defaultValue={evidence.source.citation} />
          </div>
          <div className="field">
            <label htmlFor="excerpt">Excerpt</label>
            <textarea id="excerpt" name="excerpt" defaultValue={evidence.excerpt} />
          </div>
          <div className="field">
            <label htmlFor="supportingData">Supporting data</label>
            <textarea id="supportingData" name="supportingData" defaultValue={evidence.supportingData} />
          </div>
          <div className="field">
            <label htmlFor="dateAccessed">Date accessed</label>
            <input id="dateAccessed" name="dateAccessed" type="date" defaultValue={evidence.dateAccessed} />
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
