import { notFound } from "next/navigation";
import {
  DashboardFriendsPage,
  DashboardQuestsPage,
  DashboardRankingsPage,
} from "../SocialQuestSections";
import { WorldExitLink } from "../WorldExitLink";
import { WorldPanel } from "../WorldPanel";
import { playerProfile } from "../mockData";

const statRows = [
  {
    label: "Knowledge",
    value: playerProfile.stats.knowledge,
    note: "Scholar quests",
  },
  {
    label: "Wellness",
    value: playerProfile.stats.wellness,
    note: "Wellness quests",
  },
  {
    label: "Community",
    value: playerProfile.stats.community,
    note: "Community quests",
  },
  {
    label: "Career",
    value: playerProfile.stats.career,
    note: "Career quests",
  },
];

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
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

function WorldPage() {
  return (
    <div className="dashboard-world-page">
      <h1 className="sr-only">Open World</h1>
      <WorldExitLink />
      <WorldPanel />
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="dashboard-page">
      <PageHeading
        eyebrow="Explorer card"
        title="Your profile"
        description="See the progress you have made across campus life."
      />
      <div className="dashboard-profile-grid">
        <section
          className="dashboard-panel dashboard-profile-card"
          data-tutorial-id="profile-card"
        >
          <div
            className="dashboard-avatar dashboard-avatar-large"
            role="img"
            aria-label={`${playerProfile.name}'s character`}
          />
          <h2>{playerProfile.name}</h2>
          <p>{playerProfile.major}</p>
          <span>{playerProfile.university}</span>
          <div className="dashboard-profile-level">
            <b>Level {playerProfile.level}</b>
            <span>{playerProfile.xp} XP</span>
          </div>
        </section>
        <section className="dashboard-panel dashboard-profile-stats">
          <div className="dashboard-panel-heading">
            <div>
              <span>Four paths</span>
              <h2>Profile stats</h2>
            </div>
          </div>
          {statRows.map((stat) => (
            <div className="dashboard-profile-stat" key={stat.label}>
              <div>
                <strong>{stat.label}</strong>
                <span>{stat.note}</span>
                <b>{stat.value}</b>
              </div>
              <div className="dashboard-stat-track">
                <span style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return ["quests", "world", "friends", "rankings", "profile"].map(
    (section) => ({ section }),
  );
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (section === "quests") return <DashboardQuestsPage />;
  if (section === "world") return <WorldPage />;
  if (section === "friends") return <DashboardFriendsPage />;
  if (section === "rankings") return <DashboardRankingsPage />;
  if (section === "profile") return <ProfilePage />;
  notFound();
}
