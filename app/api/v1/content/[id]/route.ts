import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/v1/content/:id - get a single content item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "content:read")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'content:read' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, data.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  return apiSuccess(data);
}

// PATCH /api/v1/content/:id - update a draft (with optimistic locking)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "content:update-draft")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'content:update-draft' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.version) {
    return apiError(ERROR_CODES.VALIDATION.code, "version is required for optimistic locking", ERROR_CODES.VALIDATION.status);
  }

  const supabase = createAdminClient();

  // Check current version
  const { data: existing, error: fetchError } = await supabase
    .from("content_items")
    .select("id, version, project_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, existing.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  if (existing.status !== "draft" && existing.status !== "changes-requested") {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Content can only be updated when in draft or changes-requested status", ERROR_CODES.FORBIDDEN.status);
  }

  if (existing.version !== body.version) {
    return apiError(ERROR_CODES.CONFLICT.code, `Version conflict: expected ${body.version} but current is ${existing.version}`, ERROR_CODES.CONFLICT.status);
  }

  // Create revision snapshot before update
  const { data: fullItem } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (fullItem) {
    await supabase.from("content_revisions").insert({
      content_item_id: id,
      version: fullItem.version,
      title: fullItem.title,
      body_markdown: fullItem.body_markdown,
      summary: fullItem.summary,
      meta_title: fullItem.meta_title,
      meta_description: fullItem.meta_description,
      actor_name: token.agent_name,
      actor_type: "agent",
      reason: "Pre-update snapshot",
    });
  }

  // Build update object (only allow certain fields)
  const updateFields = [
    "title", "summary", "body_markdown", "cluster", "content_type",
    "target_query", "search_intent", "audience", "slug", "destination_path",
    "author_name", "excerpt", "meta_title", "meta_description",
  ];

  const updates: Record<string, unknown> = {
    version: body.version + 1,
    updated_by: null, // agent, no user_id
  };

  for (const field of updateFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .eq("version", body.version) // double-check in the query
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.CONFLICT.code, "Version conflict during update", ERROR_CODES.CONFLICT.status);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    project_id: existing.project_id,
    activity_type: "content-updated",
    actor_name: token.agent_name,
    actor_type: "agent",
    target_type: "content",
    target_id: id,
    target_code: data.content_code,
  });

  return apiSuccess(data);
}

// POST /api/v1/content/:id/submit-review - submit draft for review
export async function POST_SUBMIT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "content:update-draft")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'content:update-draft' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("content_items")
    .select("id, version, project_id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, existing.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  if (existing.status !== "draft" && existing.status !== "changes-requested") {
    return apiError(ERROR_CODES.VALIDATION.code, "Content must be in draft or changes-requested status to submit for review", ERROR_CODES.VALIDATION.status);
  }

  const { data, error } = await supabase
    .from("content_items")
    .update({ status: "in-review" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, "Failed to submit for review", ERROR_CODES.INTERNAL.status);
  }

  await supabase.from("activity_log").insert({
    project_id: existing.project_id,
    activity_type: "content-submitted",
    actor_name: token.agent_name,
    actor_type: "agent",
    target_type: "content",
    target_id: id,
    target_code: data.content_code,
  });

  return apiSuccess(data);
}
