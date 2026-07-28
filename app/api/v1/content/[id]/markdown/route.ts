import { NextRequest } from "next/server";
import { validateAgentToken, hasScope, hasProjectAccess } from "@/lib/auth/agent-tokens";
import { apiSuccess, apiError, ERROR_CODES } from "@/lib/api/contract";
import { createClient } from "@/lib/supabase/server";
import { serializeMarkdown, parseMarkdownLinks } from "@/lib/schema/markdown";

// GET /api/v1/content/:id/markdown - export content as validated Markdown
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
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select(`
      *,
      project:projects(code, slug)
    `)
    .eq("id", id)
    .single();

  if (!content) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, content.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  const markdown = serializeMarkdown(
    {
      schema_version: 1,
      content_code: content.content_code,
      project: content.project?.slug || "unknown",
      title: content.title,
      status: content.status,
      content_type: content.content_type || "guide",
      cluster: content.cluster || undefined,
      target_query: content.target_query || undefined,
      search_intent: content.search_intent || undefined,
      audience: content.audience || undefined,
      slug: content.slug || "",
      destination_path: content.destination_path || undefined,
      canonical_url: content.canonical_url || undefined,
      locale: content.locale,
      author_name: content.author_name || undefined,
      excerpt: content.excerpt || undefined,
      meta_title: content.meta_title || undefined,
      meta_description: content.meta_description || undefined,
    },
    content.body_markdown || ""
  );

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${content.slug || content.content_code}.md"`,
    },
  });
}

// POST /api/v1/content/:id/markdown - import Markdown body
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
  const raw = await request.text();

  const { validateMarkdown } = await import("@/lib/schema/markdown");
  const result = validateMarkdown(raw);

  if (!result.valid) {
    return apiError(ERROR_CODES.VALIDATION.code, "Markdown validation failed", ERROR_CODES.VALIDATION.status, result.errors);
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("content_items")
    .select("id, version, project_id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return apiError(ERROR_CODES.NOT_FOUND.code, "Content not found", ERROR_CODES.NOT_FOUND.status);
  }

  if (!hasProjectAccess(token, existing.project_id)) {
    return apiError(ERROR_CODES.FORBIDDEN.code, "Token does not have access to this project", ERROR_CODES.FORBIDDEN.status);
  }

  if (existing.status !== "draft" && existing.status !== "changes-requested") {
    return apiError(ERROR_CODES.VALIDATION.code, "Content must be in draft or changes-requested to import", ERROR_CODES.VALIDATION.status);
  }

  // Parse links from the Markdown and reconcile
  const links = parseMarkdownLinks(result.body || "");

  // Create revision snapshot
  const { data: fullItem } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (fullItem) {
    await supabase.from("content_revisions").insert({
      content_item_id: id,
      version: fullItem.version,
      title: fullItem.title,
      body_markdown: fullItem.body_markdown,
      summary: fullItem.summary,
      meta_title: fullItem.meta_title,
      meta_description: fullItem.meta_description,
      actor_name: token.agent_name,
      reason: "Pre-import snapshot",
    });
  }

  // Update content
  const fm = result.frontMatter!;
  const { data, error } = await supabase
    .from("content_items")
    .update({
      title: fm.title,
      body_markdown: result.body,
      summary: fm.excerpt || fullItem?.summary,
      meta_title: fm.meta_title || null,
      meta_description: fm.meta_description || null,
      cluster: fm.cluster || fullItem?.cluster,
      target_query: fm.target_query || fullItem?.target_query,
      slug: fm.slug || fullItem?.slug,
      version: (existing.version ?? 1) + 1,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return apiError(ERROR_CODES.INTERNAL.code, error.message, ERROR_CODES.INTERNAL.status);
  }

  // Reconcile links (mark present links, add new ones)
  if (links.length > 0) {
    // Remove old 'present' links
    await supabase
      .from("content_links")
      .delete()
      .eq("source_content_id", id)
      .eq("state", "present")
      .eq("source", "markdown-parser");

    // Add parsed links as 'present'
    const linkInserts = links.map((link) => ({
      source_content_id: id,
      target_url: link.url,
      anchor_text: link.anchorText,
      link_scope: link.url.startsWith("http") ? "external" : "same-project",
      state: "present",
      source: "markdown-parser" as const,
      last_checked_at: new Date().toISOString(),
    }));

    await supabase.from("content_links").insert(linkInserts);
  }

  return apiSuccess({
    content: data,
    warnings: result.warnings,
    links_parsed: links.length,
  });
}
