// ═══════════════════════════════════════════════════════════════════════
// Database Types - mirrors Supabase schema
// ═══════════════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'editor' | 'reviewer' | 'viewer';

export type IdeaStatus = 'new' | 'ready' | 'claimed' | 'draft-created' | 'archived';
export type IdeaPriority = 'high' | 'medium' | 'low';

export type ContentStatus =
  | 'draft'
  | 'in-review'
  | 'changes-requested'
  | 'approved'
  | 'exported'
  | 'live'
  | 'archived';

export type ContentType =
  | 'guide' | 'comparison' | 'editorial' | 'landing-page' | 'tool'
  | 'pillar-guide' | 'practical-guide' | 'educational-guide'
  | 'workflow-guide' | 'roundup' | 'case-study';

export type SearchIntent =
  | 'informational' | 'commercial' | 'transactional' | 'navigational';

export type SyncStatus =
  | 'not-exported' | 'exported' | 'out-of-sync' | 'verified-live' | 'verification-failed';

export type LinkScope = 'same-project' | 'cross-project' | 'external';
export type LinkState = 'suggested' | 'approved' | 'present' | 'broken' | 'dismissed';
export type LinkSource = 'editor' | 'agent' | 'markdown-parser' | 'crawler';

export type ActivityType =
  | 'idea-created' | 'idea-updated' | 'idea-ready' | 'idea-claimed' | 'idea-released'
  | 'content-created' | 'content-updated' | 'content-submitted' | 'content-approved'
  | 'content-changes-requested' | 'content-exported' | 'content-verified'
  | 'content-archived' | 'link-suggested' | 'link-approved' | 'link-dismissed'
  | 'link-broken' | 'import-run' | 'token-created' | 'token-revoked'
  | 'member-added' | 'member-updated' | 'member-removed';

export interface Project {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  brand_color: string;
  canonical_base_url: string;
  repository: string;
  content_root: string;
  route_pattern: string;
  default_locale: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  project_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  idea_code: string;
  project_id: string;
  title: string;
  brief: string | null;
  priority: IdeaPriority;
  status: IdeaStatus;
  target_query: string | null;
  search_intent: SearchIntent | null;
  audience: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  claim_expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  content_code: string;
  project_id: string;
  source_idea_id: string | null;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  status: ContentStatus;
  cluster: string | null;
  content_type: ContentType | null;
  target_query: string | null;
  search_intent: SearchIntent | null;
  audience: string | null;
  slug: string | null;
  destination_path: string | null;
  canonical_url: string | null;
  locale: string;
  author_name: string | null;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  version: number;
  last_exported_at: string | null;
  last_exported_version: number | null;
  destination_commit_sha: string | null;
  sync_status: SyncStatus;
  published_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface ContentLink {
  id: string;
  source_content_id: string;
  target_content_id: string | null;
  target_url: string | null;
  anchor_text: string | null;
  link_scope: LinkScope;
  state: LinkState;
  source: LinkSource;
  reason: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  content_item_id: string;
  version: number;
  title: string | null;
  body_markdown: string | null;
  summary: string | null;
  meta_title: string | null;
  meta_description: string | null;
  actor_id: string | null;
  actor_name: string | null;
  reason: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  project_id: string | null;
  activity_type: ActivityType;
  actor_id: string | null;
  actor_name: string | null;
  actor_type: string;
  target_type: string | null;
  target_id: string | null;
  target_code: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentToken {
  id: string;
  token_hash: string;
  agent_name: string;
  scopes: string[];
  project_ids: string[];
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_by: string | null;
}
