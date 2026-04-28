"use server";

import { redirect } from "next/navigation";
import { saveSelectedAICandidatesAsDraftRecords, type AICandidatePreview } from "@/lib/phase3/mockAiIntake";
import { requireUser } from "@/lib/session";

export async function saveSelectedAICandidatesAction(selectedCandidates: AICandidatePreview[]) {
  const user = await requireUser();
  const claims = saveSelectedAICandidatesAsDraftRecords(selectedCandidates, user);
  redirect(claims.length === 1 ? `/evidence-review/${claims[0].id}` : "/evidence-review?reviewStatus=draft");
}
