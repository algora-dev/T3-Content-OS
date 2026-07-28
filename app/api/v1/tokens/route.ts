import { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionUser, getUserProjects } from "@/lib/auth/permissions";
import { hashToken } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { randomBytes } from "crypto";

// POST /api/v1/tokens - create a new agent token (admin only)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, "Authentication required", ERROR_CODES.UNAUTHORIZED.status);
  }

  const userProjects = await getUserProjects();
  const isAdmin = userProjects.some((p) => p.role === "admin");
  if (!isAdmin) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Admin access required", ERROR_CODES.FORBIDDEN.status);
  }

  const body = await request.json();

  if (!body.agent_name || typeof body.agent_name !== "string") {
    return apiError(ERROR_CODES.VALIDATION.code, "agent_name is required", ERROR_CODES.VALIDATION.status);
  }

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    return apiError(ERROR_CODES.VALIDATION.code, "scopes array is required", ERROR_CODES.VALIDATION.status);
  }

  if (!Array.isArray(body.project_ids) || body.project_ids.length === 0) {
    return apiError(ERROR_CODES.VALIDATION.code, "project_ids array is required", ERROR_CODES.VALIDATION.status);
  }

  // Generate a secure random token
  const rawToken = `tcos_${randomBytes(32).toString("hex")}`;
  const tokenHash = await hashToken(rawToken);

  const expiresAt = body.expires_days
    ? new Date(Date.now() + body.expires_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("agent_tokens")
    .insert({
      token_hash: tokenHash,
      agent_name: body.agent_name,
      scopes: body.scopes,
      project_ids: body.project_ids,
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select("id, agent_name, scopes, project_ids, created_at, expires_at")
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, error.message, ERROR_CODES.INTERNAL.status);
  }

  // Log activity
  const supabase = createAdminClient();
  const firstProjectId = body.project_ids[0];
  await supabase.from("activity_log").insert({
    project_id: firstProjectId,
    activity_type: "token-created",
    actor_name: user.name,
    actor_type: "human",
    target_type: "agent_token",
    target_id: data.id,
    detail: { agent_name: body.agent_name, scopes: body.scopes },
  });

  // Return the raw token ONCE - never stored again
  return apiSuccess({ ...data, token: rawToken });
}

// DELETE /api/v1/tokens - revoke a token (admin only)
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, "Authentication required", ERROR_CODES.UNAUTHORIZED.status);
  }

  const userProjects = await getUserProjects();
  const isAdmin = userProjects.some((p) => p.role === "admin");
  if (!isAdmin) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Admin access required", ERROR_CODES.FORBIDDEN.status);
  }

  const body = await request.json();

  if (!body.id) {
    return apiError(ERROR_CODES.VALIDATION.code, "token id is required", ERROR_CODES.VALIDATION.status);
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("agent_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.id)
    .is("revoked_at", null);

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, error.message, ERROR_CODES.INTERNAL.status);
  }

  return apiSuccess({ revoked: true });
}

// GET /api/v1/tokens - list all tokens (admin only)
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, "Authentication required", ERROR_CODES.UNAUTHORIZED.status);
  }

  const userProjects = await getUserProjects();
  const isAdmin = userProjects.some((p) => p.role === "admin");
  if (!isAdmin) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Admin access required", ERROR_CODES.FORBIDDEN.status);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("agent_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, error.message, ERROR_CODES.INTERNAL.status);
  }

  return apiSuccess({ data: data || [], total: data?.length ?? 0 });
}
