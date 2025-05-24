import { Scene } from "phaser";
import { RoomTiling, RoomDescription, TileTypes } from "../room/RoomTiling";
import { Player, Direction, PlayerEvents } from "../player/Player";

// Base tile ID for wall tiles - adjust this to match your tileset
const DEFAULT_WALL_BASE_ID = 0;
const DEFAULT_FLOOR_ID = 100;

export class RandomHouse extends Scene {
  private wallLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private player: Player | null = null;
  private roomWidth: number = 0;
  private roomHeight: number = 0;
  private roomX: number = 0;
  private roomY: number = 0;

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
      floor: -1,
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
    this.cameras.main.setBackgroundColor('#000000');

    // Generate random room parameters
    // sideHeight: 2 (60%), 1 (30%), 3 (10%)
    const sideHeightRoll = Math.random();
    const sideHeight = sideHeightRoll < 0.6 ? 2 : (sideHeightRoll < 0.9 ? 1 : 3);

    // Calculate floor dimensions
    const { floorRows, floorCols } = this.calculateFloorDimensions(150, 400);

    // Calculate final room dimensions
    const width = floorCols + 2;
    const overHeight = floorRows + 3 + sideHeight;

    // Generate valid door position (>= 2 and < width-2)
    const doorPosition = Math.floor(Math.random() * (width - 4)) + 2;

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
    const floors = map.addTilesetImage("floors", undefined, 16, 16, 0, 0);
    if (!walls || !floors) {
      console.error("Failed to load tilesets");
      return;
    }

    this.groundLayer = map.createBlankLayer("Ground", floors);
    this.wallLayer = map.createBlankLayer("Walls", walls);
    if (!this.wallLayer || !this.groundLayer) {
      console.error("Failed to create layers");
      return;
    }

    // Generate room tiles
    const tileTypes = this.mapTileTypesToIds(DEFAULT_WALL_BASE_ID);
    const roomTiler = new RoomTiling(tileTypes);
    const generatedTiles = roomTiler.generateTiles(roomDescription);

    // Place tiles in the layer
    for (let y = 0; y < overHeight + sideHeight; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = generatedTiles[y * width + x];
        if (tileId === -1) {
          this.groundLayer.putTileAt(DEFAULT_FLOOR_ID, x, y);
        } else {
          this.wallLayer.putTileAt(tileId, x, y);
        }
      }
    }

    // Center the room in the game canvas
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    this.roomWidth = width * 16;  // tileWidth is 16
    this.roomHeight = (overHeight + sideHeight) * 16;  // tileHeight is 16

    // Calculate the position to center the room
    this.roomX = (gameWidth - this.roomWidth) / 2;
    this.roomY = (gameHeight - this.roomHeight) / 2;

    // Set the layer's position to center it
    this.wallLayer.setPosition(this.roomX, this.roomY);
    this.groundLayer.setPosition(this.roomX, this.roomY);

    // Create player at the doorway
    const playerX = this.roomX + (doorPosition * 16) + 16; // Center in the doorway
    const playerY = this.roomY + (overHeight + sideHeight - 2) * 16; // Bottom of the room
    this.player = new Player(this, new Phaser.Math.Vector2(playerX, playerY));

    // Set up collision detection
    this.wallLayer.setCollisionByExclusion([-1]); // Collide with all tiles except empty ones
    this.physics.add.collider(this.player.getSprite(), this.wallLayer);

    // Create a zone for the door
    const doorX = this.roomX + (doorPosition * 16); // Center of the door tile
    const doorY = this.roomY + (overHeight + sideHeight - 1) * 16; // Center of the door tile
    const doorZone = this.add.zone(doorX, doorY, 32, 16);
    this.physics.add.existing(doorZone, true);

    // Wait a short delay before moving
    await new Promise(resolve => this.time.delayedCall(100, resolve));

    // Move player up one tile
    this.player.emit(PlayerEvents.MOVE, { direction: Direction.UP, speed: this.player.getSpeed() });

    // Wait for movement to complete
    const tileTime = (32 / this.player.getSpeed()) * 1000;
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

  shutdown() {
    if (this.player) {
      this.player.shutdown();
      this.player = null;
    }
  }
}
