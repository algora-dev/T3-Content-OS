"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, getProjectRole } from "@/lib/auth/permissions";
import { canPerformAction, canTransitionContent } from "@/lib/workflow";
import type { ContentStatus } from "@/lib/types";

// ── Create Content from Idea ──────────────────────────────────────────

export async function createContentFromIdea(ideaId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: idea } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found");

  const role = await getProjectRole(idea.project_id);
  if (!role || !canPerformAction(role, "content:create")) throw new Error("FORBIDDEN");

  // Generate content code
  const { data: project } = await supabase
    .from("projects")
    .select("code")
    .eq("id", idea.project_id)
    .single();

  const { count } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", idea.project_id);

  const projectCode = project?.code || "QC";
  const contentCode = `${projectCode}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  // Create slug from title
  const slug = idea.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const { data: content, error } = await supabase
    .from("content_items")
    .insert({
      content_code: contentCode,
      project_id: idea.project_id,
      source_idea_id: ideaId,
      title: idea.title,
      summary: idea.brief,
      status: "draft",
      cluster: null,
      content_type: "guide",
      target_query: idea.target_query,
      search_intent: idea.search_intent,
      audience: idea.audience,
      slug,
      author_name: user.name,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update idea status
  await supabase
    .from("ideas")
    .update({ status: "draft-created" })
    .eq("id", ideaId);

  // Create initial revision
  await supabase.from("content_revisions").insert({
    content_item_id: content.id,
    version: 1,
    title: content.title,
    body_markdown: content.body_markdown,
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    reason: "Initial draft creation",
  });

  // Log activity
  await supabase.from("activity_log").insert({
    project_id: idea.project_id,
    activity_type: "content-created",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "content",
    target_id: content.id,
    target_code: content.content_code,
    detail: { source_idea: idea.idea_code },
  });

  revalidatePath("/ideas");
  revalidatePath("/content");
  revalidatePath(`/ideas/${ideaId}`);

  return content.id;
}

// ── Update Content (autosave) ─────────────────────────────────────────

export async function updateContent(contentId: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("id, project_id, version, status")
    .eq("id", contentId)
    .single();

  if (!content) throw new Error("NOT_FOUND");

  const role = await getProjectRole(content.project_id);
  if (!role || !canPerformAction(role, "content:edit")) throw new Error("FORBIDDEN");

  if (content.status !== "draft" && content.status !== "changes-requested") {
    throw new Error("Content can only be edited in draft or changes-requested status");
  }

  const version = Number(formData.get("version"));
  if (version !== content.version) {
    throw new Error("VERSION_CONFLICT");
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
    .eq("id", contentId)
    .eq("version", version)
    .select()
    .single();

  if (error || !updated) {
    throw new Error("VERSION_CONFLICT");
  }

  // Create revision snapshot
  await supabase.from("content_revisions").insert({
    content_item_id: contentId,
    version: updated.version,
    title: updated.title,
    body_markdown: updated.body_markdown,
    summary: updated.summary,
    meta_title: updated.meta_title,
    meta_description: updated.meta_description,
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    reason: "Autosave",
  });

  revalidatePath(`/content/${contentId}`);
  revalidatePath("/content");

  return { version: updated.version };
}

// ── Submit for Review ─────────────────────────────────────────────────

export async function submitForReview(contentId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("project_id, status, content_code")
    .eq("id", contentId)
    .single();

  if (!content) throw new Error("NOT_FOUND");

  const role = await getProjectRole(content.project_id);
  if (!role || !canPerformAction(role, "content:submit-review")) throw new Error("FORBIDDEN");

  if (!canTransitionContent(content.status as ContentStatus, "in-review")) {
    throw new Error(`Cannot submit for review from ${content.status}`);
  }

  const { error } = await supabase
    .from("content_items")
    .update({ status: "in-review" })
    .eq("id", contentId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: content.project_id,
    activity_type: "content-submitted",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "content",
    target_id: contentId,
    target_code: content.content_code,
  });

  revalidatePath(`/content/${contentId}`);
  revalidatePath("/review");
  revalidatePath("/content");
}

// ── Approve Content ───────────────────────────────────────────────────

export async function approveContent(contentId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("project_id, status, content_code")
    .eq("id", contentId)
    .single();

  if (!content) throw new Error("NOT_FOUND");

  const role = await getProjectRole(content.project_id);
  if (!role || !canPerformAction(role, "content:approve")) throw new Error("FORBIDDEN");

  if (!canTransitionContent(content.status as ContentStatus, "approved")) {
    throw new Error(`Cannot approve from ${content.status}`);
  }

  const { error } = await supabase
    .from("content_items")
    .update({ status: "approved" })
    .eq("id", contentId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: content.project_id,
    activity_type: "content-approved",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "content",
    target_id: contentId,
    target_code: content.content_code,
  });

  revalidatePath(`/content/${contentId}`);
  revalidatePath("/review");
  revalidatePath("/content");
  revalidatePath("/");
}

// ── Request Changes ───────────────────────────────────────────────────

export async function requestChanges(contentId: string, note: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  if (!note.trim()) throw new Error("A note is required when requesting changes");

  const supabase = await createClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("project_id, status, content_code")
    .eq("id", contentId)
    .single();

  if (!content) throw new Error("NOT_FOUND");

  const role = await getProjectRole(content.project_id);
  if (!role || !canPerformAction(role, "content:request-changes")) throw new Error("FORBIDDEN");

  if (!canTransitionContent(content.status as ContentStatus, "changes-requested")) {
    throw new Error(`Cannot request changes from ${content.status}`);
  }

  const { error } = await supabase
    .from("content_items")
    .update({ status: "changes-requested" })
    .eq("id", contentId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: content.project_id,
    activity_type: "content-changes-requested",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "content",
    target_id: contentId,
    target_code: content.content_code,
    detail: { note },
  });

  revalidatePath(`/content/${contentId}`);
  revalidatePath("/review");
  revalidatePath("/content");
}
