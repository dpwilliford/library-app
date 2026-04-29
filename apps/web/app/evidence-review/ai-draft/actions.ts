"use server";

import { redirect } from "next/navigation";
import {
  evidenceReviewRedirectForSavedAICandidates,
  saveSelectedAICandidatesAsDraftRecords,
  type AICandidatePreview
} from "@/lib/phase3/mockAiIntake";
import { requireUser } from "@/lib/session";

export async function saveSelectedAICandidatesAction(formData: FormData) {
  const user = await requireUser();
  let redirectPath = "/evidence-review";
  try {
    const selectedCandidates = formData.getAll("selectedCandidate").map((value) => JSON.parse(String(value)) as AICandidatePreview);
    const claims = saveSelectedAICandidatesAsDraftRecords(selectedCandidates, user);
    redirectPath = evidenceReviewRedirectForSavedAICandidates(claims);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save selected AI intake candidates.";
    redirect(`/evidence-review/ai-draft?error=${encodeURIComponent(message)}`);
  }
  redirect(redirectPath);
}
