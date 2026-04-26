import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/session";

export default async function RecommendationsPage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <PlaceholderPage
        title="Recommendations"
        purpose="Collect collection requests and proposals, then route them through librarian review and head librarian decision-making."
        futureData={[
          "Student learning or research needs",
          "Professor course, assignment, program, or research relevance",
          "Librarian-reviewed rationale, evidence, and redundancy notes",
          "Final decision status from the head librarian"
        ]}
        futureActions={[
          "Submit a title, topic, creator, format, or collection need for review",
          "Connect recommendations to courses, programs, research, or collection gaps",
          "Review recommendation rationale and redundancy concerns",
          "Escalate reviewed acquisition proposals to the head librarian"
        ]}
        phaseNote="Phase 1 does not include recommendation submission, recommendation scoring, or a recommendation engine."
      />
    </AppShell>
  );
}
