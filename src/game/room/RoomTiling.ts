/**
 * Represents a rectangular room with a door on the bottom wall.
 *
 * Assumptions:
 * - width >= 5 (to ensure room is large enough for door and walls)
 * - doorPosition >= 2 && < width-2 (to ensure door is not in a corner)
 * - overHeight >= 3 + sideHeight (to ensure room is large enough for walls and door)
 * - sideHeight >= 1 (height of wall tiles below the room, default is 1)
 */
export interface RoomDescription {
  width: number;
  overHeight: number;
  sideHeight: number;
  doorPosition: number; // Position of door on bottom wall (0-based, from left)
}

export interface TileTypes {
  // Over tiles (top layer)
  overTopLeftCorner: number;
  overTopWall: number;
  overTopRightCorner: number;
  overLeftWall: number;
  floor: number;
  overRightWall: number;
  overBottomLeftCorner: number;
  overBottomWall: number;
  overBottomRightCorner: number;
  overInternalRightCorner: number;
  overInternalLeftCorner: number;

  // Side tiles (wall height)
  sideLeftWall: number;
  sideMidWall: number;
  sideRightWall: number;
  sideBottomLeftCorner: number;
  sideBottomWall: number;
  sideBottomRightCorner: number;
}

export class RoomTiling {
  constructor(private readonly tiles: TileTypes) {}

  generateTiles(room: RoomDescription): number[] {
    const tiles: number[] = new Array()

    return tiles;
  }
}
