import { createClient } from "@/lib/supabase/server";
import { getUserProjects } from "@/lib/auth/permissions";

export default async function LinksPage() {
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

  const supabase = await createClient();
  const projectIds = userProjects.map((p) => p.project.id as string);

  // Get suggested links awaiting review
  const { data: suggestedLinks } = await supabase
    .from("content_links")
    .select(`
      id, anchor_text, link_scope, state, reason, source,
      source_content:content_items!source_content_id(content_code, title),
      target_content:content_items!target_content_id(content_code, title),
      target_url
    `)
    .eq("state", "suggested")
    .limit(50);

  // Get broken links
  const { data: brokenLinks } = await supabase
    .from("content_links")
    .select(`
      id, anchor_text, target_url, last_checked_at,
      source_content:content_items!source_content_id(content_code, title)
    `)
    .eq("state", "broken")
    .limit(50);

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Intelligence</span>
          <h2>Links</h2>
          <p>Internal, cross-project, and broken link management.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Awaiting decision</span>
              <h3>Suggested links</h3>
            </div>
          </div>
          {suggestedLinks && suggestedLinks.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Anchor</th>
                    <th>Scope</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestedLinks.map((link) => (
                    <tr key={link.id}>
                      <td>{(link.source_content as unknown as { content_code: string })?.content_code}</td>
                      <td>
                        {(link.target_content as unknown as { content_code: string })?.content_code || link.target_url}
                      </td>
                      <td>{link.anchor_text}</td>
                      <td><span className="badge">{link.link_scope}</span></td>
                      <td><small>{link.reason}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: "14px" }}>
              <p>No suggested links right now.</p>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Needs fixing</span>
              <h3>Broken links</h3>
            </div>
          </div>
          {brokenLinks && brokenLinks.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>URL</th>
                    <th>Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {brokenLinks.map((link) => (
                    <tr key={link.id}>
                      <td>{(link.source_content as unknown as { content_code: string })?.content_code}</td>
                      <td><small>{link.target_url}</small></td>
                      <td><small>{link.last_checked_at ? new Date(link.last_checked_at).toLocaleDateString() : "-"}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: "14px" }}>
              <p>No broken links detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
