import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionUser, getUserProjects } from "@/lib/auth/permissions";
import { TokenManager } from "./TokenManager";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userProjects = await getUserProjects();
  const isAdmin = userProjects.some((p) => p.role === "admin");
  if (!isAdmin) redirect("/");

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Fetch all agent tokens
  const { data: tokens } = await adminClient
    .from("agent_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all projects for the dropdown
  const { data: projects } = await adminClient
    .from("projects")
    .select("id, code, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>Agent Tokens</h2>
          <p>Create and manage scoped API tokens for automated agents.</p>
        </div>
      </div>

      <TokenManager
        tokens={tokens || []}
        projects={projects || []}
        currentUserId={user.id}
      />
    </div>
  );
}
