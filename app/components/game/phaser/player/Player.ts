import Phaser from "phaser";
import { TILE_SIZE } from "@/types/world";

const SPEED = 76;
/** Matches walk anim (~8 fps / 4 frames → two steps per cycle). */
const FOOTSTEP_MS = 250;
const FOOTSTEP_VOLUME = 0.28;
const MUTE_STORAGE_KEY = "campus-quest-theme-muted";

export class Player {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<
    "up" | "down" | "left" | "right",
    Phaser.Input.Keyboard.Key
  >;
  private facing: "down" | "left" | "right" | "up" = "down";
  private nameTag: Phaser.GameObjects.Text;
  private shadow: Phaser.GameObjects.Ellipse;
  private footstepElapsed = 0;
  private wasMoving = false;
  private awaitingUnlock = false;

  constructor(
    private scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    playerName: string,
  ) {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;

    this.shadow = scene.add.ellipse(x, y + 5, 12, 5, 0x1a120c, 0.28);
    this.shadow.setDepth(y - 0.1);

    this.sprite = scene.physics.add.sprite(x, y, "player", 0);
    this.sprite.setSize(10, 8);
    this.sprite.setOffset(3, 8);
    this.sprite.setDepth(y);

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = {
        up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.nameTag = scene.add
      .text(x, y - 14, playerName, {
        fontFamily: "Pixelify Sans, monospace",
        fontSize: "8px",
        color: "#fff4d2",
        stroke: "#1a140f",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(10000);
  }

  private isMuted() {
    try {
      return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  private playFootstep() {
    if (this.isMuted() || !this.scene.cache.audio.exists("footstep")) return;

    if (this.scene.sound.locked) {
      if (!this.awaitingUnlock) {
        this.awaitingUnlock = true;
        this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.awaitingUnlock = false;
        });
      }
      return;
    }

    this.scene.sound.play("footstep", {
      volume: FOOTSTEP_VOLUME * (0.85 + Math.random() * 0.3),
      rate: 0.92 + Math.random() * 0.16,
    });
  }

  setName(playerName: string) {
    this.nameTag.setText(playerName);
  }

  update() {
    const left = !!(this.cursors?.left.isDown || this.wasd?.left.isDown);
    const right = !!(this.cursors?.right.isDown || this.wasd?.right.isDown);
    const up = !!(this.cursors?.up.isDown || this.wasd?.up.isDown);
    const down = !!(this.cursors?.down.isDown || this.wasd?.down.isDown);

    const vx = (left ? -1 : 0) + (right ? 1 : 0);
    const vy = (up ? -1 : 0) + (down ? 1 : 0);

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const length = Math.hypot(vx, vy);
      this.sprite.setVelocity((vx / length) * SPEED, (vy / length) * SPEED);
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx < 0 ? "left" : "right";
      } else {
        this.facing = vy < 0 ? "up" : "down";
      }
      this.sprite.anims.play(`walk-${this.facing}`, true);

      if (!this.wasMoving) {
        this.footstepElapsed = FOOTSTEP_MS;
      }
      this.footstepElapsed += this.scene.game.loop.delta;
      while (this.footstepElapsed >= FOOTSTEP_MS) {
        this.footstepElapsed -= FOOTSTEP_MS;
        this.playFootstep();
      }
    } else {
      this.sprite.setVelocity(0, 0);
      this.sprite.anims.play(`idle-${this.facing}`, true);
      this.footstepElapsed = 0;
    }
    this.wasMoving = moving;

    this.sprite.setDepth(this.sprite.y);
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 5);
    this.shadow.setDepth(this.sprite.y - 0.1);
    this.nameTag.setPosition(this.sprite.x, this.sprite.y - 12);
    this.nameTag.setDepth(this.sprite.y + 1);
  }

  destroy() {
    this.shadow.destroy();
    this.nameTag.destroy();
    this.sprite.destroy();
  }
}
