import type { GameFactoryContext } from "@/app/components/game/phaser/context";
import { BootScene } from "@/app/components/game/phaser/scenes/BootScene";
import { WorldScene } from "@/app/components/game/phaser/scenes/WorldScene";

export function createGame(
  Phaser: typeof import("phaser"),
  parent: HTMLElement,
  context: GameFactoryContext,
) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#7ec850",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 480,
      height: 320,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, WorldScene],
    callbacks: {
      preBoot: (booting) => {
        booting.registry.set("gameContext", context);
      },
    },
  });

  return game;
}
