import { createIdea } from "../actions";
import { getUserProjects } from "@/lib/auth/permissions";

export default async function NewIdeaPage() {
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

  return (
    <div className="page-stack">
      <div className="page-title">
        <div>
          <span className="eyebrow">Editorial</span>
          <h2>New idea</h2>
          <p>Capture a content idea with enough context for drafting.</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: "760px" }}>
        <form action={createIdea} className="login-form">
          <label>
            Project
            <select name="project_id" required>
              {userProjects.map((p) => (
                <option key={p.project.id as string} value={p.project.id as string}>
                  {(p.project as { code: string }).code} - {(p.project as { name: string }).name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input name="title" type="text" required placeholder="e.g. How to Calculate Roofing Waste" />
          </label>

          <label>
            Brief
            <textarea
              name="brief"
              rows={4}
              placeholder="What should this content cover? What angle or perspective?"
            />
          </label>

          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label>
              Priority
              <select name="priority">
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label>
              Search intent
              <select name="search_intent">
                <option value="">Not set</option>
                <option value="informational">Informational</option>
                <option value="commercial">Commercial</option>
                <option value="transactional">Transactional</option>
                <option value="navigational">Navigational</option>
              </select>
            </label>
          </div>

          <label>
            Target query
            <input name="target_query" type="text" placeholder="e.g. how much roofing waste should I allow" />
          </label>

          <label>
            Audience
            <input name="audience" type="text" placeholder="e.g. roofers, homeowners, builders" />
          </label>

          <div style={{ display: "flex", gap: "9px", marginTop: "8px" }}>
            <button className="primary" type="submit">
              Create idea
            </button>
            <a href="/ideas" className="ghost button-link">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
