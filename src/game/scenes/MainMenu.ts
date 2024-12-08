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
        this.matter.world.setBounds(0, 0, GAME_W, GAME_H);

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

        this.balls = this.add.group({ classType: GameObjects.Image });
        // this.matter.world.on("collisionstart", this.handleCollision, this);
        this.createNewBall(5);
        setTimeout(() => {
            this.createNewBall(1).setX(GAME_W / 2 - 100);
        }, 1000);

        EventBus.emit("current-scene-ready", this);
    }

    createNewBall(type: BallType) {
        const ball = this.matter.add.image(GAME_W / 2, 150, `ball-${type}`);
        ball.setCircle(ball.width / 2, {
            restitution: 0.2,
            friction: 0.1,
            frictionAir: 0.01,
        });
        // ball.setStatic(true);
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
