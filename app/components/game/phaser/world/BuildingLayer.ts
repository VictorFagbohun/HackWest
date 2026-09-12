import Phaser from "phaser";
import {
  TILE_SIZE,
  catalogById,
  type CatalogItem,
  type WorldObject,
} from "@/types/world";

export interface PlacedSprite extends Phaser.Physics.Arcade.Sprite {
  worldObject: WorldObject;
  catalogItem: CatalogItem;
}

export class BuildingLayer {
  group: Phaser.Physics.Arcade.StaticGroup;
  placed: PlacedSprite[] = [];
  private ghost?: Phaser.GameObjects.Image;

  constructor(private scene: Phaser.Scene) {
    this.group = scene.physics.add.staticGroup();
  }

  sync(objects: WorldObject[]) {
    this.placed.forEach((sprite) => sprite.destroy());
    this.placed = [];
    this.group.clear(true, true);

    objects.forEach((object) => {
      const item = catalogById[object.catalogId];
      if (!item) return;
      this.spawn(object, item);
    });
  }

  private spawn(object: WorldObject, item: CatalogItem) {
    const x = object.x * TILE_SIZE + (item.width * TILE_SIZE) / 2;
    const y = object.y * TILE_SIZE + (item.height * TILE_SIZE) / 2;
    const sprite = this.scene.physics.add.staticSprite(
      x,
      y,
      item.textureKey,
    ) as PlacedSprite;
    sprite.worldObject = object;
    sprite.catalogItem = item;
    sprite.setOrigin(0.5, 0.5);
    sprite.setDepth(y + (item.height * TILE_SIZE) / 2);
    sprite.refreshBody();
    if (item.kind === "decor" && item.height === 1 && item.width === 1) {
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody | null;
      body?.setSize(10, 8);
      body?.setOffset(3, 8);
    }
    this.group.add(sprite);
    this.placed.push(sprite);
  }

  objectAtTile(tileX: number, tileY: number) {
    return this.placed.find((sprite) => {
      const { x, y } = sprite.worldObject;
      const { width, height } = sprite.catalogItem;
      return tileX >= x && tileX < x + width && tileY >= y && tileY < y + height;
    });
  }

  showGhost(item: CatalogItem | null, tileX: number, tileY: number, valid: boolean) {
    if (!item) {
      this.ghost?.setVisible(false);
      return;
    }
    if (!this.ghost || this.ghost.texture.key !== item.textureKey) {
      this.ghost?.destroy();
      this.ghost = this.scene.add.image(0, 0, item.textureKey);
    }
    this.ghost.setVisible(true);
    this.ghost.setAlpha(valid ? 0.7 : 0.35);
    this.ghost.setTint(valid ? 0xffffff : 0xff5555);
    this.ghost.setPosition(
      tileX * TILE_SIZE + (item.width * TILE_SIZE) / 2,
      tileY * TILE_SIZE + (item.height * TILE_SIZE) / 2,
    );
    this.ghost.setDepth(1000);
  }

  hideGhost() {
    this.ghost?.setVisible(false);
  }

  nearest(x: number, y: number, range: number): PlacedSprite | null {
    let best: PlacedSprite | null = null;
    let bestDist = range;
    for (const sprite of this.placed) {
      const dist = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (dist < bestDist) {
        best = sprite;
        bestDist = dist;
      }
    }
    return best;
  }
}
