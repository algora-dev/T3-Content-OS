import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser, getProjectRole } from "@/lib/auth/permissions";
import { canPerformAction } from "@/lib/workflow";
import { markIdeaReady, archiveIdea } from "../actions";
import { createContentFromIdea } from "@/app/content/actions";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser();

  if (!user) return notFound();

  const { data: idea } = await supabase
    .from("ideas")
    .select(`
      *,
      project:projects(*),
      content:content_items!source_idea_id(id, content_code, title, status)
    `)
    .eq("id", id)
    .single();

  if (!idea) return notFound();

  const role = await getProjectRole(idea.project_id);
  const canEdit = role && canPerformAction(role, "idea:edit");
  const canCreateContent = role && canPerformAction(role, "content:create");

  return (
    <div className="page-stack">
      <a href="/ideas" className="back" style={{ color: "var(--muted)", textDecoration: "none", display: "block", marginBottom: "14px" }}>
        ← Back to ideas
      </a>

      <div className="page-title">
        <div>
          <span className="eyebrow">{idea.idea_code}</span>
          <h2>{idea.title}</h2>
          <p>{idea.brief || "No brief provided."}</p>
        </div>
        <div className="top-actions">
          {canEdit && idea.status === "new" && (
            <form action={markIdeaReady.bind(null, id)}>
              <button className="primary" type="submit">Mark ready</button>
            </form>
          )}
          {canCreateContent && idea.status === "ready" && (
            <form action={createContentFromIdea.bind(null, id)}>
              <button className="primary" type="submit">Start draft</button>
            </form>
          )}
          {canEdit && idea.status !== "archived" && (
            <form action={archiveIdea.bind(null, id)}>
              <button className="ghost" type="submit">Archive</button>
            </form>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Details</span>
              <h3>Idea information</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <td style={{ width: "140px" }}><strong>Project</strong></td>
                  <td>{(idea.project as { code: string; name: string })?.name}</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td><span className={`badge status-${idea.status}`}>{idea.status}</span></td>
                </tr>
                <tr>
                  <td><strong>Priority</strong></td>
                  <td><span className={`badge status-${idea.priority}`}>{idea.priority}</span></td>
                </tr>
                <tr>
                  <td><strong>Target query</strong></td>
                  <td>{idea.target_query || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Search intent</strong></td>
                  <td>{idea.search_intent || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Audience</strong></td>
                  <td>{idea.audience || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Claimed by</strong></td>
                  <td>{idea.claimed_by || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Created</strong></td>
                  <td><small>{new Date(idea.created_at).toLocaleString()}</small></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Linked content</span>
              <h3>Drafts</h3>
            </div>
          </div>
          {idea.content && (idea.content as unknown as Array<{ id: string; content_code: string; title: string; status: string }>).length > 0 ? (
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
                  {(idea.content as unknown as Array<{ id: string; content_code: string; title: string; status: string }>).map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/content/${c.id}`} className="title-link">{c.content_code}</Link>
                      </td>
                      <td>{c.title}</td>
                      <td><span className={`badge status-${c.status}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: "14px" }}>
              <p>No drafts created yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
