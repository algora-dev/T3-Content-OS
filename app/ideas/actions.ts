"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, getUserProjects, getProjectRole } from "@/lib/auth/permissions";
import { canPerformAction } from "@/lib/workflow";
import type { IdeaPriority, SearchIntent } from "@/lib/types";

// ── Create Idea ───────────────────────────────────────────────────────

export async function createIdea(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const projectId = String(formData.get("project_id") || "");
  const title = String(formData.get("title") || "");
  const brief = String(formData.get("brief") || "");
  const priority = String(formData.get("priority") || "medium") as IdeaPriority;
  const targetQuery = String(formData.get("target_query") || "");
  const searchIntent = String(formData.get("search_intent") || "") as SearchIntent;
  const audience = String(formData.get("audience") || "");

  if (!projectId || !title) throw new Error("Project and title are required");

  const role = await getProjectRole(projectId);
  if (!role || !canPerformAction(role, "idea:create")) throw new Error("FORBIDDEN");

  const supabase = await createClient();

  // Generate idea code
  const { data: project } = await supabase
    .from("projects")
    .select("code")
    .eq("id", projectId)
    .single();

  const { count } = await supabase
    .from("ideas")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const ideaCode = `IDEA-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      idea_code: ideaCode,
      project_id: projectId,
      title,
      brief: brief || null,
      priority,
      target_query: targetQuery || null,
      search_intent: searchIntent || null,
      audience: audience || null,
      status: "new",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: projectId,
    activity_type: "idea-created",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "idea",
    target_id: data.id,
    target_code: data.idea_code,
  });

  revalidatePath("/ideas");
  revalidatePath("/");
}

// ── Update Idea ───────────────────────────────────────────────────────

export async function updateIdea(ideaId: string, formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: idea } = await supabase
    .from("ideas")
    .select("project_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("NOT_FOUND");

  const role = await getProjectRole(idea.project_id);
  if (!role || !canPerformAction(role, "idea:edit")) throw new Error("FORBIDDEN");

  const updates: Record<string, unknown> = {};
  const fields = ["title", "brief", "priority", "target_query", "search_intent", "audience"];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) updates[field] = String(value) || null;
  }

  const { error } = await supabase.from("ideas").update(updates).eq("id", ideaId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: idea.project_id,
    activity_type: "idea-updated",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "idea",
    target_id: ideaId,
  });

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
}

// ── Mark Idea Ready ───────────────────────────────────────────────────

export async function markIdeaReady(ideaId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: idea } = await supabase
    .from("ideas")
    .select("project_id, status")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("NOT_FOUND");

  const role = await getProjectRole(idea.project_id);
  if (!role || !canPerformAction(role, "idea:edit")) throw new Error("FORBIDDEN");

  if (idea.status !== "new" && idea.status !== "draft-created") {
    throw new Error(`Cannot mark idea as ready from ${idea.status}`);
  }

  const { error } = await supabase
    .from("ideas")
    .update({ status: "ready" })
    .eq("id", ideaId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: idea.project_id,
    activity_type: "idea-ready",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "idea",
    target_id: ideaId,
  });

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath("/");
}

// ── Archive Idea ──────────────────────────────────────────────────────

export async function archiveIdea(ideaId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();

  const { data: idea } = await supabase
    .from("ideas")
    .select("project_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("NOT_FOUND");

  const role = await getProjectRole(idea.project_id);
  if (!role || !canPerformAction(role, "idea:archive")) throw new Error("FORBIDDEN");

  const { error } = await supabase
    .from("ideas")
    .update({ status: "archived" })
    .eq("id", ideaId);

  if (error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    project_id: idea.project_id,
    activity_type: "idea-updated",
    actor_id: user.id,
    actor_name: user.name,
    actor_type: "human",
    target_type: "idea",
    target_id: ideaId,
    detail: { action: "archived" },
  });

  revalidatePath("/ideas");
  revalidatePath("/");
}
