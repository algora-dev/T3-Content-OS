"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ContentData {
  id: string;
  content_code: string;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  status: string;
  cluster: string | null;
  content_type: string | null;
  target_query: string | null;
  search_intent: string | null;
  audience: string | null;
  slug: string | null;
  destination_path: string | null;
  author_name: string | null;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  version: number;
  project_id: string;
}

interface Revision {
  id: string;
  version: number;
  title: string | null;
  created_at: string;
  actor_name: string | null;
  reason: string | null;
}

export function ContentEditor({
  content,
  revisions,
  canEdit,
  canReview,
}: {
  content: ContentData;
  revisions: Revision[];
  canEdit: boolean;
  canReview: boolean;
}) {
  const router = useRouter();

  // Read-only by default, enter edit mode on click
  const [isEditing, setIsEditing] = useState(false);

  // Form state - only used in edit mode
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body_markdown || "");
  const [summary, setSummary] = useState(content.summary || "");
  const [metaTitle, setMetaTitle] = useState(content.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(content.meta_description || "");
  const [excerpt, setExcerpt] = useState(content.excerpt || "");
  const [cluster, setCluster] = useState(content.cluster || "");
  const [targetQuery, setTargetQuery] = useState(content.target_query || "");
  const [audience, setAudience] = useState(content.audience || "");
  const [slug, setSlug] = useState(content.slug || "");
  const [version, setVersion] = useState(content.version);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "conflict" | "error">("idle");
  const [showRevisions, setShowRevisions] = useState(false);
  const [error, setError] = useState("");

  const canEditContent = canEdit && content.status !== "archived";

  function handleEdit() {
    // Sync form state from latest content before entering edit mode
    setTitle(content.title);
    setBody(content.body_markdown || "");
    setSummary(content.summary || "");
    setMetaTitle(content.meta_title || "");
    setMetaDescription(content.meta_description || "");
    setExcerpt(content.excerpt || "");
    setCluster(content.cluster || "");
    setTargetQuery(content.target_query || "");
    setAudience(content.audience || "");
    setSlug(content.slug || "");
    setVersion(content.version);
    setError("");
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setError("");
  }

  async function handleSave() {
    setSaveState("saving");
    setError("");

    const formData = new FormData();
    formData.set("version", String(version));
    formData.set("title", title);
    formData.set("body_markdown", body);
    formData.set("summary", summary);
    formData.set("meta_title", metaTitle);
    formData.set("meta_description", metaDescription);
    formData.set("excerpt", excerpt);
    formData.set("cluster", cluster);
    formData.set("target_query", targetQuery);
    formData.set("audience", audience);
    formData.set("slug", slug);

    try {
      const res = await fetch(`/content/${content.id}/autosave`, {
        method: "POST",
        body: formData,
      });

      if (res.status === 409) {
        setSaveState("conflict");
        setError("Version conflict - someone else has edited this content. Reload the page.");
        return;
      }

      if (!res.ok) {
        setSaveState("error");
        setError("Save failed.");
        return;
      }

      const data = await res.json();
      setVersion(data.version);
      setSaveState("saved");
      setIsEditing(false);
      router.refresh();
    } catch {
      setSaveState("error");
      setError("Network error.");
    }
  }

  async function handleSubmitReview() {
    setError("");
    const res = await fetch(`/content/${content.id}/submit-review`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to submit for review");
    }
  }

  async function handleApprove() {
    setError("");
    const res = await fetch(`/content/${content.id}/approve`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Failed to approve");
    }
  }

  async function handleRequestChanges() {
    setError("");
    const note = prompt("What needs changing?");
    if (!note || !note.trim()) return;

    const res = await fetch(`/content/${content.id}/request-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Failed to request changes");
    }
  }

  const saveLabel = {
    idle: "",
    saving: "Saving...",
    saved: "Saved",
    conflict: "Conflict - reload needed",
    error: "Save error",
  }[saveState];

  return (
    <div className="page-stack">
      <Link href="/content" className="back" style={{ color: "var(--muted)", textDecoration: "none", display: "block", marginBottom: "14px" }}>
        ← Back to content
      </Link>

      <div className="editor-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <span className="eyebrow">{content.content_code}</span>
          <h2 style={{ fontSize: "32px", margin: "6px 0 8px", letterSpacing: "-0.03em" }}>{content.title}</h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            <span className={`badge status-${content.status}`}>{content.status}</span>
            {" "}v{content.version}
            {saveLabel && <span style={{ marginLeft: "12px", color: saveState === "conflict" || saveState === "error" ? "var(--red)" : "var(--green)" }}>{saveLabel}</span>}
          </p>
        </div>
        <div className="editor-actions">
          <button className="ghost" onClick={() => setShowRevisions(!showRevisions)}>
            Revisions ({revisions.length})
          </button>
          {isEditing ? (
            <>
              <button className="ghost" onClick={handleCancel}>Cancel</button>
              <button className="primary" onClick={handleSave}>Save</button>
            </>
          ) : (
            <>
              {canEditContent && (
                <button className="primary" onClick={handleEdit}>Edit</button>
              )}
              {canEditContent && content.status === "draft" && (
                <button className="ghost" onClick={handleSubmitReview}>Submit for review</button>
              )}
              {canReview && content.status === "in-review" && (
                <>
                  <button className="primary" onClick={handleApprove}>Approve</button>
                  <button className="ghost" onClick={handleRequestChanges}>Request changes</button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: "14px" }}>{error}</div>}

      {showRevisions ? (
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">History</span>
              <h3>Revision history</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Title</th>
                  <th>By</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map((rev) => (
                  <tr key={rev.id}>
                    <td>v{rev.version}</td>
                    <td>{rev.title}</td>
                    <td>{rev.actor_name || "-"}</td>
                    <td><small>{rev.reason || "-"}</small></td>
                    <td><small>{new Date(rev.created_at).toLocaleString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : isEditing ? (
        /* ── EDIT MODE ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "18px" }}>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px", borderBottom: "1px solid var(--line)", display: "flex", gap: "7px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", padding: "7px 10px" }}>Editing - Markdown</span>
            </div>
            <input
              className="title-editor"
              style={{
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                border: 0,
                background: "transparent",
                padding: "20px 24px 5px",
                margin: 0,
                width: "calc(100% - 48px)",
              }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              style={{
                border: 0,
                borderRadius: 0,
                minHeight: "650px",
                padding: "24px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                lineHeight: "1.7",
                resize: "vertical",
                width: "100%",
              }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your content in Markdown..."
            />
          </div>

          <div style={{ display: "grid", gap: "14px", alignContent: "start" }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Metadata</span>
                  <h3>SEO</h3>
                </div>
              </div>
              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Meta title
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO title" style={{ fontSize: "13px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Meta description
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO description" rows={3} style={{ fontSize: "13px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Excerpt
                  <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Public excerpt" rows={2} style={{ fontSize: "13px" }} />
                </label>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Editorial</span>
                  <h3>Details</h3>
                </div>
              </div>
              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Slug
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" style={{ fontSize: "13px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Cluster
                  <input value={cluster} onChange={(e) => setCluster(e.target.value)} placeholder="e.g. roof-measurement" style={{ fontSize: "13px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Target query
                  <input value={targetQuery} onChange={(e) => setTargetQuery(e.target.value)} placeholder="search query" style={{ fontSize: "13px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Audience
                  <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. roofers" style={{ fontSize: "13px" }} />
                </label>
                <label style={{ fontSize: "12px", display: "grid", gap: "4px", fontWeight: 700 }}>
                  Summary
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Internal summary" rows={3} style={{ fontSize: "13px" }} />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── READ-ONLY MODE ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "18px" }}>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px", borderBottom: "1px solid var(--line)", display: "flex", gap: "7px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", padding: "7px 10px" }}>Read-only - click Edit to make changes</span>
            </div>
            <div style={{ padding: "20px 24px 5px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 16px" }}>{content.title}</h1>
            </div>
            <div style={{
              padding: "0 24px 24px",
              whiteSpace: "pre-wrap",
              lineHeight: "1.75",
              color: "#394550",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "14px",
              minHeight: "500px",
            }}>
              {content.body_markdown || "No content yet."}
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px", alignContent: "start" }}>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Metadata</span>
                  <h3>SEO</h3>
                </div>
              </div>
              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                <div style={{ fontSize: "12px" }}>
                  <strong>Meta title</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.meta_title || "-"}</p>
                </div>
                <div style={{ fontSize: "12px" }}>
                  <strong>Meta description</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.meta_description || "-"}</p>
                </div>
                <div style={{ fontSize: "12px" }}>
                  <strong>Excerpt</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.excerpt || "-"}</p>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Editorial</span>
                  <h3>Details</h3>
                </div>
              </div>
              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                <div style={{ fontSize: "12px" }}>
                  <strong>Slug</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.slug || "-"}</p>
                </div>
                <div style={{ fontSize: "12px" }}>
                  <strong>Cluster</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.cluster || "-"}</p>
                </div>
                <div style={{ fontSize: "12px" }}>
                  <strong>Target query</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.target_query || "-"}</p>
                </div>
                <div style={{ fontSize: "12px" }}>
                  <strong>Audience</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.audience || "-"}</p>
                </div>
                <div style={{ fontSize: "12px" }}>
                  <strong>Summary</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>{content.summary || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
