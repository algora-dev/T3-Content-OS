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
        <div className="login-brand">
          <img
            src="/t3-labs-logo.png"
            alt="T3 Labs"
            width={42}
            height={42}
            style={{ borderRadius: "10px", objectFit: "cover" }}
          />
          <div>
            <strong>T3 Labs Content OS</strong>
            <small>Private employee workspace</small>
          </div>
        </div>
        <span className="eyebrow">Secure access</span>
        <h1>Sign in to Content OS</h1>
        <p>
          Review ideas, edit drafts, manage site libraries and approve content
          for publication.
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
          <button className="primary" type="submit">
            Sign in
          </button>
        </form>
        <div className="empty-state" style={{ marginTop: "20px", padding: "13px" }}>
          <small style={{ color: "var(--muted)" }}>
            Access is managed by administrators. Contact Shaun if you need an account.
          </small>
        </div>
      </section>
    </main>
  );
}
