import Link from "next/link";
import { HomeLobbyScene } from "@/app/components/HomeLobbyScene";
import { requirePlayer } from "@/lib/auth";
import { HomeEntrance } from "./HomeEntrance";

export default async function DashboardHomePage() {
  const playerProfile = await requirePlayer();

  return (
    <HomeEntrance playerName={playerProfile.name}>
      <HomeLobbyScene playerName={playerProfile.name} />

      <div className="dashboard-home-panels">
        <section className="dashboard-panel home-player-panel">
          <span>Campus explorer</span>
          <h2>{playerProfile.name}</h2>
          <p>Level {playerProfile.level}</p>
          <Link href="/dashboard/profile">View Profile</Link>
        </section>

        <section className="dashboard-panel home-action-panel">
          <span>Welcome back</span>
          <h2>Ready to explore?</h2>
          <p className="home-streak">
            Current streak <strong>4 days</strong>
          </p>
          <Link className="dashboard-primary-action" href="/dashboard/world">
            Enter Open World <span aria-hidden="true">→</span>
          </Link>
          <p className="home-explorer-note">
            Take a walk through campus, visit friends, and keep your streak alive.
          </p>
        </section>
      </div>
    </HomeEntrance>
  );
}
