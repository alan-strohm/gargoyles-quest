import { Scene } from "phaser";
import { Player } from "../player/Player";
import { Direction } from "../player/Player";

const doors = [
  { x: 8, y: 34 }, { x: 19, y: 34 }, { x: 21, y: 25 }, { x: 14, y: 25 },
  { x: 6, y: 25 }, { x: 1, y: 25 }, { x: 27, y: 16 }, { x: 19, y: 16 },
  { x: 10, y: 16 }, { x: 6, y: 8 }, { x: 13, y: 8 }, { x: 22, y: 8 },
  { x: 13, y: 3 }, { x: 6, y: 3 }
];

export class Game extends Scene {
  private player: Player | null = null;
  private worldLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor() {
    super("Game");
  }

  private getSpawnPoint(map: Phaser.Tilemaps.Tilemap, spawnPoint?: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    // If a custom spawn point was provided, use it
    if (spawnPoint) {
      return spawnPoint;
    }

    // Otherwise use the default spawn point from the map
    const defaultSpawnPoint = map.findObject(
      "Objects",
      (obj) => obj.name === "Spawn Point",
    );

    if (!defaultSpawnPoint || typeof defaultSpawnPoint.x !== 'number' || typeof defaultSpawnPoint.y !== 'number') {
      throw new Error("Failed to find spawn point");
    }

    return new Phaser.Math.Vector2(defaultSpawnPoint.x, defaultSpawnPoint.y);
  }

  private async handleDoorActivation(door: { x: number; y: number }) {
    // Fade out and transition to RandomHouse scene
    this.cameras.main.fade(500, 0, 0, 0);
    await new Promise(resolve => this.cameras.main.once('camerafadeoutcomplete', resolve));

    this.scene.start('RandomHouse', {
      onReturn: async (houseScene: Scene) => {
        // Calculate spawn point in front of the door
        const spawnX = door.x * 32 + 16; // Center of door tile
        const spawnY = (door.y + 1) * 32 + 16; // One tile below door

        // Fade in and return to game
        houseScene.cameras.main.fade(500, 0, 0, 0);
        await new Promise(resolve => houseScene.cameras.main.once('camerafadeoutcomplete', resolve));

        houseScene.scene.start('Game', {
          spawnPoint: new Phaser.Math.Vector2(spawnX, spawnY),
          initialDirection: Direction.DOWN
        });
      }
    });
  }

  create(data?: { spawnPoint?: Phaser.Math.Vector2, initialDirection?: Direction }) {
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
    this.player.on('activate', (point: Phaser.Math.Vector2) => {
      const tileX = map.worldToTileX(point.x);
      const tileY = map.worldToTileY(point.y);
      console.log(point, tileX, tileY);

      // Check if activation point matches any door
      const door = doors.find(door => door.x === tileX && door.y === tileY);

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
      .text(16, 16, 'Arrow keys to move\nSpace to interact', {
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
