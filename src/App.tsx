import { useEffect, useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [msgModalVisible, setMsgModalVisible] = useState(false);
    const [moreModalVisible, setMoreModalVisible] = useState(false);

    const turnOnFullScreen = async () => {
        setMoreModalVisible(false);
        await document.documentElement.requestFullscreen();
    };
    const turnOffFullScreen = async () => {
        setMoreModalVisible(false);
        await document.exitFullscreen();
    };
    const openGithub = () => {
        setMoreModalVisible(false);
        const url = "https://github.com/dan-kuroto/synthetic-winter-tree";
        window.open(url, "_blank");
    };
    const getRecentlyVisited = () => {
        const data = localStorage.getItem("synthetic-winter-tree");
        if (!data) {
            return false;
        }
        try {
            const obj = JSON.parse(data);
            // 更新的时候修改这个时间戳
            const lastUpdateTime = 1736397825063;
            // 更新后访问过、且一天内访问过，认为是最近访问过
            return (
                obj.lastTime > lastUpdateTime &&
                Date.now() - obj.lastTime < 3 * 24 * 60 * 60 * 1000
            );
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    useEffect(() => {
        if (
            !getRecentlyVisited() &&
            /Mobi|Android|iPhone/i.test(navigator.userAgent)
        ) {
            setMsgModalVisible(true);
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
                className="btn"
                style={{ position: "absolute", right: 10, top: 10 }}
                onClick={() => setMoreModalVisible((pre) => !pre)}
            >
                更多
            </button>
            <Modal
                visible={moreModalVisible}
                title="更多"
                content={
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            marginTop: 10,
                            gap: 10,
                        }}
                    >
                        <button className="btn" onClick={turnOnFullScreen}>
                            全屏模式
                        </button>
                        <button className="btn" onClick={turnOffFullScreen}>
                            退出全屏
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                setMoreModalVisible(false);
                                setMsgModalVisible(true);
                            }}
                        >
                            帮助
                        </button>
                        <button className="btn" onClick={openGithub}>
                            Github
                        </button>
                    </div>
                }
            />
            <Modal
                visible={msgModalVisible}
                title="提示"
                content={
                    <>
                        <p>
                            手机端浏览器若出现画面显示不全，可尝试以下方式解决：
                        </p>
                        <ul style={{ fontSize: "0.95em" }}>
                            <li>点击右上角“更多”进入全屏模式</li>
                            <li>
                                iOS设备：点击浏览器底部分享按钮，选择“添加到主屏幕”后，以全屏打开
                            </li>
                        </ul>
                    </>
                }
                footer={
                    <button
                        className="btn"
                        onClick={() => setMsgModalVisible(false)}
                    >
                        知道了
                    </button>
                }
            />
            <PhaserGame ref={phaserRef} />
        </div>
    );
}

function Modal(props: {
    visible: boolean;
    title?: string | JSX.Element;
    content?: string | JSX.Element;
    footer?: string | JSX.Element;
}) {
    return (
        <div className={`modal ${props.visible ? "active" : ""}`}>
            <header>{props.title}</header>
            <main>{props.content}</main>
            <footer>{props.footer}</footer>
        </div>
    );
}

export default App;
