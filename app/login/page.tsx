import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { redirect: redirectTo, error: loginError } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo-wrap" style={{
          background: "#0a0b10",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}>
          <img
            src="/t3-labs-logo.png"
            alt="T3 Labs"
            height={48}
            style={{ height: "48px", width: "auto", display: "block" }}
          />
        </div>
        <h1 style={{ fontSize: "24px", margin: "0 0 6px", fontWeight: 600, textAlign: "center" }}>
          Content OS
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "14px", textAlign: "center" }}>
          Private editorial workspace
        </p>
        {loginError === "invalid" && (
          <div className="form-error">Invalid email or password. Please try again.</div>
        )}
        <form
          action={`/api/auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          method="POST"
          className="login-form"
        >
          <label>
            Email address
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="primary" type="submit" style={{ width: "100%", marginTop: "4px" }}>
            Sign in
          </button>
        </form>
        <p style={{ color: "#9aa0af", fontSize: "12px", textAlign: "center", marginTop: "20px" }}>
          Access is managed by administrators. Contact Shaun if you need an account.
        </p>
      </section>
    </main>
  );
}
