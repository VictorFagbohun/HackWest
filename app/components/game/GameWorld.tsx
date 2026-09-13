"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogItem, GameWorldProps, WorldData } from "@/types/world";
import { WorldHud } from "@/app/components/game/hud/WorldHud";
import { usePhaserGame } from "@/app/components/game/usePhaserGame";
import { useTutorialWorldReporter } from "@/app/components/tutorial/TutorialProvider";

export function GameWorld({
  world,
  coins,
  editable,
  playerName,
  worldOwnerName = playerName,
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
  const [worldReady, setWorldReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const reportWorld = useTutorialWorldReporter();

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

  useEffect(() => {
    if (!worldReady) return;
    const timer = window.setTimeout(() => setLoaderGone(true), 700);
    return () => window.clearTimeout(timer);
  }, [worldReady]);

  useEffect(() => {
    reportWorld?.({
      editable,
      buildMode,
      selectedCatalogId,
      objectCount: localWorld.objects.length,
      prompt,
      worldReady: loaderGone,
    });
  }, [
    reportWorld,
    editable,
    buildMode,
    selectedCatalogId,
    localWorld.objects.length,
    prompt,
    loaderGone,
  ]);

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

  const handleReady = useCallback(() => {
    setWorldReady(true);
  }, []);

  const runtimeProps = useMemo(
    () => ({
      world: localWorld,
      coins: localCoins,
      editable,
      playerName,
      worldOwnerName,
      buildMode: editable && buildMode,
      selectedCatalogId: editable && buildMode ? selectedCatalogId : null,
    }),
    [
      localWorld,
      localCoins,
      editable,
      playerName,
      worldOwnerName,
      buildMode,
      selectedCatalogId,
    ],
  );

  usePhaserGame(hostRef, runtimeProps, {
    onWorldChange: handleWorldChange,
    onCoinsChange: handleCoinsChange,
    onPrompt: setPrompt,
    onReady: handleReady,
  });

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedCatalogId(item.id);
    setBuildMode(true);
  };

  return (
    <section className={`game-stage${worldReady ? " game-stage-ready" : ""}`}>
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
        data-tutorial-id="canvas"
      />
      {!loaderGone ? (
        <div
          className={`world-loader${worldReady ? " world-loader-exit" : ""}`}
          aria-live="polite"
          aria-busy={!worldReady}
        >
          <div className="world-loader-sky" aria-hidden="true" />
          <div className="world-loader-hills" aria-hidden="true" />
          <div className="world-loader-ground" aria-hidden="true" />
          <div className="world-loader-cast" aria-hidden="true">
            <span className="world-loader-walker" />
          </div>
          <p className="world-loader-copy">
            <span>Entering campus</span>
            <i className="world-loader-dots" aria-hidden="true">
              <b>.</b>
              <b>.</b>
              <b>.</b>
            </i>
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default GameWorld;
