import { NextRequest } from "next/server";
import { validateAgentToken } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/v1/projects - list projects accessible to this agent token
export async function GET(request: NextRequest) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;

  const supabase = createAdminClient();

  if (token.project_ids.length === 0) {
    return apiSuccess({ data: [], total: 0 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .in("id", token.project_ids)
    .eq("active", true)
    .order("name");

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, "Failed to fetch projects", ERROR_CODES.INTERNAL.status);
  }

  return apiSuccess({ data: data || [], total: data?.length ?? 0 });
}
