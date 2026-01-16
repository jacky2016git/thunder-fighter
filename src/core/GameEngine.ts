/**
 * GameEngine Class
 * 游戏引擎类
 * 
 * The core game controller that manages the game loop, rendering, and state.
 * 管理游戏循环、渲染和状态的核心游戏控制器。
 */
import { StateManager } from './StateManager';
import { InputManager } from './InputManager';
import { EntityManager } from './EntityManager';
import { GameConfig, DEFAULT_GAME_CONFIG } from '../types/GameConfig';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private stateManager: StateManager;
  private inputManager: InputManager;
  private entityManager: EntityManager;
  private config: GameConfig;
  
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  
  // Performance tracking
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFps: number = 0;
  
  constructor(canvasId: string, config: GameConfig = DEFAULT_GAME_CONFIG) {
    // Get canvas element
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
    this.canvas = canvas;
    
    // Get 2D context
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.context = context;
    
    // Store config
    this.config = config;
    
    // Set canvas size from config
    this.canvas.width = config.canvas.width;
    this.canvas.height = config.canvas.height;
    
    // Initialize managers
    this.stateManager = new StateManager();
    this.inputManager = new InputManager(this.canvas);
    this.entityManager = new EntityManager();
    
    // Bind the game loop to preserve 'this' context
    this.gameLoop = this.gameLoop.bind(this);
  }
  
  /**
   * Start the game engine
   * 启动游戏引擎
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Game engine is already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = this.lastFrameTime;
    this.frameCount = 0;
    
    // Start the game loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Stop the game engine
   * 停止游戏引擎
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clean up input manager
    this.inputManager.detach();
  }
  
  /**
   * Pause the game
   * 暂停游戏
   */
  pause(): void {
    if (!this.isRunning) {
      console.warn('Cannot pause: game is not running');
      return;
    }
    
    this.isPaused = true;
  }
  
  /**
   * Resume the game
   * 恢复游戏
   */
  resume(): void {
    if (!this.isRunning) {
      console.warn('Cannot resume: game is not running');
      return;
    }
    
    if (!this.isPaused) {
      console.warn('Game is not paused');
      return;
    }
    
    this.isPaused = false;
    this.lastFrameTime = performance.now(); // Reset to avoid large deltaTime
  }
  
  /**
   * The main game loop
   * 主游戏循环
   * @param currentTime The current timestamp from requestAnimationFrame
   */
  private gameLoop(currentTime: number): void {
    if (!this.isRunning) {
      return;
    }
    
    // Calculate delta time in seconds
    const deltaTime = this.calculateDeltaTime(currentTime);
    
    // Update FPS counter
    this.updateFps(currentTime);
    
    // Handle input
    const inputState = this.inputManager.getInputState();
    this.stateManager.handleInput(inputState);
    
    // Update game state (only if not paused)
    if (!this.isPaused) {
      this.update(deltaTime);
    }
    
    // Render
    this.render();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Calculate delta time between frames
   * 计算帧之间的时间差
   * @param currentTime The current timestamp
   * @returns Delta time in seconds
   */
  private calculateDeltaTime(currentTime: number): number {
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Cap delta time to prevent large jumps (e.g., when tab is inactive)
    return Math.min(deltaTime, 0.1); // Max 100ms
  }
  
  /**
   * Update FPS counter
   * 更新FPS计数器
   * @param currentTime The current timestamp
   */
  private updateFps(currentTime: number): void {
    this.frameCount++;
    
    const elapsed = currentTime - this.fpsUpdateTime;
    if (elapsed >= 1000) { // Update every second
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }
  
  /**
   * Update game logic
   * 更新游戏逻辑
   * @param deltaTime Time elapsed since last frame in seconds
   */
  private update(deltaTime: number): void {
    this.stateManager.update(deltaTime);
  }
  
  /**
   * Render the game
   * 渲染游戏
   */
  private render(): void {
    // Clear the canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render current state
    this.stateManager.render(this.context);
  }
  
  // Getters for managers and state
  
  /**
   * Get the state manager
   * 获取状态管理器
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }
  
  /**
   * Get the input manager
   * 获取输入管理器
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }
  
  /**
   * Get the entity manager
   * 获取实体管理器
   */
  getEntityManager(): EntityManager {
    return this.entityManager;
  }
  
  /**
   * Get the game configuration
   * 获取游戏配置
   */
  getConfig(): GameConfig {
    return this.config;
  }
  
  /**
   * Get the canvas element
   * 获取画布元素
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Get the rendering context
   * 获取渲染上下文
   */
  getContext(): CanvasRenderingContext2D {
    return this.context;
  }
  
  /**
   * Check if the game is running
   * 检查游戏是否正在运行
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Check if the game is paused
   * 检查游戏是否暂停
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }
  
  /**
   * Get the current FPS
   * 获取当前FPS
   */
  getCurrentFps(): number {
    return this.currentFps;
  }
}
