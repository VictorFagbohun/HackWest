"use client";

import { useRouter } from "next/navigation";
import { FriendsPanel } from "@/app/components/friends/FriendsPanel";
import { LeaderboardPanel } from "@/app/components/leaderboard/LeaderboardPanel";
import type { FriendProfile } from "@/types/social";
import { CampusQuestsPanel } from "./CampusQuestsPanel";
import { useSocialQuest } from "./SocialQuestProvider";
import { useTutorialVisitLock } from "@/app/components/tutorial/TutorialProvider";
import { VICTOR_FRIEND_ID } from "@/lib/tutorial";

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
  return (
    <div className="dashboard-page">
      <SectionHeading
        eyebrow="Quest log"
        title="Your quests"
        description="Visit the campus pin, then submit a photo. GPS and Gemini both have to match before rewards save."
      />
      <div className="dashboard-panel p-4">
        <CampusQuestsPanel />
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
  const lockVisitsToVictor = useTutorialVisitLock();

  const handleVisit = (friend: FriendProfile) => {
    if (lockVisitsToVictor && friend.id !== VICTOR_FRIEND_ID) return;
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
      <div className="dashboard-panel p-4" data-tutorial-id="rankings-panel">
        <LeaderboardPanel players={leaderboard} />
      </div>
    </div>
  );
}
