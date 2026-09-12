import type { PhaserBridge, GameRuntimeProps } from "@/app/components/game/usePhaserGame";

export interface GameFactoryContext {
  getProps: () => GameRuntimeProps;
  getBridge: () => PhaserBridge;
}
