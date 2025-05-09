import { Scene } from "phaser";

const WALL_TILES = {
  BLANK: 47
};

export class RandomRoom extends Scene {
  constructor() {
    super("RandomRoom");
  }
  create() {
    const map = this.make.tilemap({
      tileWidth: 16,
      tileHeight: 16,
      width: 16*100,
      height: 16*100,
    });

    const walls = map.addTilesetImage("walls", null, 16, 16, 0, 0);
    this.groundLayer = map.createBlankLayer("Ground", walls).fill(WALL_TILES.BLANK);
    const camera = this.cameras.main;
    //camera.startFollow(this.player.sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  }
}
