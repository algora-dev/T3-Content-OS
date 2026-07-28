import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/content/:id/link-suggestions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "links:suggest")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'links:suggest' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.anchor_text || !body.reason) {
    return apiError(ERROR_CODES.VALIDATION.code, "anchor_text and reason are required", ERROR_CODES.VALIDATION.status);
  }

  if (!body.target_content_id && !body.target_url) {
    return apiError(ERROR_CODES.VALIDATION.code, "Either target_content_id or target_url is required", ERROR_CODES.VALIDATION.status);
  }

  const supabase = await createClient();

  // Verify source content exists and agent has access
  const { data: source } = await supabase
    .from("content_items")
    .select("id, project_id, content_code")
    .eq("id", id)
    .single();

  if (!source) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Source content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, source.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  // If target_content_id provided, verify it exists
  let targetProjectId: string | null = null;
  if (body.target_content_id) {
    const { data: target } = await supabase
      .from("content_items")
      .select("id, project_id")
      .eq("id", body.target_content_id)
      .single();

    if (!target) {
      return apiError(ERROR_CODES.VALIDATION.code, "Target content not found", ERROR_CODES.VALIDATION.status);
    }

    targetProjectId = target.project_id;
    body.link_scope = target.project_id === source.project_id ? "same-project" : "cross-project";
  }

  const { data, error } = await supabase
    .from("content_links")
    .insert({
      source_content_id: id,
      target_content_id: body.target_content_id || null,
      target_url: body.target_url || null,
      anchor_text: body.anchor_text,
      link_scope: body.link_scope || "external",
      state: "suggested",
      source: "agent",
      reason: body.reason,
    })
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, error.message, ERROR_CODES.INTERNAL.status);
  }

  await supabase.from("activity_log").insert({
    project_id: source.project_id,
    activity_type: "link-suggested",
    actor_name: token.agent_name,
    actor_type: "agent",
    target_type: "content",
    target_id: id,
    target_code: source.content_code,
    detail: { link_id: data.id, anchor_text: body.anchor_text },
  });

  return apiSuccess(data);
}
