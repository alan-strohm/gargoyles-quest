import { Scene } from "phaser";
import { Player } from "../player/Player";

export class Game extends Scene {
  private player: Player | null = null;
  private worldLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor() {
    super("Game");
  }

  create() {
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

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = map.findObject(
      "Objects",
      (obj) => obj.name === "Spawn Point",
    );

    if (!spawnPoint || typeof spawnPoint.x !== 'number' || typeof spawnPoint.y !== 'number') {
      throw new Error("Failed to find spawn point");
    }

    // Create the player
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.getSprite(), this.worldLayer);

    // Add collision with door objects
    const doorObjects = map.getObjectLayer("Objects")?.objects.filter(obj => obj.type === "Door") || [];

    for (const doorObj of doorObjects) {
      if (typeof doorObj.x === 'number' && typeof doorObj.y === 'number') {
        const doorZone = this.add.zone(doorObj.x, doorObj.y, 32, 16);
        this.physics.add.existing(doorZone, true);

        this.physics.add.overlap(
          this.player.getSprite(),
          doorZone,
          () => {
            // Start the RandomHouse scene
            this.scene.start('RandomHouse');
          },
          undefined,
          this
        );
      }
    }

    const camera = this.cameras.main;
    camera.startFollow(this.player.getSprite());
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
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
