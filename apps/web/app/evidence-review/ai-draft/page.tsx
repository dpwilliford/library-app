import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { generateAICandidates } from "@/lib/phase3/mockAiIntake";
import { canManageEvidence } from "@/lib/phase3/permissions";
import { requireUser } from "@/lib/session";
import { saveSelectedAICandidatesAction } from "./actions";
import { SaveSelectedButton } from "./SaveSelectedButton";

type SearchParams = {
  rawText?: string | string[];
  error?: string;
};

export default async function AIDraftIntakePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  if (!canManageEvidence(user.role)) {
    redirect("/dashboard");
  }

  const rawText = firstValue(searchParams.rawText);
  const candidates = generateAICandidates(rawText);
  const error = firstValue(searchParams.error);

  return (
    <AppShell user={user}>
      <section className="panel stack evidence-review-workflow ai-intake-workflow">
        <div className="page-action-header">
          <div>
            <p className="eyebrow">Phase 3.3 AI Draft Intake</p>
            <h1>AI Intake Preview</h1>
            <p className="muted">
              Paste source notes to generate deterministic preview candidates. This page is preview-only until a librarian selects
              candidates and saves them.
            </p>
          </div>
          <div className="action-row page-actions">
            <Link className="button secondary" href="/evidence-review">
              Review Queue
            </Link>
          </div>
        </div>

        <div className="guidance-panel preview-guidance" role="note">
          <div>
            <p className="eyebrow">Preview only</p>
            <h2>Nothing here is a saved evidence record yet</h2>
          </div>
          <ul className="plain-list">
            <li>AI intake candidates are deterministic draft suggestions generated from pasted text for librarian review.</li>
            <li>Preview candidates are not stored, exported, routed, counted, or placed in the review queue.</li>
            <li>Nothing is saved until the librarian selects candidates and uses Save Selected Drafts.</li>
            <li>Saved candidates become normal draft evidence-review records on the review queue.</li>
          </ul>
        </div>

        <form className="stack" action="/evidence-review/ai-draft">
          <div className="field">
            <label htmlFor="rawText">Raw text</label>
            <textarea id="rawText" name="rawText" rows={8} defaultValue={rawText} required />
          </div>
          <div className="action-row">
            <button className="button" type="submit">
              Generate Preview
            </button>
            <Link className="button secondary" href="/evidence-review/ai-draft">
              Clear
            </Link>
          </div>
        </form>

        {error ? <p className="phase-note">{error}</p> : null}

        {rawText ? (
          candidates.length > 0 ? (
            <form className="stack" action={saveSelectedAICandidatesAction}>
              <div className="mock-list ai-candidate-list" aria-label="AI intake preview candidates">
                {candidates.map((candidate, index) => (
                  <label className="mock-row candidate-preview-row" key={`${candidate.candidateClaimText}-${index}`}>
                    <input type="checkbox" name="selectedCandidate" value={JSON.stringify(candidate)} />
                    <span>
                      <strong>{candidate.candidateClaimText}</strong>
                      <small className="preview-only-label">Preview only. Not saved. Requires explicit librarian save.</small>
                      <small>
                        {candidate.candidateClaimKind.replace("candidate_", "").replaceAll("_", " ")} ·{" "}
                        {candidate.candidateConfidenceHint.replace("candidate_", "")} confidence ·{" "}
                        {candidate.candidateEvidenceLink.replace("candidate_", "").replaceAll("_", " ")}
                      </small>
                      <small>Source: {candidate.candidateSourceLabel || candidate.candidateSourceLocator || "Unspecified source"}</small>
                      <small>Evidence: {candidate.candidateEvidenceText}</small>
                      <small>{candidate.candidateUncertaintyNote}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="action-row">
                <SaveSelectedButton />
                <Link className="button secondary" href="/evidence-review">
                  Review Queue
                </Link>
              </div>
            </form>
          ) : (
            <div className="empty-state" role="status">
              <p className="eyebrow">No preview candidates</p>
              <h2>The pasted text did not produce review-ready candidates</h2>
              <p>
                This can happen when the text is blank after cleanup, lacks separable notes, or does not include enough claim and
                evidence context for the deterministic preview parser. Revise the pasted notes with clearer claim text, source
                labels or URLs, and excerpt-like evidence, then generate the preview again.
              </p>
            </div>
          )
        ) : null}
      </section>
    </AppShell>
  );
}

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}
