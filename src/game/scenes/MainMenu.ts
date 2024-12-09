import { GameObjects, Physics, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { GAME_H, GAME_W } from "../constants";

type BallType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class MainMenu extends Scene {
    background: GameObjects.Image;
    scoreText: GameObjects.Text;
    balls: GameObjects.Group;
    currentBall: Physics.Matter.Image | null = null;

    ballCount = 0;
    isDragging = false;
    score = 0;

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
        // 1 ~ 5
        this.createNewBall();
        // this.matter.world.on("collisionstart", this.handleCollision, this);

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number): void {
        const pointer = this.input.activePointer;
        if (pointer.isDown && this.currentBall) {
            this.isDragging = true;
            this.currentBall.setX(pointer.x);
        }
        if (!pointer.isDown && this.isDragging && this.currentBall) {
            this.isDragging = false;
            this.currentBall.setStatic(false);
            this.currentBall = null;
            this.time.delayedCall(
                1000,
                () => {
                    this.createNewBall();
                },
                [],
                this
            );
        }
    }

    createNewBall() {
        // 当小球堆到最顶上的时候会导致跟新创建的小球发生重叠挤压碰撞，但不用担心，以后有了安全线就不会有这个问题了
        // 在那之前就游戏结束了！
        const type =
            this.ballCount === 0
                ? 1
                : ((Math.floor(Math.random() * 5) + 1) as BallType);

        const ball = this.matter.add.image(GAME_W / 2, 175, `ball-${type}`);
        ball.setCircle(ball.width / 2, {
            restitution: 0.2,
            friction: 0.1,
            frictionAir: 0.01,
        });
        ball.setStatic(true);
        this.currentBall = ball;
        this.balls.add(ball);
        this.ballCount++;
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
