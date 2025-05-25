import { Scene } from "phaser";
import { Player } from "../player/Player";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("logo", "logo.png");
    this.load.image("tiles", "./tilesets/tuxmon-sample-32px-extruded.png");
    this.load.image("walls", "./tilesets/core_indoor_walls.png");
    this.load.image("floors", "./tilesets/core_indoor_floors.png");
    this.load.tilemapTiledJSON("map", "./tilemaps/tuxemon-town.json");

    this.load.atlas("atlas-16px", "./atlas/atlas-16px.png", "./atlas/atlas-16px.json");
    this.load.atlas("atlas-32px", "./atlas/atlas-32px.png", "./atlas/atlas-32px.json");
  }

  create() {
    Player.createAnimations(this.anims);
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    // this.scene.start("MainMenu");
    this.scene.start("Game");
  }
}
