// ═══════════════════════════════════════════════════════════════════════
// API Contract Types - shared between server and client
// ═══════════════════════════════════════════════════════════════════════

import type {
  Idea, ContentItem, ContentLink, Project, ActivityLogEntry,
} from '@/lib/types';

// ── Standard API response ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  detail?: unknown;
}

// ── Pagination ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Request bodies ────────────────────────────────────────────────────

export interface CreateIdeaRequest {
  project_id: string;
  title: string;
  brief?: string;
  priority?: 'high' | 'medium' | 'low';
  target_query?: string;
  search_intent?: string;
  audience?: string;
}

export interface UpdateIdeaRequest {
  title?: string;
  brief?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  target_query?: string;
  search_intent?: string;
  audience?: string;
}

export interface ClaimIdeaRequest {
  agent_name: string;
  lease_minutes?: number;
}

export interface CreateContentRequest {
  project_id: string;
  source_idea_id?: string;
  title: string;
  summary?: string;
  body_markdown?: string;
  cluster?: string;
  content_type?: string;
  target_query?: string;
  search_intent?: string;
  audience?: string;
  slug?: string;
  destination_path?: string;
  author_name?: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateContentRequest {
  title?: string;
  summary?: string;
  body_markdown?: string;
  cluster?: string;
  content_type?: string;
  target_query?: string;
  search_intent?: string;
  audience?: string;
  slug?: string;
  destination_path?: string;
  author_name?: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  version: number; // required for optimistic locking
}

export interface CreateLinkSuggestionRequest {
  target_content_id?: string;
  target_url?: string;
  anchor_text: string;
  link_scope: 'same-project' | 'cross-project' | 'external';
  reason: string;
}

// ── Response shapes ───────────────────────────────────────────────────

export interface ProjectListResponse extends PaginatedResponse<Project> {}
export interface IdeaListResponse extends PaginatedResponse<Idea> {}
export interface ContentListResponse extends PaginatedResponse<ContentItem> {}
export interface LinkListResponse extends PaginatedResponse<ContentLink> {}
export interface ActivityListResponse extends PaginatedResponse<ActivityLogEntry> {}

// ── Error helper ──────────────────────────────────────────────────────

export function apiError(code: string, message: string, status: number, detail?: unknown) {
  return Response.json(
    { data: null, error: { code, message, detail } },
    { status }
  );
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json({ data, error: null }, { status });
}

export const ERROR_CODES = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Authentication required', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'You do not have access to this resource', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  VALIDATION: { code: 'VALIDATION_ERROR', message: 'Request validation failed', status: 422 },
  CONFLICT: { code: 'CONFLICT', message: 'Version conflict - resource was modified', status: 409 },
  RATE_LIMITED: { code: 'RATE_LIMITED', message: 'Too many requests', status: 429 },
  INTERNAL: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', status: 500 },
} as const;
