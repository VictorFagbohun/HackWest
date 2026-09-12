"use client";

import { useEffect, useRef } from "react";
import type { WorldData } from "@/types/world";

export interface PhaserBridge {
  onWorldChange: (world: WorldData) => void;
  onCoinsChange: (coins: number) => void;
  onPrompt: (prompt: string | null) => void;
}

export interface GameRuntimeProps {
  world: WorldData;
  coins: number;
  editable: boolean;
  playerName: string;
  buildMode: boolean;
  selectedCatalogId: string | null;
}

export function usePhaserGame(
  hostRef: React.RefObject<HTMLDivElement | null>,
  props: GameRuntimeProps,
  bridge: PhaserBridge,
) {
  const gameRef = useRef<{
    destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
    events?: { emit: (event: string, payload: GameRuntimeProps) => void };
  } | null>(null);
  const propsRef = useRef(props);
  const bridgeRef = useRef(bridge);

  propsRef.current = props;
  bridgeRef.current = bridge;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    const start = async () => {
      try {
        const Phaser = (await import("phaser")).default;
        const { createGame } = await import("./phaser/createGame");
        if (cancelled || !hostRef.current) return;

        const game = createGame(Phaser, hostRef.current, {
          getProps: () => propsRef.current,
          getBridge: () => bridgeRef.current,
        });
        gameRef.current = game;
      } catch (error) {
        console.error("[GameWorld] failed to start Phaser", error);
      }
    };

    void start();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
      host.replaceChildren();
    };
  }, [hostRef]);

  useEffect(() => {
    gameRef.current?.events?.emit("game-props", props);
  }, [props]);
}
