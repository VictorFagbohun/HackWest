import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestCard } from "../QuestCard";
import { WorldPanel } from "../WorldPanel";
import { playerProfile, quests } from "../mockData";

const friends = [
  { name: "Maya", major: "Biology", level: 6, status: "In the library" },
  { name: "Jordan", major: "Architecture", level: 5, status: "Exploring campus" },
  { name: "Avery", major: "Marketing", level: 4, status: "Questing today" },
  { name: "Noah", major: "Engineering", level: 3, status: "Offline" },
];

const rankings = [
  { rank: 1, name: "Maya", xp: 1680, streak: 8 },
  { rank: 2, name: "Jordan", xp: 1435, streak: 6 },
  { rank: 3, name: "Daniel", xp: 780, streak: 4 },
  { rank: 4, name: "Avery", xp: 720, streak: 3 },
  { rank: 5, name: "Noah", xp: 655, streak: 5 },
];

const statRows = [
  { label: "Knowledge", value: playerProfile.stats.knowledge, note: "Scholar quests" },
  { label: "Wellness", value: playerProfile.stats.wellness, note: "Wellness quests" },
  { label: "Community", value: playerProfile.stats.community, note: "Community quests" },
  { label: "Career", value: playerProfile.stats.career, note: "Career quests" },
];

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="dashboard-page-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

function QuestsPage() {
  return (
    <div className="dashboard-page">
      <PageHeading eyebrow="Quest log" title="Your quests" description="Build every part of your student life, one real-world action at a time." />
      <div className="dashboard-quest-grid">
        {quests.map((quest) => <QuestCard key={quest.id} quest={quest} />)}
      </div>
    </div>
  );
}

function WorldPage() {
  return (
    <div className="dashboard-world-page">
      <h1 className="sr-only">Open World</h1>
      <Link className="dashboard-world-exit" href="/dashboard">
        <span aria-hidden="true">←</span>
        Exit world
      </Link>
      <WorldPanel />
    </div>
  );
}

function FriendsPage() {
  return (
    <div className="dashboard-page">
      <PageHeading eyebrow="Your circle" title="Friends" description="See who is active and how your friends are growing across campus." />
      <div className="dashboard-friend-grid">
        {friends.map((friend, index) => (
          <article className="dashboard-friend-card" key={friend.name}>
            <div className={`dashboard-friend-avatar dashboard-friend-avatar-${index + 1}`} aria-hidden="true">
              {friend.name.charAt(0)}
            </div>
            <div>
              <h2>{friend.name}</h2>
              <p>{friend.major}</p>
              <span>{friend.status}</span>
            </div>
            <strong>Lv. {friend.level}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

function RankingsPage() {
  return (
    <div className="dashboard-page">
      <PageHeading eyebrow="Weekly board" title="Campus rankings" description="Compare XP and quest streaks from this week." />
      <section className="dashboard-panel dashboard-ranking-panel">
        <div className="dashboard-ranking-header">
          <span>Rank</span><span>Explorer</span><span>Weekly XP</span><span>Streak</span>
        </div>
        {rankings.map((entry) => (
          <div className={`dashboard-ranking-row ${entry.name === playerProfile.name ? "dashboard-ranking-current" : ""}`} key={entry.name}>
            <b>#{entry.rank}</b><strong>{entry.name}</strong><span>{entry.xp.toLocaleString()} XP</span><span>{entry.streak} days</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="dashboard-page">
      <PageHeading eyebrow="Explorer card" title="Your profile" description="See the progress you have made across campus life." />
      <div className="dashboard-profile-grid">
        <section className="dashboard-panel dashboard-profile-card">
          <div className="dashboard-avatar dashboard-avatar-large" role="img" aria-label={`${playerProfile.name}'s character`} />
          <h2>{playerProfile.name}</h2>
          <p>{playerProfile.major}</p>
          <span>{playerProfile.university}</span>
          <div className="dashboard-profile-level"><b>Level {playerProfile.level}</b><span>{playerProfile.xp} XP</span></div>
        </section>
        <section className="dashboard-panel dashboard-profile-stats">
          <div className="dashboard-panel-heading"><div><span>Four paths</span><h2>Profile stats</h2></div></div>
          {statRows.map((stat) => (
            <div className="dashboard-profile-stat" key={stat.label}>
              <div><strong>{stat.label}</strong><span>{stat.note}</span><b>{stat.value}</b></div>
              <div className="dashboard-stat-track"><span style={{ width: `${stat.value}%` }} /></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return ["quests", "world", "friends", "rankings", "profile"].map((section) => ({ section }));
}

export default async function DashboardSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  if (section === "quests") return <QuestsPage />;
  if (section === "world") return <WorldPage />;
  if (section === "friends") return <FriendsPage />;
  if (section === "rankings") return <RankingsPage />;
  if (section === "profile") return <ProfilePage />;
  notFound();
}
