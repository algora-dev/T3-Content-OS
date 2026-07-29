import { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionUser, getProjectRole } from "@/lib/auth/permissions";
import { canPerformAction, canTransitionContent } from "@/lib/workflow";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const note = body.note;

  if (!note || !note.trim()) {
    return Response.json({ error: "A note is required when requesting changes" }, { status: 422 });
  }

  const supabase = await createClient();

  let { data: content } = await supabase
    .from("content_items")
    .select("project_id, status, content_code")
    .eq("id", id)
    .single();

  // Fallback: use admin client if RLS blocks
  if (!content) {
    const adminClient = createAdminClient();
    const adminResult = await adminClient
      .from("content_items")
      .select("project_id, status, content_code")
      .eq("id", id)
      .single();
    content = adminResult.data;
  }

  if (!content) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  const role = await getProjectRole(content.project_id);
  if (!role || !canPerformAction(role, "content:request-changes")) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!canTransitionContent(content.status, "changes-requested")) {
    return Response.json({ error: `Cannot request changes from ${content.status}` }, { status: 422 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("content_items")
    .update({ status: "changes-requested" })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await adminClient.from("activity_log").insert({
    project_id: content.project_id,
    activity_type: "content-changes-requested",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "content",
    target_id: id,
    target_code: content.content_code,
    detail: { note },
  });

  return Response.json({ success: true });
}
