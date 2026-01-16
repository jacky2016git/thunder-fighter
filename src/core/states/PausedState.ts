/**
 * PausedState Class
 * 暂停状态类
 * 
 * The paused state shown when the game is paused.
 * 游戏暂停时显示的暂停状态。
 */
import { GameState } from '../GameState';
import { InputState } from '../InputState';
import { GameStateType } from '../../types/enums';
import { StateManager } from '../StateManager';
import { GameConfig } from '../../types/GameConfig';

export class PausedState implements GameState {
  readonly type = GameStateType.PAUSED;
  
  private stateManager: StateManager;
  private config: GameConfig;
  
  private resumeKeyPressed: boolean = false;
  private menuKeyPressed: boolean = false;
  private selectedOption: number = 0; // 0 = Resume, 1 = Menu
  
  constructor(stateManager: StateManager, config: GameConfig) {
    this.stateManager = stateManager;
    this.config = config;
  }
  
  /**
   * Called when entering the paused state
   * 进入暂停状态时调用
   */
  enter(): void {
    console.log('Entered Paused State');
    this.resumeKeyPressed = false;
    this.menuKeyPressed = false;
    this.selectedOption = 0;
  }
  
  /**
   * Called when exiting the paused state
   * 退出暂停状态时调用
   */
  exit(): void {
    console.log('Exited Paused State');
  }
  
  /**
   * Update the paused state
   * 更新暂停状态
   * @param _deltaTime Time elapsed since last frame (unused in pause)
   */
  update(_deltaTime: number): void {
    // Paused state doesn't need continuous updates
  }
  
  /**
   * Render the paused state
   * 渲染暂停状态
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;
    
    // Draw semi-transparent overlay
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, width, height);
    
    // Draw pause title
    context.fillStyle = '#e94560';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('游戏暂停', width / 2, height / 3);
    
    // Draw subtitle
    context.fillStyle = '#ffffff';
    context.font = '24px Arial';
    context.fillText('PAUSED', width / 2, height / 3 + 50);
    
    // Draw menu options
    const options = [
      { text: '继续游戏 / Resume', action: 'resume' },
      { text: '返回菜单 / Main Menu', action: 'menu' }
    ];
    
    const optionStartY = height / 2 + 30;
    const optionSpacing = 50;
    
    options.forEach((option, index) => {
      const y = optionStartY + index * optionSpacing;
      const isSelected = index === this.selectedOption;
      
      // Draw selection indicator
      if (isSelected) {
        context.fillStyle = '#e94560';
        context.fillText('▶', width / 2 - 150, y);
      }
      
      // Draw option text
      context.fillStyle = isSelected ? '#ffffff' : '#808080';
      context.font = isSelected ? 'bold 24px Arial' : '24px Arial';
      context.fillText(option.text, width / 2, y);
    });
    
    // Draw instructions
    context.fillStyle = '#a0a0a0';
    context.font = '16px Arial';
    context.fillText('↑↓ 选择 / Select   Enter 确认 / Confirm', width / 2, height - 50);
    context.fillText('P / ESC 继续 / Resume', width / 2, height - 25);
  }
  
  /**
   * Handle input for the paused state
   * 处理暂停状态的输入
   * @param input The current input state
   */
  handleInput(input: InputState): void {
    // Check for resume input (P or Escape)
    const resumePressed = input.keys.has('KeyP') || input.keys.has('Escape');
    
    if (resumePressed && !this.resumeKeyPressed) {
      this.resumeKeyPressed = true;
      this.stateManager.changeState(GameStateType.PLAYING);
      return;
    } else if (!resumePressed) {
      this.resumeKeyPressed = false;
    }
    
    // Handle menu navigation
    if (input.keys.has('ArrowUp') || input.keys.has('KeyW')) {
      if (!this.menuKeyPressed) {
        this.selectedOption = Math.max(0, this.selectedOption - 1);
        this.menuKeyPressed = true;
      }
    } else if (input.keys.has('ArrowDown') || input.keys.has('KeyS')) {
      if (!this.menuKeyPressed) {
        this.selectedOption = Math.min(1, this.selectedOption + 1);
        this.menuKeyPressed = true;
      }
    } else {
      this.menuKeyPressed = false;
    }
    
    // Handle selection
    if (input.keys.has('Enter') || input.keys.has('Space')) {
      if (this.selectedOption === 0) {
        // Resume
        this.stateManager.changeState(GameStateType.PLAYING);
      } else {
        // Return to menu
        this.stateManager.changeState(GameStateType.MENU);
      }
    }
  }
}
