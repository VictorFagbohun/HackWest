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
  onEditableChange,
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
    <section className="game-stage">
      <WorldHud
        worldName={localWorld.name ?? "Campus"}
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
        onEditableChange={onEditableChange}
      />
      <div
        ref={hostRef}
        className="game-canvas-host"
        data-testid="game-world-host"
      />
    </section>
  );
}

export default GameWorld;
