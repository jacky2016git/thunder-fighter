/**
 * Thunder Fighter Game - Main Entry Point
 * 雷霆战机游戏 - 主入口文件
 * 
 * This file initializes and integrates all game systems:
 * - GameEngine: Core game loop and state management
 * - StateManager: Game state transitions (Menu, Playing, Paused, GameOver)
 * - InputManager: Keyboard and mouse input handling
 * - EntityManager: Game entity lifecycle management
 * - CollisionSystem: Collision detection and response
 * - SpawnSystem: Enemy and power-up spawning
 * - ScoreSystem: Score tracking and persistence
 * - RenderSystem: Visual rendering
 * - AudioManager: Sound effects and music
 * - VisualEffects: Explosions, particles, screen effects
 * - BackgroundRenderer: Scrolling space background
 * - UIRenderer: HUD and menu rendering
 * - SpriteManager: Procedural sprite generation
 */

import { GameEngine } from './core/GameEngine';
import { StateManager } from './core/StateManager';
import { EntityManager } from './core/EntityManager';
import { InputManager } from './core/InputManager';
import { MenuState } from './core/states/MenuState';
import { PlayingState } from './core/states/PlayingState';
import { PausedState } from './core/states/PausedState';
import { GameOverState } from './core/states/GameOverState';
import { CollisionSystem, CollisionEventType } from './systems/CollisionSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { ScoreSystem } from './systems/ScoreSystem';
// RenderSystem available for advanced rendering features
// import { RenderSystem } from './systems/RenderSystem';
import { AudioManager } from './systems/AudioManager';
import { VisualEffects } from './systems/VisualEffects';
import { BackgroundRenderer } from './systems/BackgroundRenderer';
import { UIRenderer } from './systems/UIRenderer';
import { SpriteManager } from './systems/SpriteManager';
import { PlayerAircraft } from './entities/PlayerAircraft';
import { EnemyAircraft } from './entities/EnemyAircraft';
import { Bullet } from './entities/Bullet';
import { PowerUp } from './entities/PowerUp';
import { GameStateType, SoundEffect, EnemyType, BulletOwner } from './types/enums';
import { DEFAULT_GAME_CONFIG, GameConfig } from './types/GameConfig';

/**
 * ThunderFighterGame Class
 * 雷霆战机游戏类
 * 
 * Main game class that orchestrates all systems and manages the game lifecycle.
 */
class ThunderFighterGame {
  // Core systems
  private engine: GameEngine;
  private stateManager: StateManager;
  private entityManager: EntityManager;
  private inputManager: InputManager;
  
  // Game systems
  private collisionSystem: CollisionSystem;
  private spawnSystem: SpawnSystem;
  private scoreSystem: ScoreSystem;
  // RenderSystem is available but we use custom rendering in this integration
  // private renderSystem: RenderSystem;
  private audioManager: AudioManager;
  
  // Visual systems
  private visualEffects: VisualEffects;
  private backgroundRenderer: BackgroundRenderer;
  private uiRenderer: UIRenderer;
  private spriteManager: SpriteManager;
  
  // Game state
  private player: PlayerAircraft | null = null;
  private config: GameConfig;
  private gameTime: number = 0;
  private isInitialized: boolean = false;
  
  // Game states
  private menuState: MenuState | null = null;
  private playingState: PlayingState | null = null;
  private pausedState: PausedState | null = null;
  private gameOverState: GameOverState | null = null;

  constructor(canvasId: string = 'gameCanvas') {
    this.config = DEFAULT_GAME_CONFIG;
    
    // Initialize core engine
    this.engine = new GameEngine(canvasId, this.config);
    this.stateManager = this.engine.getStateManager();
    this.entityManager = this.engine.getEntityManager();
    this.inputManager = this.engine.getInputManager();
    
    // Initialize game systems
    this.collisionSystem = new CollisionSystem();
    this.spawnSystem = new SpawnSystem(undefined, this.config);
    this.scoreSystem = new ScoreSystem();
    // RenderSystem available for future use
    // this.renderSystem = new RenderSystem(this.engine.getContext(), this.config);
    this.audioManager = new AudioManager();
    
    // Initialize visual systems
    this.visualEffects = new VisualEffects(this.config);
    this.backgroundRenderer = new BackgroundRenderer(this.config);
    this.uiRenderer = new UIRenderer(this.config);
    this.spriteManager = new SpriteManager();
  }

  /**
   * Initialize the game
   * 初始化游戏
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Thunder Fighter - Initializing...');
    
    // Initialize sprite manager (async to load SVG sprites)
    await this.spriteManager.initialize();
    
    // Initialize audio (will be fully activated on first user interaction)
    await this.audioManager.initialize();
    
    // Load audio assets (non-blocking)
    this.loadAudioAssets();
    
    // Register game states
    this.registerGameStates();
    
    // Setup collision callbacks
    this.setupCollisionCallbacks();
    
    // Override engine's update and render methods
    this.setupGameLoop();
    
    this.isInitialized = true;
    console.log('Thunder Fighter - Initialization complete!');
  }

  /**
   * Register all game states with the state manager
   * 向状态管理器注册所有游戏状态
   */
  private registerGameStates(): void {
    // Create game states
    this.menuState = new MenuState(this.stateManager, this.config);
    this.playingState = new PlayingState(this.stateManager, this.entityManager, this.config);
    this.pausedState = new PausedState(this.stateManager, this.config);
    this.gameOverState = new GameOverState(this.stateManager, this.config);
    
    // Register states
    this.stateManager.registerState(GameStateType.MENU, this.menuState);
    this.stateManager.registerState(GameStateType.PLAYING, this.playingState);
    this.stateManager.registerState(GameStateType.PAUSED, this.pausedState);
    this.stateManager.registerState(GameStateType.GAME_OVER, this.gameOverState);
    
    // Set initial state to menu
    this.stateManager.changeState(GameStateType.MENU);
    
    console.log('Game states registered: Menu, Playing, Paused, GameOver');
  }

  /**
   * Setup collision system callbacks
   * 设置碰撞系统回调
   */
  private setupCollisionCallbacks(): void {
    // Player bullet hits enemy
    this.collisionSystem.onCollision(CollisionEventType.PLAYER_BULLET_ENEMY, (event) => {
      const bullet = event.entityA as Bullet;
      const enemy = event.entityB as EnemyAircraft;
      
      // Apply damage to enemy
      enemy.takeDamage(bullet.damage);
      bullet.active = false;
      
      // Record hit for accuracy
      this.scoreSystem.recordHit();
      
      // Create impact sparks
      this.visualEffects.createImpactSparks(bullet.x, bullet.y, 5);
      
      // Play hit sound
      this.audioManager.playSound(SoundEffect.HIT);
      
      // If enemy destroyed
      if (!enemy.active) {
        // Add score
        this.scoreSystem.addScore(enemy.scoreValue, this.gameTime);
        this.scoreSystem.recordEnemyDestroyed();
        
        // Create explosion
        const explosionSize = enemy.type === EnemyType.BOSS ? 2 : 1;
        this.visualEffects.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          explosionSize
        );
        
        // Play explosion sound
        this.audioManager.playSound(SoundEffect.EXPLOSION);
        
        // Try to spawn power-up
        this.spawnSystem.trySpawnPowerUp(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          this.entityManager
        );
        
        // Record for boss tracking
        if (enemy.type === EnemyType.BOSS) {
          this.spawnSystem.onBossDefeated();
        } else {
          this.spawnSystem.recordEnemyDestroyed(this.entityManager);
        }
      }
    });

    // Enemy bullet hits player
    this.collisionSystem.onCollision(CollisionEventType.ENEMY_BULLET_PLAYER, (event) => {
      const bullet = event.entityA as Bullet;
      const player = event.entityB as PlayerAircraft;
      
      if (!player.invincible) {
        player.takeDamage(bullet.damage);
        bullet.active = false;
        
        // Create damage effect
        this.visualEffects.createDamageEffect();
        this.audioManager.playSound(SoundEffect.HIT);
        
        // Update playing state health
        if (this.playingState) {
          this.playingState.setHealth(player.health);
        }
        
        // Check for game over
        if (player.health <= 0) {
          this.handleGameOver();
        }
      }
    });

    // Player collides with enemy
    this.collisionSystem.onCollision(CollisionEventType.PLAYER_ENEMY, (event) => {
      const player = event.entityA as PlayerAircraft;
      const enemy = event.entityB as EnemyAircraft;
      
      if (!player.invincible) {
        player.takeDamage(1);
        enemy.active = false;
        
        // Create effects
        this.visualEffects.createDamageEffect();
        this.visualEffects.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          0.8
        );
        this.audioManager.playSound(SoundEffect.EXPLOSION);
        
        // Update playing state health
        if (this.playingState) {
          this.playingState.setHealth(player.health);
        }
        
        // Check for game over
        if (player.health <= 0) {
          this.handleGameOver();
        }
      }
    });

    // Player collects power-up
    this.collisionSystem.onCollision(CollisionEventType.PLAYER_POWERUP, (event) => {
      const player = event.entityA as PlayerAircraft;
      const powerUp = event.entityB as PowerUp;
      
      // Apply power-up effect
      powerUp.apply(player);
      
      // Create collection effect
      const colors: Record<string, string> = {
        'weaponUpgrade': '#ffd700',
        'health': '#00ff00',
        'shield': '#4169e1'
      };
      this.visualEffects.createPowerUpEffect(
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2,
        colors[powerUp.type] || '#ffffff'
      );
      
      // Play power-up sound
      this.audioManager.playSound(SoundEffect.POWER_UP);
      
      // Update playing state health if health power-up
      if (this.playingState) {
        this.playingState.setHealth(player.health);
      }
    });
  }

  /**
   * Setup the main game loop integration
   * 设置主游戏循环集成
   */
  private setupGameLoop(): void {
    // Store original methods
    const originalUpdate = this.stateManager.update.bind(this.stateManager);
    const originalRender = this.stateManager.render.bind(this.stateManager);
    
    // Override state manager update
    this.stateManager.update = (deltaTime: number) => {
      const currentState = this.stateManager.getCurrentStateType();
      
      if (currentState === GameStateType.PLAYING) {
        this.updatePlaying(deltaTime);
      } else if (currentState === GameStateType.MENU) {
        this.updateMenu(deltaTime);
      }
      
      // Call original update for state-specific logic
      originalUpdate(deltaTime);
    };
    
    // Override state manager render
    this.stateManager.render = (context: CanvasRenderingContext2D) => {
      const currentState = this.stateManager.getCurrentStateType();
      console.log('Render called, current state:', currentState);
      
      // Always clear canvas first
      context.fillStyle = '#0a0a1a';
      context.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);
      
      if (currentState === GameStateType.PLAYING) {
        this.renderPlaying(context);
      } else if (currentState === GameStateType.MENU) {
        this.renderMenu(context);
      } else if (currentState === GameStateType.PAUSED) {
        // Render game state behind pause overlay
        this.renderPlaying(context);
        originalRender(context);
      } else if (currentState === GameStateType.GAME_OVER) {
        this.renderPlaying(context);
        originalRender(context);
      } else {
        console.log('Using original render for state:', currentState);
        originalRender(context);
      }
    };
    
    // Listen for state changes
    this.setupStateChangeListeners();
  }

  /**
   * Setup listeners for state changes
   * 设置状态变化监听器
   */
  private setupStateChangeListeners(): void {
    // Store original changeState
    const originalChangeState = this.stateManager.changeState.bind(this.stateManager);
    
    this.stateManager.changeState = (type: GameStateType): boolean => {
      const previousState = this.stateManager.getCurrentStateType();
      const result = originalChangeState(type);
      
      if (result) {
        this.onStateChange(previousState, type);
      }
      
      return result;
    };
  }

  /**
   * Handle state change events
   * 处理状态变化事件
   */
  private onStateChange(from: GameStateType | null, to: GameStateType): void {
    console.log(`State change: ${from} -> ${to}`);
    
    if (to === GameStateType.PLAYING && from !== GameStateType.PAUSED) {
      // Starting new game
      this.startNewGame();
    } else if (to === GameStateType.PLAYING && from === GameStateType.PAUSED) {
      // Resuming from pause
      this.audioManager.resumeMusic();
    } else if (to === GameStateType.PAUSED) {
      // Pausing game
      this.audioManager.pauseMusic();
    } else if (to === GameStateType.MENU) {
      // Returning to menu
      this.audioManager.stopMusic();
      this.resetGame();
    } else if (to === GameStateType.GAME_OVER) {
      // Game over
      this.audioManager.stopMusic();
    }
  }

  /**
   * Start a new game
   * 开始新游戏
   */
  private startNewGame(): void {
    console.log('Starting new game...');
    
    // Reset systems
    this.entityManager.clear();
    this.scoreSystem.reset();
    this.spawnSystem.reset();
    this.visualEffects.clear();
    this.backgroundRenderer.reset();
    this.gameTime = 0;
    
    // Create player at bottom center
    const playerX = (this.config.canvas.width - this.config.player.width) / 2;
    const playerY = this.config.canvas.height - this.config.player.height - 50;
    this.player = new PlayerAircraft(playerX, playerY, this.config);
    this.entityManager.addEntity(this.player);
    
    // Update playing state
    if (this.playingState) {
      this.playingState.setHealth(this.player.health);
    }
    
    // Start background music
    this.audioManager.playMusic();
    
    console.log('New game started!');
  }

  /**
   * Reset game state
   * 重置游戏状态
   */
  private resetGame(): void {
    this.entityManager.clear();
    this.visualEffects.clear();
    this.player = null;
    this.gameTime = 0;
  }

  /**
   * Handle game over
   * 处理游戏结束
   */
  private handleGameOver(): void {
    // Apply final score bonus
    this.scoreSystem.applyFinalBonus();
    
    // Set final score in game over state
    if (this.gameOverState) {
      this.gameOverState.setFinalScore(this.scoreSystem.getCurrentScore());
    }
    
    // Create big explosion at player position
    if (this.player) {
      this.visualEffects.createExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        2,
        'normal'
      );
    }
    
    // Transition to game over state
    this.stateManager.changeState(GameStateType.GAME_OVER);
  }

  /**
   * Update menu state
   * 更新菜单状态
   */
  private updateMenu(deltaTime: number): void {
    this.backgroundRenderer.update(deltaTime);
    this.uiRenderer.update(deltaTime);
  }

  /**
   * Update playing state
   * 更新游戏状态
   */
  private updatePlaying(deltaTime: number): void {
    this.gameTime += deltaTime * 1000; // Convert to milliseconds
    
    // Update background
    this.backgroundRenderer.update(deltaTime);
    
    // Update visual effects
    this.visualEffects.update(deltaTime);
    this.uiRenderer.update(deltaTime);
    
    // Handle player input
    this.handlePlayerInput(deltaTime);
    
    // Update spawn system
    this.spawnSystem.update(deltaTime, this.entityManager, this.gameTime);
    
    // Update all entities
    this.entityManager.update(deltaTime);
    
    // Handle enemy shooting
    this.handleEnemyShooting();
    
    // Check collisions
    if (this.player && this.player.active) {
      const enemies = this.entityManager.getEntitiesByType(EnemyAircraft);
      const bullets = this.entityManager.getEntitiesByType(Bullet);
      const powerUps = this.entityManager.getEntitiesByType(PowerUp);
      
      this.collisionSystem.update(this.player, enemies, bullets, powerUps);
    }
    
    // Update playing state score
    if (this.playingState) {
      this.playingState.addScore(0); // Trigger score update
    }
    
    // Create engine trails for player
    if (this.player && this.player.active && Math.random() < 0.3) {
      this.visualEffects.createEngineTrail(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height
      );
    }
  }

  /**
   * Handle player input
   * 处理玩家输入
   */
  private handlePlayerInput(_deltaTime: number): void {
    if (!this.player || !this.player.active) return;
    
    let vx = 0;
    let vy = 0;
    
    // Movement
    if (this.inputManager.isActionActive('moveUp')) {
      vy = -this.player.speed;
    }
    if (this.inputManager.isActionActive('moveDown')) {
      vy = this.player.speed;
    }
    if (this.inputManager.isActionActive('moveLeft')) {
      vx = -this.player.speed;
    }
    if (this.inputManager.isActionActive('moveRight')) {
      vx = this.player.speed;
    }
    
    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = 1 / Math.sqrt(2);
      vx *= factor;
      vy *= factor;
    }
    
    this.player.setVelocity(vx, vy);
    
    // Shooting (auto-fire or manual)
    if (this.player.autoFire || this.inputManager.isActionActive('fire')) {
      const bullets = this.player.fire(this.gameTime);
      if (bullets.length > 0) {
        for (const bullet of bullets) {
          this.entityManager.addEntity(bullet);
        }
        this.scoreSystem.recordShots(bullets.length);
        this.audioManager.playSound(SoundEffect.PLAYER_SHOOT);
      }
    }

    // Ultimate ability (B key)
    if (this.inputManager.isActionActive('ultimate')) {
      const activated = this.player.activateUltimate(this.gameTime);
      if (activated) {
        // Destroy all enemies on screen
        const enemies = this.entityManager.getEntitiesByType(EnemyAircraft);
        for (const enemy of enemies) {
          if (enemy.active) {
            // Add score for destroyed enemy
            this.scoreSystem.addScore(enemy.scoreValue, this.gameTime);
            this.scoreSystem.recordEnemyDestroyed();
            
            // Create explosion
            const explosionSize = enemy.type === EnemyType.BOSS ? 2 : 1;
            this.visualEffects.createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              explosionSize
            );
            
            // Deactivate enemy
            enemy.active = false;
            
            // Record for boss tracking
            if (enemy.type === EnemyType.BOSS) {
              this.spawnSystem.onBossDefeated();
            } else {
              this.spawnSystem.recordEnemyDestroyed(this.entityManager);
            }
          }
        }
        
        // Destroy all enemy bullets on screen
        const bullets = this.entityManager.getEntitiesByType(Bullet);
        for (const bullet of bullets) {
          if (bullet.active && bullet.owner === BulletOwner.ENEMY) {
            // Create small impact effect for destroyed bullets
            this.visualEffects.createImpactSparks(bullet.x, bullet.y, 3);
            bullet.active = false;
          }
        }
        
        // Create ultimate activation visual effect
        this.visualEffects.createUltimateActivationEffect(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2
        );
        
        // Play explosion sound for dramatic effect
        this.audioManager.playSound(SoundEffect.EXPLOSION);
        
        // Add screen flash
        this.visualEffects.addScreenFlash(0.3, '#00ffff');
        
        // Clear the 'ultimate' action to prevent repeated activation
        this.inputManager.getInputState().keys.delete('KeyB');
      }
    }
  }

  /**
   * Handle enemy shooting
   * 处理敌机射击
   */
  private handleEnemyShooting(): void {
    const enemies = this.entityManager.getEntitiesByType(EnemyAircraft);
    
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      if (enemy.type === EnemyType.BOSS) {
        const bullets = enemy.fireBoss(this.gameTime);
        for (const bullet of bullets) {
          this.entityManager.addEntity(bullet);
        }
        if (bullets.length > 0) {
          this.audioManager.playSound(SoundEffect.ENEMY_SHOOT);
        }
      } else {
        const bullet = enemy.fire(this.gameTime);
        if (bullet) {
          this.entityManager.addEntity(bullet);
          this.audioManager.playSound(SoundEffect.ENEMY_SHOOT);
        }
      }
    }
  }

  /**
   * Render menu state
  /**
   * Render menu state
   * 渲染菜单状态
   */
  private renderMenu(context: CanvasRenderingContext2D): void {
    console.log('Rendering menu...');
    
    // Render background
    this.backgroundRenderer.render(context);
    
    // Render menu UI
    this.uiRenderer.renderMenuScreen(context, 0);
    
    console.log('Menu rendered');
  }

  /**
   * Render playing state
   * 渲染游戏状态
   */
  private renderPlaying(context: CanvasRenderingContext2D): void {
    // Render background
    this.backgroundRenderer.render(context);
    
    // Render entities in order: power-ups, bullets, enemies, player
    const powerUps = this.entityManager.getEntitiesByType(PowerUp);
    const bullets = this.entityManager.getEntitiesByType(Bullet);
    const enemies = this.entityManager.getEntitiesByType(EnemyAircraft);
    
    for (const powerUp of powerUps) {
      powerUp.render(context);
    }
    
    for (const bullet of bullets) {
      bullet.render(context);
    }
    
    for (const enemy of enemies) {
      enemy.render(context);
    }
    
    if (this.player && this.player.active) {
      this.player.render(context);
    }
    
    // Render visual effects
    this.visualEffects.render(context);
    
    // Render HUD with ultimate ability status
    const scoreData = this.scoreSystem.getScoreData();
    const health = this.player?.health ?? 0;
    const maxHealth = this.player?.maxHealth ?? this.config.player.maxHealth;
    const weaponLevel = this.player?.weaponLevel ?? 1;
    
    // Get ultimate ability status
    const ultimateReady = this.player?.isUltimateReady(this.gameTime) ?? false;
    const ultimateActive = this.player?.ultimateActive ?? false;
    const ultimateTimeRemaining = this.player?.ultimateTime ?? 0;
    const ultimateCooldownRemaining = this.player?.getUltimateCooldown(this.gameTime) ?? 0;
    
    this.uiRenderer.renderGameHUD(
      context,
      scoreData,
      health,
      maxHealth,
      weaponLevel,
      ultimateReady,
      ultimateActive,
      ultimateTimeRemaining,
      ultimateCooldownRemaining
    );
  }

  /**
   * Load audio assets
   * 加载音频资源
   */
  private async loadAudioAssets(): Promise<void> {
    try {
      // Try to load sounds (will fail gracefully if files don't exist)
      // Note: In Vite, public directory files are served at root path
      await Promise.all([
        this.audioManager.loadSound(SoundEffect.PLAYER_SHOOT, 'sounds/player_shoot.mp3'),
        this.audioManager.loadSound(SoundEffect.ENEMY_SHOOT, 'sounds/enemy_shoot.mp3'),
        this.audioManager.loadSound(SoundEffect.EXPLOSION, 'sounds/explosion.mp3'),
        this.audioManager.loadSound(SoundEffect.POWER_UP, 'sounds/power_up.mp3'),
        this.audioManager.loadSound(SoundEffect.HIT, 'sounds/hit.mp3'),
        this.audioManager.loadMusic('music/bgm.mp3')
      ]);
      console.log('Audio assets loaded (or using fallbacks)');
    } catch (error) {
      console.warn('Some audio assets could not be loaded:', error);
    }
  }

  /**
   * Start the game
   * 启动游戏
   */
  start(): void {
    if (!this.isInitialized) {
      console.error('Game not initialized! Call initialize() first.');
      return;
    }
    
    console.log('Thunder Fighter - Starting game engine...');
    this.engine.start();
  }

  /**
   * Stop the game
   * 停止游戏
   */
  stop(): void {
    this.engine.stop();
    this.audioManager.dispose();
  }

  /**
   * Get the game engine
   * 获取游戏引擎
   */
  getEngine(): GameEngine {
    return this.engine;
  }
}

// Global game instance
let game: ThunderFighterGame | null = null;

/**
 * Initialize and start the game when DOM is ready
 * 当DOM准备就绪时初始化并启动游戏
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Thunder Fighter Game - Loading...');
  
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context!');
    return;
  }
  
  // Display loading message
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('THUNDER FIGHTER', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText('雷霆战机', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '18px Arial';
  ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2 + 40);
  
  try {
    // Create and initialize game
    game = new ThunderFighterGame('gameCanvas');
    await game.initialize();
    
    // Start the game
    game.start();
    
    console.log('Thunder Fighter Game - Ready!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    
    // Display error message
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Failed to load game', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px Arial';
    ctx.fillText('Please refresh the page', canvas.width / 2, canvas.height / 2 + 30);
  }
});

// Export for potential external use
export { ThunderFighterGame, game };
