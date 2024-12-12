import { GameObjects, Physics, Scene } from "phaser";

import { EventBus } from "../EventBus";
import {
    BALL_INIT_Y,
    CONTINUOUS_INTERVAL,
    CONTINUOUS_THRESHOLD,
    FUSION_MIN_INTERVAL,
    GAME_H,
    GAME_W,
    GROUND_IMG_H,
    LAST_WARNING_TIME,
    WARNING_LINE_THRESHOLD,
    WARNING_LINE_Y,
} from "../constants";

type BallLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class MainMenu extends Scene {
    ground: GameObjects.Image;
    scoreText: GameObjects.Text;
    gameOverText: GameObjects.Text;
    warningLine: GameObjects.Image;
    balls: GameObjects.Group;
    currentBall: Physics.Matter.Image | null = null;
    warningLineTween: Phaser.Tweens.Tween | null = null;
    gameOverTimer: Phaser.Time.TimerEvent | null = null;
    darkOverlay: GameObjects.Rectangle;

    fusionTimestamps: number[] = [];
    isDragging = false;
    score = 0;
    aboutToGameOver = false;
    isGameOver = false;

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
                fontSize: 108,
                color: "#ee548e",
                stroke: "#ffffff",
                strokeThickness: 5,
                align: "center",
            })
            .setDepth(100);
        this.setScore(0);

        this.gameOverText = this.add
            .text(GAME_W / 2, GAME_H / 2, "Game Over", {
                fontFamily: "Arial Black",
                fontSize: 150,
                color: "#ee548e",
                stroke: "#ffffff",
                strokeThickness: 5,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setAlpha(0);

        this.warningLine = this.add
            .image(GAME_W / 2, WARNING_LINE_Y, "warning-line")
            .setDepth(100)
            .setAlpha(0);

        this.balls = this.add.group({ classType: GameObjects.Image });
        this.currentBall = this.createNewBall();
        this.matter.world.on("collisionstart", this.handleCollision, this);
        this.matter.world.on("collisionactive", this.handleOverlap, this);

        this.darkOverlay = this.add
            .rectangle(0, 0, GAME_W, GAME_H, 0x000000, 1)
            .setAlpha(0)
            .setOrigin(0)
            .setDepth(99);

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number): void {
        const pointer = this.input.activePointer;
        // 拖动小球
        if (!this.isGameOver && pointer.isDown && this.currentBall) {
            this.isDragging = true;
            let x = pointer.x;
            x = Math.min(x, GAME_W - this.currentBall.width / 2);
            x = Math.max(x, this.currentBall.width / 2);
            this.currentBall.setX(x);
        }
        // 放开小球
        if (
            !this.isGameOver &&
            !pointer.isDown &&
            this.isDragging &&
            this.currentBall
        ) {
            this.isDragging = false;
            this.throwBall();
        }
        // 警戒线
        this.warningCheck();
    }

    warningCheck() {
        // 是否显示警戒线
        let showWarning = false;
        let aboutToGameOver = false;
        for (const ball of this.balls.getChildren() as Physics.Matter.Image[]) {
            // 小球已经被销毁
            if (!ball.body) {
                continue;
            }
            // 小球还没发生过碰撞
            if (!ball.getData("hasCollided")) {
                continue;
            }
            // 小球中心点Y坐标-半径Y坐标
            const ballTop = ball.y - ball.height / 2;
            // 如果小球超出警戒线阈值，显示警戒线
            if (ballTop < WARNING_LINE_Y + WARNING_LINE_THRESHOLD) {
                showWarning = true;
                // 如果小球甚至超出警戒线，准备游戏结束
                if (ballTop < WARNING_LINE_Y) {
                    aboutToGameOver = true;
                }
            }
        }
        // 不是游戏结束准备状态，重置标记
        if (!aboutToGameOver && this.aboutToGameOver) {
            this.cancelGameOver();
        }
        // 隐藏警戒线
        if (!showWarning) {
            this.warningLine.setAlpha(0);
            if (this.warningLineTween) {
                this.warningLineTween.stop();
                this.warningLineTween = null;
            }
            return;
        }
        // 显示警戒线
        if (!this.warningLineTween || !this.warningLineTween.isPlaying()) {
            this.warningLine.setAlpha(1);
            this.warningLineTween = this.tweens.add({
                targets: this.warningLine,
                alpha: 0,
                duration: 500,
                yoyo: true,
                repeat: -1,
            });
        }
        // 游戏结束准备
        if (aboutToGameOver && !this.aboutToGameOver) {
            this.prepareGameOver();
        }
    }

    cancelGameOver() {
        this.aboutToGameOver = false;
        // 警戒线闪烁动画恢复正常
        if (this.warningLineTween) {
            this.warningLineTween.timeScale = 1;
        }
        // 取消游戏结束计时器
        if (this.gameOverTimer) {
            this.gameOverTimer.remove();
            this.gameOverTimer = null;
        }
    }

    prepareGameOver() {
        this.aboutToGameOver = true;
        // 警戒线闪烁动画加速
        if (this.warningLineTween) {
            this.warningLineTween.timeScale = 4;
        }
        // 计时一段时间后开始播放游戏结束音效
        this.gameOverTimer = this.time.delayedCall(
            LAST_WARNING_TIME,
            this.gameOver,
            [],
            this
        );
    }

    gameOver() {
        this.isGameOver = true;
        // 播放游戏结束音效
        this.sound.play("game-over");
        // 显示游戏结束文字提示(延迟2秒，以匹配音效)
        this.time.delayedCall(
            2000,
            () => {
                this.tweens.add({
                    targets: this.gameOverText,
                    alpha: 1,
                    duration: 700,
                });
            },
            [],
            this
        );
        // 添加屏幕变暗效果
        this.tweens.add({
            targets: this.darkOverlay,
            alpha: 0.5,
            duration: 700,
            ease: "Power2",
        });
        let count = 0;
        for (const ball of this.balls.getChildren() as Physics.Matter.Image[]) {
            count++;
            // 锁死所有小球
            ball.setSensor(true);
            ball.setStatic(true);
            // 每个小球计分
            const label = ball.body.label as string;
            const level = parseInt(label.split("-")[1], 10) as BallLevel;
            const scoreDelta = MainMenu.levelToScore(level);
            // 每个小球延迟一定时间后计分和播放动画
            this.time.delayedCall(
                (count % 10) * 100,
                () => {
                    // 有可能在延迟过程中小球已经被销毁了(正好碰上融合)
                    if (ball.getData("aboutToDestroy") || !ball.body) {
                        return;
                    }
                    this.increaseScoreWithAnimation(scoreDelta, ball.x, ball.y);
                },
                [],
                this
            );
        }
    }

    static levelToScore(level: BallLevel) {
        return level + (level === 11 ? 100 : 0);
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
        if (this.isGameOver) {
            return;
        }
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
        if (this.isGameOver) {
            return;
        }
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
        const x = (ballA.x + ballB.x) / 2;
        const y = (ballA.y + ballB.y) / 2;
        // 算分
        const scoreDelta = MainMenu.levelToScore(newLevel);
        this.increaseScoreWithAnimation(scoreDelta, x, y);
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
            ball.setDepth(-1);
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
        this.currentBall.setDepth(0);
        this.currentBall = null;
    }

    createNewBall() {
        // NOTE 注意这里如果生成小球太大有可能会触发跟天花板的碰撞，导致可以无CD连续生成小球
        //      但只要保证最大不超过5级小球就不会有这个问题，不是BUG！
        return this.createBall(
            (Math.floor(Math.random() * 5) + 1) as BallLevel,
            GAME_W / 2,
            BALL_INIT_Y,
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
            ball.setDepth(1);
        } else {
            // 融合小球认为已经碰撞过了(否则融合后初次碰撞会再次触发创建新小球)
            ball.setData("hasCollided", true);
        }

        this.balls.add(ball);
        return ball;
    }

    clearScore() {
        this.setScore(0);
    }

    setScore(score: number) {
        this.score = score;
        this.scoreText.setText(this.score + "");
    }

    increaseScoreWithAnimation(scoreDelta: number, x: number, y: number) {
        const scoreIncrementText = this.add
            .text(x, y, `+${scoreDelta}`, {
                fontFamily: "Arial Black",
                fontSize: scoreDelta > 10 ? 200 : Math.max(48, scoreDelta * 20),
                color: "#ee548e",
                stroke: "#ffffff",
                strokeThickness: 5,
                align: "center",
            })
            .setDepth(101);

        this.tweens.add({
            targets: scoreIncrementText,
            x: 40,
            y: 20,
            alpha: 0,
            duration: 1000,
            ease: "Power2",
            onComplete: () => {
                scoreIncrementText.destroy();
                this.setScore(this.score + scoreDelta);
            },
        });
    }
}
