import { ShellClient } from "@/components/ShellClient";
import { getSessionUser, getUserProjects } from "@/lib/auth/permissions";
import { getActiveProject } from "@/lib/active-project";
import type { ReactNode } from "react";

export async function Shell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) return <>{children}</>;

  const userProjects = await getUserProjects();
  const activeProject = await getActiveProject();

  const projectOptions = userProjects.map((p) => ({
    id: p.project.id as string,
    code: p.project.code as string,
    name: p.project.name as string,
    brand_color: (p.project.brand_color as string) || "#111820",
  }));

  const active = activeProject ? {
    id: activeProject.id,
    code: activeProject.code,
    name: activeProject.name,
  } : null;

  return (
    <ShellClient
      user={user}
      projectOptions={projectOptions}
      activeProject={active}
    >
      {children}
    </ShellClient>
  );
}
