import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Documentation</span>
          <h2>How Content OS works</h2>
          <p>A guide to every section and how to use the editorial workflow.</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: "780px" }}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">Overview</span>
            <h3>What is Content OS?</h3>
          </div>
        </div>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginTop: "14px" }}>
          Content OS is a private editorial workspace for T3 Labs. It lets you plan,
          draft, review, and publish content across all T3 Labs websites
          (QuoteCore+, T3 Labs, T3 Play) from one central place. Instead of
          scattering ideas across Slack, Google Docs, and random folders,
          everything lives here.
        </p>
      </div>

      <div className="panel" style={{ maxWidth: "780px" }}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">Section guide</span>
            <h3>Each section explained</h3>
          </div>
        </div>

        <div style={{ display: "grid", gap: "20px", marginTop: "18px" }}>
          <div>
            <h4 style={{ marginBottom: "6px" }}>
              <Link href="/ideas" className="title-link">Ideas</Link>
            </h4>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Where content starts. Capture an idea with a title, brief, priority,
              and optional SEO context (target query, search intent, audience).
              Ideas move through statuses: <span className="badge status-new">new</span>{" "}
              <span className="badge status-ready">ready</span>{" "}
              <span className="badge status-draft-created">draft-created</span>{" "}
              <span className="badge status-archived">archived</span>.
              Mark an idea as "ready" when it has enough context for someone to
              start drafting. Click "Start draft" to create a content item from
              the idea.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: "6px" }}>
              <Link href="/content" className="title-link">Content Library</Link>
            </h4>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              All content items (drafts, articles, guides) across all projects.
              Each item has a markdown editor, metadata panel (SEO title,
              description, slug, cluster, target query), and revision history.
              Content moves through:{" "}
              <span className="badge status-draft">draft</span>{" "}
              <span className="badge status-in-review">in-review</span>{" "}
              <span className="badge status-changes-requested">changes-requested</span>{" "}
              <span className="badge status-approved">approved</span>{" "}
              <span className="badge status-exported">exported</span>{" "}
              <span className="badge status-live">live</span>.
              Click any item to open the editor.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: "6px" }}>
              <Link href="/review" className="title-link">Review Queue</Link>
            </h4>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Shows all content currently in review. Admins can approve content
              (moves to "approved") or request changes (sends back to
              "changes-requested" with a required note). Editors submit drafts
              for review from the content editor.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: "6px" }}>
              <Link href="/links" className="title-link">Links</Link>
            </h4>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              Shows suggested internal links between content items and any
              broken links that need fixing. This helps build a strong internal
              linking structure for SEO.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: "6px" }}>
              <Link href="/activity" className="title-link">Activity</Link>
            </h4>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              A log of everything that happens: ideas created, content drafted,
              reviews submitted, approvals, changes requested. Useful for
              tracking progress and seeing what needs attention.
            </p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: "780px" }}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">Workflow</span>
            <h3>How content gets published</h3>
          </div>
        </div>

        <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span className="feed-icon">1</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              <strong>Capture an idea</strong> - Go to Ideas, click "+ New idea",
              fill in the title, brief, and SEO context. Status starts as "new".
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span className="feed-icon">2</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              <strong>Mark ready</strong> - When the idea has enough detail,
              click "Mark ready". This signals it's ready for drafting.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span className="feed-icon">3</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              <strong>Start draft</strong> - Click "Start draft" to create a
              content item. The editor opens with the idea's context carried over.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span className="feed-icon">4</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              <strong>Write and autosave</strong> - Write in Markdown. The editor
              autosaves every 2 seconds. Fill in the metadata panel (SEO title,
              description, slug). Use Preview to see how it reads.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span className="feed-icon">5</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              <strong>Submit for review</strong> - When the draft is ready,
              click "Submit for review". An admin will review it.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span className="feed-icon">6</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
              <strong>Review and approve</strong> - Admins can approve (moves to
              "approved") or request changes (sends back with a note). Once
              approved, content is ready to export to the destination repo.
            </p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: "780px" }}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">Roles</span>
            <h3>Who can do what</h3>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: "14px" }}>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Editor</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Create ideas</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Edit ideas</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Archive ideas</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Create content</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Edit content</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Submit for review</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Approve content</td><td>No</td><td>Yes</td></tr>
              <tr><td>Request changes</td><td>No</td><td>Yes</td></tr>
              <tr><td>Manage members</td><td>No</td><td>Yes</td></tr>
              <tr><td>Manage agent tokens</td><td>No</td><td>Yes</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
