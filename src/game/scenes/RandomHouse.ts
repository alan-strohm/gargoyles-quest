import { Scene } from "phaser";
import { RoomTiling, RoomDescription, TileTypes } from "../room/RoomTiling";

// Base tile ID for wall tiles - adjust this to match your tileset
const DEFAULT_WALL_BASE_ID = 0;

export class RandomHouse extends Scene {
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

  create() {
    // Generate random room parameters
    // sideHeight: 1 (60%), 2 (30%), 3 (10%)
    const sideHeightRoll = Math.random();
    const sideHeight = sideHeightRoll < 0.6 ? 1 : (sideHeightRoll < 0.9 ? 2 : 3);

    // Generate floor dimensions that satisfy area constraints
    // Floor area = (overHeight-3-sideHeight) * (width-2) must be between 10 and 50
    let floorRowsCalc: number;
    let floorColsCalc: number;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      // Minimum floor rows is 1 (overHeight - 3 - sideHeight >= 1)
      floorRowsCalc = Math.floor(Math.random() * 5) + 1;
      // Minimum floor columns is 3 (width - 2 >= 3)
      floorColsCalc = Math.floor(Math.random() * 8) + 3;
      attempts++;
    } while ((floorRowsCalc * floorColsCalc <= 10 || floorRowsCalc * floorColsCalc >= 50) && attempts < MAX_ATTEMPTS);

    // If we couldn't find valid dimensions, use defaults
    if (attempts >= MAX_ATTEMPTS) {
      floorRowsCalc = 3;
      floorColsCalc = 5;
    }

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

    // Add tileset and create layer
    const walls = map.addTilesetImage("walls", undefined, 16, 16, 0, 0);
    if (!walls) {
      console.error("Failed to load walls tileset");
      return;
    }

    this.groundLayer = map.createBlankLayer("Ground", walls);
    if (!this.groundLayer) {
      console.error("Failed to create ground layer");
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
        this.groundLayer.putTileAt(tileId, x, y);
      }
    }

    // Set up camera
    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.centerOn(width * 8, (overHeight + sideHeight) * 8); // Center on middle of room
  }
}
