import { useEffect, useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [fullScreen, setFullScreen] = useState(false);
    const [msgVisible, setMsgVisible] = useState(false);

    const toggleFullScreen = async () => {
        if (fullScreen) {
            await document.exitFullscreen();
        } else {
            const elem = document.documentElement;
            await elem.requestFullscreen();
        }
        setFullScreen(!fullScreen);
    };
    const getIsVisited = () => {
        const data = localStorage.getItem("synthetic-winter-tree");
        if (!data) {
            return false;
        }
        try {
            const obj = JSON.parse(data);
            return obj.lastTime >= 1735622147612; // 需要更新的时候修改这个时间戳
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    useEffect(() => {
        if (
            !getIsVisited() &&
            /Mobi|Android|iPhone/i.test(navigator.userAgent)
        ) {
            setMsgVisible(true);
        }

        localStorage.setItem(
            "synthetic-winter-tree",
            JSON.stringify({
                lastTime: Date.now(),
            })
        );
    }, []);

    return (
        <div id="app">
            <button
                id="full-screen-btn"
                className="btn"
                onClick={toggleFullScreen}
            >
                {fullScreen ? "返回" : "全屏"}
            </button>
            <MsgContainer
                visible={msgVisible}
                onHide={() => setMsgVisible(false)}
            />
            <PhaserGame ref={phaserRef} />
        </div>
    );
}

function MsgContainer(props: { visible: boolean; onHide: () => void }) {
    return (
        <div
            className="msg-container"
            style={{ display: props.visible ? "block" : "none" }}
        >
            <header>提示</header>
            <main>
                <p>
                    手机端浏览器如果出现画面显示不全，请尝试点击右上角“全屏”按钮，进入全屏模式，或许可以解决问题。
                </p>
            </main>
            <footer>
                <button className="btn" onClick={props.onHide}>
                    知道了
                </button>
            </footer>
        </div>
    );
}

export default App;
