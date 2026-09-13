import type { WorldData } from "@/types/world";

export type SocialTab = "quests" | "friends" | "leaderboard";

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: "Campus" | "Social" | "Daily";
  goal: number;
  rewardCoins: number;
  rewardXp: number;
}

export interface QuestProgress extends Quest {
  progress: number;
  claimed: boolean;
}

export interface FriendProfile {
  id: string;
  name: string;
  initials: string;
  major: string;
  level: number;
  xp: number;
  status: "online" | "away" | "offline";
  lastSeen: string;
  world: WorldData;
}

export interface LeaderboardPlayer {
  id: string;
  name: string;
  initials: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
}
