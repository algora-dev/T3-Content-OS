import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getActiveProject } from "@/lib/active-project";

export default async function IdeasPage() {
  const activeProject = await getActiveProject();

  if (!activeProject) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No project selected</h3>
          <p>Select a project from the sidebar to view its ideas.</p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();

  const { data: ideas } = await adminClient
    .from("ideas")
    .select("*")
    .eq("project_id", activeProject.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">{activeProject.code} editorial</span>
          <h2>Ideas</h2>
          <p>Capture, prioritise and assign content ideas for {activeProject.name}.</p>
        </div>
        <Link className="primary button-link" href="/ideas/new">
          + New idea
        </Link>
      </div>

      {ideas && ideas.length > 0 ? (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Claimed by</th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea) => (
                  <tr key={idea.id}>
                    <td>
                      <Link href={`/ideas/${idea.id}`} className="title-link">
                        <strong>{idea.idea_code}</strong>
                      </Link>
                    </td>
                    <td>{idea.title}</td>
                    <td>
                      <span className={`badge status-${idea.priority}`}>
                        {idea.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge status-${idea.status}`}>
                        {idea.status}
                      </span>
                    </td>
                    <td>{idea.claimed_by || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No ideas yet</h3>
          <p>No ideas have been created for {activeProject.name} yet.</p>
        </div>
      )}
    </div>
  );
}
