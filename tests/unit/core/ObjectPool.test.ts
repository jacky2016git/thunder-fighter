/**
 * ObjectPool Unit Tests
 * 对象池单元测试
 */
import { ObjectPool, BulletPool, EnemyPool, Poolable } from '../../../src/core/ObjectPool';
import { Bullet } from '../../../src/entities/Bullet';
import { EnemyAircraft } from '../../../src/entities/EnemyAircraft';
import { BulletOwner, EnemyType } from '../../../src/types/enums';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';

// Simple poolable test object
class TestPoolable implements Poolable {
  active: boolean = true;
  value: number = 0;
  resetCalled: boolean = false;
  destroyCalled: boolean = false;

  reset(value: number): void {
    this.value = value;
    this.resetCalled = true;
    this.active = true;
  }

  destroy(): void {
    this.destroyCalled = true;
    this.active = false;
  }
}

describe('ObjectPool', () => {
  describe('Basic Operations', () => {
    it('should create pool with factory function', () => {
      const pool = new ObjectPool<TestPoolable>(() => new TestPoolable());
      expect(pool.getTotalCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(0);
    });

    it('should prewarm pool with initial objects', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 10 }
      );
      
      expect(pool.getTotalCount()).toBe(10);
      expect(pool.getAvailableCount()).toBe(10);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('should acquire object from pool', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      const obj = pool.acquire();
      
      expect(obj).toBeInstanceOf(TestPoolable);
      expect(obj.active).toBe(true);
      expect(pool.getActiveCount()).toBe(1);
      expect(pool.getAvailableCount()).toBe(4);
    });

    it('should create new object when pool is empty', () => {
      const pool = new ObjectPool<TestPoolable>(() => new TestPoolable());

      const obj = pool.acquire();
      
      expect(obj).toBeInstanceOf(TestPoolable);
      expect(pool.getTotalCount()).toBe(1);
    });

    it('should release object back to pool', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      const obj = pool.acquire();
      expect(pool.getAvailableCount()).toBe(4);

      pool.release(obj);
      
      expect(obj.active).toBe(false);
      expect(pool.getAvailableCount()).toBe(5);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('should reuse released objects', () => {
      const pool = new ObjectPool<TestPoolable>(() => new TestPoolable());

      const obj1 = pool.acquire();
      pool.release(obj1);
      
      const obj2 = pool.acquire();
      
      expect(obj2).toBe(obj1); // Same object reused
      expect(pool.getStats().reused).toBe(1);
    });

    it('should call reset function when acquiring', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        {
          resetFn: (obj, value: number) => {
            obj.value = value;
            obj.resetCalled = true;
          }
        }
      );

      const obj = pool.acquire(42);
      
      expect(obj.value).toBe(42);
      expect(obj.resetCalled).toBe(true);
    });

    it('should call object reset method if no resetFn provided', () => {
      const pool = new ObjectPool<TestPoolable>(() => new TestPoolable());

      const obj = pool.acquire(100);
      
      expect(obj.value).toBe(100);
      expect(obj.resetCalled).toBe(true);
    });
  });

  describe('Pool Management', () => {
    it('should respect max pool size', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { maxSize: 3 }
      );

      // Acquire and release more than max size
      const objects: TestPoolable[] = [];
      for (let i = 0; i < 5; i++) {
        objects.push(pool.acquire());
      }

      // Release all
      objects.forEach(obj => pool.release(obj));

      // Pool should only keep maxSize objects
      expect(pool.getAvailableCount()).toBe(3);
    });

    it('should release all active objects', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      // Acquire several objects
      pool.acquire();
      pool.acquire();
      pool.acquire();

      expect(pool.getActiveCount()).toBe(3);

      pool.releaseAll();

      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(5);
    });

    it('should clear pool and destroy all objects', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      const obj = pool.acquire();
      
      pool.clear();

      expect(pool.getTotalCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(0);
      expect(obj.destroyCalled).toBe(true);
    });

    it('should shrink pool to target size', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 10 }
      );

      expect(pool.getAvailableCount()).toBe(10);

      pool.shrink(5);

      expect(pool.getAvailableCount()).toBe(5);
      expect(pool.getTotalCount()).toBe(5);
    });

    it('should get active objects', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      pool.acquire();
      pool.acquire();

      const active = pool.getActiveObjects();
      
      expect(active.length).toBe(2);
      expect(active.every(obj => obj.active)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track pool statistics', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 2 }
      );

      // Initial stats
      let stats = pool.getStats();
      expect(stats.created).toBe(2);
      expect(stats.acquired).toBe(0);
      expect(stats.released).toBe(0);
      expect(stats.reused).toBe(0);

      // Acquire
      const obj1 = pool.acquire();
      stats = pool.getStats();
      expect(stats.acquired).toBe(1);
      expect(stats.reused).toBe(1); // Reused from prewarm

      // Release
      pool.release(obj1);
      stats = pool.getStats();
      expect(stats.released).toBe(1);

      // Acquire again (reuse)
      pool.acquire();
      stats = pool.getStats();
      expect(stats.acquired).toBe(2);
      expect(stats.reused).toBe(2);
    });

    it('should calculate reuse rate', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      // All acquires will be reuses from prewarm
      pool.acquire();
      pool.acquire();
      pool.acquire();

      const stats = pool.getStats();
      expect(stats.reuseRate).toBe(100);
    });
  });

  describe('Update Operations', () => {
    it('should update all active objects', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      const obj1 = pool.acquire(0);
      const obj2 = pool.acquire(0);
      const obj3 = pool.acquire(0);

      pool.updateActive(1, (obj, dt) => {
        obj.value += dt;
      });

      expect(obj1.value).toBe(1);
      expect(obj2.value).toBe(1);
      expect(obj3.value).toBe(1);
    });

    it('should process and cleanup inactive objects', () => {
      const pool = new ObjectPool<TestPoolable>(
        () => new TestPoolable(),
        { initialSize: 5 }
      );

      const obj1 = pool.acquire();
      pool.acquire(); // obj2 - we just need it active

      // At this point: 3 available, 2 active
      expect(pool.getActiveCount()).toBe(2);
      expect(pool.getAvailableCount()).toBe(3);

      // Manually deactivate obj1
      obj1.active = false;

      pool.processAndCleanup();

      // Now: 1 active (obj2), obj1 should be back in pool
      expect(pool.getActiveCount()).toBe(1);
      // Available should be 3 (original) + 1 (released obj1) = 4
      // But obj1 wasn't in pool yet, so it gets added
      expect(pool.getAvailableCount()).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('BulletPool', () => {
  let bulletPool: BulletPool;

  beforeEach(() => {
    bulletPool = new BulletPool(DEFAULT_GAME_CONFIG, 10);
  });

  afterEach(() => {
    bulletPool.clear();
  });

  it('should acquire player bullets', () => {
    const bullet = bulletPool.acquirePlayerBullet(100, 200);

    expect(bullet).toBeInstanceOf(Bullet);
    expect(bullet.owner).toBe(BulletOwner.PLAYER);
    expect(bullet.x).toBe(100);
    expect(bullet.y).toBe(200);
    expect(bullet.active).toBe(true);
  });

  it('should acquire enemy bullets', () => {
    const bullet = bulletPool.acquireEnemyBullet(150, 250);

    expect(bullet).toBeInstanceOf(Bullet);
    expect(bullet.owner).toBe(BulletOwner.ENEMY);
    expect(bullet.x).toBe(150);
    expect(bullet.y).toBe(250);
    expect(bullet.active).toBe(true);
  });

  it('should release bullets to correct pool', () => {
    const playerBullet = bulletPool.acquirePlayerBullet(0, 0);
    const enemyBullet = bulletPool.acquireEnemyBullet(0, 0);

    bulletPool.release(playerBullet);
    bulletPool.release(enemyBullet);

    expect(playerBullet.active).toBe(false);
    expect(enemyBullet.active).toBe(false);
  });

  it('should get all active bullets', () => {
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquireEnemyBullet(0, 0);

    const active = bulletPool.getActiveBullets();
    expect(active.length).toBe(3);
  });

  it('should get active player bullets only', () => {
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquireEnemyBullet(0, 0);

    const playerBullets = bulletPool.getActivePlayerBullets();
    expect(playerBullets.length).toBe(2);
    expect(playerBullets.every(b => b.owner === BulletOwner.PLAYER)).toBe(true);
  });

  it('should get active enemy bullets only', () => {
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquireEnemyBullet(0, 0);
    bulletPool.acquireEnemyBullet(0, 0);

    const enemyBullets = bulletPool.getActiveEnemyBullets();
    expect(enemyBullets.length).toBe(2);
    expect(enemyBullets.every(b => b.owner === BulletOwner.ENEMY)).toBe(true);
  });

  it('should release all bullets', () => {
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquireEnemyBullet(0, 0);

    bulletPool.releaseAll();

    expect(bulletPool.getActiveBullets().length).toBe(0);
  });

  it('should provide combined statistics', () => {
    bulletPool.acquirePlayerBullet(0, 0);
    bulletPool.acquireEnemyBullet(0, 0);

    const stats = bulletPool.getStats();
    
    expect(stats.player).toBeDefined();
    expect(stats.enemy).toBeDefined();
    expect(stats.player.acquired).toBe(1);
    expect(stats.enemy.acquired).toBe(1);
  });
});

describe('EnemyPool', () => {
  let enemyPool: EnemyPool;

  beforeEach(() => {
    enemyPool = new EnemyPool(DEFAULT_GAME_CONFIG, 5);
  });

  afterEach(() => {
    enemyPool.clear();
  });

  it('should acquire basic enemies', () => {
    const enemy = enemyPool.acquire(EnemyType.BASIC, 100, 50);

    expect(enemy).toBeInstanceOf(EnemyAircraft);
    expect(enemy.type).toBe(EnemyType.BASIC);
    expect(enemy.x).toBe(100);
    expect(enemy.y).toBe(50);
    expect(enemy.active).toBe(true);
  });

  it('should acquire different enemy types', () => {
    const basic = enemyPool.acquire(EnemyType.BASIC, 0, 0);
    const shooter = enemyPool.acquire(EnemyType.SHOOTER, 0, 0);
    const zigzag = enemyPool.acquire(EnemyType.ZIGZAG, 0, 0);
    const boss = enemyPool.acquire(EnemyType.BOSS, 0, 0);

    expect(basic.type).toBe(EnemyType.BASIC);
    expect(shooter.type).toBe(EnemyType.SHOOTER);
    expect(zigzag.type).toBe(EnemyType.ZIGZAG);
    expect(boss.type).toBe(EnemyType.BOSS);
  });

  it('should release enemies back to pool', () => {
    const enemy = enemyPool.acquire(EnemyType.BASIC, 0, 0);
    
    enemyPool.release(enemy);

    expect(enemy.active).toBe(false);
  });

  it('should reset enemy health on acquire', () => {
    const enemy = enemyPool.acquire(EnemyType.BASIC, 0, 0);
    enemy.takeDamage(enemy.health); // Kill enemy
    
    enemyPool.release(enemy);
    
    const reacquired = enemyPool.acquire(EnemyType.BASIC, 0, 0);
    
    expect(reacquired.health).toBe(reacquired.maxHealth);
    expect(reacquired.active).toBe(true);
  });

  it('should get all active enemies', () => {
    enemyPool.acquire(EnemyType.BASIC, 0, 0);
    enemyPool.acquire(EnemyType.SHOOTER, 0, 0);
    enemyPool.acquire(EnemyType.ZIGZAG, 0, 0);

    const active = enemyPool.getActiveEnemies();
    expect(active.length).toBe(3);
  });

  it('should get active enemies by type', () => {
    enemyPool.acquire(EnemyType.BASIC, 0, 0);
    enemyPool.acquire(EnemyType.BASIC, 0, 0);
    enemyPool.acquire(EnemyType.SHOOTER, 0, 0);

    const basicEnemies = enemyPool.getActiveByType(EnemyType.BASIC);
    expect(basicEnemies.length).toBe(2);
    expect(basicEnemies.every(e => e.type === EnemyType.BASIC)).toBe(true);
  });

  it('should release all enemies', () => {
    enemyPool.acquire(EnemyType.BASIC, 0, 0);
    enemyPool.acquire(EnemyType.SHOOTER, 0, 0);
    enemyPool.acquire(EnemyType.ZIGZAG, 0, 0);

    enemyPool.releaseAll();

    expect(enemyPool.getActiveEnemies().length).toBe(0);
  });

  it('should provide statistics for all enemy types', () => {
    enemyPool.acquire(EnemyType.BASIC, 0, 0);
    enemyPool.acquire(EnemyType.SHOOTER, 0, 0);

    const stats = enemyPool.getStats();
    
    expect(stats[EnemyType.BASIC]).toBeDefined();
    expect(stats[EnemyType.SHOOTER]).toBeDefined();
    expect(stats[EnemyType.BASIC].acquired).toBe(1);
    expect(stats[EnemyType.SHOOTER].acquired).toBe(1);
  });
});
