import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/v1/content - list content items
export async function GET(request: NextRequest) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "content:read")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'content:read' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project");
  const status = searchParams.get("status");
  const locale = searchParams.get("locale");

  let query = supabase.from("content_items").select("*");

  if (token.project_ids.length > 0) {
    query = query.in("project_id", token.project_ids);
  }

  if (projectId) {
    if (!token.project_ids.includes(projectId)) {
      return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
    }
    query = query.eq("project_id", projectId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (locale) {
    query = query.eq("locale", locale);
  }

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(100);

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, "Failed to fetch content", ERROR_CODES.INTERNAL.status);
  }

  return apiSuccess({ data: data || [], total: data?.length ?? 0 });
}

// POST /api/v1/content - create a new content item (agent draft)
export async function POST(request: NextRequest) {
  const authResult = await validateAgentToken(request.headers.get("authorization"));

  if (!authResult.valid) {
    return apiError(ERROR_CODES.UNAUTHORIZED.code, authResult.error!, ERROR_CODES.UNAUTHORIZED.status);
  }

  const token = authResult.token!;
  if (!hasScope(token, "content:create")) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token lacks 'content:create' scope", ERROR_CODES.FORBIDDEN.status);
  }

  const body = await request.json();
  const idempotencyKey = request.headers.get("x-idempotency-key");

  if (!body.project_id || !body.title) {
    return apiError(ERROR_CODES.VALIDATION.code, "project_id and title are required", ERROR_CODES.VALIDATION.status);
  }

  if (!hasProjectAccess(token, body.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  const supabase = createAdminClient();

  // Check for idempotent duplicate
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("content_items")
      .select("*")
      .eq("source_idea_id", body.source_idea_id || null)
      .eq("title", body.title)
      .eq("project_id", body.project_id)
      .single();

    if (existing) {
      return apiSuccess(existing);
    }
  }

  // Generate content code (will be replaced by DB trigger or sequence)
  const { data: project } = await supabase
    .from("projects")
    .select("code")
    .eq("id", body.project_id)
    .single();

  const projectCode = project?.code || "QC";
  const { count } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", body.project_id);

  const contentCode = `${projectCode}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      content_code: contentCode,
      project_id: body.project_id,
      source_idea_id: body.source_idea_id || null,
      title: body.title,
      summary: body.summary || null,
      body_markdown: body.body_markdown || null,
      status: "draft",
      cluster: body.cluster || null,
      content_type: body.content_type || null,
      target_query: body.target_query || null,
      search_intent: body.search_intent || null,
      audience: body.audience || null,
      slug: body.slug || null,
      destination_path: body.destination_path || null,
      author_name: body.author_name || token.agent_name,
      locale: body.locale || 'en-GB',
    })
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, error.message, ERROR_CODES.INTERNAL.status);
  }

  // Log activity
  await supabase.from("activity_log").insert({
    project_id: body.project_id,
    activity_type: "content-created",
    actor_name: token.agent_name,
    actor_type: "agent",
    target_type: "content",
    target_id: data.id,
    target_code: data.content_code,
  });

  return apiSuccess(data);
}
