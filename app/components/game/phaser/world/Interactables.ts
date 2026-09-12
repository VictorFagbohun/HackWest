import type { PlacedSprite } from "@/app/components/game/phaser/world/BuildingLayer";

export function inspectPrompt(target: PlacedSprite | null, playerName: string) {
  if (!target) return null;
  return (
    target.catalogItem.interactLabel ??
    `${target.catalogItem.name} on ${playerName}'s campus`
  );
}
