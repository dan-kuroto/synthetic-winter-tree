import { Boot } from "./scenes/Boot";
import { MainMenu } from "./scenes/MainMenu";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";
import { GAME_H, GAME_W } from "./constants";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_W,
    height: GAME_H,
    parent: "game-container",
    backgroundColor: "#028af8",
    physics: {
        default: "matter",
        matter: {
            gravity: { x: 0, y: 6 },
            // debug: true,
        },
    },
    scene: [Boot, Preloader, MainMenu],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
