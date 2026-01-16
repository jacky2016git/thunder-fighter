/**
 * Game Configuration Types
 * 游戏配置类型
 */

/**
 * Enemy Configuration
 * 敌机配置
 */
export interface EnemyConfig {
  /** Width of the enemy */
  width: number;
  /** Height of the enemy */
  height: number;
  /** Movement speed (pixels per second) */
  speed: number;
  /** Health points */
  health: number;
  /** Score value when destroyed */
  scoreValue: number;
  /** Fire rate in milliseconds (optional, for shooting enemies) */
  fireRate?: number;
}

/**
 * Bullet Configuration
 * 子弹配置
 */
export interface BulletConfig {
  /** Width of the bullet */
  width: number;
  /** Height of the bullet */
  height: number;
  /** Movement speed (pixels per second) */
  speed: number;
  /** Damage dealt on hit */
  damage: number;
}

/**
 * Game Configuration
 * 游戏配置
 */
export interface GameConfig {
  /** Canvas configuration */
  canvas: {
    /** Canvas width in pixels */
    width: number;
    /** Canvas height in pixels */
    height: number;
  };
  
  /** Player configuration */
  player: {
    /** Player aircraft width */
    width: number;
    /** Player aircraft height */
    height: number;
    /** Movement speed (pixels per second) */
    speed: number;
    /** Maximum health points */
    maxHealth: number;
    /** Fire rate (milliseconds between shots) */
    fireRate: number;
    /** Invincibility duration after taking damage (milliseconds) */
    invincibleDuration: number;
  };
  
  /** Enemy configurations by type */
  enemy: {
    basic: EnemyConfig;
    shooter: EnemyConfig;
    zigzag: EnemyConfig;
    boss: EnemyConfig;
  };
  
  /** Bullet configurations */
  bullet: {
    player: BulletConfig;
    enemy: BulletConfig;
  };
  
  /** Power-up configuration */
  powerUp: {
    /** Drop chance (0-1) */
    dropChance: number;
    /** Fall speed (pixels per second) */
    fallSpeed: number;
  };
  
  /** Spawn system configuration */
  spawn: {
    /** Initial spawn rate (milliseconds) */
    initialRate: number;
    /** Minimum spawn rate (milliseconds) */
    minRate: number;
    /** Difficulty increase interval (milliseconds) */
    difficultyIncrease: number;
  };
}

/**
 * Default game configuration
 * 默认游戏配置
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvas: {
    width: 480,
    height: 800
  },
  
  player: {
    width: 48,
    height: 64,
    speed: 300,
    maxHealth: 3,
    fireRate: 200,
    invincibleDuration: 2000
  },
  
  enemy: {
    basic: {
      width: 40,
      height: 40,
      speed: 100,
      health: 1,
      scoreValue: 10
    },
    shooter: {
      width: 48,
      height: 48,
      speed: 80,
      health: 2,
      scoreValue: 20,
      fireRate: 2000
    },
    zigzag: {
      width: 44,
      height: 44,
      speed: 120,
      health: 2,
      scoreValue: 30
    },
    boss: {
      width: 120,
      height: 100,
      speed: 50,
      health: 20,
      scoreValue: 200,
      fireRate: 1000
    }
  },
  
  bullet: {
    player: {
      width: 8,
      height: 16,
      speed: 500,
      damage: 1
    },
    enemy: {
      width: 8,
      height: 12,
      speed: 300,
      damage: 1
    }
  },
  
  powerUp: {
    dropChance: 0.15,
    fallSpeed: 100
  },
  
  spawn: {
    initialRate: 2000,
    minRate: 500,
    difficultyIncrease: 30000
  }
};
