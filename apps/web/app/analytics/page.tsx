import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/session";

export default async function AnalyticsPage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <PlaceholderPage
        title="Analytics & Targets"
        purpose="Support collection-development planning with reproducible reports, targets, usage summaries, and collection balance views."
        futureData={[
          "Monthly acquisition targets",
          "Percentage targets by collection area",
          "Checkout and usage summaries",
          "Recommendation activity, approval rates, and pending review counts",
          "Traceable statements about collection strengths, gaps, and imbalances"
        ]}
        futureActions={[
          "Review acquisition progress against targets",
          "Compare collection-area distribution and activity",
          "Inspect pending review counts and recommendation activity",
          "Use traceable reports to support collection-development decisions"
        ]}
        phaseNote="Phase 1 does not calculate analytics, create reports, or display real usage data."
      />
    </AppShell>
  );
}
