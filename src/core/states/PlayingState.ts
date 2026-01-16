/**
 * PlayingState Class
 * 游戏中状态类
 * 
 * The main gameplay state where the action happens.
 * 游戏进行中的主要状态。
 */
import { GameState } from '../GameState';
import { InputState } from '../InputState';
import { GameStateType } from '../../types/enums';
import { StateManager } from '../StateManager';
import { EntityManager } from '../EntityManager';
import { GameConfig } from '../../types/GameConfig';

export class PlayingState implements GameState {
  readonly type = GameStateType.PLAYING;
  
  private stateManager: StateManager;
  private entityManager: EntityManager;
  private config: GameConfig;
  
  // Game state
  private score: number = 0;
  private health: number = 3;
  private gameTime: number = 0;
  private pauseKeyPressed: boolean = false;
  
  constructor(
    stateManager: StateManager, 
    entityManager: EntityManager,
    config: GameConfig
  ) {
    this.stateManager = stateManager;
    this.entityManager = entityManager;
    this.config = config;
  }
  
  /**
   * Called when entering the playing state
   * 进入游戏状态时调用
   */
  enter(): void {
    console.log('Entered Playing State');
    this.pauseKeyPressed = false;
    
    // Reset game state if coming from menu or game over
    // (This will be expanded when player entity is implemented)
    this.score = 0;
    this.health = this.config.player.maxHealth;
    this.gameTime = 0;
    
    // Clear any existing entities
    this.entityManager.clear();
  }
  
  /**
   * Called when exiting the playing state
   * 退出游戏状态时调用
   */
  exit(): void {
    console.log('Exited Playing State');
  }
  
  /**
   * Update the playing state
   * 更新游戏状态
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    
    // Update all entities
    this.entityManager.update(deltaTime);
    
    // Check for game over condition
    if (this.health <= 0) {
      this.stateManager.changeState(GameStateType.GAME_OVER);
    }
  }
  
  /**
   * Render the playing state
   * 渲染游戏状态
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;
    
    // Draw background
    context.fillStyle = '#0f0f23';
    context.fillRect(0, 0, width, height);
    
    // Draw stars (simple background effect)
    this.renderStars(context);
    
    // Render all entities
    this.entityManager.render(context);
    
    // Render UI
    this.renderUI(context);
  }
  
  /**
   * Handle input for the playing state
   * 处理游戏状态的输入
   * @param input The current input state
   */
  handleInput(input: InputState): void {
    // Check for pause input
    const pausePressed = input.keys.has('KeyP') || input.keys.has('Escape');
    
    if (pausePressed && !this.pauseKeyPressed) {
      this.pauseKeyPressed = true;
      this.stateManager.changeState(GameStateType.PAUSED);
    } else if (!pausePressed) {
      this.pauseKeyPressed = false;
    }
    
    // Player input handling will be added when PlayerAircraft is implemented
  }
  
  /**
   * Render simple star background
   * 渲染简单的星星背景
   */
  private renderStars(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#ffffff';
    
    // Use game time to create scrolling effect
    const offset = (this.gameTime * 50) % this.config.canvas.height;
    
    // Draw some static stars (positions based on simple hash)
    for (let i = 0; i < 50; i++) {
      const x = (i * 97) % this.config.canvas.width;
      const y = ((i * 73 + offset) % this.config.canvas.height);
      const size = (i % 3) + 1;
      
      context.globalAlpha = 0.3 + (i % 5) * 0.1;
      context.fillRect(x, y, size, size);
    }
    
    context.globalAlpha = 1;
  }
  
  /**
   * Render the game UI
   * 渲染游戏UI
   */
  private renderUI(context: CanvasRenderingContext2D): void {
    const { width } = this.config.canvas;
    
    // Draw score
    context.fillStyle = '#ffffff';
    context.font = '20px Arial';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText(`分数: ${this.score}`, 10, 10);
    
    // Draw health
    context.fillStyle = '#e94560';
    context.textAlign = 'right';
    context.fillText(`生命: ${'❤'.repeat(this.health)}`, width - 10, 10);
    
    // Draw game time
    context.fillStyle = '#a0a0a0';
    context.font = '14px Arial';
    context.textAlign = 'left';
    context.fillText(`时间: ${Math.floor(this.gameTime)}s`, 10, 35);
  }
  
  // Public methods for game logic
  
  /**
   * Add to the score
   * 增加分数
   * @param points Points to add
   */
  addScore(points: number): void {
    this.score += points;
  }
  
  /**
   * Get the current score
   * 获取当前分数
   */
  getScore(): number {
    return this.score;
  }
  
  /**
   * Set the health
   * 设置生命值
   * @param health New health value
   */
  setHealth(health: number): void {
    this.health = Math.max(0, Math.min(health, this.config.player.maxHealth));
  }
  
  /**
   * Get the current health
   * 获取当前生命值
   */
  getHealth(): number {
    return this.health;
  }
  
  /**
   * Take damage
   * 受到伤害
   * @param damage Amount of damage
   */
  takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage);
  }
  
  /**
   * Get the game time
   * 获取游戏时间
   */
  getGameTime(): number {
    return this.gameTime;
  }
}
