import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Event emitted from the PhaserGame component
    const onCurrentSceneReady = (scene: Phaser.Scene) => {
        console.log(scene.scene.key);
    };

    return (
        <div id="app">
            <PhaserGame
                ref={phaserRef}
                onCurrentSceneReady={onCurrentSceneReady}
            />
        </div>
    );
}

export default App;
