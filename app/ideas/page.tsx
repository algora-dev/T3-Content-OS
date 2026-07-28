import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";
import { getProjectFilter } from "@/lib/project-filter";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const userProjects = await getUserProjects();

  if (userProjects.length === 0) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No projects assigned</h3>
          <p>An administrator needs to assign you to a project first.</p>
        </div>
      </div>
    );
  }

  const { projectIds, selectedProjectName } = await getProjectFilter(searchParams);

  const supabase = await createClient();

  const { data: ideas } = await supabase
    .from("ideas")
    .select(`
      *,
      project:projects(code, name)
    `)
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Editorial</span>
          <h2>Ideas</h2>
          <p>
            {selectedProjectName
              ? `Ideas for ${selectedProjectName}`
              : "Capture, prioritise and assign content ideas across projects."}
          </p>
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
                  <th>Project</th>
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
                    <td>
                      <span className={`site site-${(idea.project as unknown as { code: string }).code?.toLowerCase()}`}>
                        {(idea.project as unknown as { code: string }).code}
                      </span>
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
          <p>
            {selectedProjectName
              ? `No ideas have been created for ${selectedProjectName} yet.`
              : "Create your first content idea to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
