import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { DynamicHouse } from "./scenes/DynamicHouse";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: {
      width: 800,
      height: 800,
    },
  },
  backgroundColor: "#028af8",
  scene: [Boot, Preloader, MainMenu, MainGame, DynamicHouse, GameOver],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
