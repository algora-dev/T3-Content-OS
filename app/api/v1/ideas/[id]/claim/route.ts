import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/ideas/:id/claim - Atomically claim an idea
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
  const body = await request.json().catch(() => ({}));
  const agentName = body.agent_name || token.agent_name;
  const leaseMinutes = body.lease_minutes || 30;

  // Check project access
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("project_id")
    .eq("id", id)
    .single();

  if (!idea) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Idea not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, idea.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  // Atomic claim via RPC
  const { data, error } = await supabase.rpc("claim_idea", {
    p_idea_id: id,
    p_agent_name: agentName,
    p_lease_minutes: leaseMinutes,
  });

  if (error) {
    return apiError(ERROR_CODES.CONFLICT.code, error.message, ERROR_CODES.CONFLICT.status);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    project_id: idea.project_id,
    activity_type: "idea-claimed",
    actor_name: agentName,
    actor_type: "agent",
    target_type: "idea",
    target_id: id,
    target_code: data?.idea_code,
  });

  return apiSuccess(data);
}
