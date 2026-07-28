import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/v1/content/:id/link-context - get link context for an article
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

  const { data: content } = await supabase
    .from("content_items")
    .select("id, project_id, content_code, title, cluster, target_query, status")
    .eq("id", id)
    .single();

  if (!content) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, content.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  // Get outgoing links from this content
  const { data: outgoingLinks } = await supabase
    .from("content_links")
    .select(`
      *,
      target:content_items!target_content_id(content_code, title, slug, status)
    `)
    .eq("source_content_id", id);

  // Get incoming links to this content
  const { data: incomingLinks } = await supabase
    .from("content_links")
    .select(`
      source_content_id,
      anchor_text,
      state,
      source_content:content_items!source_content_id(content_code, title, slug, status)
    `)
    .eq("target_content_id", id);

  // Find potentially related content (same cluster, same project)
  const { data: relatedContent } = await supabase
    .from("content_items")
    .select("content_code, title, slug, status, cluster, target_query")
    .eq("project_id", content.project_id)
    .neq("id", id)
    .or(`cluster.eq.${content.cluster},target_query.eq.${content.target_query}`)
    .limit(10);

  // Find potential cannibalisation (same target_query)
  const { data: cannibalisation } = content.target_query
    ? await supabase
        .from("content_items")
        .select("content_code, title, status, target_query")
        .eq("project_id", content.project_id)
        .eq("target_query", content.target_query)
        .neq("id", id)
    : { data: [] };

  return apiSuccess({
    content,
    outgoing_links: outgoingLinks || [],
    incoming_links: incomingLinks || [],
    related_content: relatedContent || [],
    cannibalisation_warnings: cannibalisation || [],
  });
}
