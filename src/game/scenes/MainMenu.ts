import { GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { GAME_H, GAME_W } from "../constants";

type BallType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class MainMenu extends Scene {
    background: GameObjects.Image;
    scoreText: GameObjects.Text;
    balls: GameObjects.Group;

    score: number = 0;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.background = this.add.image(GAME_W / 2, GAME_H / 2, "background");

        this.scoreText = this.add
            .text(10, 10, `SCORE  ${this.score}`, {
                fontFamily: "Arial Black",
                fontSize: 58,
                color: "#ee548e",
                stroke: "#000000",
                strokeThickness: 5,
                align: "center",
            })
            .setDepth(100);

        // TODO 小球在该转动时没有角速度，换matter.js试试
        this.balls = this.add.group({ classType: GameObjects.Image });
        this.physics.add.collider(this.balls, this.balls);
        this.createNewBall(1);

        EventBus.emit("current-scene-ready", this);
    }

    createNewBall(type: BallType) {
        const ball = this.physics.add
            .image(GAME_W / 2, 150, `ball-${type}`)
            .setBounce(0.2)
            .setFriction(0.1)
            .setCollideWorldBounds(true);
        ball.setCircle(ball.width / 2);
        ball.body.moves = false;
        this.balls.add(ball);
        return ball;
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
