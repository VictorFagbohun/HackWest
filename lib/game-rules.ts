import { z } from 'zod';
export const UUID = z.string().uuid();
export const ItemId = z.string().regex(/^[a-z_]{1,50}$/);
export const Scope = z.enum(['ALL_TIME', 'WEEKLY', 'FRIENDS']);
export const LocationCode = z.enum(['LIBRARY', 'REC_CENTER', 'CAREER_CENTER', 'STUDENT_UNION', 'HACKATHON']);
export type LocationCode = z.infer<typeof LocationCode>;
export const categoryStat = { SCHOLAR: 'knowledge', WELLNESS: 'wellness', COMMUNITY: 'community', CAREER: 'career' } as const;
export function levelForXp(xp: number): number {
  return Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
}
export function gridSize() {
  return z.coerce.number().int().min(1).max(200).parse(process.env.WORLD_GRID_SIZE ?? 20);
}
export const Placement = z.object({ itemId: ItemId, x: z.number().int().nonnegative(), y: z.number().int().nonnegative() }).strict();
export const Placements = z.array(Placement).max(100);
