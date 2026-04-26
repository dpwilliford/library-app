import { AppShell } from "@/components/AppShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/session";

export default async function SystemSettingsPage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <PlaceholderPage
        title="Admin / System Settings"
        purpose="Support user access, role permissions, and system configuration while keeping collection-development authority with librarians."
        futureData={[
          "User invitations, account status, and role assignments",
          "Permission settings for students, professors, librarians, collection-area librarians, head librarians, and administrators",
          "System configuration and export controls",
          "Audit-related settings for important user and system actions"
        ]}
        futureActions={[
          "Invite, deactivate, or update user accounts",
          "Assign roles without changing collection-development authority",
          "Review system configuration and export settings",
          "Maintain audit-related controls for important user and system actions"
        ]}
        phaseNote="Phase 1 uses fixed demo users only. It does not manage real accounts, permissions, secrets, or deployment settings."
      />
    </AppShell>
  );
}
