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
  worldOwnerName: string;
  buildMode: boolean;
  selectedCatalogId: string | null;
}

type PhaserGameHandle = {
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  events?: { emit: (event: string, payload: GameRuntimeProps) => void };
  scale?: { refresh: () => void };
};

export function usePhaserGame(
  hostRef: React.RefObject<HTMLDivElement | null>,
  props: GameRuntimeProps,
  bridge: PhaserBridge,
) {
  const gameRef = useRef<PhaserGameHandle | null>(null);
  const propsRef = useRef(props);
  const bridgeRef = useRef(bridge);

  propsRef.current = props;
  bridgeRef.current = bridge;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

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

        resizeObserver = new ResizeObserver(() => {
          game.scale.refresh();
        });
        resizeObserver.observe(hostRef.current);
        game.scale.refresh();
      } catch (error) {
        console.error("[GameWorld] failed to start Phaser", error);
      }
    };

    void start();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      gameRef.current?.destroy(true);
      gameRef.current = null;
      host.replaceChildren();
    };
  }, [hostRef]);

  useEffect(() => {
    gameRef.current?.events?.emit("game-props", props);
  }, [props]);
}
