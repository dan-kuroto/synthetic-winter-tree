/**
 * 游戏宽度
 */
export const GAME_W = 1080;

/**
 * 游戏高度
 */
export const GAME_H = 2160;

/**
 * 地板图片高度
 */
export const GROUND_IMG_H = 240;

/**
 * 小球初始Y坐标
 */
export const BALL_INIT_Y = 175;

/**
 * 警戒线的Y坐标
 */
export const WARNING_LINE_Y = 400;

/**
 * 显示警戒线的阈值(提前一段距离开始显示)
 */
export const WARNING_LINE_THRESHOLD = 200;

/**
 * 小球连续融合的最短时间间隔 避免融合过快看不清
 */
export const FUSION_MIN_INTERVAL = 200;

/**
 * 计算小球连续融合的时间间隔
 */
export const CONTINUOUS_INTERVAL = 1000;

/**
 * 小球连续融合的次数阈值，超过这个次数则播放暴击音效
 */
export const CONTINUOUS_THRESHOLD = 4;
