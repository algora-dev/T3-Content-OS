import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getActiveProject } from "@/lib/active-project";
import { getUserProjects } from "@/lib/auth/permissions";

export default async function OverviewPage() {
  const activeProject = await getActiveProject();

  if (!activeProject) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h3>No project selected</h3>
          <p>Select a project from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();
  const projectId = activeProject.id;

  const [
    { count: totalContent },
    { count: readyIdeas },
    { count: inReview },
    { count: approvedContent },
    { count: liveContent },
  ] = await Promise.all([
    adminClient.from("content_items").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    adminClient.from("ideas").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "ready"),
    adminClient.from("content_items").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "in-review"),
    adminClient.from("content_items").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "approved"),
    adminClient.from("content_items").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("status", "live"),
  ]);

  const { data: recentActivity } = await adminClient
    .from("activity_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: priorityItems } = await adminClient
    .from("content_items")
    .select("id, content_code, title, status")
    .eq("project_id", projectId)
    .in("status", ["in-review", "approved"])
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: readyIdeasList } = await adminClient
    .from("ideas")
    .select("id, idea_code, title, status")
    .eq("project_id", projectId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    ["Total content", String(totalContent ?? 0), activeProject.name],
    ["Ready ideas", String(readyIdeas ?? 0), "Available to claim"],
    ["Needs review", String(inReview ?? 0), "Awaiting review"],
    ["Live articles", String(liveContent ?? 0), "Published and verified"],
  ];

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="eyebrow">{activeProject.code} workspace</span>
          <h2>Build useful content that compounds.</h2>
          <p>
            Plan, draft, connect, review and publish for {activeProject.name}.
          </p>
        </div>
        <div className="hero-score">
          <span>Active project</span>
          <strong>{activeProject.code}</strong>
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
