import { Scene } from "phaser";
import { GAME_H, GAME_W } from "../constants";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(GAME_W / 2, GAME_H, "ground").setOrigin(0.5, 1);

        //  A simple progress bar. This is the outline of the bar.
        this.add
            .rectangle(GAME_W / 2, GAME_H / 3, 468, 32)
            .setStrokeStyle(1, 0x77513b);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(
            GAME_W / 2 - 230,
            GAME_H / 3,
            4,
            28,
            0xb28955
        );

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 460 * progress;
        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath("synthetic-winter-tree/assets");

        for (let i = 1; i <= 11; i++) {
            this.load.image(`ball-${i}`, `ball-${i}.png`);
        }
        this.load.image("warning-line", "warning-line.png");
        this.load.image("critical-text", "critical-text.png");
        this.load.audio("biu", "biu.mp3");
        this.load.audio("critical", "critical.mp3");
        this.load.audio("game-over", "game-over.mp3");
        this.load.audio("game-clear", "game-clear.mp3");
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start("MainMenu");
    }
}
