import { createAdminClient } from "@/lib/supabase/server";
import { getActiveProject } from "@/lib/active-project";

export default async function ReviewPage() {
  const activeProject = await getActiveProject();

  if (!activeProject) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No project selected</h3>
          <p>Select a project from the sidebar to view its review queue.</p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();

  const { data: reviewQueue } = await adminClient
    .from("content_items")
    .select(`
      id, content_code, title, status, updated_at, version
    `)
    .eq("project_id", activeProject.id)
    .eq("status", "in-review")
    .order("updated_at", { ascending: true });

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">{activeProject.code} quality gate</span>
          <h2>Review queue</h2>
          <p>Content awaiting review and approval for {activeProject.name}.</p>
        </div>
      </div>

      {reviewQueue && reviewQueue.length > 0 ? (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Version</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviewQueue.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.content_code}</strong></td>
                    <td>{item.title}</td>
                    <td>v{item.version}</td>
                    <td>
                      <small>{new Date(item.updated_at).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <a href={`/content/${item.id}`} className="title-link">Open</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Queue is empty</h3>
          <p>No content is waiting for review right now for {activeProject.name}.</p>
        </div>
      )}
    </div>
  );
}
