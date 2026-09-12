import Phaser from "phaser";
import type { GameFactoryContext } from "@/app/components/game/phaser/context";
import type { GameRuntimeProps } from "@/app/components/game/usePhaserGame";
import { Player } from "@/app/components/game/phaser/player/Player";
import { BuildingLayer } from "@/app/components/game/phaser/world/BuildingLayer";
import { inspectPrompt } from "@/app/components/game/phaser/world/Interactables";
import {
  TILE_SIZE,
  catalogById,
  type CatalogItem,
  type WorldObject,
} from "@/types/world";

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private buildings!: BuildingLayer;
  private collisionLayer?: Phaser.Tilemaps.TilemapLayer;
  private inspectKey?: Phaser.Input.Keyboard.Key;
  private deleteKey?: Phaser.Input.Keyboard.Key;
  private lastPrompt: string | null = null;
  private lastObjectSignature = "";

  constructor() {
    super({ key: "WorldScene" });
  }

  private context() {
    return this.game.registry.get("gameContext") as GameFactoryContext;
  }

  private props() {
    return this.context().getProps();
  }

  create() {
    const props = this.props();
    const map = this.make.tilemap({ key: props.world.mapKey });
    const town = map.addTilesetImage("tiny-town", "tiny-town");
    const extras = map.addTilesetImage("campus-extras", "campus-extras");
    if (!town || !extras) {
      throw new Error(
        `Campus tilesets failed to load. town=${!!town} extras=${!!extras}`,
      );
    }

    const ground = map.createLayer("ground", [town, extras], 0, 0);
    map.createLayer("water", [town, extras], 0, 0)?.setDepth(1);
    map.createLayer("details", [town, extras], 0, 0)?.setDepth(2);
    map.createLayer("scenery", [town, extras], 0, 0)?.setDepth(3);
    ground?.setDepth(0);
    if (!ground) {
      throw new Error("Ground layer failed to create.");
    }

    this.collisionLayer =
      map.createLayer("collision", [town, extras], 0, 0) ?? undefined;
    this.collisionLayer?.setCollisionByExclusion([-1, 0]);
    this.collisionLayer?.setVisible(false);

    this.buildings = new BuildingLayer(this);
    this.buildings.sync(props.world.objects);
    this.lastObjectSignature = `${props.world.id}:${props.world.objects
      .map((object) => object.id)
      .join(",")}`;

    this.player = new Player(
      this,
      props.world.spawn.x,
      props.world.spawn.y,
      props.playerName,
    );

    if (this.collisionLayer) {
      this.physics.add.collider(this.player.sprite, this.collisionLayer);
    }
    this.physics.add.collider(this.player.sprite, this.buildings.group);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.player.sprite.setCollideWorldBounds(true);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.inspectKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.deleteKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handlePointer(pointer);
    });

    this.game.events.on("game-props", this.onProps, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("game-props", this.onProps, this);
    });
  }

  private onProps = (next: GameRuntimeProps) => {
    this.player.setName(next.playerName);
    const signature = `${next.world.id}:${next.world.objects
      .map((object) => object.id)
      .join(",")}`;
    if (signature !== this.lastObjectSignature) {
      this.lastObjectSignature = signature;
      this.buildings.sync(next.world.objects);
    }
    if (!next.buildMode) this.buildings.hideGhost();
  };

  private handlePointer(pointer: Phaser.Input.Pointer) {
    const props = this.props();
    if (!props.editable || !props.buildMode) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tileX = Math.floor(worldPoint.x / TILE_SIZE);
    const tileY = Math.floor(worldPoint.y / TILE_SIZE);
    const existing = this.buildings.objectAtTile(tileX, tileY);

    if (existing) {
      this.removeObject(existing.worldObject.id, true);
      return;
    }

    if (!props.selectedCatalogId) return;
    const item = catalogById[props.selectedCatalogId];
    if (!item || props.coins < item.cost) return;
    if (!this.canPlace(item, tileX, tileY)) return;

    const nextObject: WorldObject = {
      id: `${item.id}-${Date.now()}`,
      catalogId: item.id,
      kind: item.kind,
      x: tileX,
      y: tileY,
    };

    const bridge = this.context().getBridge();
    bridge.onWorldChange({
      ...props.world,
      objects: [...props.world.objects, nextObject],
    });
    bridge.onCoinsChange(props.coins - item.cost);
  }

  private canPlace(item: CatalogItem | undefined, tileX: number, tileY: number) {
    if (!item) return false;
    for (let y = 0; y < item.height; y += 1) {
      for (let x = 0; x < item.width; x += 1) {
        if (this.buildings.objectAtTile(tileX + x, tileY + y)) return false;
        const tile = this.collisionLayer?.getTileAt(tileX + x, tileY + y);
        if (tile && tile.index > 0) return false;
      }
    }
    return true;
  }

  private removeObject(id: string, refund: boolean) {
    const props = this.props();
    const target = props.world.objects.find((object) => object.id === id);
    if (!target) return;
    const item = catalogById[target.catalogId];
    const bridge = this.context().getBridge();
    bridge.onWorldChange({
      ...props.world,
      objects: props.world.objects.filter((object) => object.id !== id),
    });
    if (refund && item) {
      bridge.onCoinsChange(props.coins + Math.floor(item.cost / 2));
    }
  }

  update() {
    const props = this.props();
    this.player.update();

    const target = this.buildings.nearest(
      this.player.sprite.x,
      this.player.sprite.y,
      28,
    );
    const hoverPrompt = inspectPrompt(target, props.playerName);
    if (hoverPrompt !== this.lastPrompt) {
      this.lastPrompt = hoverPrompt;
      this.context().getBridge().onPrompt(hoverPrompt);
    }

    if (
      this.inspectKey &&
      Phaser.Input.Keyboard.JustDown(this.inspectKey) &&
      target
    ) {
      this.context()
        .getBridge()
        .onPrompt(inspectPrompt(target, props.playerName));
    }

    if (
      props.editable &&
      props.buildMode &&
      this.deleteKey &&
      Phaser.Input.Keyboard.JustDown(this.deleteKey) &&
      target
    ) {
      this.removeObject(target.worldObject.id, true);
    }

    if (props.editable && props.buildMode && props.selectedCatalogId) {
      const item = catalogById[props.selectedCatalogId];
      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tileX = Math.floor(worldPoint.x / TILE_SIZE);
      const tileY = Math.floor(worldPoint.y / TILE_SIZE);
      const valid =
        !!item && this.canPlace(item, tileX, tileY) && props.coins >= item.cost;
      this.buildings.showGhost(item ?? null, tileX, tileY, valid);
    } else {
      this.buildings.hideGhost();
    }
  }
}
