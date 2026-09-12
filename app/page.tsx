"use client";

import { useMemo, useState } from "react";
import { GameWorld } from "@/app/components/game/GameWorld";
import { createStarterWorld } from "@/types/world";

export default function HomePage() {
  const [editable, setEditable] = useState(true);
  const [coins] = useState(1500);
  const world = useMemo(() => createStarterWorld(), []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0b1410] px-4 py-6">
      <header className="w-full max-w-6xl text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">
          HackWest
        </p>
        <h1 className="mt-1 text-3xl text-amber-100">Campus World</h1>
        <p className="mt-2 text-sm text-emerald-100/70">
          Walk the grounds. Build when it is your world. Visit when it is a
          friend&apos;s.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setEditable((value) => !value)}
          className="rounded border-2 border-amber-700 bg-[#2a1b10] px-4 py-2 text-amber-100 hover:bg-[#3a2616]"
        >
          {editable ? "View as friend (locked)" : "Edit my world"}
        </button>
        <span className="text-emerald-100/70">
          {editable
            ? "Build mode available"
            : "Explore only — objects are locked"}
        </span>
      </div>

      <GameWorld
        world={world}
        coins={coins}
        editable={editable}
        playerName="Daniel"
      />
    </main>
  );
}
