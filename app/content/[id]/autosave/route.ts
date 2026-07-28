import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, getProjectRole } from "@/lib/auth/permissions";
import { canPerformAction } from "@/lib/workflow";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("id, project_id, version, status")
    .eq("id", id)
    .single();

  if (!content) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  const role = await getProjectRole(content.project_id);
  if (!role || !canPerformAction(role, "content:edit")) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (content.status !== "draft" && content.status !== "changes-requested") {
    return Response.json({ error: "Content cannot be edited in current status" }, { status: 422 });
  }

  const formData = await request.formData();
  const version = Number(formData.get("version"));

  if (version !== content.version) {
    return Response.json({ error: "VERSION_CONFLICT" }, { status: 409 });
  }

  const updates: Record<string, unknown> = {
    version: version + 1,
    updated_by: user.id,
  };

  const fields = [
    "title", "summary", "body_markdown", "cluster", "content_type",
    "target_query", "search_intent", "audience", "slug", "destination_path",
    "author_name", "excerpt", "meta_title", "meta_description",
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      updates[field] = String(value) || null;
    }
  }

  const { data: updated, error } = await supabase
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .eq("version", version)
    .select()
    .single();

  if (error || !updated) {
    return Response.json({ error: "VERSION_CONFLICT" }, { status: 409 });
  }

  // Create revision snapshot
  await supabase.from("content_revisions").insert({
    content_item_id: id,
    version: updated.version,
    title: updated.title,
    body_markdown: updated.body_markdown,
    summary: updated.summary,
    meta_title: updated.meta_title,
    meta_description: updated.meta_description,
    actor_id: user.id,
    actor_name: user.name,
    reason: "Autosave",
  });

  return Response.json({ version: updated.version });
}
