"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
  projectOptions 
}: { 
  children: ReactNode;
  user: { name: string; email: string };
  projectOptions: Array<{ id: string; code: string; name: string; brand_color?: string }>;
}) {
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <img
              src="/t3-labs-logo.png"
              alt="T3 Labs"
              height={36}
            />
          </span>
          <div>
            <strong>Content OS</strong>
          </div>
        </div>
        <ProjectSwitcher projects={projectOptions} />
        <nav>
          {navLinks.map((link) => (
            <Link key={link.href} href={projectParam ? `${link.href}?project=${projectParam}` : link.href}>
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
            <Link className="ghost button-link" href={projectParam ? `/content?project=${projectParam}` : "/content"}>
              Search library
            </Link>
            <Link className="primary button-link" href={projectParam ? `/ideas/new?project=${projectParam}` : "/ideas/new"}>
              + New idea
            </Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
