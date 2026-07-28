import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const redirectTo = new URL(request.url).searchParams.get("redirect") || "/";

  const origin = new URL(request.url).origin;

  // Collect cookies to set
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.push(...cookies);
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "invalid");
    if (redirectTo !== "/") {
      url.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(url);
  }

  // Create success response and attach auth cookies
  const response = NextResponse.redirect(new URL(redirectTo, origin));
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as object);
  });

  return response;
}
