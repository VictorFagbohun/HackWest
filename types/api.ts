import type { CharacterOutfit } from '../lib/shop-catalog';
import type { WorldData } from './world';

export type Stats = { knowledge: number; wellness: number; community: number; career: number };
export type PlayerProfile = {
  id: string; name: string; university: string; major: string | null;
  level: number; xp: number; coins: number; character: Record<string, unknown>; stats: Stats;
};
export type Quest = {
  id: string; title: string; description: string | null;
  category: 'SCHOLAR' | 'WELLNESS' | 'COMMUNITY' | 'CAREER';
  xp_reward: number; coin_reward: number; location_code: string | null;
  frequency: 'DAILY' | 'ONE_TIME' | 'REPEATABLE';
  verification_policy: 'QR' | 'PHOTO_AI' | 'MANUAL'; minimum_duration_seconds: number;
};
export type QuestAttempt = { id: string; questId: string; status: string; startedAt: string };
export type QuestProgress = Quest & {
  claimed: boolean;
  activeAttempt: QuestAttempt | null;
};
export type CompletionResult = {
  success: true; xpGained: number; coinsGained: number; leveledUp: boolean;
  newLevel: number; newXp: number; newCoins: number; updatedStats: Stats;
};
export type OwnedItem = { itemId: string; placed: boolean; x: number | null; y: number | null };
export type PurchaseResult = { success: true; newCoinBalance: number; ownedItems: OwnedItem[] };
export type World = { userId: string; placedItems: { itemId: string; x: number; y: number }[] };
export type LeaderboardEntry = { userId: string; name: string; level: number; xp: number; rank: number };
export type PlayerSearchResult = { userId: string; name: string; university: string; level: number };
export type ApiFailure = { success: false; error: { code: string; message: string } };
export type CampusProgressResult = {
  coins: number;
  xp: number;
  level: number;
  claimedQuestIds: string[];
  visitedFriendIds: string[];
  homeWorld: WorldData | null;
  outfit: CharacterOutfit;
};
