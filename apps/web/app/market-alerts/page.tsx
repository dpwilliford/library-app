import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/session";

export default async function MarketAlertsPage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <PlaceholderPage
        title="Market Layer"
        purpose="Track unstable purchase availability separately from local holdings and reviewed field knowledge."
        futureData={[
          "Vendor, publisher-direct, and marketplace links",
          "Price, format, condition, preorder status, and availability",
          "Date checked and source URL for every market observation",
          "Alerts for collection-area librarians when relevant items become available"
        ]}
        futureActions={[
          "Review timestamped market availability",
          "Check purchase options without treating them as stable knowledge",
          "Monitor preorder or availability changes",
          "Attach market observations to future acquisition proposals"
        ]}
        phaseNote="Phase 1 does not search vendors, scrape websites, call external APIs, or show live market data."
      />
    </AppShell>
  );
}
