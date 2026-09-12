"use client";

import { useMemo, useState } from "react";
import { GameWorld } from "@/app/components/game/GameWorld";
import { SocialPanel } from "@/app/components/social/SocialPanel";
import { FRIENDS, LEADERBOARD_PLAYERS, QUESTS } from "@/lib/social-data";
import type { FriendProfile, QuestProgress, SocialTab } from "@/types/social";
import { createStarterWorld, type WorldData } from "@/types/world";

const CURRENT_USER = {
  id: "hanmi",
  name: "Hanmi",
  initials: "HA",
  startingXp: 980,
};

export default function HomePage() {
  const starterWorld = useMemo(() => createStarterWorld(), []);
  const starterObjectCount = useMemo(() => starterWorld.objects.length, [starterWorld]);
  const [homeWorld, setHomeWorld] = useState<WorldData>(starterWorld);
  const [coins, setCoins] = useState(1500);
  const [xp, setXp] = useState(CURRENT_USER.startingXp);
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>([]);
  const [visitedFriendIds, setVisitedFriendIds] = useState<string[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendProfile | null>(null);
  const [activeTab, setActiveTab] = useState<SocialTab>("quests");

  const quests = useMemo<QuestProgress[]>(() => {
    const buildingCount = homeWorld.objects.filter((object) => object.kind === "building").length;
    const newlyPlacedCount = Math.max(0, homeWorld.objects.length - starterObjectCount);
    return QUESTS.map((quest) => ({
      ...quest,
      progress:
        quest.id === "campus-foundation"
          ? buildingCount
          : quest.id === "campus-creator"
            ? newlyPlacedCount
            : visitedFriendIds.length,
      claimed: claimedQuestIds.includes(quest.id),
    }));
  }, [claimedQuestIds, homeWorld.objects, starterObjectCount, visitedFriendIds.length]);

  const leaderboard = useMemo(
    () => [
      ...LEADERBOARD_PLAYERS,
      {
        id: CURRENT_USER.id,
        name: CURRENT_USER.name,
        initials: CURRENT_USER.initials,
        xp,
        level: Math.floor(xp / 150) + 1,
        isCurrentUser: true,
      },
    ],
    [xp],
  );

  const handleClaimQuest = (quest: QuestProgress) => {
    if (quest.claimed || quest.progress < quest.goal) return;
    setClaimedQuestIds((current) => [...current, quest.id]);
    setCoins((current) => current + quest.rewardCoins);
    setXp((current) => current + quest.rewardXp);
  };

  const handleVisitFriend = (friend: FriendProfile) => {
    setActiveFriend(friend);
    setVisitedFriendIds((current) => current.includes(friend.id) ? current : [...current, friend.id]);
  };

  const viewedWorld = activeFriend?.world ?? homeWorld;

  return (
    <main className="min-h-screen bg-[#0b1410] px-4 py-6">
      <header className="mx-auto mb-5 flex w-full max-w-[1440px] flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">HackWest</p>
          <h1 className="mt-1 text-3xl text-amber-100">Campus World</h1>
          <p className="mt-2 text-sm text-emerald-100/70">Build your campus, complete quests, and explore with friends.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded border border-yellow-700 bg-yellow-950/60 px-3 py-2 text-yellow-200">🪙 {coins.toLocaleString()} coins</span>
          <span className="rounded border border-violet-700 bg-violet-950/60 px-3 py-2 text-violet-200">✦ {xp.toLocaleString()} XP</span>
        </div>
      </header>

      {activeFriend ? (
        <div className="mx-auto mb-4 flex w-full max-w-[1440px] items-center justify-between gap-3 rounded border-2 border-emerald-800 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-100">
          <span>Visiting <strong>{activeFriend.name}</strong> · Explore-only mode</span>
          <button type="button" onClick={() => setActiveFriend(null)} className="rounded border border-emerald-700 px-3 py-1 text-xs hover:bg-emerald-900">Return home</button>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-5 lg:flex-row">
        <GameWorld
          world={viewedWorld}
          coins={coins}
          editable={!activeFriend}
          playerName={activeFriend?.name ?? CURRENT_USER.name}
          onWorldChange={activeFriend ? undefined : setHomeWorld}
          onCoinsChange={activeFriend ? undefined : setCoins}
        />
        <SocialPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          quests={quests}
          onClaimQuest={handleClaimQuest}
          friends={FRIENDS}
          activeFriendId={activeFriend?.id ?? null}
          visitedFriendIds={visitedFriendIds}
          onVisitFriend={handleVisitFriend}
          onReturnHome={() => setActiveFriend(null)}
          leaderboard={leaderboard}
        />
      </div>
    </main>
  );
}
