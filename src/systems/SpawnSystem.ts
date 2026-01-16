/**
 * SpawnSystem Class
 * 生成系统类
 * 
 * Controls enemy and power-up spawning logic.
 * 控制敌机和道具的生成逻辑。
 */
import { EnemyType, PowerUpType } from '../types/enums';
import { DEFAULT_GAME_CONFIG, GameConfig } from '../types/GameConfig';
import { EnemyAircraft } from '../entities/EnemyAircraft';
import { PowerUp } from '../entities/PowerUp';
import { EntityManager } from '../core/EntityManager';

/**
 * Spawn Configuration Interface
 * 生成配置接口
 */
export interface SpawnConfig {
  /** Enemy spawn rate in milliseconds */
  enemySpawnRate: number;
  /** Difficulty increase interval in milliseconds */
  difficultyIncreaseRate: number;
  /** Power-up drop chance (0-1) */
  powerUpDropChance: number;
}

/**
 * SpawnSystem Class
 * 生成系统
 */
export class SpawnSystem {
  private config: SpawnConfig;
  private gameConfig: GameConfig;
  private lastSpawnTime: number = 0;
  private gameTime: number = 0;
  private currentDifficulty: number = 1;
  private enemiesDestroyed: number = 0;
  private bossActive: boolean = false;
  private lastDifficultyIncrease: number = 0;

  // Enemy type spawn probabilities
  private readonly ENEMY_TYPE_WEIGHTS = {
    [EnemyType.BASIC]: 0.60,    // 60%
    [EnemyType.SHOOTER]: 0.25,  // 25%
    [EnemyType.ZIGZAG]: 0.15    // 15%
  };

  /**
   * Create a new spawn system
   * @param config Spawn configuration (optional)
   * @param gameConfig Game configuration (optional)
   */
  constructor(
    config?: Partial<SpawnConfig>,
    gameConfig: GameConfig = DEFAULT_GAME_CONFIG
  ) {
    this.gameConfig = gameConfig;
    this.config = {
      enemySpawnRate: config?.enemySpawnRate ?? gameConfig.spawn.initialRate,
      difficultyIncreaseRate: config?.difficultyIncreaseRate ?? gameConfig.spawn.difficultyIncrease,
      powerUpDropChance: config?.powerUpDropChance ?? gameConfig.powerUp.dropChance
    };
  }

  /**
   * Update the spawn system
   * 更新生成系统
   * @param deltaTime Time elapsed since last frame in seconds
   * @param entityManager Entity manager to add spawned entities
   * @param currentTime Current game time in milliseconds
   */
  update(deltaTime: number, entityManager: EntityManager, currentTime: number): void {
    this.gameTime += deltaTime * 1000; // Convert to milliseconds

    // Check for difficulty increase
    this.updateDifficulty();

    // Check if it's time to spawn an enemy
    if (currentTime - this.lastSpawnTime >= this.calculateSpawnRate()) {
      this.spawnEnemy(entityManager);
      this.lastSpawnTime = currentTime;
    }
  }

  /**
   * Update difficulty based on game time
   * 根据游戏时间更新难度
   */
  private updateDifficulty(): void {
    const difficultyIntervals = Math.floor(this.gameTime / this.config.difficultyIncreaseRate);
    
    if (difficultyIntervals > this.lastDifficultyIncrease) {
      this.currentDifficulty = 1 + difficultyIntervals * 0.1; // 10% increase per interval
      this.lastDifficultyIncrease = difficultyIntervals;
    }
  }

  /**
   * Calculate current spawn rate based on difficulty
   * 根据难度计算当前生成频率
   * @returns Spawn rate in milliseconds
   */
  calculateSpawnRate(): number {
    // Decrease spawn rate (faster spawning) as difficulty increases
    const baseRate = this.config.enemySpawnRate;
    const minRate = this.gameConfig.spawn.minRate;
    
    // Reduce spawn rate by 10% for each difficulty level
    const adjustedRate = baseRate / this.currentDifficulty;
    
    // Clamp to minimum rate
    return Math.max(adjustedRate, minRate);
  }

  /**
   * Spawn an enemy at the top of the screen
   * 在屏幕顶部生成敌机
   * @param entityManager Entity manager to add the enemy
   */
  spawnEnemy(entityManager: EntityManager): void {
    // Don't spawn regular enemies if boss is active
    if (this.bossActive) return;

    const enemyType = this.selectEnemyType();
    const enemyConfig = this.getEnemyConfigByType(enemyType);
    
    // Random X position within canvas bounds
    const maxX = this.gameConfig.canvas.width - enemyConfig.width;
    const x = Math.random() * maxX;
    
    // Spawn above the screen
    const y = -enemyConfig.height;

    const enemy = new EnemyAircraft(x, y, enemyType, this.gameConfig);
    entityManager.addEntity(enemy);
  }

  /**
   * Get enemy config by type
   * 根据类型获取敌机配置
   */
  private getEnemyConfigByType(type: EnemyType) {
    switch (type) {
      case EnemyType.BASIC:
        return this.gameConfig.enemy.basic;
      case EnemyType.SHOOTER:
        return this.gameConfig.enemy.shooter;
      case EnemyType.ZIGZAG:
        return this.gameConfig.enemy.zigzag;
      case EnemyType.BOSS:
        return this.gameConfig.enemy.boss;
      default:
        return this.gameConfig.enemy.basic;
    }
  }

  /**
   * Select enemy type based on weighted probabilities
   * 根据加权概率选择敌机类型
   * @returns Selected enemy type
   */
  selectEnemyType(): EnemyType {
    const random = Math.random();
    let cumulative = 0;

    // Check each enemy type weight
    for (const [type, weight] of Object.entries(this.ENEMY_TYPE_WEIGHTS)) {
      cumulative += weight;
      if (random < cumulative) {
        return type as EnemyType;
      }
    }

    // Default to BASIC
    return EnemyType.BASIC;
  }

  /**
   * Spawn a power-up at the specified position
   * 在指定位置生成道具
   * @param x X position
   * @param y Y position
   * @param entityManager Entity manager to add the power-up
   */
  spawnPowerUp(x: number, y: number, entityManager: EntityManager): void {
    const type = this.selectPowerUpType();
    const powerUp = new PowerUp(x, y, type, this.gameConfig);
    entityManager.addEntity(powerUp);
  }

  /**
   * Try to spawn a power-up based on drop chance
   * 根据掉落概率尝试生成道具
   * @param x X position
   * @param y Y position
   * @param entityManager Entity manager to add the power-up
   * @returns true if power-up was spawned
   */
  trySpawnPowerUp(x: number, y: number, entityManager: EntityManager): boolean {
    if (Math.random() < this.config.powerUpDropChance) {
      this.spawnPowerUp(x, y, entityManager);
      return true;
    }
    return false;
  }

  /**
   * Select power-up type randomly
   * 随机选择道具类型
   * @returns Selected power-up type
   */
  selectPowerUpType(): PowerUpType {
    return PowerUp.getRandomType();
  }

  /**
   * Record an enemy destroyed and check for boss spawn
   * 记录敌机被击毁并检查是否需要生成Boss
   * @param entityManager Entity manager to add boss if triggered
   */
  recordEnemyDestroyed(entityManager: EntityManager): void {
    this.enemiesDestroyed++;

    // Check boss spawn condition (every 50 enemies)
    if (this.enemiesDestroyed % 50 === 0 && !this.bossActive) {
      this.spawnBoss(entityManager);
    }
  }

  /**
   * Spawn a boss enemy
   * 生成Boss敌机
   * @param entityManager Entity manager to add the boss
   */
  spawnBoss(entityManager: EntityManager): void {
    const bossConfig = this.gameConfig.enemy.boss;
    
    // Spawn boss at center top of screen
    const x = (this.gameConfig.canvas.width - bossConfig.width) / 2;
    const y = -bossConfig.height;

    const boss = new EnemyAircraft(x, y, EnemyType.BOSS, this.gameConfig);
    entityManager.addEntity(boss);
    
    this.bossActive = true;
  }

  /**
   * Mark boss as defeated
   * 标记Boss已被击败
   */
  onBossDefeated(): void {
    this.bossActive = false;
  }

  /**
   * Check if boss is currently active
   * 检查Boss是否当前活跃
   */
  isBossActive(): boolean {
    return this.bossActive;
  }

  /**
   * Get current difficulty level
   * 获取当前难度等级
   */
  getCurrentDifficulty(): number {
    return this.currentDifficulty;
  }

  /**
   * Get total enemies destroyed
   * 获取击毁的敌机总数
   */
  getEnemiesDestroyed(): number {
    return this.enemiesDestroyed;
  }

  /**
   * Get current game time
   * 获取当前游戏时间
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Reset the spawn system
   * 重置生成系统
   */
  reset(): void {
    this.lastSpawnTime = 0;
    this.gameTime = 0;
    this.currentDifficulty = 1;
    this.enemiesDestroyed = 0;
    this.bossActive = false;
    this.lastDifficultyIncrease = 0;
  }

  /**
   * Set spawn configuration
   * 设置生成配置
   * @param config Partial spawn configuration
   */
  setConfig(config: Partial<SpawnConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current spawn configuration
   * 获取当前生成配置
   */
  getConfig(): SpawnConfig {
    return { ...this.config };
  }
}
