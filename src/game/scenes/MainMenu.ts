import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { GAME_H, GAME_W } from "../constants";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    scoreText: GameObjects.Text;

    score: number = 0;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.background = this.add.image(GAME_W / 2, GAME_H / 2, "background");

        this.scoreText = this.add
            .text(0, 0, `SCORE  ${this.score}`, {
                fontFamily: "Arial Black",
                fontSize: 58,
                color: "#ee548e",
                stroke: "#000000",
                strokeThickness: 5,
                align: "center",
            })
            .setDepth(100);

        EventBus.emit("current-scene-ready", this);
    }

    increaseScore(delta: number) {
        this.score += delta;
        this.scoreText.setText(`SCORE  ${this.score}`);
    }

    clearScore() {
        this.score = 0;
        this.scoreText.setText(`SCORE  ${this.score}`);
    }
}
