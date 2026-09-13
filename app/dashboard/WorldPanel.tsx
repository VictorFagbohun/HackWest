"use client";

import { useMemo } from "react";
import { GameWorld } from "@/app/components/game/GameWorld";
import { createStarterWorld } from "@/types/world";
import { playerProfile } from "./mockData";

export function WorldPanel() {
  const world = useMemo(() => createStarterWorld(), []);

  return (
    <GameWorld
      world={world}
      coins={playerProfile.coins}
      editable
      playerName={playerProfile.name}
    />
  );
}
