import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectRole } from "@/lib/auth/permissions";
import { canPerformAction } from "@/lib/workflow";
import { ContentEditor } from "@/components/ContentEditor";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (!content) return notFound();

  const role = await getProjectRole(content.project_id);
  if (!role) return notFound();

  const { data: revisions } = await supabase
    .from("content_revisions")
    .select("id, version, title, created_at, actor_name, reason")
    .eq("content_item_id", id)
    .order("version", { ascending: false })
    .limit(50);

  const canEdit = canPerformAction(role, "content:edit");
  const canReview = canPerformAction(role, "content:approve");

  return (
    <ContentEditor
      content={content}
      revisions={revisions || []}
      canEdit={canEdit}
      canReview={canReview}
    />
  );
}
