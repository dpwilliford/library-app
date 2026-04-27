import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/session";

export default async function TitleGenealogiesPage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <PlaceholderPage
        title="Title Genealogies"
        purpose="Describe how titles move across time, media, editions, translations, adaptations, reissues, and local holdings."
        futureData={[
          "Title clusters, works, series, and instantiations",
          "Original works, collected editions, translations, adaptations, and special editions",
          "Owned and not-owned indicators",
          "Teaching relevance and reviewed title biographies"
        ]}
        futureActions={[
          "Review a title biography across media and time",
          "Distinguish works, editions, translations, adaptations, and holdings",
          "Identify why a specific instantiation matters to teaching or research",
          "Compare owned and not-owned instantiations"
        ]}
        phaseNote="Phase 1.2 includes static demo title relationships only. These are retained for reference and do not create Phase 2 SQLite-backed holdings or real title genealogies."
      />
    </AppShell>
  );
}
