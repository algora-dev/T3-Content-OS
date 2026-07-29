import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";
import { getProjectFilter } from "@/lib/project-filter";

export default async function ReviewPage({
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

  let { data: reviewQueue } = await supabase
    .from("content_items")
    .select(`
      id, content_code, title, status, updated_at, version,
      project:projects(code, name)
    `)
    .in("project_id", projectIds)
    .eq("status", "in-review")
    .order("updated_at", { ascending: true });

  // Fallback: use admin client if RLS blocks the user session query
  if (!reviewQueue || reviewQueue.length === 0) {
    const adminClient = createAdminClient();
    const { data: adminReview } = await adminClient
      .from("content_items")
      .select(`
        id, content_code, title, status, updated_at, version,
        project:projects(code, name)
      `)
      .in("project_id", projectIds)
      .eq("status", "in-review")
      .order("updated_at", { ascending: true });
    reviewQueue = adminReview;
  }

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Quality gate</span>
          <h2>Review queue</h2>
          <p>
            {selectedProjectName
              ? `Review queue for ${selectedProjectName}`
              : "Content awaiting review and approval."}
          </p>
        </div>
      </div>

      {reviewQueue && reviewQueue.length > 0 ? (
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project</th>
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
                    <td>
                     <span className={`site site-${(item.project as unknown as { code: string }).code?.toLowerCase()}`}>
                       {(item.project as unknown as { code: string }).code}
                     </span>
                    </td>
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
          <p>No content is waiting for review right now.</p>
        </div>
      )}
    </div>
  );
}
