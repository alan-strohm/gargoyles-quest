import { Scene } from "phaser";
import { RoomTiling, RoomDescription, TileTypes } from "../room/RoomTiling";
import { Player, Direction, PlayerEvents } from "../player/Player";

// Base tile ID for wall tiles - adjust this to match your tileset
const DEFAULT_WALL_BASE_ID = 0;

export class RandomHouse extends Scene {
  private belowLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private aboveLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private player: Player | null = null;

  constructor() {
    super("RandomHouse");
  }

  /**
   * Maps TileTypes to actual tile IDs using offsets from a base wall tile ID.
   * You will need to adjust the offsets to match your tileset.
   */
  private mapTileTypesToIds(wallBaseId: number): TileTypes {
    return {
      // Over tiles (double line)
      overTopLeftCorner: wallBaseId + 0,
      overTopWall: wallBaseId + 1,
      overTopRightCorner: wallBaseId + 2,
      overLeftWall: wallBaseId + 46,
      floor: wallBaseId + 47,
      overRightWall: wallBaseId + 48,
      overBottomLeftCorner: wallBaseId + 92,
      overBottomWall: wallBaseId + 93,
      overBottomRightCorner: wallBaseId + 94,
      overInternalRightCorner: wallBaseId + 232,
      overInternalLeftCorner: wallBaseId + 230,

      // Side tiles (single line)
      sideLeftWall: wallBaseId + 138,
      sideMidWall: wallBaseId + 139,
      sideRightWall: wallBaseId + 140,
      sideBottomLeftCorner: wallBaseId + 184,
      sideBottomWall: wallBaseId + 185,
      sideBottomRightCorner: wallBaseId + 186
    };
  }

  /**
   * Calculates floor dimensions using the golden ratio (φ ≈ 1.618) to create aesthetically pleasing room proportions.
   * @param minFloorArea Minimum floor area (exclusive)
   * @param maxFloorArea Maximum floor area (exclusive)
   * @returns Object containing floorRows and floorCols
   */
  private calculateFloorDimensions(minFloorArea: number, maxFloorArea: number): { floorRows: number, floorCols: number } {
    // Choose a target area within the range
    const targetArea = Math.floor(Math.random() * (maxFloorArea - minFloorArea - 1)) + minFloorArea + 1;

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
    const floorCols = Math.round(width);
    const floorRows = Math.round(targetArea / floorCols);

    // Ensure dimensions are at least 3 (minimum width-2)
    if (floorCols < 3 || floorRows < 3) {
      return {
        floorRows: Math.max(3, floorRows),
        floorCols: Math.max(3, floorCols)
      };
    }

    return { floorRows, floorCols };
  }

  // onReturn will be called when the player exits the house.
  async create(data?: { onReturn?: (scene: Scene) => void }) {
    // Set black background
    this.cameras.main.setBackgroundColor('#dcdcdc');

    // Generate random room parameters
    // sideHeight: 3 (60%), 2 (30%), 4 (10%)
    const sideHeightRoll = Math.random();
    const sideHeight = sideHeightRoll < 0.6 ? 3 : (sideHeightRoll < 0.9 ? 2 : 4);

    // Calculate floor dimensions
    const { floorRows, floorCols } = this.calculateFloorDimensions(150, 400);

    // Calculate final room dimensions
    const width = floorCols + 2;
    const overHeight = floorRows + 3 + sideHeight;

    // Generate valid door position (>= 2 and < width-3)
    const doorPosition = Math.floor(Math.random() * (width - 5)) + 2;

    // Create room description
    const roomDescription: RoomDescription = {
      width,
      overHeight,
      sideHeight,
      doorPosition
    };

    // Create tilemap with room dimensions
    const map = this.make.tilemap({
      tileWidth: 16,
      tileHeight: 16,
      width: width,
      height: overHeight + sideHeight,
    });

    const walls = map.addTilesetImage("walls", undefined, 16, 16, 0, 0);
    if (!walls) {
      console.error("Failed to load tilesets");
      return;
    }

    this.belowLayer = map.createBlankLayer("Below", walls);
    this.aboveLayer = map.createBlankLayer("Above", walls);
    if (!this.belowLayer || !this.aboveLayer) {
      console.error("Failed to create layers");
      return;
    }
    this.aboveLayer.setDepth(10);

    this.tileRoom(roomDescription, DEFAULT_WALL_BASE_ID);

    // Set up keyboard handler for cycling through wall styles
    const keyboard = this.input.keyboard;
    if (keyboard) {
      let times = 0;
      keyboard.on("keydown-X", () => {
        times++;
        const offset = (times % 4) * 7 + Math.floor(times / 4) * 322;
        this.tileRoom(roomDescription, offset);
      });
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

    // Center the room in the game canvas
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    const roomWidth = width * 16;  // tileWidth is 16
    const roomHeight = (overHeight + sideHeight) * 16;  // tileHeight is 16

    // Calculate the position to center the room
    const roomX = (gameWidth - roomWidth) / 2;
    const roomY = (gameHeight - roomHeight) / 2;
    this.physics.world.setBounds(
      roomX+16,
      roomY+16*(sideHeight-1),
      roomWidth-32,
      roomHeight-16*(sideHeight-1));

    // Set the layer's position to center it
    this.belowLayer.setPosition(roomX, roomY);
    this.aboveLayer.setPosition(roomX, roomY);

    // Create player at the doorway
    const playerX = roomX + (doorPosition * 16) + 16; // Center in the doorway
    const playerY = roomY + roomHeight - 32; // Bottom of the room
    this.player = new Player(this, new Phaser.Math.Vector2(playerX, playerY));

    this.player.getSprite().setCollideWorldBounds(true);
    this.physics.add.collider(this.player.getSprite(), this.aboveLayer);

    // Create a zone for the door
    const doorX = roomX + (doorPosition * 16) + 16; // Center of the door tile
    const doorY = roomY + roomHeight-8;
    const doorZone = this.add.zone(doorX, doorY, 32, 16);
    this.physics.add.existing(doorZone, true);

    // Wait a short delay before moving
    await new Promise(resolve => this.time.delayedCall(100, resolve));

    // Move player up one tile
    this.player.emit(PlayerEvents.MOVE, { direction: Direction.UP, speed: this.player.getSpeed() });

    // Wait for movement to complete
    const tileTime = (16 / this.player.getSpeed()) * 1000;
    await new Promise(resolve => this.time.delayedCall(tileTime, resolve));

    this.player.emit(PlayerEvents.STOP);

    let onReturn = data?.onReturn;
    // Set up door overlap check
    this.physics.add.overlap(
      this.player.getSprite(),
      doorZone,
      () => {
        if (onReturn) {
          onReturn(this);
          onReturn = null;
        }
      },
      undefined,
      this
    );
  }

  private tileRoom(roomDescription: RoomDescription, tileOffset: number) {
    const tileTypes = this.mapTileTypesToIds(tileOffset);
    // Set up collision detection
    const roomTiler = new RoomTiling(tileTypes);
    const generatedTiles = roomTiler.generateTiles(roomDescription);
    const { overHeight, sideHeight, width } = roomDescription;
    for (let y = 0; y < overHeight + sideHeight; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = generatedTiles[y * width + x];
        if (y < (overHeight-1) || tileId === tileTypes.floor) {
          this.belowLayer?.putTileAt(tileId, x, y);
        } else {
          this.aboveLayer?.putTileAt(tileId, x, y).setCollision(
            tileId === tileTypes.sideBottomWall ||
            tileId === tileTypes.sideBottomLeftCorner ||
            tileId === tileTypes.sideBottomRightCorner);
        }
      }
    }
  }

  shutdown() {
    if (this.player) {
      this.player.shutdown();
      this.player = null;
    }
  }
}
