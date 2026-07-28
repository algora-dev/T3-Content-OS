import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";
import { getProjectFilter } from "@/lib/project-filter";

export default async function OverviewPage() {
  const userProjects = await getUserProjects();

  if (userProjects.length === 0) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No projects assigned</h3>
          <p>
            You are authenticated but not assigned to any projects yet. An
            administrator needs to add you to a project before you can use
            Content OS.
          </p>
        </div>
      </div>
    );
  }

  const { projectFilter, projectIds, selectedProjectName } = await getProjectFilter();

  const supabase = await createClient();

  // Build query with optional project filter
  const contentQuery = supabase.from("content_items").select("id, content_code, title, status, cluster, project:projects(code, name)", { count: "exact", head: true });
  if (projectFilter) {
    contentQuery.in("project_id", projectIds);
  } else {
    contentQuery.in("project_id", userProjects.map((p) => p.project.id as string));
  }

  const allProjectIds = projectFilter ? projectIds : userProjects.map((p) => p.project.id as string);

  const [
    { count: totalContent },
    { count: readyIdeas },
    { count: inReview },
    { count: approvedContent },
    { count: liveContent },
  ] = await Promise.all([
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", allProjectIds),
    supabase.from("ideas").select("id", { count: "exact", head: true }).in("project_id", allProjectIds).eq("status", "ready"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", allProjectIds).eq("status", "in-review"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", allProjectIds).eq("status", "approved"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", allProjectIds).eq("status", "live"),
  ]);

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from("activity_log")
    .select("*")
    .in("project_id", allProjectIds)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch priority items (ready ideas + in-review + approved content)
  const { data: priorityItems } = await supabase
    .from("content_items")
    .select("id, content_code, title, status, project:projects(code)")
    .in("project_id", allProjectIds)
    .in("status", ["in-review", "approved"])
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: readyIdeasList } = await supabase
    .from("ideas")
    .select("id, idea_code, title, status, project:projects(code)")
    .in("project_id", allProjectIds)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    ["Total content", String(totalContent ?? 0), selectedProjectName || "Across all projects"],
    ["Ready ideas", String(readyIdeas ?? 0), "Available to claim"],
    ["Needs review", String(inReview ?? 0), "Awaiting review"],
    ["Live articles", String(liveContent ?? 0), "Published and verified"],
  ];

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Private workspace</span>
          <h2>Build useful content that compounds.</h2>
          <p>
            Plan, draft, connect, review and publish across every T3 Labs
            website from one controlled workspace.
          </p>
        </div>
        <div className="hero-score">
          <span>Active projects</span>
          <strong>{projectFilter ? "1" : String(userProjects.length)}</strong>
          <small>{approvedContent ?? 0} awaiting export</small>
        </div>
      </section>

      <section className="stat-grid">
        {stats.map(([label, value, sub]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
          </article>
        ))}
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h3>Ready for attention</h3>
            </div>
            <Link className="ghost button-link" href="/content">
              View all
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!priorityItems || priorityItems.length === 0) && (!readyIdeasList || readyIdeasList.length === 0) ? (
                  <tr>
                    <td colSpan={3}>
                      <small>No items need attention right now.</small>
                    </td>
                  </tr>
                ) : (
                  <>
                    {readyIdeasList?.map((idea) => (
                      <tr key={idea.id}>
                        <td>{idea.idea_code}</td>
                        <td>
                          <Link href={`/ideas/${idea.id}`} className="title-link">
                            {idea.title}
                          </Link>
                        </td>
                        <td>
                          <span className="status status-ready">Ready</span>
                        </td>
                      </tr>
                    ))}
                    {priorityItems?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.content_code}</td>
                        <td>
                          <Link href={`/content/${item.id}`} className="title-link">
                            {item.title}
                          </Link>
                        </td>
                        <td>
                          <span className={`status status-${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Activity feed</span>
              <h3>Recent events</h3>
            </div>
          </div>
          <div className="feed">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((entry) => (
                <div key={entry.id}>
                  <span className="feed-icon">
                    {entry.activity_type.charAt(0).toUpperCase()}
                  </span>
                  <p>
                    <strong>{entry.actor_name || "System"}</strong>
                    <br />
                    {entry.activity_type.replace(/-/g, " ")}
                    {entry.target_code ? ` - ${entry.target_code}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <div>
                <p>No recent activity.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
