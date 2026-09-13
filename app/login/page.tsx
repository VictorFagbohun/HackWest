import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authConfigured, getAuth0 } from "@/lib/auth0";
import { WoodlandScene } from "@/app/components/WoodlandScene";

export const metadata: Metadata = {
  title: "Log in | Campus Quest",
  description: "Log in to continue your Campus Quest adventure.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configured = authConfigured();
  const session = configured ? await getAuth0().getSession() : null;

  if (session?.user?.sub) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-screen">
      <WoodlandScene />
      <Link className="auth-back-link" href="/">
        <span aria-hidden="true">←</span> Back to trail
      </Link>

      <section className="auth-card" aria-labelledby="login-heading">
        <header className="auth-header">
          <p>Campus Quest</p>
          <h1 id="login-heading">Welcome back</h1>
          <span>Continue your campus adventure.</span>
        </header>
        {configured ? (
          <Link className="auth-submit auth-submit-link" href="/auth/login">
            Continue with Auth0
          </Link>
        ) : (
          <p className="auth-message" role="status">
            Sign-in is being set up.
          </p>
        )}
      </section>
    </main>
  );
}
