/**
 * InputState Interface
 * 输入状态接口
 * 
 * Represents the current state of all input devices.
 * 表示所有输入设备的当前状态。
 */
export interface InputState {
  /** Set of currently pressed keys */
  keys: Set<string>;
  
  /** Current mouse X position relative to canvas */
  mouseX: number;
  
  /** Current mouse Y position relative to canvas */
  mouseY: number;
  
  /** Whether the mouse button is currently pressed */
  mouseDown: boolean;
}

/**
 * Create a default input state
 * 创建默认输入状态
 */
export function createDefaultInputState(): InputState {
  return {
    keys: new Set<string>(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false
  };
}
