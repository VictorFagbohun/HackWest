import type { Metadata } from "next";
import Link from "next/link";
import { WoodlandScene } from "@/app/components/WoodlandScene";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in | Campus Quest",
  description: "Log in to continue your Campus Quest adventure.",
};

export default function LoginPage() {
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
        <LoginForm />
      </section>
    </main>
  );
}
