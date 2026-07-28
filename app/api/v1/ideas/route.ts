import { NextRequest } from "next/server";
import { validateAgentToken, hasScope } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "ideas:read")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'ideas:read' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const projectId = searchParams.get("project");

  let query = supabase.from("ideas").select("*");

  // Filter to token's allowed projects
  if (token.project_ids.length > 0) {
    query = query.in("project_id", token.project_ids);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (projectId) {
    if (!token.project_ids.includes(projectId)) {
      return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
    }
    query = query.eq("project_id", projectId);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).limit(100);

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, "Failed to fetch ideas", ERROR_CODES.INTERNAL.status);
  }

  return apiSuccess({ data: data || [], total: count ?? data?.length ?? 0 });
}
