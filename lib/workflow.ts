// ═══════════════════════════════════════════════════════════════════════
// Workflow Transition Matrix
// Only allowed transitions are accepted. Checked server-side.
// ═══════════════════════════════════════════════════════════════════════

import type { ContentStatus, IdeaStatus, UserRole } from './types';

// ── Idea status transitions ───────────────────────────────────────────

const ideaTransitions: Record<IdeaStatus, IdeaStatus[]> = {
  'new': ['ready', 'archived'],
  'ready': ['claimed', 'archived'],
  'claimed': ['ready', 'draft-created', 'archived'],
  'draft-created': ['ready', 'archived'],
  'archived': [],
};

export function canTransitionIdea(from: IdeaStatus, to: IdeaStatus): boolean {
  return ideaTransitions[from]?.includes(to) ?? false;
}

// ── Content status transitions ────────────────────────────────────────

const contentTransitions: Record<ContentStatus, ContentStatus[]> = {
  'draft': ['in-review', 'archived'],
  'in-review': ['changes-requested', 'approved', 'draft', 'archived'],
  'changes-requested': ['in-review', 'draft', 'archived'],
  'approved': ['exported', 'draft', 'archived'],
  'exported': ['live', 'out-of-sync' as ContentStatus, 'draft', 'archived'],
  'live': ['archived', 'draft'],
  'archived': [],
};

export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return contentTransitions[from]?.includes(to) ?? false;
}

// ── Role-based action permissions ─────────────────────────────────────

export function canPerformAction(
  role: UserRole,
  action: string
): boolean {
  const permissions: Record<UserRole, string[]> = {
    'admin': [
      'idea:create', 'idea:edit', 'idea:delete', 'idea:assign', 'idea:archive',
      'content:create', 'content:edit', 'content:submit-review', 'content:approve',
      'content:request-changes', 'content:export', 'content:verify-live',
      'content:archive', 'link:suggest', 'link:approve', 'link:dismiss',
      'token:create', 'token:revoke', 'member:manage', 'project:manage',
    ],
    'editor': [
      'idea:create', 'idea:edit', 'idea:assign', 'idea:archive',
      'content:create', 'content:edit', 'content:submit-review', 'content:approve',
      'content:request-changes', 'content:export', 'content:verify-live',
      'content:archive', 'link:suggest', 'link:approve', 'link:dismiss',
    ],
    'reviewer': [
      'content:submit-review', 'content:approve', 'content:request-changes',
      'link:suggest', 'link:dismiss',
    ],
    'viewer': [],
  };

  return permissions[role]?.includes(action) ?? false;
}

// ── Agent scopes (never include approve/export/verify/publish) ─────────

export const AGENT_ALLOWED_SCOPES = [
  'ideas:read',
  'ideas:claim',
  'content:read',
  'content:create',
  'content:update-draft',
  'links:suggest',
] as const;

export function isAgentScope(scope: string): boolean {
  return (AGENT_ALLOWED_SCOPES as readonly string[]).includes(scope);
}

// ── Sync status transitions ───────────────────────────────────────────

export function canTransitionSync(
  from: string,
  to: string
): boolean {
  const syncTransitions: Record<string, string[]> = {
    'not-exported': ['exported'],
    'exported': ['verified-live', 'verification-failed', 'out-of-sync'],
    'out-of-sync': ['exported', 'verified-live', 'verification-failed'],
    'verified-live': ['out-of-sync'],
    'verification-failed': ['exported'],
  };
  return syncTransitions[from]?.includes(to) ?? false;
}
