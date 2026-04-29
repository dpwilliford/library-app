"use server";

import { redirect } from "next/navigation";
import { saveSelectedAICandidatesAsDraftRecords, type AICandidatePreview } from "@/lib/phase3/mockAiIntake";
import { requireUser } from "@/lib/session";

export async function saveSelectedAICandidatesAction(formData: FormData) {
  const user = await requireUser();
  let redirectPath = "/evidence-review?reviewStatus=draft";
  try {
    const selectedCandidates = formData.getAll("selectedCandidate").map((value) => JSON.parse(String(value)) as AICandidatePreview);
    const claims = saveSelectedAICandidatesAsDraftRecords(selectedCandidates, user);
    redirectPath = claims.length === 1 ? `/evidence-review/${claims[0].id}` : "/evidence-review?reviewStatus=draft";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save selected AI intake candidates.";
    redirect(`/evidence-review/ai-draft?error=${encodeURIComponent(message)}`);
  }
  redirect(redirectPath);
}
