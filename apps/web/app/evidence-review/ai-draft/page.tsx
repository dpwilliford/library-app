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
      <section className="panel stack">
        <div className="page-action-header">
          <div>
            <p className="eyebrow">Phase 3.3 AI Draft Intake</p>
            <h1>AI Intake Preview</h1>
            <p className="muted">
              Paste source notes to generate deterministic preview candidates. Candidates are not saved until selected and confirmed.
            </p>
          </div>
          <div className="action-row page-actions">
            <Link className="button secondary" href="/evidence-review">
              Review Queue
            </Link>
          </div>
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
              <div className="mock-list" aria-label="AI intake preview candidates">
                {candidates.map((candidate, index) => (
                  <label className="mock-row" key={`${candidate.candidateClaimText}-${index}`}>
                    <input type="checkbox" name="selectedCandidate" value={JSON.stringify(candidate)} />
                    <span>
                      <strong>{candidate.candidateClaimText}</strong>
                      <small>
                        Preview only. Not saved. Not part of the archive. Requires librarian confirmation.
                      </small>
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
                <Link className="button secondary" href="/evidence-review?reviewStatus=draft">
                  Draft Queue
                </Link>
              </div>
            </form>
          ) : (
            <p className="phase-note">No preview candidates were generated.</p>
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
