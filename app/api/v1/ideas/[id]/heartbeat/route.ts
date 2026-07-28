import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

// POST /api/v1/ideas/:id/heartbeat - extend claim lease
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
  const extendMinutes = body.extend_minutes || 30;

  const supabase = createAdminClient();

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, project_id, claimed_by, claim_expires_at")
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

  const newExpiry = new Date(Date.now() + extendMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("ideas")
    .update({ claim_expires_at: newExpiry })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, "Failed to extend claim", ERROR_CODES.INTERNAL.status);
  }

  return apiSuccess({ claim_expires_at: newExpiry });
}
