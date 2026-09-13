import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    this.load.image("tiny-town", "/game/tilesets/tiny-town.png");
    this.load.image("campus-extras", "/game/tilesets/campus-extras.png");
    this.load.tilemapTiledJSON("campus", "/game/maps/campus.json");
    this.load.spritesheet("player", "/game/characters/student.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.image("building-library", "/game/buildings/library.png");
    this.load.image("building-gym", "/game/buildings/gym.png");
    this.load.image("building-org-hall", "/game/buildings/org-hall.png");
    this.load.image("building-career", "/game/buildings/career.png");

    this.load.image("decor-tree-pine", "/game/decorations/tree-pine.png");
    this.load.image("decor-tree-round", "/game/decorations/tree-round.png");
    this.load.image("decor-tree-autumn", "/game/decorations/tree-autumn.png");
    this.load.image("decor-bush", "/game/decorations/bush.png");
    this.load.image("decor-flowers", "/game/decorations/flowers.png");
    this.load.image("decor-grass-flower", "/game/decorations/grass-flower.png");
    this.load.image("decor-bench", "/game/decorations/bench.png");
    this.load.image("decor-lamp", "/game/decorations/lamp.png");
    this.load.image("decor-mushrooms", "/game/decorations/mushrooms.png");
    this.load.image("decor-sign", "/game/decorations/sign.png");
    this.load.image("decor-well", "/game/decorations/well.png");
  }

  create() {
    const dirs = ["down", "left", "right", "up"] as const;
    dirs.forEach((dir, row) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers("player", {
          start: row * 4,
          end: row * 4 + 3,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `idle-${dir}`,
        frames: [{ key: "player", frame: row * 4 }],
        frameRate: 1,
      });
    });

    this.scene.start("WorldScene");
  }
}
