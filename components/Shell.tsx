import { ShellClient } from "@/components/ShellClient";
import { getSessionUser, getUserProjects } from "@/lib/auth/permissions";
import type { ReactNode } from "react";

export async function Shell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return <>{children}</>;
  }

  const userProjects = await getUserProjects();
  const projectOptions = userProjects.map((p) => ({
    id: p.project.id as string,
    code: p.project.code as string,
    name: p.project.name as string,
    brand_color: (p.project.brand_color as string) || "#111820",
  }));

  return (
    <ShellClient user={user} projectOptions={projectOptions}>
      {children}
    </ShellClient>
  );
}
