import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";
import { getProjectFilter } from "@/lib/project-filter";

export default async function ActivityPage({
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
        </div>
      </div>
    );
  }

  const { projectIds, selectedProjectName } = await getProjectFilter(searchParams);

  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Audit trail</span>
          <h2>Activity log</h2>
          <p>
            {selectedProjectName
              ? `Activity for ${selectedProjectName}`
              : "Every important change, in order."}
          </p>
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
