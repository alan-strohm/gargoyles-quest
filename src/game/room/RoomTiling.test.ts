import { RoomTiling, RoomDimensions } from './RoomTiling';

describe('RoomTiling', () => {
  // Helper function to convert tile numbers to ASCII characters for visualization
  function tilesToAscii(tiles: number[], width: number, tileMap: Record<number, string>): string {
    let result = '';
    for (let y = 0; y < tiles.length / width; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y * width + x];
        result += tileMap[tile] || '?';
      }
      result += '\n';
    }
    return result;
  }

  // Create tile IDs that are easy to read in ASCII
  const tiles = {
    // Over tiles (double line)
    overTopLeftCorner: 1,
    overTopWall: 2,
    overTopRightCorner: 3,
    overLeftWall: 4,
    floor: 5,
    overRightWall: 6,
    overBottomLeftCorner: 7,
    overBottomWall: 8,
    overBottomRightCorner: 9,
    overInternalRightCorner: 10,
    overInternalLeftCorner: 11,

    // Side tiles (single line)
    sideLeftWall: 12,
    sideMidWall: 13,
    sideRightWall: 14,
    sideBottomLeftCorner: 15,
    sideBottomWall: 16,
    sideBottomRightCorner: 17
  };

  // ASCII mapping for tiles
  const tileMap: Record<number, string> = {
    // Over tiles (double line)
    [tiles.overTopLeftCorner]: '╔',
    [tiles.overTopWall]: '═',
    [tiles.overTopRightCorner]: '╗',
    [tiles.overLeftWall]: '║',
    [tiles.floor]: '·',
    [tiles.overRightWall]: '║',
    [tiles.overBottomLeftCorner]: '╚',
    [tiles.overBottomWall]: '═',
    [tiles.overBottomRightCorner]: '╝',
    [tiles.overInternalRightCorner]: '╣',
    [tiles.overInternalLeftCorner]: '╠',

    // Side tiles (single line)
    [tiles.sideLeftWall]: '│',
    [tiles.sideMidWall]: '+',
    [tiles.sideRightWall]: '│',
    [tiles.sideBottomLeftCorner]: '└',
    [tiles.sideBottomWall]: '─',
    [tiles.sideBottomRightCorner]: '┘'
  };

  it('should generate correct tiles for the smallest possible room', () => {
    const room: RoomDimensions = {
      width: 6,
      overHeight: 4,
      sideHeight: 1,
      doorPosition: 2
    };

    const tiling = new RoomTiling(tiles);
    const generatedTiles = tiling.generateTiles(room);

    // Expected layout (5 rows total: 4 over + 1 side):
    const expectedTiles = [
      '╔════╗\n',
      '║────║\n',
      '║····║\n',
      '╚╣··╠╝\n',
      '└┘··└┘\n'
    ].join('');

    expect(tilesToAscii(generatedTiles, room.width, tileMap)).toBe(expectedTiles);
  });

  it('should generate correct tiles for the smallest possible room with sideHeight of 2', () => {
    const room: RoomDimensions = {
      width: 6,
      overHeight: 5,
      sideHeight: 2,
      doorPosition: 2
    };

    const tiling = new RoomTiling(tiles);
    const generatedTiles = tiling.generateTiles(room);

    // Expected layout (7 rows total: 5 over + 2 side):
    const expectedTiles = [
      '╔════╗\n',
      '║++++║\n',
      '║────║\n',
      '║····║\n',
      '╚╣··╠╝\n',
      '││··││\n',
      '└┘··└┘\n'
    ].join('');

    expect(tilesToAscii(generatedTiles, room.width, tileMap)).toBe(expectedTiles);
  });

  it('should generate correct tiles the smallest room with space on either side of the door and sideHeight of 2', () => {
    const room: RoomDimensions = {
      width: 8,
      overHeight: 6,
      sideHeight: 2,
      doorPosition: 3
    };

    const tiling = new RoomTiling(tiles);
    const generatedTiles = tiling.generateTiles(room);

    // Expected layout (8 rows total: 6 over + 2 side):
    const expectedTiles = [
      '╔══════╗\n',
      '║++++++║\n',
      '║──────║\n',
      '║······║\n',
      '║······║\n',
      '╚═╣··╠═╝\n',
      '│+│··│+│\n',
      '└─┘··└─┘\n'
    ].join('');

    expect(tilesToAscii(generatedTiles, room.width, tileMap)).toBe(expectedTiles);
  });

  it('should generate correct tiles for a room with sideHeight of 3 and the door as far left as possible', () => {
    const room: RoomDimensions = {
      width: 8,
      overHeight: 6,
      sideHeight: 3,
      doorPosition: 2
    };

    const tiling = new RoomTiling(tiles);
    const generatedTiles = tiling.generateTiles(room);

    // Expected layout (9 rows total: 6 over + 3 side):
    const expectedTiles = [
      '╔══════╗\n',
      '║++++++║\n',
      '║++++++║\n',
      '║──────║\n',
      '║······║\n',
      '╚╣··╠══╝\n',
      '││··│++│\n',
      '││··│++│\n',
      '└┘··└──┘\n'
    ].join('');

    expect(tilesToAscii(generatedTiles, room.width, tileMap)).toBe(expectedTiles);
  });

  describe('error handling', () => {
    it('should throw error for widths that are too small', () => {
      const room: RoomDimensions = {
        width: 5,
        overHeight: 4,
        sideHeight: 1,
        doorPosition: 2
      };

      const tiling = new RoomTiling(tiles);
      expect(() => tiling.generateTiles(room)).toThrow('Room width must be at least 6');
    });

    it('should throw error for door positions that are too far to the left', () => {
      const room: RoomDimensions = {
        width: 6,
        overHeight: 4,
        sideHeight: 1,
        doorPosition: 1
      };

      const tiling = new RoomTiling(tiles);
      expect(() => tiling.generateTiles(room)).toThrow('Door position must be at least 2 and less than width-3');
    });

    it('should throw error for door positions that are too far right', () => {
      const room: RoomDimensions = {
        width: 6,
        overHeight: 4,
        sideHeight: 1,
        doorPosition: 3
      };

      const tiling = new RoomTiling(tiles);
      expect(() => tiling.generateTiles(room)).toThrow('Door position must be at least 2 and less than width-3');
    });

    it('should throw error for sideHeights that are too small', () => {
      const room: RoomDimensions = {
        width: 6,
        overHeight: 4,
        sideHeight: 0,
        doorPosition: 2
      };

      const tiling = new RoomTiling(tiles);
      expect(() => tiling.generateTiles(room)).toThrow('Side height must be at least 1');
    });

    it('should throw error for overHeights too small', () => {
      const room: RoomDimensions = {
        width: 6,
        overHeight: 3,
        sideHeight: 1,
        doorPosition: 2
      };

      const tiling = new RoomTiling(tiles);
      expect(() => tiling.generateTiles(room)).toThrow('Over height must be at least 3 + sideHeight');
    });

    it('should throw error for sideHeights that are too large', () => {
      const room: RoomDimensions = {
        width: 6,
        overHeight: 4,
        sideHeight: 2,
        doorPosition: 2
      };

      const tiling = new RoomTiling(tiles);
      expect(() => tiling.generateTiles(room)).toThrow('Over height must be at least 3 + sideHeight');
    });
  });
});
