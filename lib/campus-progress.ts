import { z } from 'zod';
import { QUESTS } from './social-data';
import {
  DEFAULT_OUTFIT,
  normalizeOutfit,
  type CharacterOutfit,
  type EquippedItems,
  type ShopCategory,
} from './shop-catalog';
import type { WorldData } from '../types/world';

const WorldObject = z.object({
  id: z.string().min(1).max(120),
  catalogId: z.string().min(1).max(80),
  kind: z.enum(['building', 'decor']),
  x: z.number().int().min(-50).max(200),
  y: z.number().int().min(-50).max(200),
}).strict();

export const HomeWorldSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().max(100).optional(),
  mapKey: z.literal('campus'),
  spawn: z.object({
    x: z.number().int().min(-50).max(200),
    y: z.number().int().min(-50).max(200),
  }).strict(),
  objects: z.array(WorldObject).max(250),
}).strict();

const EquippedSchema = z.object({
  SHIRT: z.string().min(1).max(80).nullable(),
  HAT: z.string().min(1).max(80).nullable(),
  SHOES: z.string().min(1).max(80).nullable(),
  ACCESSORY: z.string().min(1).max(80).nullable(),
}).strict();

export const OutfitSchema = z.object({
  ownedItemIds: z.array(z.string().min(1).max(80)).max(50),
  equipped: EquippedSchema,
}).strict();

export const CampusProgressSchema = z.object({
  claimedQuestIds: z.array(z.string().min(1).max(80)).max(50).default([]),
  visitedFriendIds: z.array(z.string().min(1).max(80)).max(50).default([]),
  homeWorld: HomeWorldSchema.nullable().optional(),
  outfit: OutfitSchema.optional(),
}).strict();

export type CampusProgress = {
  claimedQuestIds: string[];
  visitedFriendIds: string[];
  homeWorld: WorldData | null;
  outfit: CharacterOutfit;
};

export const SaveCampusProgressSchema = z.object({
  coins: z.number().int().min(0).max(5_000_000),
  visitedFriendIds: z.array(z.string().min(1).max(80)).max(50),
  homeWorld: HomeWorldSchema,
  outfit: OutfitSchema,
}).strict();

export const ClaimSocialQuestSchema = z.object({
  questId: z.string().min(1).max(80),
}).strict();

const SOCIAL_QUEST_BY_ID = Object.fromEntries(QUESTS.map((quest) => [quest.id, quest]));

export function socialQuestById(questId: string) {
  return SOCIAL_QUEST_BY_ID[questId];
}

export function readCampusProgress(character: Record<string, unknown> | null | undefined): CampusProgress {
  const raw = character && typeof character === 'object' ? character.campusProgress : undefined;
  const parsed = CampusProgressSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return {
      claimedQuestIds: [],
      visitedFriendIds: [],
      homeWorld: null,
      outfit: normalizeOutfit(DEFAULT_OUTFIT),
    };
  }
  return {
    claimedQuestIds: parsed.data.claimedQuestIds,
    visitedFriendIds: parsed.data.visitedFriendIds,
    homeWorld: (parsed.data.homeWorld as WorldData | null | undefined) ?? null,
    outfit: normalizeOutfit(parsed.data.outfit),
  };
}

export function writeCampusProgress(
  character: Record<string, unknown> | null | undefined,
  progress: CampusProgress,
): Record<string, unknown> {
  const outfit = normalizeOutfit(progress.outfit);
  return {
    ...(character && typeof character === 'object' ? character : {}),
    campusProgress: {
      claimedQuestIds: progress.claimedQuestIds,
      visitedFriendIds: progress.visitedFriendIds,
      homeWorld: progress.homeWorld,
      outfit: {
        ownedItemIds: outfit.ownedItemIds,
        equipped: outfit.equipped,
      },
    },
  };
}

export type { CharacterOutfit, EquippedItems, ShopCategory };
