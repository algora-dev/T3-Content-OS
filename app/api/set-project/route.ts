import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser, getUserProjects } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  // Validate user has access to this project
  const userProjects = await getUserProjects();
  const hasAccess = userProjects.some(
    (p) => (p.project.id as string) === projectId
  );

  if (!hasAccess) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("contentos_project", projectId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
    httpOnly: true,
  });

  return NextResponse.json({ success: true });
}
