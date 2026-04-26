import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/session";

export default async function EvidenceReviewPage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <PlaceholderPage
        title="Evidence Review"
        purpose="Help librarians review claims before they become authoritative knowledge, with the dashboard and review workflow as the authority."
        futureData={[
          "Claims that separate facts from interpretation",
          "Evidence records with source, excerpt or supporting data, date accessed, confidence level, and review status",
          "Librarian review outcomes and revision requests",
          "Clear distinction between provisional information and reviewed knowledge"
        ]}
        futureActions={[
          "Review whether a claim has adequate evidence",
          "Mark evidence-backed claims as ready, not ready, or needing revision",
          "Mark unsupported claims as unverified or provisional",
          "Preserve source, confidence, date accessed, and review status"
        ]}
        phaseNote="Phase 1.2 includes static mock evidence records only. It does not create claims, evaluate evidence, finalize knowledge, or run AI workflows."
      />
    </AppShell>
  );
}
