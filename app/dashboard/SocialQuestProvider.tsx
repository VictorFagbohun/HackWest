"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FRIENDS, LEADERBOARD_PLAYERS, QUESTS } from "@/lib/social-data";
import type {
  FriendProfile,
  LeaderboardPlayer,
  QuestProgress,
} from "@/types/social";
import type { PlayerProfile } from "@/types/api";
import { createStarterWorld, type WorldData } from "@/types/world";

interface SocialQuestContextValue {
  activeFriend: FriendProfile | null;
  claimQuest: (quest: QuestProgress) => void;
  coins: number;
  friends: FriendProfile[];
  homeWorld: WorldData;
  leaderboard: LeaderboardPlayer[];
  player: PlayerProfile;
  quests: QuestProgress[];
  returnHome: () => void;
  setCoins: (coins: number) => void;
  setHomeWorld: (world: WorldData) => void;
  visitFriend: (friend: FriendProfile) => void;
  visitedFriendIds: string[];
  viewedWorld: WorldData;
  xp: number;
}

const starterWorld = createStarterWorld();
const starterObjectCount = starterWorld.objects.length;
const SocialQuestContext = createContext<SocialQuestContextValue | null>(null);

export function SocialQuestProvider({ player, children }: { player: PlayerProfile; children: ReactNode }) {
  const [homeWorld, setHomeWorld] = useState<WorldData>(starterWorld);
  const [coins, setCoins] = useState(player.coins);
  const [xp, setXp] = useState(player.xp);
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>([]);
  const [visitedFriendIds, setVisitedFriendIds] = useState<string[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendProfile | null>(null);

  const quests = useMemo<QuestProgress[]>(() => {
    const buildingCount = homeWorld.objects.filter(
      (object) => object.kind === "building",
    ).length;
    const newlyPlacedCount = Math.max(
      0,
      homeWorld.objects.length - starterObjectCount,
    );

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
  }, [claimedQuestIds, homeWorld.objects, visitedFriendIds.length]);

  const leaderboard = useMemo<LeaderboardPlayer[]>(
    () => [
      ...LEADERBOARD_PLAYERS,
      {
        id: player.id,
        name: player.name,
        initials: player.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2),
        xp,
        level:
          player.level +
          Math.floor((xp - player.xp) / 150),
        isCurrentUser: true,
      },
    ],
    [player, xp],
  );

  const claimQuest = (quest: QuestProgress) => {
    if (quest.claimed || quest.progress < quest.goal) return;
    setClaimedQuestIds((current) => [...current, quest.id]);
    setCoins((current) => current + quest.rewardCoins);
    setXp((current) => current + quest.rewardXp);
  };

  const visitFriend = (friend: FriendProfile) => {
    setActiveFriend(friend);
    setVisitedFriendIds((current) =>
      current.includes(friend.id) ? current : [...current, friend.id],
    );
  };

  const returnHome = () => setActiveFriend(null);

  return (
    <SocialQuestContext.Provider
      value={{
        activeFriend,
        claimQuest,
        coins,
        friends: FRIENDS,
        homeWorld,
        leaderboard,
        player,
        quests,
        returnHome,
        setCoins,
        setHomeWorld,
        visitFriend,
        visitedFriendIds,
        viewedWorld: activeFriend?.world ?? homeWorld,
        xp,
      }}
    >
      {children}
    </SocialQuestContext.Provider>
  );
}

export function useSocialQuest() {
  const value = useContext(SocialQuestContext);
  if (!value) {
    throw new Error("useSocialQuest must be used inside SocialQuestProvider");
  }
  return value;
}
