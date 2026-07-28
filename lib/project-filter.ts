import { headers } from "next/headers";
import { getUserProjects } from "@/lib/auth/permissions";

export interface ProjectFilterResult {
  projectFilter: string | null;
  projectIds: string[];
  selectedProjectName: string | null;
  allProjectIds: string[];
}

/**
 * Reads the ?project= query param from the current URL via referer header
 * or the page's searchParams. Since server components can't useSearchParams,
 * we pass projectIds from the page's searchParams to this helper.
 * 
 * For pages that receive searchParams, pass them through.
 */
export async function getProjectFilter(
  searchParams?: { project?: string }
): Promise<ProjectFilterResult> {
  const userProjects = await getUserProjects();
  const allProjectIds = userProjects.map((p) => p.project.id as string);

  const projectId = searchParams?.project || null;

  if (projectId && projectId !== "all") {
    // Validate that the user has access to this project
    const valid = userProjects.some((p) => p.project.id === projectId);
    if (!valid) {
      return { projectFilter: null, projectIds: allProjectIds, selectedProjectName: null, allProjectIds };
    }
    const projectName = userProjects.find((p) => p.project.id === projectId)?.project.name as string;
    return {
      projectFilter: projectId,
      projectIds: [projectId],
      selectedProjectName: projectName,
      allProjectIds,
    };
  }

  return { projectFilter: null, projectIds: allProjectIds, selectedProjectName: null, allProjectIds };
}
