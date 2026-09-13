import Link from "next/link";
import { WoodlandScene } from "@/app/components/WoodlandScene";

export default function LandingPage() {
  return (
    <main className="login-screen bg-[#0b1410]">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100/90">
          Your next adventure awaits
        </p>
        <h1 className="mt-3 text-4xl text-amber-100 sm:text-5xl">
          Campus Quest
        </h1>
      </header>
      <WoodlandScene />
      <Link
        href="/login"
        aria-label="Log in"
        className="landing-login-link min-h-14 rounded-lg border-2 border-amber-200/60 bg-[#2a1b10] px-14 py-4 text-2xl font-semibold text-amber-100 shadow-lg transition-colors hover:border-amber-200 hover:bg-[#3a2616] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 active:bg-[#20140c]"
      >
        <span aria-hidden="true" className="inline-flex">
          {Array.from("Log in").map((letter, index) => (
            <span
              key={index}
              className="login-letter"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {letter === " " ? "\u00a0" : letter}
            </span>
          ))}
        </span>
      </Link>
    </main>
  );
}
