import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/content/:id/submit-review
export async function POST(
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
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("content_items")
    .select("id, project_id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, existing.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  if (existing.status !== "draft" && existing.status !== "changes-requested") {
    return apiError(ERROR_CODES.VALIDATION.code, "Content must be in draft or changes-requested to submit for review", ERROR_CODES.VALIDATION.status);
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
