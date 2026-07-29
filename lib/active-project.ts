import { cookies } from 'next/headers';
import { getUserProjects } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/types';

export interface ActiveProject {
  id: string;
  code: string;
  name: string;
  brand_color: string;
  role: UserRole;
}

/**
 * Reads the active project from the cookie.
 * Returns null if no project is selected or the user doesn't have access.
 */
export async function getActiveProject(): Promise<ActiveProject | null> {
  const cookieStore = await cookies();
  const projectId = cookieStore.get('contentos_project')?.value;

  if (!projectId) return null;

  const userProjects = await getUserProjects();

  const match = userProjects.find(
    (p) => (p.project.id as string) === projectId
  );

  if (!match) return null;

  const project = match.project;
  return {
    id: project.id as string,
    code: project.code as string,
    name: project.name as string,
    brand_color: (project.brand_color as string) || '#111820',
    role: match.role,
  };
}

/**
 * Returns the active project ID, or throws if none selected.
 * Use in pages that require a project context.
 */
export async function requireActiveProject(): Promise<ActiveProject> {
  const project = await getActiveProject();
  if (!project) {
    throw new Error('NO_PROJECT_SELECTED');
  }
  return project;
}
