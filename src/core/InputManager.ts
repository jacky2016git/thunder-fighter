/**
 * InputManager Class
 * 输入管理器类
 * 
 * Handles keyboard and mouse input for the game.
 * 处理游戏的键盘和鼠标输入。
 */
import { InputState, createDefaultInputState } from './InputState';

/**
 * Default key bindings
 * 默认键位绑定
 */
const DEFAULT_KEY_BINDINGS: Record<string, string> = {
  // Movement
  'ArrowUp': 'moveUp',
  'ArrowDown': 'moveDown',
  'ArrowLeft': 'moveLeft',
  'ArrowRight': 'moveRight',
  'KeyW': 'moveUp',
  'KeyS': 'moveDown',
  'KeyA': 'moveLeft',
  'KeyD': 'moveRight',
  // Actions
  'Space': 'fire',
  'KeyP': 'pause',
  'Escape': 'menu',
  'Enter': 'confirm'
};

export class InputManager {
  private inputState: InputState;
  private keyBindings: Map<string, string>;
  private canvas: HTMLCanvasElement | null = null;
  
  // Bound event handlers for proper removal
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  
  constructor(canvas?: HTMLCanvasElement) {
    this.inputState = createDefaultInputState();
    this.keyBindings = new Map(Object.entries(DEFAULT_KEY_BINDINGS));
    
    // Bind event handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    
    if (canvas) {
      this.attachToCanvas(canvas);
    }
  }
  
  /**
   * Attach input listeners to a canvas element
   * 将输入监听器附加到画布元素
   * @param canvas The canvas element
   */
  attachToCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    
    // Keyboard events on document
    document.addEventListener('keydown', this.boundHandleKeyDown);
    document.addEventListener('keyup', this.boundHandleKeyUp);
    
    // Mouse events on canvas
    canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    canvas.addEventListener('mousedown', this.boundHandleMouseDown);
    canvas.addEventListener('mouseup', this.boundHandleMouseUp);
    
    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Detach input listeners
   * 分离输入监听器
   */
  detach(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    document.removeEventListener('keyup', this.boundHandleKeyUp);
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
      this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
      this.canvas.removeEventListener('mouseup', this.boundHandleMouseUp);
      this.canvas = null;
    }
  }
  
  /**
   * Get the current input state
   * 获取当前输入状态
   */
  getInputState(): InputState {
    return this.inputState;
  }
  
  /**
   * Check if an action is currently active
   * 检查某个动作是否当前激活
   * @param action The action name (e.g., 'moveUp', 'fire')
   */
  isActionActive(action: string): boolean {
    for (const [key, boundAction] of this.keyBindings) {
      if (boundAction === action && this.inputState.keys.has(key)) {
        return true;
      }
    }
    
    // Special case for fire action with mouse
    if (action === 'fire' && this.inputState.mouseDown) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if a specific key is pressed
   * 检查特定键是否被按下
   * @param keyCode The key code (e.g., 'KeyW', 'Space')
   */
  isKeyPressed(keyCode: string): boolean {
    return this.inputState.keys.has(keyCode);
  }
  
  /**
   * Get the current mouse position
   * 获取当前鼠标位置
   */
  getMousePosition(): { x: number; y: number } {
    return {
      x: this.inputState.mouseX,
      y: this.inputState.mouseY
    };
  }
  
  /**
   * Check if the mouse button is down
   * 检查鼠标按钮是否按下
   */
  isMouseDown(): boolean {
    return this.inputState.mouseDown;
  }
  
  /**
   * Set a key binding
   * 设置键位绑定
   * @param keyCode The key code
   * @param action The action name
   */
  setKeyBinding(keyCode: string, action: string): void {
    this.keyBindings.set(keyCode, action);
  }
  
  /**
   * Get the action bound to a key
   * 获取绑定到某个键的动作
   * @param keyCode The key code
   */
  getKeyBinding(keyCode: string): string | undefined {
    return this.keyBindings.get(keyCode);
  }
  
  /**
   * Get all key bindings
   * 获取所有键位绑定
   */
  getAllKeyBindings(): Map<string, string> {
    return new Map(this.keyBindings);
  }
  
  /**
   * Reset key bindings to defaults
   * 重置键位绑定为默认值
   */
  resetKeyBindings(): void {
    this.keyBindings = new Map(Object.entries(DEFAULT_KEY_BINDINGS));
  }
  
  /**
   * Clear all current input state
   * 清除所有当前输入状态
   */
  clearInputState(): void {
    this.inputState.keys.clear();
    this.inputState.mouseDown = false;
  }
  
  // Private event handlers
  
  private handleKeyDown(event: KeyboardEvent): void {
    // Prevent default for game keys to avoid scrolling, etc.
    if (this.keyBindings.has(event.code)) {
      event.preventDefault();
    }
    this.inputState.keys.add(event.code);
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    this.inputState.keys.delete(event.code);
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    this.inputState.mouseX = (event.clientX - rect.left) * scaleX;
    this.inputState.mouseY = (event.clientY - rect.top) * scaleY;
  }
  
  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      this.inputState.mouseDown = true;
    }
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      this.inputState.mouseDown = false;
    }
  }
}
