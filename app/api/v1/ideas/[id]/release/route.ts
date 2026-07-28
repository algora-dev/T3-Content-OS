import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/v1/ideas/:id/release - release a claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "ideas:claim")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'ideas:claim' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, project_id, claimed_by, status, idea_code")
    .eq("id", id)
    .single();

  if (!idea) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Idea not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, idea.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  if (idea.claimed_by !== token.agent_name) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Idea is claimed by a different agent", ERROR_CODES.FORBIDDEN.status);
  }

  const { data, error } = await supabase
    .from("ideas")
    .update({
      status: "ready",
      claimed_by: null,
      claimed_at: null,
      claim_expires_at: null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, "Failed to release claim", ERROR_CODES.INTERNAL.status);
  }

  await supabase.from("activity_log").insert({
    project_id: idea.project_id,
    activity_type: "idea-released",
    actor_name: token.agent_name,
    actor_type: "agent",
    target_type: "idea",
    target_id: id,
    target_code: idea.idea_code,
  });

  return apiSuccess(data);
}
