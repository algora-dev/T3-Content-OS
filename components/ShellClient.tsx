"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/ideas", label: "Ideas" },
  { href: "/content", label: "Content library" },
  { href: "/review", label: "Review queue" },
  { href: "/links", label: "Links" },
  { href: "/activity", label: "Activity" },
  { href: "/admin", label: "Admin" },
  { href: "/help", label: "Help" },
];

export function ShellClient({
  children,
  user,
  projectOptions,
  activeProject,
}: {
  children: ReactNode;
  user: { name: string; email: string };
  projectOptions: Array<{ id: string; code: string; name: string; brand_color?: string }>;
  activeProject: { id: string; code: string; name: string } | null;
}) {
  const router = useRouter();

  async function handleSwitchProject(projectId: string) {
    await fetch("/api/set-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <img src="/t3-labs-logo.png" alt="T3 Labs" height={36} />
          </span>
          <div>
            <strong>Content OS</strong>
          </div>
        </div>
        <ProjectSwitcher
          projects={projectOptions}
          activeProject={activeProject}
          onSwitch={handleSwitchProject}
        />
        <nav>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="profile">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
        <LogoutButton />
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>Content OS</h1>
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
