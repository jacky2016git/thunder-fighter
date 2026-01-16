/**
 * GameOverState Class
 * 游戏结束状态类
 * 
 * The game over state shown when the player loses.
 * 玩家失败时显示的游戏结束状态。
 */
import { GameState } from '../GameState';
import { InputState } from '../InputState';
import { GameStateType } from '../../types/enums';
import { StateManager } from '../StateManager';
import { GameConfig } from '../../types/GameConfig';

export class GameOverState implements GameState {
  readonly type = GameStateType.GAME_OVER;
  
  private stateManager: StateManager;
  private config: GameConfig;
  
  private keyPressed: boolean = false;
  private selectedOption: number = 0; // 0 = Restart, 1 = Menu
  private menuKeyPressed: boolean = false;
  
  // Score data (will be set when entering state)
  private finalScore: number = 0;
  private highScore: number = 0;
  private isNewHighScore: boolean = false;
  
  constructor(stateManager: StateManager, config: GameConfig) {
    this.stateManager = stateManager;
    this.config = config;
  }
  
  /**
   * Called when entering the game over state
   * 进入游戏结束状态时调用
   */
  enter(): void {
    console.log('Entered Game Over State');
    this.keyPressed = false;
    this.menuKeyPressed = false;
    this.selectedOption = 0;
    
    // Load high score from localStorage
    this.loadHighScore();
    
    // Check if new high score
    if (this.finalScore > this.highScore) {
      this.highScore = this.finalScore;
      this.isNewHighScore = true;
      this.saveHighScore();
    } else {
      this.isNewHighScore = false;
    }
  }
  
  /**
   * Called when exiting the game over state
   * 退出游戏结束状态时调用
   */
  exit(): void {
    console.log('Exited Game Over State');
  }
  
  /**
   * Update the game over state
   * 更新游戏结束状态
   * @param _deltaTime Time elapsed since last frame (unused)
   */
  update(_deltaTime: number): void {
    // Game over state doesn't need continuous updates
  }
  
  /**
   * Render the game over state
   * 渲染游戏结束状态
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;
    
    // Draw background
    context.fillStyle = '#1a1a2e';
    context.fillRect(0, 0, width, height);
    
    // Draw game over title
    context.fillStyle = '#e94560';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('游戏结束', width / 2, height / 4);
    
    // Draw subtitle
    context.fillStyle = '#ffffff';
    context.font = '24px Arial';
    context.fillText('GAME OVER', width / 2, height / 4 + 50);
    
    // Draw score
    context.fillStyle = '#ffffff';
    context.font = '28px Arial';
    context.fillText(`最终得分: ${this.finalScore}`, width / 2, height / 2 - 40);
    
    // Draw high score
    if (this.isNewHighScore) {
      // Blinking new high score text
      const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      context.fillStyle = `rgba(233, 69, 96, ${alpha})`;
      context.font = 'bold 24px Arial';
      context.fillText('🎉 新纪录! NEW HIGH SCORE! 🎉', width / 2, height / 2);
    }
    
    context.fillStyle = '#ffd700';
    context.font = '24px Arial';
    context.fillText(`最高分: ${this.highScore}`, width / 2, height / 2 + 40);
    
    // Draw menu options
    const options = [
      { text: '重新开始 / Restart', action: 'restart' },
      { text: '返回菜单 / Main Menu', action: 'menu' }
    ];
    
    const optionStartY = height / 2 + 120;
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
    context.fillText('↑↓ 选择 / Select   Enter 确认 / Confirm', width / 2, height - 30);
  }
  
  /**
   * Handle input for the game over state
   * 处理游戏结束状态的输入
   * @param input The current input state
   */
  handleInput(input: InputState): void {
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
    const confirmPressed = input.keys.has('Enter') || input.keys.has('Space');
    
    if (confirmPressed && !this.keyPressed) {
      this.keyPressed = true;
      
      if (this.selectedOption === 0) {
        // Restart game
        this.stateManager.changeState(GameStateType.PLAYING);
      } else {
        // Return to menu
        this.stateManager.changeState(GameStateType.MENU);
      }
    } else if (!confirmPressed) {
      this.keyPressed = false;
    }
  }
  
  /**
   * Set the final score
   * 设置最终得分
   * @param score The final score
   */
  setFinalScore(score: number): void {
    this.finalScore = score;
  }
  
  /**
   * Get the final score
   * 获取最终得分
   */
  getFinalScore(): number {
    return this.finalScore;
  }
  
  /**
   * Get the high score
   * 获取最高分
   */
  getHighScore(): number {
    return this.highScore;
  }
  
  /**
   * Load high score from localStorage
   * 从localStorage加载最高分
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('thunderFighter_highScore');
      this.highScore = saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      console.warn('Could not load high score from localStorage:', e);
      this.highScore = 0;
    }
  }
  
  /**
   * Save high score to localStorage
   * 保存最高分到localStorage
   */
  private saveHighScore(): void {
    try {
      localStorage.setItem('thunderFighter_highScore', this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score to localStorage:', e);
    }
  }
}
