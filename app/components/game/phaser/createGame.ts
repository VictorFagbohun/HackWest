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
    width: parent.clientWidth || window.innerWidth,
    height: parent.clientHeight || window.innerHeight,
    // Match the page letterbox so asset preload doesn't flash solid grass green.
    backgroundColor: "#0a120e",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || window.innerWidth,
      height: parent.clientHeight || window.innerHeight,
      expandParent: false,
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
