import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";

export default async function ContentPage() {
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

  const supabase = await createClient();
  const projectIds = userProjects.map((p) => p.project.id as string);

  const { data: content } = await supabase
    .from("content_items")
    .select(`
      id, content_code, title, status, sync_status, cluster, target_query, version,
      project:projects(code, name)
    `)
    .in("project_id", projectIds)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Library</span>
          <h2>Content</h2>
          <p>All content items across your projects.</p>
        </div>
      </div>

      {content && content.length > 0 ? (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Sync</th>
                  <th>Version</th>
                </tr>
              </thead>
              <tbody>
                {content.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/content/${item.id}`} className="title-link">
                        {item.content_code}
                      </Link>
                    </td>
                    <td>
                     <span className={`site site-${(item.project as unknown as { code: string }).code?.toLowerCase()}`}>
                       {(item.project as unknown as { code: string }).code}
                     </span>
                    </td>
                    <td>
                      <Link href={`/content/${item.id}`} className="title-link">
                        {item.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge">{item.sync_status}</span>
                    </td>
                    <td>v{item.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No content yet</h3>
          <p>Content items will appear here once ideas are drafted.</p>
        </div>
      )}
    </div>
  );
}
