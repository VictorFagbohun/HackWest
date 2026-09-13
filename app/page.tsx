import { WoodlandScene } from "@/app/components/WoodlandScene";

export default function LandingPage() {
  return (
    <main className="login-screen">
      <header className="landing-title text-center">
        <p>
          Your next adventure awaits
        </p>
        <h1>
          <span>Campus</span>
          <span>Quest</span>
        </h1>
      </header>
      <WoodlandScene showLogin />
    </main>
  );
}
