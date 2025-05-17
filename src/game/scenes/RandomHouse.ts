import { Scene } from "phaser";
import { RoomTiling, RoomDescription, TileTypes } from "../room/RoomTiling";

// Base tile ID for wall tiles - adjust this to match your tileset
const DEFAULT_WALL_BASE_ID = 0;
const DEFAULT_FLOOR_ID = 100;

export class RandomHouse extends Scene {
  private wallLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;

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
   * Calculates floor dimensions using prime factorization to find good room proportions.
   * @param minFloorArea Minimum floor area (exclusive)
   * @param maxFloorArea Maximum floor area (exclusive)
   * @returns Object containing floorRows and floorCols
   */
  private calculateFloorDimensions(minFloorArea: number, maxFloorArea: number): { floorRows: number, floorCols: number } {
    // Choose a target area within the range
    const targetArea = Math.floor(Math.random() * (maxFloorArea - minFloorArea - 1)) + minFloorArea + 1;

    // Find factors of the target area that are >= 3 (minimum width-2)
    const factors: number[] = [];
    for (let i = 3; i <= Math.sqrt(targetArea); i++) {
      if (targetArea % i === 0) {
        factors.push(i);
      }
    }

    if (factors.length > 0) {
      // Use a random factor for one dimension
      const factor = factors[Math.floor(Math.random() * factors.length)];
      return {
        floorRows: factor,
        floorCols: targetArea / factor
      };
    }

    // If no good factors found, try to find the closest number with good factors
    for (let offset = 1; offset <= 5; offset++) {
      const candidates = [targetArea + offset, targetArea - offset];
      for (const candidate of candidates) {
        if (candidate >= minFloorArea && candidate <= maxFloorArea) {
          for (let i = 3; i <= Math.sqrt(candidate); i++) {
            if (candidate % i === 0) {
              return {
                floorRows: i,
                floorCols: candidate / i
              };
            }
          }
        }
      }
    }

    // Fallback: use square root as a last resort
    const side = Math.ceil(Math.sqrt(targetArea));
    return {
      floorRows: side,
      floorCols: Math.ceil(targetArea / side)
    };
  }

  create() {
    // Set black background
    this.cameras.main.setBackgroundColor('#000000');

    // Generate random room parameters
    // sideHeight: 2 (60%), 1 (30%), 3 (10%)
    const sideHeightRoll = Math.random();
    const sideHeight = sideHeightRoll < 0.6 ? 2 : (sideHeightRoll < 0.9 ? 1 : 3);

    // Calculate floor dimensions
    const { floorRows: floorRowsCalc, floorCols: floorColsCalc } = this.calculateFloorDimensions(50, 150);

    // Calculate final room dimensions
    const width = floorColsCalc + 2;
    const overHeight = floorRowsCalc + 3 + sideHeight;

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
    const roomWidth = width * 16;  // tileWidth is 16
    const roomHeight = (overHeight + sideHeight) * 16;  // tileHeight is 16

    // Calculate the position to center the room
    const x = (gameWidth - roomWidth) / 2;
    const y = (gameHeight - roomHeight) / 2;

    // Set the layer's position to center it
    this.wallLayer.setPosition(x, y);
    this.groundLayer.setPosition(x, y);
  }
}
