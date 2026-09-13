import Link from "next/link";
import { requirePlayer } from "@/lib/auth";

export default async function DashboardHomePage() {
  const playerProfile = await requirePlayer();

  return (
    <div className="dashboard-home-menu">
      <section className="dashboard-character-stage" aria-labelledby="home-character-name">
        <div className="dashboard-day-sky" aria-hidden="true">
          <span className="dashboard-day-sun" />
          <span className="dashboard-day-cloud dashboard-day-cloud-one" />
          <span className="dashboard-day-cloud dashboard-day-cloud-two" />
          <span className="dashboard-day-hills dashboard-day-hills-far" />
          <span className="dashboard-day-hills dashboard-day-hills-near" />
          <span className="dashboard-sky-bird dashboard-sky-bird-one" />
          <span className="dashboard-sky-bird dashboard-sky-bird-two" />
          <span className="dashboard-sky-bird dashboard-sky-bird-three" />
        </div>

        <div className="dashboard-hero-identity">
          <span>Campus explorer</span>
          <h1 id="home-character-name">{playerProfile.name}</h1>
          <div>
            <b>Level {playerProfile.level}</b>
            <Link href="/dashboard/profile">View profile</Link>
          </div>
        </div>

        {/* These decorations come from the Phaser asset pack. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dashboard-stage-tree dashboard-stage-tree-left" src="/game/decorations/tree-pine.png" alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dashboard-stage-tree dashboard-stage-tree-middle" src="/game/decorations/tree-pine.png" alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dashboard-stage-tree dashboard-stage-tree-right" src="/game/decorations/tree-pine.png" alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dashboard-stage-flowers dashboard-stage-flowers-left" src="/game/decorations/flowers.png" alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dashboard-stage-flowers dashboard-stage-flowers-right" src="/game/decorations/grass-flower.png" alt="" aria-hidden="true" />

        <div className="dashboard-hero-character" role="img" aria-label={`${playerProfile.name}'s game character`}>
          <span className="dashboard-hero-character-shadow" aria-hidden="true" />
          <span className="dashboard-hero-character-sprite" aria-hidden="true" />
        </div>

        <p className="dashboard-stage-message">Ready for your next campus adventure?</p>
      </section>

      <section className="dashboard-home-journal" aria-labelledby="home-journal-title">
        <header className="dashboard-journal-heading">
          <span>Home base</span>
          <h2 id="home-journal-title">Welcome back</h2>
          <p>Your campus adventure is ready whenever you are.</p>
        </header>

        <div className="dashboard-home-actions">
          <article className="dashboard-home-streak">
            <span>Current streak</span>
            <strong>4 days</strong>
            <p>Complete one quest today to keep it going.</p>
          </article>

          <Link className="dashboard-enter-world" href="/dashboard/world">
            <span>
              <small>Continue exploring</small>
              Enter Open World
            </span>
            <b aria-hidden="true">→</b>
          </Link>
        </div>

        <div className="dashboard-home-tip">
          <span>Explorer note</span>
          <p>Step into the open world to visit campus landmarks and meet other players.</p>
        </div>
      </section>
    </div>
  );
}
