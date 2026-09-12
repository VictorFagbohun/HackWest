"use client";

import { useMemo, useState } from "react";
import { GameWorld } from "@/app/components/game/GameWorld";
import { createStarterWorld } from "@/types/world";

export default function HomePage() {
  const [editable, setEditable] = useState(true);
  const [coins] = useState(1500);
  const world = useMemo(() => createStarterWorld(), []);

  return (
    <main className="game-shell">
      <GameWorld
        world={world}
        coins={coins}
        editable={editable}
        playerName="Daniel"
        onEditableChange={setEditable}
      />
    </main>
  );
}
