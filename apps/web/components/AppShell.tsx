import Link from "next/link";
import { clearSession, type SessionUser } from "@/lib/session";
import { roleLabels, type RoleName } from "@library-app/shared";
import { redirect } from "next/navigation";

type NavStatus = "View only" | "Requires librarian review" | "Head librarian only";

type NavItem = {
  href: string;
  label: string;
  status?: NavStatus;
  roles: RoleName[];
};

async function logoutAction() {
  "use server";
  await clearSession();
  redirect("/login");
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Role Dashboard",
    roles: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian", "administrator"]
  },
  {
    href: "/collection",
    label: "Collection Graph",
    status: "View only",
    roles: ["student", "professor", "librarian", "collection_area_librarian", "head_librarian"]
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

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>Library Collection Intelligence</span>
          <small>Phase 1 private app foundation</small>
        </div>
        <nav className="nav" aria-label="Primary">
          {visibleNav.map((item) => (
            <Link href={item.href} key={item.href}>
              <span>{item.label}</span>
              {item.status ? <small>{item.status}</small> : null}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit">Log out</button>
          </form>
        </nav>
      </aside>
      <main className="main">
        <div className="header">
          <div>
            <span className="role-banner-label">Signed in as</span>
            <strong>{user.name}</strong>
            <div className="muted">{user.email}</div>
          </div>
          <div>
            <span className="badge">{roleLabels[role]}</span>
          </div>
        </div>
        <div className="testing-note">
          Phase 1 uses role-aware navigation. Phase 1.2 mock records are clearly labeled and remain static for testing.
        </div>
        {children}
      </main>
    </div>
  );
}
