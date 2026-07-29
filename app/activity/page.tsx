import { createAdminClient } from "@/lib/supabase/server";
import { getActiveProject } from "@/lib/active-project";

export default async function ActivityPage() {
  const activeProject = await getActiveProject();

  if (!activeProject) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No project selected</h3>
          <p>Select a project from the sidebar to view its activity.</p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();

  const { data: activity } = await adminClient
    .from("activity_log")
    .select("*")
    .eq("project_id", activeProject.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">{activeProject.code} audit trail</span>
          <h2>Activity log</h2>
          <p>Every important change for {activeProject.name}, in order.</p>
        </div>
      </div>

      {activity && activity.length > 0 ? (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Type</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((entry) => (
                  <tr key={entry.id}>
                    <td><small>{new Date(entry.created_at).toLocaleString()}</small></td>
                    <td>
                      <strong>{entry.actor_name || "System"}</strong>
                      <small>{entry.actor_type}</small>
                    </td>
                    <td>{entry.activity_type.replace(/-/g, " ")}</td>
                    <td>{entry.target_code || entry.target_id?.slice(0, 8) || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No activity yet</h3>
          <p>Actions will be logged here as the system is used.</p>
        </div>
      )}
    </div>
  );
}
