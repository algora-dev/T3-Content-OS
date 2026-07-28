import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";

export default async function OverviewPage() {
  const userProjects = await getUserProjects();

  // If no projects, show empty state
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

  const supabase = await createClient();
  const projectIds = userProjects.map((p) => p.project.id as string);

  // Fetch counts for each project
  const [
    { count: totalContent },
    { count: readyIdeas },
    { count: inReview },
    { count: approvedContent },
    { count: liveContent },
  ] = await Promise.all([
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", projectIds),
    supabase.from("ideas").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "ready"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "in-review"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "approved"),
    supabase.from("content_items").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "live"),
  ]);

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from("activity_log")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    ["Total content", String(totalContent ?? 0), "Across all projects"],
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
          <strong>{userProjects.length}</strong>
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
                {(readyIdeas ?? 0) === 0 && (inReview ?? 0) === 0 && (approvedContent ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <small>No items need attention right now.</small>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Items will be populated by real queries */}
                    <tr>
                      <td colSpan={3}>
                        <small>Loading content queue...</small>
                      </td>
                    </tr>
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
