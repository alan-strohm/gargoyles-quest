import { Scene } from "phaser";
import { Player } from "../player/Player";
import { Direction } from "../player/Player";
import { HouseDescription } from "./DynamicHouse";
import { Heart } from "../items/Items";

const doors = [
  { x: 8, y: 34 },
  { x: 19, y: 34 },
  { x: 21, y: 25 },
  { x: 14, y: 25 },
  { x: 6, y: 25 },
  { x: 1, y: 25 },
  { x: 27, y: 16 },
  { x: 19, y: 16 },
  { x: 10, y: 16 },
  { x: 6, y: 8 },
  { x: 13, y: 8 },
  { x: 22, y: 8 },
  { x: 13, y: 3 },
  { x: 6, y: 3 },
].map((door) => {
  const house = randomHouse();
  return {
    ...door,
    house,
  };
});

// Choose one random house to contain the macguffin
const macguffinHouseIndex = Math.floor(Math.random() * doors.length);
const macguffinHouse = doors[macguffinHouseIndex].house;
const { room } = macguffinHouse;

// Place macguffin at a random position within the floor area
// Add 1 to x and y to account for walls, and subtract 1 from width and height to keep away from walls
const macguffinX = Math.floor(Math.random() * (room.width - 4)) + 2;
const macguffinY =
  Math.floor(Math.random() * (room.overHeight - 4)) + 2 + room.sideHeight;

macguffinHouse.items = [
  { item: new Heart(), tileX: macguffinX, tileY: macguffinY },
];

function randomHouse(): HouseDescription {
  const minFloorArea = 75;
  const maxFloorArea = 200;

  // Choose a target area within the range
  const targetArea =
    Math.floor(Math.random() * (maxFloorArea - minFloorArea)) + minFloorArea;

  // Using golden ratio (φ ≈ 1.618)
  const phi = 1.618033988749895;

  // Calculate the shorter side using the golden ratio
  // If width/height = φ, then height = width/φ
  // And since width * height = area, we can solve for width:
  // width * (width/φ) = area
  // width² = area * φ
  // width = √(area * φ)
  const width = Math.sqrt(targetArea * phi);

  // Round to nearest integer
  let floorCols = Math.round(width);
  let floorRows = Math.round(targetArea / floorCols);

  // Ensure dimensions are at least 3 (minimum width-2)
  if (floorCols < 3 || floorRows < 3) {
    floorRows = 3;
    floorCols = 3;
  }
  // sideHeight: 2 (60%), 1 (30%), 3 (10%)
  const sideHeightRoll = Math.random();
  const sideHeight = sideHeightRoll < 0.6 ? 2 : sideHeightRoll < 0.9 ? 1 : 3;
  const tileRoll = Math.floor(Math.random() * 30);
  console.log("tileRoll", tileRoll);
  return {
    room: {
      width: floorCols + 2,
      overHeight: floorRows + 3 + sideHeight,
      sideHeight,
      // Generate valid door position (>= 2 and < width-3)
      doorPosition: Math.floor(Math.random() * (floorCols - 5)) + 2,
    },
    tileOffset: (tileRoll % 4) * 7 + Math.floor(tileRoll / 4) * 322,
    items: [],
  };
}

export class Game extends Scene {
  private player: Player | null = null;
  private worldLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor() {
    super("Game");
  }

  private getSpawnPoint(
    map: Phaser.Tilemaps.Tilemap,
    spawnPoint?: Phaser.Math.Vector2,
  ): Phaser.Math.Vector2 {
    // If a custom spawn point was provided, use it
    if (spawnPoint) {
      return spawnPoint;
    }

    // Otherwise use the default spawn point from the map
    const defaultSpawnPoint = map.findObject(
      "Objects",
      (obj) => obj.name === "Spawn Point",
    );

    if (
      !defaultSpawnPoint ||
      typeof defaultSpawnPoint.x !== "number" ||
      typeof defaultSpawnPoint.y !== "number"
    ) {
      throw new Error("Failed to find spawn point");
    }

    return new Phaser.Math.Vector2(defaultSpawnPoint.x, defaultSpawnPoint.y);
  }

  private async handleDoorActivation(door: {
    x: number;
    y: number;
    house: HouseDescription;
  }) {
    // Fade out and transition to RandomHouse scene
    this.cameras.main.fade(500, 0, 0, 0);
    await new Promise((resolve) =>
      this.cameras.main.once("camerafadeoutcomplete", resolve),
    );

    this.scene.start("DynamicHouse", {
      house: door.house,
      onReturn: async (houseScene: Scene) => {
        // Calculate spawn point in front of the door
        const spawnX = door.x * 32 + 16; // Center of door tile
        const spawnY = (door.y + 1) * 32 + 16; // One tile below door

        // Fade in and return to game
        houseScene.cameras.main.fade(500, 0, 0, 0);
        await new Promise((resolve) =>
          houseScene.cameras.main.once("camerafadeoutcomplete", resolve),
        );

        houseScene.scene.start("Game", {
          spawnPoint: new Phaser.Math.Vector2(spawnX, spawnY),
          initialDirection: Direction.DOWN,
        });
      },
    });
  }

  create(data?: {
    spawnPoint?: Phaser.Math.Vector2;
    initialDirection?: Direction;
  }) {
    const map = this.make.tilemap({ key: "map" });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
    if (!tileset) {
      throw new Error("Failed to load tileset");
    }

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createLayer("Below Player", tileset, 0, 0);
    this.worldLayer = map.createLayer("World", tileset, 0, 0);
    const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

    if (!this.worldLayer || !aboveLayer) {
      throw new Error("Failed to create map layers");
    }

    this.worldLayer.setCollisionByProperty({ collides: true });

    // By default, everything gets depth sorted on the screen in the order we created things. Here, we
    // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
    // Higher depths will sit on top of lower depth objects.
    aboveLayer.setDepth(10);

    // Get the spawn point and create the player
    const spawnPoint = this.getSpawnPoint(map, data?.spawnPoint);
    this.player = new Player(this, spawnPoint, data?.initialDirection);

    // Listen for player activation events
    this.player.on("activate", (point: Phaser.Math.Vector2) => {
      const tileX = map.worldToTileX(point.x);
      const tileY = map.worldToTileY(point.y);
      console.log(point, tileX, tileY);

      // Check if activation point matches any door
      const door = doors.find((door) => door.x === tileX && door.y === tileY);

      if (door) {
        this.handleDoorActivation(door);
      }
    });

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.getSprite(), this.worldLayer);

    const camera = this.cameras.main;
    camera.startFollow(this.player.getSprite());
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, "Arrow keys to move\nSpace to interact\nFind the heart!", {
        font: "18px monospace",
        color: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(30);

    // Debug graphics
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.once("keydown-D", () => {
        // Turn on physics debugging to show player's hitbox
        this.physics.world.createDebugGraphic();

        // Create worldLayer collision graphic above the player, but below the help text
        const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
        this.worldLayer?.renderDebug(graphics, {
          tileColor: null, // Color of non-colliding tiles
          collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
          faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
        });
      });
    }
  }

  shutdown() {
    if (this.player) {
      this.player.shutdown();
      this.player = null;
    }
  }
}
