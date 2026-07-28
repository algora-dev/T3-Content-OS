-- ═══════════════════════════════════════════════════════════════════════
-- T3 Labs Content OS - Core Schema Migration
-- Phase 0 + 1: Tables, enums, indexes, RLS policies
-- ═══════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'editor', 'reviewer', 'viewer');

create type idea_status as enum ('new', 'ready', 'claimed', 'draft-created', 'archived');
create type idea_priority as enum ('high', 'medium', 'low');

create type content_status as enum (
  'draft', 'in-review', 'changes-requested', 'approved', 'exported', 'live', 'archived'
);

create type content_type as enum (
  'guide', 'comparison', 'editorial', 'landing-page', 'tool', 'pillar-guide',
  'practical-guide', 'educational-guide', 'workflow-guide', 'roundup', 'case-study'
);

create type search_intent as enum (
  'informational', 'commercial', 'transactional', 'navigational'
);

create type sync_status as enum (
  'not-exported', 'exported', 'out-of-sync', 'verified-live', 'verification-failed'
);

create type link_scope as enum ('same-project', 'cross-project', 'external');
create type link_state as enum ('suggested', 'approved', 'present', 'broken', 'dismissed');
create type link_source as enum ('editor', 'agent', 'markdown-parser', 'crawler');

create type activity_type as enum (
  'idea-created', 'idea-updated', 'idea-ready', 'idea-claimed', 'idea-released',
  'content-created', 'content-updated', 'content-submitted', 'content-approved',
  'content-changes-requested', 'content-exported', 'content-verified',
  'content-archived', 'link-suggested', 'link-approved', 'link-dismissed',
  'link-broken', 'import-run', 'token-created', 'token-revoked',
  'member-added', 'member-updated', 'member-removed'
);

-- ── projects ──────────────────────────────────────────────────────────

create table projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  description text,
  brand_color text default '#111820',
  canonical_base_url text not null,
  repository text not null,
  content_root text not null,
  route_pattern text not null,
  default_locale text default 'en-NZ',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── project_members ───────────────────────────────────────────────────

create table project_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  role user_role not null default 'viewer',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, project_id)
);

create index idx_project_members_user on project_members(user_id);
create index idx_project_members_project on project_members(project_id);

-- ── agent_tokens ──────────────────────────────────────────────────────

create table agent_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  agent_name text not null,
  scopes text[] not null default '{}',
  project_ids uuid[] not null default '{}',
  created_at timestamptz default now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id)
);

create index idx_agent_tokens_hash on agent_tokens(token_hash) where revoked_at is null;
create index idx_agent_tokens_agent on agent_tokens(agent_name);

-- ── ideas ─────────────────────────────────────────────────────────────

create table ideas (
  id uuid primary key default gen_random_uuid(),
  idea_code text not null unique,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  brief text,
  priority idea_priority default 'medium',
  status idea_status default 'new',
  target_query text,
  search_intent search_intent,
  audience text,
  claimed_by text,
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_ideas_project on ideas(project_id);
create index idx_ideas_status on ideas(status);
create index idx_ideas_ready on ideas(project_id, status) where status = 'ready';
create index idx_ideas_claimed on ideas(claimed_by) where claimed_by is not null;

-- ── content_items ─────────────────────────────────────────────────────

create table content_items (
  id uuid primary key default gen_random_uuid(),
  content_code text not null unique,
  project_id uuid not null references projects(id) on delete cascade,
  source_idea_id uuid references ideas(id) on delete set null,
  title text not null,
  summary text,
  body_markdown text,
  status content_status default 'draft',
  cluster text,
  content_type content_type,
  target_query text,
  search_intent search_intent,
  audience text,
  slug text,
  destination_path text,
  canonical_url text,
  locale text default 'en-NZ',
  author_name text,
  excerpt text,
  meta_title text,
  meta_description text,
  version integer not null default 1,
  last_exported_at timestamptz,
  last_exported_version integer,
  destination_commit_sha text,
  sync_status sync_status default 'not-exported',
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

create index idx_content_project on content_items(project_id);
create index idx_content_status on content_items(status);
create index idx_content_sync on content_items(sync_status);
create index idx_content_cluster on content_items(project_id, cluster);
create index idx_content_slug on content_items(slug);
create index idx_content_query on content_items(target_query);

-- ── content_links ─────────────────────────────────────────────────────

create table content_links (
  id uuid primary key default gen_random_uuid(),
  source_content_id uuid not null references content_items(id) on delete cascade,
  target_content_id uuid references content_items(id) on delete set null,
  target_url text,
  anchor_text text,
  link_scope link_scope not null default 'same-project',
  state link_state not null default 'suggested',
  source link_source not null default 'editor',
  reason text,
  last_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (target_content_id is not null or target_url is not null)
);

create index idx_links_source on content_links(source_content_id);
create index idx_links_target on content_links(target_content_id);
create index idx_links_state on content_links(state);
create index idx_links_scope on content_links(link_scope);

-- ── content_revisions ─────────────────────────────────────────────────

create table content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  version integer not null,
  title text,
  body_markdown text,
  summary text,
  meta_title text,
  meta_description text,
  actor_id uuid references auth.users(id),
  actor_name text,
  reason text,
  created_at timestamptz default now()
);

create index idx_revisions_content on content_revisions(content_item_id);
create index idx_revisions_version on content_revisions(content_item_id, version desc);

-- ── activity_log ──────────────────────────────────────────────────────

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  activity_type activity_type not null,
  actor_id uuid references auth.users(id),
  actor_name text,
  actor_type text not null default 'human',
  target_type text,
  target_id uuid,
  target_code text,
  detail jsonb,
  created_at timestamptz default now()
);

create index idx_activity_project on activity_log(project_id);
create index idx_activity_type on activity_log(activity_type);
create index idx_activity_created on activity_log(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════

alter table projects enable row level security;
alter table project_members enable row level security;
alter table agent_tokens enable row level security;
alter table ideas enable row level security;
alter table content_items enable row level security;
alter table content_links enable row level security;
alter table content_revisions enable row level security;
alter table activity_log enable row level security;

-- ── Helper function: get current user's role for a project ────────────

create or replace function get_user_role(target_project_id uuid)
returns user_role
language sql
stable
security definer
as $$
  select role from project_members
  where user_id = auth.uid() and project_id = target_project_id;
$$;

-- ── Helper: is current user an admin of any project ───────────────────

create or replace function is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from project_members
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── projects: visible to any authenticated member ─────────────────────

create policy "projects: read if member"
  on projects for select
  using (
    exists (
      select 1 from project_members
      where user_id = auth.uid() and project_id = projects.id
    )
  );

create policy "projects: admin write"
  on projects for all
  using (is_admin())
  with check (is_admin());

-- ── project_members: read if you're a member or admin ─────────────────

create policy "members: read if member"
  on project_members for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from project_members pm2
      where pm2.user_id = auth.uid()
        and pm2.project_id = project_members.project_id
    )
  );

create policy "members: admin manage"
  on project_members for all
  using (is_admin())
  with check (is_admin());

-- ── agent_tokens: admin only ──────────────────────────────────────────

create policy "tokens: admin only"
  on agent_tokens for all
  using (is_admin())
  with check (is_admin());

-- ── ideas: visible to project members ─────────────────────────────────

create policy "ideas: read if project member"
  on ideas for select
  using (
    exists (
      select 1 from project_members
      where user_id = auth.uid() and project_id = ideas.project_id
    )
  );

create policy "ideas: write if editor+"
  on ideas for all
  using (
    exists (
      select 1 from project_members
      where user_id = auth.uid()
        and project_id = ideas.project_id
        and role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from project_members
      where user_id = auth.uid()
        and project_id = ideas.project_id
        and role in ('admin', 'editor')
    )
  );

-- ── content_items: visible to project members ─────────────────────────

create policy "content: read if project member"
  on content_items for select
  using (
    exists (
      select 1 from project_members
      where user_id = auth.uid() and project_id = content_items.project_id
    )
  );

create policy "content: write if editor+"
  on content_items for all
  using (
    exists (
      select 1 from project_members
      where user_id = auth.uid()
        and project_id = content_items.project_id
        and role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from project_members
      where user_id = auth.uid()
        and project_id = content_items.project_id
        and role in ('admin', 'editor')
    )
  );

-- ── content_links: visible to project members ─────────────────────────
-- Links reference content_items, so we check project membership via the
-- source content's project.

create policy "links: read if project member"
  on content_links for select
  using (
    exists (
      select 1 from content_items ci
      join project_members pm on pm.project_id = ci.project_id
      where ci.id = content_links.source_content_id
        and pm.user_id = auth.uid()
    )
  );

create policy "links: write if editor+"
  on content_links for all
  using (
    exists (
      select 1 from content_items ci
      join project_members pm on pm.project_id = ci.project_id
      where ci.id = content_links.source_content_id
        and pm.user_id = auth.uid()
        and pm.role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1 from content_items ci
      join project_members pm on pm.project_id = ci.project_id
      where ci.id = content_links.source_content_id
        and pm.user_id = auth.uid()
        and pm.role in ('admin', 'editor')
    )
  );

-- ── content_revisions: visible to project members ─────────────────────

create policy "revisions: read if project member"
  on content_revisions for select
  using (
    exists (
      select 1 from content_items ci
      join project_members pm on pm.project_id = ci.project_id
      where ci.id = content_revisions.content_item_id
        and pm.user_id = auth.uid()
    )
  );

-- Revisions are created by the system (server-side), so we allow insert
-- via service role only. No direct client inserts.
create policy "revisions: admin update"
  on content_revisions for update
  using (is_admin());

-- ── activity_log: read if project member ──────────────────────────────

create policy "activity: read if project member"
  on activity_log for select
  using (
    project_id is null
    or exists (
      select 1 from project_members
      where user_id = auth.uid() and project_id = activity_log.project_id
    )
    or is_admin()
  );

-- Activity log is append-only from server-side. No client deletes.
create policy "activity: admin all"
  on activity_log for all
  using (is_admin())
  with check (is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- Triggers: updated_at
-- ═══════════════════════════════════════════════════════════════════════

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_updated before update on projects
  for each row execute function update_updated_at();

create trigger trg_project_members_updated before update on project_members
  for each row execute function update_updated_at();

create trigger trg_ideas_updated before update on ideas
  for each row execute function update_updated_at();

create trigger trg_content_items_updated before update on content_items
  for each row execute function update_updated_at();

create trigger trg_content_links_updated before update on content_links
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
-- Atomic claim function for ideas
-- ═══════════════════════════════════════════════════════════════════════

create or replace function claim_idea(
  p_idea_id uuid,
  p_agent_name text,
  p_lease_minutes integer default 30
)
returns ideas
language plpgsql
security definer
as $$
declare
  result ideas;
begin
  update ideas
  set status = 'claimed',
      claimed_by = p_agent_name,
      claimed_at = now(),
      claim_expires_at = now() + (p_lease_minutes || ' minutes')::interval
  where id = p_idea_id
    and (status = 'ready'
         or (status = 'claimed' and claim_expires_at < now()))
  returning * into result;

  if result is null then
    raise exception 'Idea is not available for claiming';
  end if;

  return result;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- Release expired claims (can be called by cron or on read)
-- ═══════════════════════════════════════════════════════════════════════

create or replace function release_expired_claims()
returns integer
language plpgsql
security definer
as $$
declare
  count integer;
begin
  update ideas
  set status = 'ready',
      claimed_by = null,
      claimed_at = null,
      claim_expires_at = null
  where status = 'claimed'
    and claim_expires_at < now();

  get diagnostics count = row_count;
  return count;
end;
$$;
