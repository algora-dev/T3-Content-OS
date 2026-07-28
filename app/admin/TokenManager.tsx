"use client";

import { useState } from "react";

interface AgentToken {
  id: string;
  agent_name: string;
  scopes: string[];
  project_ids: string[];
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

const ALL_SCOPES = [
  "ideas:read",
  "ideas:claim",
  "content:read",
  "content:create",
  "content:update-draft",
  "links:suggest",
];

export function TokenManager({
  tokens,
  projects,
  currentUserId,
}: {
  tokens: AgentToken[];
  projects: Project[];
  currentUserId: string;
}) {
  const [agentName, setAgentName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(ALL_SCOPES);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    projects.map((p) => p.id)
  );
  const [expiresDays, setExpiresDays] = useState("90");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    setCreatedToken(null);

    try {
      const res = await fetch("/api/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          scopes: selectedScopes,
          project_ids: selectedProjectIds,
          expires_days: parseInt(expiresDays) || 90,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Failed to create token");
        return;
      }

      setCreatedToken(data.data.token);
      setAgentName("");
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this token? This cannot be undone.")) return;

    const res = await fetch("/api/v1/tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      window.location.reload();
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function copyToken() {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="page-stack">
      {/* Create new token */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">New token</span>
            <h3>Create agent token</h3>
          </div>
        </div>

        <div className="form-stack">
          <div>
            <label className="form-label">Agent name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g. Ron, Barry"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Scopes</label>
            <div className="checkbox-grid">
              {ALL_SCOPES.map((scope) => (
                <label key={scope} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span>{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Project access</label>
            <div className="checkbox-grid">
              {projects.map((p) => (
                <label key={p.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedProjectIds.includes(p.id)}
                    onChange={() => toggleProject(p.id)}
                  />
                  <span>{p.code} - {p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Expires (days)</label>
            <input
              type="number"
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              className="form-input"
              style={{ width: "120px" }}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !agentName.trim()}
            className="primary button-link"
            style={{ alignSelf: "flex-start" }}
          >
            {creating ? "Creating..." : "Create token"}
          </button>

          {error && <p className="error-text">{error}</p>}
        </div>
      </div>

      {/* Show created token once */}
      {createdToken && (
        <div className="panel" style={{ borderColor: "var(--lime)" }}>
          <div className="panel-head">
            <div>
              <span className="eyebrow" style={{ color: "var(--lime)" }}>Save this now</span>
              <h3>Token created</h3>
            </div>
          </div>
          <p className="form-help">
            This token is shown once. Copy it now - it cannot be retrieved later.
          </p>
          <div className="token-display">
            <code>{createdToken}</code>
            <button onClick={copyToken} className="ghost button-link">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Existing tokens */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Active tokens</span>
            <h3>All tokens ({tokens.length})</h3>
          </div>
        </div>

        {tokens.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Scopes</th>
                  <th>Projects</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.agent_name}</strong></td>
                    <td>
                      <div className="scope-list">
                        {t.scopes.map((s) => (
                          <span key={s} className="badge">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <small>
                        {t.project_ids.length} project{t.project_ids.length !== 1 ? "s" : ""}
                      </small>
                    </td>
                    <td><small>{new Date(t.created_at).toLocaleDateString()}</small></td>
                    <td>
                      <small>
                        {t.last_used_at
                          ? new Date(t.last_used_at).toLocaleDateString()
                          : "Never"}
                      </small>
                    </td>
                    <td>
                      <small>
                        {t.expires_at
                          ? new Date(t.expires_at).toLocaleDateString()
                          : "No expiry"}
                      </small>
                    </td>
                    <td>
                      {t.revoked_at ? (
                        <span className="status status-archived">Revoked</span>
                      ) : t.expires_at && new Date(t.expires_at) < new Date() ? (
                        <span className="status status-changes-requested">Expired</span>
                      ) : (
                        <span className="status status-live">Active</span>
                      )}
                    </td>
                    <td>
                      {!t.revoked_at && (
                        <button
                          onClick={() => handleRevoke(t.id)}
                          className="ghost button-link danger"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: "14px" }}>
            <p>No agent tokens yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
