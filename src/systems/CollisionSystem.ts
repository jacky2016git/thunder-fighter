/**
 * CollisionSystem Class
 * 碰撞检测系统类
 * 
 * Handles all collision detection between game entities.
 * 处理所有游戏实体之间的碰撞检测。
 */
import { Rectangle } from '../types/Rectangle';
import { Collidable } from '../interfaces/Collidable';
import { PlayerAircraft } from '../entities/PlayerAircraft';
import { EnemyAircraft } from '../entities/EnemyAircraft';
import { Bullet } from '../entities/Bullet';
import { PowerUp } from '../entities/PowerUp';
import { BulletOwner } from '../types/enums';

/**
 * Collision Event Interface
 * 碰撞事件接口
 */
export interface CollisionEvent {
  /** First entity in collision */
  entityA: Collidable;
  /** Second entity in collision */
  entityB: Collidable;
  /** Type of collision */
  type: CollisionEventType;
}

/**
 * Collision Event Types
 * 碰撞事件类型
 */
export enum CollisionEventType {
  /** Player bullet hit enemy */
  PLAYER_BULLET_ENEMY = 'playerBulletEnemy',
  /** Enemy bullet hit player */
  ENEMY_BULLET_PLAYER = 'enemyBulletPlayer',
  /** Player collided with enemy */
  PLAYER_ENEMY = 'playerEnemy',
  /** Player collected power-up */
  PLAYER_POWERUP = 'playerPowerUp'
}

/**
 * Collision callback type
 */
export type CollisionCallback = (event: CollisionEvent) => void;

/**
 * CollisionSystem Class
 * 碰撞检测系统
 */
export class CollisionSystem {
  private callbacks: Map<CollisionEventType, CollisionCallback[]> = new Map();

  constructor() {
    // Initialize callback arrays for each event type
    Object.values(CollisionEventType).forEach(type => {
      this.callbacks.set(type, []);
    });
  }

  /**
   * Check AABB collision between two rectangles
   * 检查两个矩形之间的AABB碰撞
   * @param a First rectangle
   * @param b Second rectangle
   * @returns true if collision detected
   */
  checkCollision(a: Rectangle, b: Rectangle): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Check collisions between player bullets and enemies
   * 检查玩家子弹与敌机之间的碰撞
   * @param bullets Array of bullets
   * @param enemies Array of enemies
   * @returns Array of collision events
   */
  checkPlayerBulletCollisions(
    bullets: Bullet[],
    enemies: EnemyAircraft[]
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    // Filter to only player bullets
    const playerBullets = bullets.filter(
      b => b.active && b.owner === BulletOwner.PLAYER
    );

    for (const bullet of playerBullets) {
      for (const enemy of enemies) {
        if (!enemy.active) continue;

        if (this.checkCollision(bullet.collisionBox, enemy.collisionBox)) {
          events.push({
            entityA: bullet,
            entityB: enemy,
            type: CollisionEventType.PLAYER_BULLET_ENEMY
          });
        }
      }
    }

    return events;
  }

  /**
   * Check collisions between enemy bullets and player
   * 检查敌机子弹与玩家之间的碰撞
   * @param bullets Array of bullets
   * @param player Player aircraft
   * @returns Array of collision events
   */
  checkEnemyBulletCollisions(
    bullets: Bullet[],
    player: PlayerAircraft
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    if (!player.active) return events;

    // Filter to only enemy bullets
    const enemyBullets = bullets.filter(
      b => b.active && b.owner === BulletOwner.ENEMY
    );

    for (const bullet of enemyBullets) {
      if (this.checkCollision(bullet.collisionBox, player.collisionBox)) {
        events.push({
          entityA: bullet,
          entityB: player,
          type: CollisionEventType.ENEMY_BULLET_PLAYER
        });
      }
    }

    return events;
  }

  /**
   * Check collisions between player and enemies
   * 检查玩家与敌机之间的碰撞
   * @param player Player aircraft
   * @param enemies Array of enemies
   * @returns Array of collision events
   */
  checkPlayerEnemyCollisions(
    player: PlayerAircraft,
    enemies: EnemyAircraft[]
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    if (!player.active) return events;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      if (this.checkCollision(player.collisionBox, enemy.collisionBox)) {
        events.push({
          entityA: player,
          entityB: enemy,
          type: CollisionEventType.PLAYER_ENEMY
        });
      }
    }

    return events;
  }

  /**
   * Check collisions between player and power-ups
   * 检查玩家与道具之间的碰撞
   * @param player Player aircraft
   * @param powerUps Array of power-ups
   * @returns Array of collision events
   */
  checkPlayerPowerUpCollisions(
    player: PlayerAircraft,
    powerUps: PowerUp[]
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    if (!player.active) return events;

    for (const powerUp of powerUps) {
      if (!powerUp.active) continue;

      if (this.checkCollision(player.collisionBox, powerUp.collisionBox)) {
        events.push({
          entityA: player,
          entityB: powerUp,
          type: CollisionEventType.PLAYER_POWERUP
        });
      }
    }

    return events;
  }

  /**
   * Check all collisions in the game
   * 检查游戏中的所有碰撞
   * @param player Player aircraft
   * @param enemies Array of enemies
   * @param bullets Array of bullets
   * @param powerUps Array of power-ups
   * @returns Array of all collision events
   */
  checkAllCollisions(
    player: PlayerAircraft,
    enemies: EnemyAircraft[],
    bullets: Bullet[],
    powerUps: PowerUp[]
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];

    // Check player bullets vs enemies
    events.push(...this.checkPlayerBulletCollisions(bullets, enemies));

    // Check enemy bullets vs player
    events.push(...this.checkEnemyBulletCollisions(bullets, player));

    // Check player vs enemies
    events.push(...this.checkPlayerEnemyCollisions(player, enemies));

    // Check player vs power-ups
    events.push(...this.checkPlayerPowerUpCollisions(player, powerUps));

    return events;
  }

  /**
   * Register a callback for a collision event type
   * 为碰撞事件类型注册回调
   * @param type Collision event type
   * @param callback Callback function
   */
  onCollision(type: CollisionEventType, callback: CollisionCallback): void {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  /**
   * Remove a callback for a collision event type
   * 移除碰撞事件类型的回调
   * @param type Collision event type
   * @param callback Callback function to remove
   */
  offCollision(type: CollisionEventType, callback: CollisionCallback): void {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Process collision events and trigger callbacks
   * 处理碰撞事件并触发回调
   * @param events Array of collision events
   */
  processCollisions(events: CollisionEvent[]): void {
    for (const event of events) {
      // Trigger entity collision handlers
      event.entityA.onCollision(event.entityB);
      event.entityB.onCollision(event.entityA);

      // Trigger registered callbacks
      const callbacks = this.callbacks.get(event.type);
      if (callbacks) {
        for (const callback of callbacks) {
          callback(event);
        }
      }
    }
  }

  /**
   * Update collision system - check and process all collisions
   * 更新碰撞系统 - 检查并处理所有碰撞
   * @param player Player aircraft
   * @param enemies Array of enemies
   * @param bullets Array of bullets
   * @param powerUps Array of power-ups
   */
  update(
    player: PlayerAircraft,
    enemies: EnemyAircraft[],
    bullets: Bullet[],
    powerUps: PowerUp[]
  ): void {
    const events = this.checkAllCollisions(player, enemies, bullets, powerUps);
    this.processCollisions(events);
  }

  /**
   * Clear all registered callbacks
   * 清除所有注册的回调
   */
  clearCallbacks(): void {
    Object.values(CollisionEventType).forEach(type => {
      this.callbacks.set(type, []);
    });
  }
}
