/**
 * Game Enumerations
 * 游戏枚举类型
 */

/**
 * Game State Types
 * 游戏状态类型
 */
export enum GameStateType {
  /** Main menu state */
  MENU = 'menu',
  /** Active gameplay state */
  PLAYING = 'playing',
  /** Game is paused */
  PAUSED = 'paused',
  /** Game over state */
  GAME_OVER = 'gameOver'
}

/**
 * Enemy Aircraft Types
 * 敌机类型
 */
export enum EnemyType {
  /** Basic enemy: moves straight down, no shooting */
  BASIC = 'basic',
  /** Shooter enemy: moves down, shoots periodically */
  SHOOTER = 'shooter',
  /** Zigzag enemy: moves in zigzag pattern */
  ZIGZAG = 'zigzag',
  /** Boss enemy: high health, complex movement */
  BOSS = 'boss'
}

/**
 * Bullet Owner Types
 * 子弹所有者类型
 */
export enum BulletOwner {
  /** Bullet fired by player */
  PLAYER = 'player',
  /** Bullet fired by enemy */
  ENEMY = 'enemy'
}

/**
 * Power-Up Types
 * 道具类型
 */
export enum PowerUpType {
  /** Weapon upgrade power-up */
  WEAPON_UPGRADE = 'weaponUpgrade',
  /** Health restoration power-up */
  HEALTH = 'health',
  /** Shield (temporary invincibility) power-up */
  SHIELD = 'shield'
}

/**
 * Collision Types
 * 碰撞类型（用于碰撞过滤）
 */
export enum CollisionType {
  /** Player aircraft */
  PLAYER = 'player',
  /** Enemy aircraft */
  ENEMY = 'enemy',
  /** Player's bullet */
  PLAYER_BULLET = 'playerBullet',
  /** Enemy's bullet */
  ENEMY_BULLET = 'enemyBullet',
  /** Power-up item */
  POWER_UP = 'powerUp'
}

/**
 * Sound Effect Types
 * 音效类型
 */
export enum SoundEffect {
  /** Player shooting sound */
  PLAYER_SHOOT = 'playerShoot',
  /** Enemy shooting sound */
  ENEMY_SHOOT = 'enemyShoot',
  /** Explosion sound */
  EXPLOSION = 'explosion',
  /** Power-up collection sound */
  POWER_UP = 'powerUp',
  /** Hit sound */
  HIT = 'hit'
}

/**
 * Movement Pattern Types
 * 移动模式类型
 */
export enum MovementPattern {
  /** Straight line movement */
  STRAIGHT = 'straight',
  /** Zigzag movement pattern */
  ZIGZAG = 'zigzag',
  /** Sine wave movement pattern */
  SINE = 'sine',
  /** Circular movement pattern */
  CIRCULAR = 'circular',
  /** Follow player movement pattern */
  FOLLOW = 'follow'
}
