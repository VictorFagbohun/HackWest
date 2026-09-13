import Link from "next/link";
import { QuestCard } from "./QuestCard";
import { playerProfile, quests } from "./mockData";

const stats = [
  { key: "knowledge", label: "Knowledge", value: playerProfile.stats.knowledge },
  { key: "wellness", label: "Wellness", value: playerProfile.stats.wellness },
  { key: "community", label: "Community", value: playerProfile.stats.community },
  { key: "career", label: "Career", value: playerProfile.stats.career },
];

export default function DashboardHomePage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-page-heading">
        <div>
          <span>Home base</span>
          <h1>Your campus today</h1>
          <p>Choose a quest, visit your world, or check in with friends.</p>
        </div>
        <Link className="dashboard-primary-action" href="/dashboard/world">
          Enter Open World <span aria-hidden="true">→</span>
        </Link>
      </section>

      <div className="dashboard-home-grid">
        <section className="dashboard-panel dashboard-profile-summary">
          <div className="dashboard-avatar" role="img" aria-label={`${playerProfile.name}'s character`} />
          <div className="dashboard-profile-copy">
            <span>Level {playerProfile.level} explorer</span>
            <h2>{playerProfile.name}</h2>
            <p>{playerProfile.major}</p>
          </div>
          <Link href="/dashboard/profile">View profile</Link>
        </section>

        <section className="dashboard-panel dashboard-streak-card">
          <span>Current streak</span>
          <strong>4 days</strong>
          <p>Complete one quest today to keep it going.</p>
        </section>

        <section className="dashboard-panel dashboard-stats-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Player growth</span>
              <h2>Your stats</h2>
            </div>
            <Link href="/dashboard/profile">All stats</Link>
          </div>
          <div className="dashboard-stat-list">
            {stats.map((stat) => (
              <div className="dashboard-stat" key={stat.key}>
                <div><span>{stat.label}</span><b>{stat.value}</b></div>
                <div className="dashboard-stat-track"><span style={{ width: `${stat.value}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel dashboard-quests-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span>Available now</span>
              <h2>Today&apos;s quests</h2>
            </div>
            <Link href="/dashboard/quests">View all</Link>
          </div>
          <div className="dashboard-quest-list">
            {quests.slice(0, 3).map((quest) => <QuestCard key={quest.id} quest={quest} compact />)}
          </div>
        </section>

        <section className="dashboard-panel dashboard-shortcuts">
          <div className="dashboard-panel-heading">
            <div>
              <span>Quick paths</span>
              <h2>Explore</h2>
            </div>
          </div>
          <div className="dashboard-shortcut-grid">
            <Link href="/dashboard/friends"><strong>Friends</strong><span>See who is exploring</span></Link>
            <Link href="/dashboard/rankings"><strong>Rankings</strong><span>Check the weekly board</span></Link>
            <Link href="/dashboard/world"><strong>My World</strong><span>Walk and build your campus</span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
