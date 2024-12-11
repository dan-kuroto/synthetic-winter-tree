import { GameObjects, Physics, Scene } from "phaser";

import { EventBus } from "../EventBus";
import {
    CONTINUOUS_INTERVAL,
    CONTINUOUS_THRESHOLD,
    FUSION_MIN_INTERVAL,
    GAME_H,
    GAME_W,
    GROUND_IMG_H,
} from "../constants";

type BallLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class MainMenu extends Scene {
    ground: GameObjects.Image;
    scoreText: GameObjects.Text;
    warningLine: GameObjects.Image;
    balls: GameObjects.Group;
    currentBall: Physics.Matter.Image | null = null;
    fusionTimestamps: number[] = [];

    isDragging = false;
    score = 0;

    constructor() {
        super("MainMenu");
    }

    create() {
        this.matter.world.setBounds(0, 0, GAME_W, GAME_H);

        this.ground = this.matter.add
            .image(GAME_W / 2, GAME_H - GROUND_IMG_H / 2, "ground")
            .setStatic(true);

        this.scoreText = this.add
            .text(40, 20, "", {
                fontFamily: "Arial Black",
                fontSize: 58,
                color: "#ee548e",
                stroke: "#ffffff",
                strokeThickness: 5,
                align: "center",
            })
            .setDepth(100);
        this.setScore(0);

        this.warningLine = this.add
            .image(GAME_W / 2, 400, "warning-line")
            .setZ(1)
            .setAlpha(0);

        this.balls = this.add.group({ classType: GameObjects.Image });
        this.currentBall = this.createNewBall();
        this.matter.world.on("collisionstart", this.handleCollision, this);
        this.matter.world.on("collisionactive", this.handleOverlap, this);

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number): void {
        const pointer = this.input.activePointer;
        if (pointer.isDown && this.currentBall) {
            this.isDragging = true;
            let x = pointer.x;
            x = Math.min(x, GAME_W - this.currentBall.width / 2);
            x = Math.max(x, this.currentBall.width / 2);
            this.currentBall.setX(x);
        }
        if (!pointer.isDown && this.isDragging && this.currentBall) {
            this.isDragging = false;
            this.throwBall();
        }
    }

    handleCollision(event, bodyA, bodyB) {
        this.onBallFirstCollided(bodyA);
        this.onBallFirstCollided(bodyB);
        this.handleFusion(bodyA, bodyB);
    }

    handleOverlap(event) {
        const pairs = event.pairs;
        for (const pair of pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            this.onBallFirstCollided(bodyA);
            this.onBallFirstCollided(bodyB);
            this.handleFusion(bodyA, bodyB);
        }
    }

    /**
     * 处理小球初次碰撞
     */
    onBallFirstCollided(body) {
        const label = body.label as string;
        // 只处理小球
        if (!label.startsWith("ball-")) {
            return;
        }
        const ball = body.gameObject as Physics.Matter.Image;
        // 避免小球已被销毁导致报错
        if (!ball) {
            return;
        }
        // 不处理挂起还未释放的小球
        if (ball.getData("suspend")) {
            return;
        }
        // 只处理第一次碰撞
        if (ball.getData("hasCollided")) {
            return;
        }
        ball.setData("hasCollided", true);

        this.currentBall = this.createNewBall();
    }

    /**
     * 处理小球融合
     */
    handleFusion(bodyA, bodyB) {
        const labelA = bodyA.label as string;
        const labelB = bodyB.label as string;
        // 只有小球之间的碰撞才处理
        if (!labelA.startsWith("ball-") || !labelB.startsWith("ball-")) {
            return;
        }
        // 同种类才能合成
        if (labelA !== labelB) {
            return;
        }
        // 11级小球不能再合成
        const levelA = parseInt(labelA.split("-")[1], 10) as BallLevel;
        const levelB = parseInt(labelB.split("-")[1], 10) as BallLevel;
        if (levelA !== levelB || levelA === 11 || levelB === 11) {
            return;
        }
        // 当前正在操作的小球不能合成
        if (
            bodyA === this.currentBall?.body ||
            bodyB === this.currentBall?.body
        ) {
            return;
        }
        // 避免连续合成太快看不清
        const now = this.time.now;
        const lastTime =
            this.fusionTimestamps[this.fusionTimestamps.length - 1] || 0;
        if (now - lastTime < FUSION_MIN_INTERVAL) {
            return;
        }
        // 连续合成时似乎有概率一个小球被重复合成导致报错(因为上次合成后已经被销毁了)
        const ballA = bodyA.gameObject as Physics.Matter.Image;
        const ballB = bodyB.gameObject as Physics.Matter.Image;
        if (!ballA || !ballB) {
            return;
        }
        // 正在动画中的小球不能合成(否则被销毁后动画那边会报错)
        if (ballA.getData("isAnimating") || ballB.getData("isAnimating")) {
            return;
        }
        // 将要销毁的小球不能合成
        if (
            ballA.getData("aboutToDestroy") ||
            ballB.getData("aboutToDestroy")
        ) {
            return;
        }
        // 处于sensor状态的小球不能合成
        if (ballA.isSensor() || ballB.isSensor()) {
            return;
        }

        const newLevel = (levelA + 1) as BallLevel;
        // 算分
        this.increaseScore(levelA + (newLevel === 11 ? 100 : 0));
        // 融合
        const x = (ballA.x + ballB.x) / 2;
        const y = (ballA.y + ballB.y) / 2;

        // 融合逻辑
        const [volumeX, volumeY] = this.calcNewBallVolume(ballA, ballB);
        const newBall = this.createFusionBall(newLevel, x, y);
        newBall.setVelocity(volumeX, volumeY);
        this.fusionAnimation(ballA, ballB, newBall);
        this.sound.play("biu");
        // 连续融合的判定和提示
        this.fusionTimestamps.push(now);
        this.fusionTimestamps = this.fusionTimestamps.filter(
            (timestamp) => now - timestamp <= CONTINUOUS_INTERVAL
        );
        if (this.fusionTimestamps.length >= CONTINUOUS_THRESHOLD) {
            this.sound.play("critical");
            this.fusionTimestamps = [];
        }
        // 合出最大时的提示
        if (newLevel === 11) {
            this.sound.play("game-clear");
        }
    }

    fusionAnimation(
        ballA: Physics.Matter.Image,
        ballB: Physics.Matter.Image,
        newBall: Physics.Matter.Image
    ) {
        newBall.setScale(0.9);
        newBall.setData("isAnimating", true);
        this.tweens.add({
            targets: newBall,
            scale: 1,
            duration: FUSION_MIN_INTERVAL,
            ease: "Power2",
            onComplete: () => {
                newBall.setData("isAnimating", false);
            },
        });

        for (const ball of [ballA, ballB]) {
            ball.setData("aboutToDestroy", true);
            ball.setSensor(true);
            ball.setStatic(true);
            ball.setZ(1);
        }
        // 球A和球B的销毁动画 向彼此靠拢
        this.tweens.add({
            targets: [ballA, ballB],
            x: newBall.x,
            y: newBall.y,
            width: 0,
            height: 0,
            alpha: 0,
            duration: FUSION_MIN_INTERVAL / 2, // 旧球消失比新球出现快一点
            ease: "Power2",
            onComplete: () => {
                ballA.destroy();
                ballB.destroy();
            },
        });
    }

    calcNewBallVolume(
        ballA: Physics.Matter.Image,
        ballB: Physics.Matter.Image
    ): [number, number] {
        const velocityA = ballA.getVelocity();
        const velocityB = ballB.getVelocity();
        const massA = ballA.body?.mass || 0;
        const massB = ballB.body?.mass || 0;
        const volumeX =
            (velocityA.x * massA + velocityB.x * massB) / (massA + massB);
        const volumeY =
            (velocityA.y * massA + velocityB.y * massB) / (massA + massB);
        return [volumeX, volumeY];
    }

    throwBall() {
        if (!this.currentBall) {
            return;
        }
        this.currentBall.setSensor(false);
        this.currentBall.setStatic(false);
        this.currentBall.setData("suspend", false);
        this.currentBall = null;
    }

    createNewBall() {
        return this.createBall(
            (Math.floor(Math.random() * 5) + 1) as BallLevel,
            GAME_W / 2,
            175,
            true
        );
    }

    createFusionBall(level: BallLevel, x: number, y: number) {
        return this.createBall(level, x, y, false);
    }

    createBall(level: BallLevel, x: number, y: number, isInit: boolean) {
        // 当小球堆到最顶上的时候会导致跟新创建的小球发生重叠挤压碰撞，但不用担心，以后有了安全线就不会有这个问题了
        // 在那之前就游戏结束了！
        const ball = this.matter.add.image(x, y, `ball-${level}`);
        ball.setCircle(ball.width / 2, {
            restitution: 0.2,
            friction: 0.8,
            frictionAir: 0.01,
            mass: level * level * 0.25,
            label: `ball-${level}`,
        });
        if (isInit) {
            ball.setSensor(true);
            ball.setStatic(true);
            ball.setData("suspend", true);
        } else {
            // 融合小球认为已经碰撞过了(否则融合后初次碰撞会再次触发创建新小球)
            ball.setData("hasCollided", true);
        }

        this.balls.add(ball);
        return ball;
    }

    increaseScore(delta: number) {
        this.setScore(this.score + delta);
    }

    clearScore() {
        this.setScore(0);
    }

    setScore(score: number) {
        this.score = score;
        this.scoreText.setText(this.score + "");
    }
}
