import { Scene } from "phaser";
import { RoomTiling, RoomDimensions, TileTypes } from "../room/RoomTiling";
import { Player, Direction, PlayerEvents } from "../player/Player";
import { Item, createItem } from "../items/Items";

export interface HouseDescription {
  room: RoomDimensions;
  tileOffset: number;
  items: { item: string | Item, tileX: number, tileY: number }[];
}

const TILE_SIZE = 32;

export class DynamicHouse extends Scene {
  private belowLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private worldLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private aboveLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private player: Player | null = null;
  private items: { sprite: Phaser.GameObjects.Sprite, item: Item }[] = [];

  constructor() {
    super("DynamicHouse");
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

  // onReturn will be called when the player exits the house.
  async create(data: { house: HouseDescription, onReturn: (scene: Scene) => void }) {
    // Set black background
    this.cameras.main.setBackgroundColor('#dcdcdc');

    const { room, tileOffset, items } = data.house;
    const { width, overHeight, sideHeight, doorPosition } = room;

    // Create tilemap with room dimensions
    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: width,
      height: overHeight + sideHeight,
    });

    const walls = map.addTilesetImage("walls", undefined, TILE_SIZE, TILE_SIZE, 0, 0);
    if (!walls) {
      console.error("Failed to load tilesets");
      return;
    }

    this.belowLayer = map.createBlankLayer("Below", walls);
    this.worldLayer = map.createBlankLayer("World", walls);
    this.aboveLayer = map.createBlankLayer("Above", walls);
    if (!this.belowLayer || !this.worldLayer || !this.aboveLayer) {
      console.error("Failed to create layers");
      return;
    }
    this.aboveLayer.setDepth(10);

    console.log("tileOffset", tileOffset);
    this.tileRoom(room, tileOffset);

    // Set up keyboard handler for cycling through wall styles
    const keyboard = this.input.keyboard;
    if (keyboard) {
      let times = 0;
      keyboard.on("keydown-X", () => {
        times++;
        times %= 30;
        const offset = (times % 4) * 7 + Math.floor(times / 4) * 322;
        this.tileRoom(room, offset);
      });
      keyboard.once("keydown-D", () => {
        // Turn on physics debugging to show player's hitbox
        this.physics.world.createDebugGraphic();

        // Create worldLayer collision graphic above the player, but below the help text
        const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
        this.aboveLayer?.renderDebug(graphics, {
          tileColor: null, // Color of non-colliding tiles
          collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
          faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
        });
      });
    }

    // Center the room in the game canvas
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    const roomWidth = width * TILE_SIZE;
    const roomHeight = (overHeight + sideHeight) * TILE_SIZE;

    // Calculate the position to center the room
    const roomX = (gameWidth - roomWidth) / 2;
    const roomY = (gameHeight - roomHeight) / 2;
    this.physics.world.setBounds(
      roomX + TILE_SIZE,
      roomY + TILE_SIZE * sideHeight,
      roomWidth - 2 * TILE_SIZE,
      roomHeight - TILE_SIZE * (sideHeight-1));

    // Set the layer's position to center it
    this.belowLayer.setPosition(roomX, roomY);
    this.worldLayer.setPosition(roomX, roomY);
    this.aboveLayer.setPosition(roomX, roomY);

    // Create player at the doorway
    const playerX = roomX + (doorPosition * TILE_SIZE) + TILE_SIZE; // Center in the doorway
    const playerY = roomY + roomHeight - 2 * TILE_SIZE; // Bottom of the room
    this.player = new Player(this, new Phaser.Math.Vector2(playerX, playerY));

    this.player.getSprite().setCollideWorldBounds(true);
    this.physics.add.collider(this.player.getSprite(), this.aboveLayer);
    this.physics.add.collider(this.player.getSprite(), this.worldLayer);

    // Create items at their tile positions
    items.forEach(({ item, tileX, tileY }) => {
      const itemInstance = typeof item === 'string' ? createItem(item) : item;
      const worldX = roomX + (tileX * TILE_SIZE) + TILE_SIZE / 2;
      const worldY = roomY + (tileY * TILE_SIZE) + TILE_SIZE / 2;
      const sprite = itemInstance.createSprite(this, worldX, worldY);
      if (this.player) {
        this.physics.add.collider(this.player.getSprite(), sprite);
      }
      this.items.push({ sprite, item: itemInstance });
    });

    // Listen for player activation events
    this.player.on(PlayerEvents.ACTIVATE, (point: Phaser.Math.Vector2) => {
      // Check if any item is at the activation point
      this.items.forEach(({ sprite, item }) => {
        const distance = Phaser.Math.Distance.Between(
          point.x, point.y,
          sprite.x, sprite.y
        );
        if (distance < TILE_SIZE) {
          item.activate(this);
        }
      });
    });

    // Create a zone for the door
    const doorX = roomX + (doorPosition * TILE_SIZE) + TILE_SIZE; // Center of the door tile
    const doorY = roomY + roomHeight - TILE_SIZE / 2;
    const doorZone = this.add.zone(doorX, doorY, 2 * TILE_SIZE, TILE_SIZE);
    this.physics.add.existing(doorZone, true);

    // Wait a short delay before moving
    await new Promise(resolve => this.time.delayedCall(100, resolve));

    // Move player up one tile
    this.player.emit(PlayerEvents.MOVE, { direction: Direction.UP, speed: this.player.getSpeed() });

    // Wait for movement to complete
    const tileTime = (TILE_SIZE / this.player.getSpeed()) * 1000;
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

  private tileRoom(roomDescription: RoomDimensions, tileOffset: number) {
    const tileTypes = this.mapTileTypesToIds(tileOffset);
    // Set up collision detection
    const roomTiler = new RoomTiling(tileTypes);
    const generatedTiles = roomTiler.generateTiles(roomDescription);
    const { overHeight, sideHeight, width } = roomDescription;
    for (let y = 0; y < overHeight + sideHeight; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = generatedTiles[y * width + x];
        if (tileId === tileTypes.floor) {
          this.belowLayer?.putTileAt(tileId, x, y);
        } else if (y < (overHeight-1)) {
          this.worldLayer?.putTileAt(tileId, x, y);
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
    // Clean up items
    this.items.forEach(({ sprite }) => sprite.destroy());
    this.items = [];
  }
}
