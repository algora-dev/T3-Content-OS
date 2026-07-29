import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getActiveProject } from "@/lib/active-project";

export default async function ContentPage() {
  const activeProject = await getActiveProject();

  if (!activeProject) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No project selected</h3>
          <p>Select a project from the sidebar to view its content.</p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();

  const { data: content } = await adminClient
    .from("content_items")
    .select(`
      id, content_code, title, status, sync_status, cluster, target_query, version
    `)
    .eq("project_id", activeProject.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">{activeProject.code} library</span>
          <h2>Content</h2>
          <p>All content items for {activeProject.name}.</p>
        </div>
      </div>

      {content && content.length > 0 ? (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
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
                      <Link href={`/content/${item.id}`} className="title-link">
                        {item.title}
                      </Link>
                      {item.target_query && (
                        <small>Target: {item.target_query}</small>
                      )}
                    </td>
                    <td>
                      <span className={`status status-${item.status}`}>
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
          <p>
            Content items for {activeProject.name} will appear here once ideas are drafted or existing content is imported.
          </p>
        </div>
      )}
    </div>
  );
}
