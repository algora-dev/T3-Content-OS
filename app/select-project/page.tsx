import { redirect } from "next/navigation";
import { getSessionUser, getUserProjects } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

export default async function SelectProjectPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const userProjects = await getUserProjects();

  if (userProjects.length === 0) {
    return (
      <div className="select-project-page">
        <div className="select-project-card">
          <h1>No projects assigned</h1>
          <p>An administrator needs to assign you to a project before you can use Content OS.</p>
        </div>
      </div>
    );
  }

  if (userProjects.length === 1) {
    const projectId = userProjects[0].project.id as string;
    const cookieStore = await cookies();
    cookieStore.set('contentos_project', projectId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      httpOnly: true,
    });
    redirect("/");
  }

  async function selectProject(formData: FormData) {
    "use server";
    const projectId = formData.get("projectId") as string;
    const cookieStore = await cookies();
    cookieStore.set('contentos_project', projectId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
    });
    redirect("/");
  }

  return (
    <div className="select-project-page">
      <div className="select-project-card">
        <div className="select-project-header">
          <img src="/t3-labs-logo.png" alt="T3 Labs" height={40} />
          <h1>Select a project</h1>
          <p>Choose which project workspace you want to enter.</p>
        </div>
        <div className="select-project-list">
          {userProjects.map(({ project, role }) => (
            <form key={project.id as string} action={selectProject}>
              <input type="hidden" name="projectId" value={project.id as string} />
              <button type="submit" className="select-project-item">
                <span
                  className="project-dot"
                  style={{ backgroundColor: (project.brand_color as string) || '#111820' }}
                />
                <div className="select-project-info">
                  <strong>{project.code as string} - {project.name as string}</strong>
                  <small>{role}</small>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
