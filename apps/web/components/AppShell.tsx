import Link from "next/link";
import { Badge } from "@/components/Badge";
import { clearSession, type SessionUser } from "@/lib/session";
import { roleLabels, type RoleName } from "@library-app/shared";
import { redirect } from "next/navigation";

type NavStatus = "View only" | "Requires librarian review" | "Head librarian only";

type NavItem = {
  href: string;
  label: string;
  status?: NavStatus;
  roles: RoleName[];
  phase2Primary?: boolean;
};

async function logoutAction() {
  "use server";
  await clearSession();
  redirect("/login");
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    phase2Primary: true,
    roles: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian", "administrator"]
  },
  {
    href: "/collection",
    label: "Holdings",
    status: "View only",
    phase2Primary: true,
    roles: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/collection/import",
    label: "Import CSV",
    status: "Requires librarian review",
    phase2Primary: true,
    roles: ["librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/collection/export",
    label: "Export",
    status: "Requires librarian review",
    phase2Primary: true,
    roles: ["librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/collection#audit-log",
    label: "Audit Log",
    status: "Requires librarian review",
    phase2Primary: true,
    roles: ["librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/recommendations",
    label: "Recommendations",
    status: "Requires librarian review",
    roles: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/analytics",
    label: "Analytics & Targets",
    status: "Head librarian only",
    roles: ["head_librarian"]
  },
  {
    href: "/analytics",
    label: "Analytics & Targets",
    status: "View only",
    roles: ["librarian", "collection_area_librarian"]
  },
  {
    href: "/title-genealogies",
    label: "Title Genealogies",
    status: "View only",
    roles: ["librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/market-alerts",
    label: "Market Layer",
    status: "View only",
    roles: ["collection_area_librarian", "head_librarian"]
  },
  {
    href: "/evidence-review",
    label: "Evidence Review",
    status: "Requires librarian review",
    roles: ["librarian", "collection_area_librarian", "head_librarian"]
  },
  {
    href: "/system-settings",
    label: "Admin / System Settings",
    status: "View only",
    roles: ["administrator"]
  }
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const role = user.role as RoleName;
  const visibleNav = navItems.filter((item) => item.roles.includes(role));
  const primaryNav = visibleNav.filter((item) => item.phase2Primary);
  const secondaryNav = visibleNav.filter((item) => !item.phase2Primary);

  return (
    <div className="shell">
      <header className="site-header">
        <div className="brand">
          <Link href="/dashboard">Library Collection Intelligence</Link>
          <small>Phase 2 Collection Graph</small>
        </div>
        <nav className="desktop-nav" aria-label="Primary collection navigation">
          {primaryNav.map((item) => (
            <Link href={item.href} key={`${item.href}-${item.label}`}>
              <span>{item.label}</span>
            </Link>
          ))}
          {secondaryNav.length > 0 ? (
            <details className="more-nav">
              <summary aria-label="Open secondary navigation">More</summary>
              <div className="more-nav-panel">
                {secondaryNav.map((item) => (
                  <Link href={item.href} key={`${item.href}-${item.label}`}>
                    <span>{item.label}</span>
                    {item.status ? <small>{item.status}</small> : null}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
          <form action={logoutAction}>
            <button type="submit">Log out</button>
          </form>
        </nav>
        <details className="mobile-menu">
          <summary aria-label="Open or close navigation menu">Menu</summary>
          <div className="mobile-menu-panel" id="mobile-navigation">
            <nav aria-label="Mobile primary navigation">
              {primaryNav.map((item) => (
                <Link href={item.href} key={`${item.href}-${item.label}-mobile`}>
                  <span>{item.label}</span>
                  {item.status ? <small>{item.status}</small> : null}
                </Link>
              ))}
            </nav>
            {secondaryNav.length > 0 ? (
              <details className="mobile-secondary">
                <summary aria-label="Open secondary links">More</summary>
                <nav aria-label="Mobile secondary navigation">
                  {secondaryNav.map((item) => (
                    <Link href={item.href} key={`${item.href}-${item.label}-mobile-secondary`}>
                      <span>{item.label}</span>
                      {item.status ? <small>{item.status}</small> : null}
                    </Link>
                  ))}
                </nav>
              </details>
            ) : null}
            <form action={logoutAction}>
              <button type="submit">Log out</button>
            </form>
            <p className="mobile-menu-help">Use Menu again to close navigation.</p>
          </div>
        </details>
      </header>
      <main className="main">
        <div className="header">
          <div>
            <span className="role-banner-label">Signed in as</span>
            <strong>{user.name}</strong>
            <div className="muted">{user.email}</div>
          </div>
          <div>
            <Badge variant="primary">{roleLabels[role]}</Badge>
          </div>
        </div>
        <div className="testing-note">
          Phase 1 provides the app foundation: login, demo users, protected dashboard, and role-aware navigation. Phase 1.2
          static demo records remain for reference. Phase 2 uses the SQLite-backed Collection Graph for CSV imports,
          holdings, batches, exports, and audit logs.
        </div>
        {children}
      </main>
    </div>
  );
}
