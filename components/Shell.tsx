import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { getSessionUser } from "@/lib/auth/permissions";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/ideas", label: "Ideas" },
  { href: "/content", label: "Content library" },
  { href: "/review", label: "Review queue" },
  { href: "/links", label: "Links" },
  { href: "/activity", label: "Activity" },
];

export async function Shell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return <>{children}</>;
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <img
              src="/t3-labs-logo.png"
              alt="T3 Labs"
              width={42}
              height={42}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </span>
          <div>
            <strong>Content OS</strong>
            <small>T3 Labs</small>
          </div>
        </div>
        <nav>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <ProjectSwitcher />
        <div className="sidebar-card">
          <span className="eyebrow">Private workspace</span>
          <strong>Content OS</strong>
          <small>Authorised access only</small>
        </div>
        <div className="profile">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
        <LogoutButton />
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Private workspace</span>
            <h1>T3 Labs Content OS</h1>
          </div>
          <div className="top-actions">
            <Link className="ghost button-link" href="/content">
              Search library
            </Link>
            <Link className="primary button-link" href="/ideas/new">
              + New idea
            </Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
