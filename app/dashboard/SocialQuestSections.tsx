"use client";

import { useRouter } from "next/navigation";
import { FriendsPanel } from "@/app/components/friends/FriendsPanel";
import { LeaderboardPanel } from "@/app/components/leaderboard/LeaderboardPanel";
import { QuestPanel } from "@/app/components/quests/QuestPanel";
import type { FriendProfile } from "@/types/social";
import { useSocialQuest } from "./SocialQuestProvider";

function SectionHeading({
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

export function DashboardQuestsPage() {
  const { quests, claimQuest } = useSocialQuest();

  return (
    <div className="dashboard-page">
      <SectionHeading
        eyebrow="Quest log"
        title="Your quests"
        description="Build your campus and connect with friends to earn rewards."
      />
      <div className="dashboard-panel quest-panel-surface p-4">
        <QuestPanel quests={quests} onClaim={claimQuest} />
      </div>
    </div>
  );
}

export function DashboardFriendsPage() {
  const router = useRouter();
  const {
    activeFriend,
    friends,
    returnHome,
    visitFriend,
    visitedFriendIds,
  } = useSocialQuest();

  const handleVisit = (friend: FriendProfile) => {
    visitFriend(friend);
    router.push("/dashboard/world");
  };

  return (
    <div className="dashboard-page">
      <SectionHeading
        eyebrow="Your circle"
        title="Friends"
        description="Find friends and explore their campuses in visit-only mode."
      />
      <div className="dashboard-panel p-4">
        <FriendsPanel
          friends={friends}
          activeFriendId={activeFriend?.id ?? null}
          visitedFriendIds={visitedFriendIds}
          onVisit={handleVisit}
          onReturnHome={returnHome}
        />
      </div>
    </div>
  );
}

export function DashboardRankingsPage() {
  const { leaderboard } = useSocialQuest();

  return (
    <div className="dashboard-page">
      <SectionHeading
        eyebrow="Weekly board"
        title="Campus rankings"
        description="Compare XP earned through quests this week."
      />
      <div className="dashboard-panel p-4">
        <LeaderboardPanel players={leaderboard} />
      </div>
    </div>
  );
}
