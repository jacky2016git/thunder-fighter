/**
 * ObjectPool Class
 * 对象池类
 * 
 * Generic object pool for reusing game objects to reduce garbage collection.
 * 通用对象池，用于重用游戏对象以减少垃圾回收。
 */

/**
 * Interface for poolable objects
 * 可池化对象的接口
 */
export interface Poolable {
  /** Whether the object is currently active/in use */
  active: boolean;
  /** Reset the object to its initial state for reuse */
  reset?(...args: any[]): void;
  /** Clean up the object when returning to pool */
  destroy(): void;
}

/**
 * Factory function type for creating new pool objects
 */
export type PoolFactory<T extends Poolable> = () => T;

/**
 * Reset function type for reinitializing pool objects
 */
export type PoolReset<T extends Poolable> = (obj: T, ...args: any[]) => void;

/**
 * ObjectPool Class
 * 对象池
 * 
 * @template T The type of objects in the pool (must implement Poolable)
 */
export class ObjectPool<T extends Poolable> {
  /** Pool of available (inactive) objects */
  private pool: T[] = [];
  
  /** All objects created by this pool (both active and inactive) */
  private allObjects: T[] = [];
  
  /** Factory function to create new objects */
  private factory: PoolFactory<T>;
  
  /** Optional reset function to reinitialize objects */
  private resetFn?: PoolReset<T>;
  
  /** Maximum pool size (0 = unlimited) */
  private maxSize: number;
  
  /** Initial pool size */
  private initialSize: number;
  
  /** Statistics */
  private stats = {
    created: 0,
    acquired: 0,
    released: 0,
    reused: 0
  };

  /**
   * Create a new object pool
   * @param factory Factory function to create new objects
   * @param options Pool configuration options
   */
  constructor(
    factory: PoolFactory<T>,
    options: {
      initialSize?: number;
      maxSize?: number;
      resetFn?: PoolReset<T>;
    } = {}
  ) {
    this.factory = factory;
    this.resetFn = options.resetFn;
    this.maxSize = options.maxSize ?? 0;
    this.initialSize = options.initialSize ?? 0;

    // Pre-populate pool with initial objects
    this.prewarm(this.initialSize);
  }

  /**
   * Pre-populate the pool with objects
   * 预填充对象池
   * @param count Number of objects to create
   */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.createObject();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  /**
   * Create a new object using the factory
   * 使用工厂创建新对象
   */
  private createObject(): T {
    const obj = this.factory();
    this.allObjects.push(obj);
    this.stats.created++;
    return obj;
  }

  /**
   * Acquire an object from the pool
   * 从池中获取对象
   * @param args Arguments to pass to the reset function
   * @returns An object from the pool (either reused or newly created)
   */
  acquire(...args: any[]): T {
    this.stats.acquired++;
    
    let obj: T;

    if (this.pool.length > 0) {
      // Reuse an existing object from the pool
      obj = this.pool.pop()!;
      this.stats.reused++;
    } else {
      // Create a new object if pool is empty
      obj = this.createObject();
    }

    // Reset/reinitialize the object
    obj.active = true;
    if (this.resetFn) {
      this.resetFn(obj, ...args);
    } else if (obj.reset) {
      obj.reset(...args);
    }

    return obj;
  }

  /**
   * Release an object back to the pool
   * 将对象释放回池中
   * @param obj The object to release
   */
  release(obj: T): void {
    if (!obj.active) {
      // Already released
      return;
    }

    obj.active = false;
    this.stats.released++;

    // Only add back to pool if under max size
    if (this.maxSize === 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /**
   * Release all active objects back to the pool
   * 将所有活跃对象释放回池中
   */
  releaseAll(): void {
    for (const obj of this.allObjects) {
      if (obj.active) {
        this.release(obj);
      }
    }
  }

  /**
   * Get all active objects
   * 获取所有活跃对象
   */
  getActiveObjects(): T[] {
    return this.allObjects.filter(obj => obj.active);
  }

  /**
   * Get the number of active objects
   * 获取活跃对象数量
   */
  getActiveCount(): number {
    return this.allObjects.filter(obj => obj.active).length;
  }

  /**
   * Get the number of available objects in the pool
   * 获取池中可用对象数量
   */
  getAvailableCount(): number {
    return this.pool.length;
  }

  /**
   * Get the total number of objects created
   * 获取创建的对象总数
   */
  getTotalCount(): number {
    return this.allObjects.length;
  }

  /**
   * Get pool statistics
   * 获取池统计信息
   */
  getStats(): {
    created: number;
    acquired: number;
    released: number;
    reused: number;
    reuseRate: number;
  } {
    const reuseRate = this.stats.acquired > 0 
      ? (this.stats.reused / this.stats.acquired) * 100 
      : 0;
    
    return {
      ...this.stats,
      reuseRate: Math.round(reuseRate * 100) / 100
    };
  }

  /**
   * Clear the pool and destroy all objects
   * 清空池并销毁所有对象
   */
  clear(): void {
    for (const obj of this.allObjects) {
      obj.destroy();
    }
    this.pool = [];
    this.allObjects = [];
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      reused: 0
    };
  }

  /**
   * Shrink the pool to a target size
   * 将池缩小到目标大小
   * @param targetSize Target pool size
   */
  shrink(targetSize: number): void {
    while (this.pool.length > targetSize) {
      const obj = this.pool.pop();
      if (obj) {
        const index = this.allObjects.indexOf(obj);
        if (index !== -1) {
          this.allObjects.splice(index, 1);
        }
        obj.destroy();
      }
    }
  }

  /**
   * Update all active objects
   * 更新所有活跃对象
   * @param deltaTime Time elapsed since last frame
   * @param updateFn Update function to call on each active object
   */
  updateActive(deltaTime: number, updateFn: (obj: T, deltaTime: number) => void): void {
    for (const obj of this.allObjects) {
      if (obj.active) {
        updateFn(obj, deltaTime);
      }
    }
  }

  /**
   * Process all active objects and release inactive ones
   * 处理所有活跃对象并释放非活跃对象
   */
  processAndCleanup(): void {
    for (const obj of this.allObjects) {
      if (!obj.active && !this.pool.includes(obj)) {
        this.release(obj);
      }
    }
  }
}

/**
 * BulletPool - Specialized pool for bullets
 * 子弹池 - 专门用于子弹的对象池
 */
import { Bullet } from '../entities/Bullet';
import { BulletOwner } from '../types/enums';
import { GameConfig, DEFAULT_GAME_CONFIG } from '../types/GameConfig';

export class BulletPool {
  private playerBulletPool: ObjectPool<Bullet>;
  private enemyBulletPool: ObjectPool<Bullet>;
  private config: GameConfig;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG, initialSize: number = 50) {
    this.config = config;

    // Create player bullet pool
    this.playerBulletPool = new ObjectPool<Bullet>(
      () => new Bullet(0, 0, BulletOwner.PLAYER, -config.bullet.player.speed, config),
      {
        initialSize,
        maxSize: 200,
        resetFn: (bullet, x: number, y: number, velocityY: number) => {
          bullet.x = x;
          bullet.y = y;
          bullet.velocityY = velocityY;
          bullet.velocityX = 0;
          bullet.active = true;
          bullet.collisionBox.x = x;
          bullet.collisionBox.y = y;
        }
      }
    );

    // Create enemy bullet pool
    this.enemyBulletPool = new ObjectPool<Bullet>(
      () => new Bullet(0, 0, BulletOwner.ENEMY, config.bullet.enemy.speed, config),
      {
        initialSize: initialSize / 2,
        maxSize: 100,
        resetFn: (bullet, x: number, y: number, velocityY: number) => {
          bullet.x = x;
          bullet.y = y;
          bullet.velocityY = velocityY;
          bullet.velocityX = 0;
          bullet.active = true;
          bullet.collisionBox.x = x;
          bullet.collisionBox.y = y;
        }
      }
    );
  }

  /**
   * Acquire a player bullet
   */
  acquirePlayerBullet(x: number, y: number, velocityY?: number): Bullet {
    return this.playerBulletPool.acquire(
      x, 
      y, 
      velocityY ?? -this.config.bullet.player.speed
    );
  }

  /**
   * Acquire an enemy bullet
   */
  acquireEnemyBullet(x: number, y: number, velocityY?: number): Bullet {
    return this.enemyBulletPool.acquire(
      x, 
      y, 
      velocityY ?? this.config.bullet.enemy.speed
    );
  }

  /**
   * Release a bullet back to the appropriate pool
   */
  release(bullet: Bullet): void {
    if (bullet.owner === BulletOwner.PLAYER) {
      this.playerBulletPool.release(bullet);
    } else {
      this.enemyBulletPool.release(bullet);
    }
  }

  /**
   * Get all active bullets
   */
  getActiveBullets(): Bullet[] {
    return [
      ...this.playerBulletPool.getActiveObjects(),
      ...this.enemyBulletPool.getActiveObjects()
    ];
  }

  /**
   * Get all active player bullets
   */
  getActivePlayerBullets(): Bullet[] {
    return this.playerBulletPool.getActiveObjects();
  }

  /**
   * Get all active enemy bullets
   */
  getActiveEnemyBullets(): Bullet[] {
    return this.enemyBulletPool.getActiveObjects();
  }

  /**
   * Release all bullets
   */
  releaseAll(): void {
    this.playerBulletPool.releaseAll();
    this.enemyBulletPool.releaseAll();
  }

  /**
   * Process and cleanup inactive bullets
   */
  processAndCleanup(): void {
    this.playerBulletPool.processAndCleanup();
    this.enemyBulletPool.processAndCleanup();
  }

  /**
   * Get combined statistics
   */
  getStats() {
    return {
      player: this.playerBulletPool.getStats(),
      enemy: this.enemyBulletPool.getStats()
    };
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.playerBulletPool.clear();
    this.enemyBulletPool.clear();
  }
}

/**
 * EnemyPool - Specialized pool for enemies
 * 敌机池 - 专门用于敌机的对象池
 */
import { EnemyAircraft } from '../entities/EnemyAircraft';
import { EnemyType } from '../types/enums';

export class EnemyPool {
  private pools: Map<EnemyType, ObjectPool<EnemyAircraft>>;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG, initialSize: number = 20) {
    this.pools = new Map();

    // Create pools for each enemy type
    const enemyTypes = [EnemyType.BASIC, EnemyType.SHOOTER, EnemyType.ZIGZAG, EnemyType.BOSS];
    
    for (const type of enemyTypes) {
      const poolSize = type === EnemyType.BOSS ? 2 : initialSize;
      
      this.pools.set(type, new ObjectPool<EnemyAircraft>(
        () => new EnemyAircraft(0, 0, type, config),
        {
          initialSize: poolSize,
          maxSize: type === EnemyType.BOSS ? 5 : 50,
          resetFn: (enemy, x: number, y: number) => {
            enemy.x = x;
            enemy.y = y;
            enemy.active = true;
            enemy.health = enemy.maxHealth;
            enemy.collisionBox.x = x;
            enemy.collisionBox.y = y;
            enemy.lastFireTime = 0;
          }
        }
      ));
    }
  }

  /**
   * Acquire an enemy of the specified type
   */
  acquire(type: EnemyType, x: number, y: number): EnemyAircraft {
    const pool = this.pools.get(type);
    if (!pool) {
      throw new Error(`No pool for enemy type: ${type}`);
    }
    return pool.acquire(x, y);
  }

  /**
   * Release an enemy back to its pool
   */
  release(enemy: EnemyAircraft): void {
    const pool = this.pools.get(enemy.type);
    if (pool) {
      pool.release(enemy);
    }
  }

  /**
   * Get all active enemies
   */
  getActiveEnemies(): EnemyAircraft[] {
    const active: EnemyAircraft[] = [];
    for (const pool of this.pools.values()) {
      active.push(...pool.getActiveObjects());
    }
    return active;
  }

  /**
   * Get active enemies of a specific type
   */
  getActiveByType(type: EnemyType): EnemyAircraft[] {
    const pool = this.pools.get(type);
    return pool ? pool.getActiveObjects() : [];
  }

  /**
   * Release all enemies
   */
  releaseAll(): void {
    for (const pool of this.pools.values()) {
      pool.releaseAll();
    }
  }

  /**
   * Process and cleanup inactive enemies
   */
  processAndCleanup(): void {
    for (const pool of this.pools.values()) {
      pool.processAndCleanup();
    }
  }

  /**
   * Get statistics for all pools
   */
  getStats() {
    const stats: Record<string, ReturnType<ObjectPool<EnemyAircraft>['getStats']>> = {};
    for (const [type, pool] of this.pools) {
      stats[type] = pool.getStats();
    }
    return stats;
  }

  /**
   * Clear all pools
   */
  clear(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }
}
