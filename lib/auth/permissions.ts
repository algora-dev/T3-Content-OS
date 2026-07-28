// ═══════════════════════════════════════════════════════════════════════
// Server-side permission helpers
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface ProjectContext {
  projectId: string;
  role: UserRole;
}

// ── Get current authenticated user ────────────────────────────────────

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    name:
      (user.user_metadata?.full_name as string) ??
      (user.email?.split('@')[0] ?? 'User'),
  };
}

// ── Get user's role for a specific project ────────────────────────────

export async function getProjectRole(
  projectId: string
): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .single();

  return (data?.role as UserRole) ?? null;
}

// ── Get all projects for current user ──────────────────────────────────

export async function getUserProjects(): Promise<
  Array<{ project: Record<string, unknown>; role: UserRole }>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('project_members')
    .select(`
      role,
      project:projects(*)
    `)
    .eq('user_id', user.id);

  if (error || !data) return [];

  return data.map((item) => ({
    project: (item.project as unknown as Record<string, unknown>) ?? {},
    role: item.role as UserRole,
  }));
}

// ── Check if user can perform an action on a project ───────────────────

export async function checkPermission(
  projectId: string,
  action: string
): Promise<boolean> {
  const role = await getProjectRole(projectId);
  if (!role) return false;

  const { canPerformAction } = await import('@/lib/workflow');
  return canPerformAction(role, action);
}

// ── Require authentication or redirect ────────────────────────────────

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// ── Require project membership ────────────────────────────────────────

export async function requireProjectAccess(
  projectId: string
): Promise<ProjectContext> {
  const user = await requireUser();
  const role = await getProjectRole(projectId);

  if (!role) {
    throw new Error('FORBIDDEN');
  }

  return { projectId, role };
}

// ── Require a specific role or higher ─────────────────────────────────

export async function requireRole(
  projectId: string,
  minRole: UserRole[]
): Promise<ProjectContext> {
  const ctx = await requireProjectAccess(projectId);

  if (!minRole.includes(ctx.role)) {
    throw new Error('FORBIDDEN');
  }

  return ctx;
}
