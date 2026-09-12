"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogItem, GameWorldProps, WorldData } from "@/types/world";
import { WorldHud } from "@/app/components/game/hud/WorldHud";
import { usePhaserGame } from "@/app/components/game/usePhaserGame";

export function GameWorld({
  world,
  coins,
  editable,
  playerName,
  onWorldChange,
  onCoinsChange,
}: GameWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [localWorld, setLocalWorld] = useState<WorldData>(world);
  const [localCoins, setLocalCoins] = useState(coins);
  const [buildMode, setBuildMode] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    null,
  );
  const [prompt, setPrompt] = useState<string | null>(null);

  useEffect(() => {
    setLocalWorld(world);
  }, [world]);

  useEffect(() => {
    setLocalCoins(coins);
  }, [coins]);

  useEffect(() => {
    if (!editable) {
      setBuildMode(false);
      setSelectedCatalogId(null);
    }
  }, [editable]);

  const handleWorldChange = useCallback(
    (next: WorldData) => {
      setLocalWorld(next);
      onWorldChange?.(next);
    },
    [onWorldChange],
  );

  const handleCoinsChange = useCallback(
    (next: number) => {
      setLocalCoins(next);
      onCoinsChange?.(next);
    },
    [onCoinsChange],
  );

  const runtimeProps = useMemo(
    () => ({
      world: localWorld,
      coins: localCoins,
      editable,
      playerName,
      buildMode: editable && buildMode,
      selectedCatalogId: editable && buildMode ? selectedCatalogId : null,
    }),
    [
      localWorld,
      localCoins,
      editable,
      playerName,
      buildMode,
      selectedCatalogId,
    ],
  );

  usePhaserGame(hostRef, runtimeProps, {
    onWorldChange: handleWorldChange,
    onCoinsChange: handleCoinsChange,
    onPrompt: setPrompt,
  });

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedCatalogId(item.id);
    setBuildMode(true);
  };

  return (
    <section className="w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-lg border-4 border-[#6b3e1a] bg-[#0d1a12] shadow-[0_12px_0_#2a1b10]">
        <div className="border-b-2 border-[#8a5a2b] bg-[#3d2918] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-amber-100/80">
          {localWorld.name ?? "Campus"}
        </div>
        <div className="relative">
          <WorldHud
            playerName={playerName}
            coins={localCoins}
            editable={editable}
            buildMode={buildMode}
            selectedCatalogId={selectedCatalogId}
            prompt={prompt}
            onToggleBuild={() => {
              setBuildMode((value) => !value);
              setSelectedCatalogId(null);
            }}
            onSelectItem={handleSelectItem}
          />
          <div
            ref={hostRef}
            className="aspect-[3/2] w-full bg-black"
            data-testid="game-world-host"
          />
        </div>
      </div>
    </section>
  );
}

export default GameWorld;
