import { Scene } from "phaser";

export interface Item {
  // Unique identifier for the item type
  readonly id: string;
  // Create the item's animations
  createAnimations(anims: Phaser.Animations.AnimationManager): void;
  // Create a sprite for this item at the given position
  createSprite(scene: Scene, x: number, y: number): Phaser.GameObjects.Sprite;
  // Called when the player activates this item
  activate(scene: Scene): void;
}

// Private registry of all item types
const ITEMS: { [key: string]: new () => Item } = {};

// Helper function to register an item type
export function registerItem(itemClass: new () => Item) {
  const item = new itemClass();
  ITEMS[item.id] = itemClass;
}

// Create a new instance of an item by its ID
export function createItem(id: string): Item {
  const ItemClass = ITEMS[id];
  if (!ItemClass) {
    throw new Error(`No item registered with id: ${id}`);
  }
  return new ItemClass();
}

// Create animations for all registered items
export function createItemAnimations(
  anims: Phaser.Animations.AnimationManager,
): void {
  Object.values(ITEMS).forEach((ItemClass) => {
    const item = new ItemClass();
    item.createAnimations(anims);
  });
}

export class Heart implements Item {
  readonly id: string;

  constructor() {
    this.id = `heart`;
  }

  createAnimations(anims: Phaser.Animations.AnimationManager): void {
    anims.create({
      key: "heart",
      frames: anims.generateFrameNames("atlas-16px", {
        prefix: "heart-",
        start: 0,
        end: 3,
        zeroPad: 0,
      }),
      frameRate: 5,
      repeat: -1,
    });
  }

  createSprite(
    scene: Scene,
    x: number,
    y: number,
  ): Phaser.Types.Physics.Arcade.SpriteWithStaticBody {
    const sprite = scene.physics.add
      .staticSprite(x, y, "atlas-16px", `heart-0`)
      .setSize(24, 24)
      .setOffset(4, 4);
    sprite.play("heart");
    return sprite;
  }

  async activate(scene: Scene): Promise<void> {
    scene.cameras.main.fade(500, 0, 0, 0);
    await new Promise((resolve) =>
      scene.cameras.main.once("camerafadeoutcomplete", resolve),
    );
    scene.scene.start("Game", null);
  }
}

// Register all gem types
registerItem(Heart);
