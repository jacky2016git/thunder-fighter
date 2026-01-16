/**
 * MenuState Class
 * 菜单状态类
 * 
 * The main menu state shown when the game starts.
 * 游戏开始时显示的主菜单状态。
 */
import { GameState } from '../GameState';
import { InputState } from '../InputState';
import { GameStateType } from '../../types/enums';
import { StateManager } from '../StateManager';
import { GameConfig } from '../../types/GameConfig';

export class MenuState implements GameState {
  readonly type = GameStateType.MENU;
  
  private stateManager: StateManager;
  private config: GameConfig;
  private startKeyPressed: boolean = false;
  
  constructor(stateManager: StateManager, config: GameConfig) {
    this.stateManager = stateManager;
    this.config = config;
  }
  
  /**
   * Called when entering the menu state
   * 进入菜单状态时调用
   */
  enter(): void {
    this.startKeyPressed = false;
    console.log('Entered Menu State');
  }
  
  /**
   * Called when exiting the menu state
   * 退出菜单状态时调用
   */
  exit(): void {
    console.log('Exited Menu State');
  }
  
  /**
   * Update the menu state
   * 更新菜单状态
   * @param _deltaTime Time elapsed since last frame (unused in menu)
   */
  update(_deltaTime: number): void {
    // Menu state doesn't need continuous updates
  }
  
  /**
   * Render the menu state
   * 渲染菜单状态
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;
    
    // Draw background
    context.fillStyle = '#1a1a2e';
    context.fillRect(0, 0, width, height);
    
    // Draw title
    context.fillStyle = '#e94560';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('雷霆战机', width / 2, height / 3);
    
    // Draw subtitle
    context.fillStyle = '#16213e';
    context.font = '24px Arial';
    context.fillText('Thunder Fighter', width / 2, height / 3 + 50);
    
    // Draw start instruction (blinking effect)
    const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.font = '20px Arial';
    context.fillText('按 ENTER 或 SPACE 开始游戏', width / 2, height / 2 + 50);
    context.fillText('Press ENTER or SPACE to Start', width / 2, height / 2 + 80);
    
    // Draw controls info
    context.fillStyle = '#a0a0a0';
    context.font = '16px Arial';
    context.fillText('控制方式 / Controls:', width / 2, height - 150);
    context.fillText('方向键 / WASD - 移动 / Move', width / 2, height - 120);
    context.fillText('空格键 / 鼠标左键 - 射击 / Fire', width / 2, height - 90);
    context.fillText('P - 暂停 / Pause', width / 2, height - 60);
  }
  
  /**
   * Handle input for the menu state
   * 处理菜单状态的输入
   * @param input The current input state
   */
  handleInput(input: InputState): void {
    // Check for start game input
    const startPressed = input.keys.has('Enter') || 
                         input.keys.has('Space') ||
                         input.mouseDown;
    
    // Only trigger on key down (not held)
    if (startPressed && !this.startKeyPressed) {
      this.startKeyPressed = true;
      this.stateManager.changeState(GameStateType.PLAYING);
    } else if (!startPressed) {
      this.startKeyPressed = false;
    }
  }
}
