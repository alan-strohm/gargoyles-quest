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
    // Validate room dimensions
    if (room.width < 5) {
      throw new Error('Room width must be at least 5');
    }
    if (room.doorPosition < 2 || room.doorPosition >= room.width - 2) {
      throw new Error('Door position must be at least 2 and less than width-2');
    }
    if (room.sideHeight < 1) {
      throw new Error('Side height must be at least 1');
    }
    if (room.overHeight < 3 + room.sideHeight) {
      throw new Error('Over height must be at least 3 + sideHeight');
    }

    // Calculate total height and create array for all tiles
    const totalHeight = room.overHeight + room.sideHeight;
    const totalSize = room.width * totalHeight;
    const result = new Array(totalSize).fill(this.tiles.floor);

    // Helper function to get index in the 1D array
    const getIndex = (x: number, y: number): number => y * room.width + x;

    /**
     * Room tiling pattern:
     * 1. If sideHeight = 1:
     *    - Second row contains sideBottomWall
     *    - No sideMidWall tiles are used
     *
     * 2. If sideHeight > 1:
     *    - First sideHeight rows after top border contain sideMidWall
     *    - The next row (after all sideMidWall rows) contains sideBottomWall
     *    - Side section has vertical walls with sideMidWall in interiors
     */

    // Place tiles for the room structure
    for (let y = 0; y < totalHeight; y++) {
      // Define row roles based on position
      const isTopBorder = y === 0;
      const isBottomOverBorder = y === room.overHeight - 1;
      const isBottomSideBorder = y === totalHeight - 1;
      const isOverSection = y < room.overHeight;

      // Calculate the number of midwall decoration rows
      const midWallRows = room.sideHeight > 1 ? room.sideHeight - 1 : 0;
      const bottomWallRow = midWallRows + 1;

      // Determine row type for pattern handling
      const rowPositionInOver = y; // 0-indexed position within over section

      // Check if this row should be a decoration row
      const isMidWallRow = rowPositionInOver > 0 && rowPositionInOver <= midWallRows;
      const isBottomWallRow = rowPositionInOver === bottomWallRow;

      for (let x = 0; x < room.width; x++) {
        // Edge and door positions
        const isLeftEdge = x === 0;
        const isRightEdge = x === room.width - 1;
        const isDoor = x === room.doorPosition;
        const isNextToDoorLeft = x === room.doorPosition - 1;
        const isNextToDoorRight = x === room.doorPosition + 1;
        const isDoorPath = isDoor && (isBottomOverBorder || y >= room.overHeight);

        if (isDoorPath) {
          continue; // Keep door as floor tile
        }

        // Over section (main room) - top to bottom
        if (isOverSection) {
          if (isTopBorder) {
            // Top border wall
            if (isLeftEdge) result[getIndex(x, y)] = this.tiles.overTopLeftCorner;
            else if (isRightEdge) result[getIndex(x, y)] = this.tiles.overTopRightCorner;
            else result[getIndex(x, y)] = this.tiles.overTopWall;
          } else if (isBottomOverBorder) {
            // Bottom border wall
            if (isLeftEdge) result[getIndex(x, y)] = this.tiles.overBottomLeftCorner;
            else if (isRightEdge) result[getIndex(x, y)] = this.tiles.overBottomRightCorner;
            else if (isNextToDoorLeft) result[getIndex(x, y)] = this.tiles.overInternalRightCorner;
            else if (isNextToDoorRight) result[getIndex(x, y)] = this.tiles.overInternalLeftCorner;
            else result[getIndex(x, y)] = this.tiles.overBottomWall;
          } else if (isLeftEdge || isRightEdge) {
            // Side walls
            result[getIndex(x, y)] = isLeftEdge ? this.tiles.overLeftWall : this.tiles.overRightWall;
          } else if (isMidWallRow) {
            // Decoration rows with sideMidWall
            result[getIndex(x, y)] = this.tiles.sideMidWall;
          } else if (isBottomWallRow) {
            // Decoration row with sideBottomWall
            result[getIndex(x, y)] = this.tiles.sideBottomWall;
          }
          // All other interior positions remain as floor
        }
        // Side section (below main room) - handle varying sideHeight
        else {
          if (isBottomSideBorder) {
            // Bottom row of side section - corners and edges
            if (isLeftEdge) result[getIndex(x, y)] = this.tiles.sideBottomLeftCorner;
            else if (isRightEdge) result[getIndex(x, y)] = this.tiles.sideBottomRightCorner;
            else if (isNextToDoorLeft) result[getIndex(x, y)] = this.tiles.sideBottomRightCorner;
            else if (isNextToDoorRight) result[getIndex(x, y)] = this.tiles.sideBottomLeftCorner;
            else result[getIndex(x, y)] = this.tiles.sideBottomWall;
          } else {
            // Non-bottom side section rows - vertical walls and interior
            if (isLeftEdge) result[getIndex(x, y)] = this.tiles.sideLeftWall;
            else if (isRightEdge) result[getIndex(x, y)] = this.tiles.sideRightWall;
            else if (isNextToDoorLeft || isNextToDoorRight) {
              // Vertical lines next to door
              result[getIndex(x, y)] = this.tiles.sideLeftWall;
            } else {
              // Fill spaces between walls
              result[getIndex(x, y)] = this.tiles.sideMidWall;
            }
          }
        }
      }
    }

    return result;
  }
}
