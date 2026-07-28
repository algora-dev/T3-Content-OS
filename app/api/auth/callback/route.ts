import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const redirectTo = new URL(request.url).searchParams.get("redirect") || "/";

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "invalid");
    if (redirectTo !== "/") {
      url.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
