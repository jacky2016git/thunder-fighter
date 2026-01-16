/**
 * CollisionSystem Unit Tests
 * 碰撞检测系统单元测试
 */
import { CollisionSystem, CollisionEventType, CollisionEvent } from '../../../src/systems/CollisionSystem';
import { PlayerAircraft } from '../../../src/entities/PlayerAircraft';
import { EnemyAircraft } from '../../../src/entities/EnemyAircraft';
import { Bullet } from '../../../src/entities/Bullet';
import { PowerUp } from '../../../src/entities/PowerUp';
import { EnemyType, BulletOwner, PowerUpType } from '../../../src/types/enums';
import { Rectangle } from '../../../src/types/Rectangle';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
  });

  describe('AABB Collision Detection', () => {
    it('should detect collision when rectangles overlap', () => {
      const rectA: Rectangle = { x: 0, y: 0, width: 50, height: 50 };
      const rectB: Rectangle = { x: 25, y: 25, width: 50, height: 50 };

      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision when rectangles do not overlap', () => {
      const rectA: Rectangle = { x: 0, y: 0, width: 50, height: 50 };
      const rectB: Rectangle = { x: 100, y: 100, width: 50, height: 50 };

      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(false);
    });

    it('should detect collision when rectangles touch at edges', () => {
      const rectA: Rectangle = { x: 0, y: 0, width: 50, height: 50 };
      const rectB: Rectangle = { x: 49, y: 0, width: 50, height: 50 };

      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision when rectangles are adjacent but not overlapping', () => {
      const rectA: Rectangle = { x: 0, y: 0, width: 50, height: 50 };
      const rectB: Rectangle = { x: 50, y: 0, width: 50, height: 50 };

      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(false);
    });

    it('should detect collision when one rectangle contains another', () => {
      const rectA: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
      const rectB: Rectangle = { x: 25, y: 25, width: 50, height: 50 };

      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(true);
    });

    it('should handle zero-size rectangles (point inside rectangle)', () => {
      const rectA: Rectangle = { x: 25, y: 25, width: 0, height: 0 };
      const rectB: Rectangle = { x: 0, y: 0, width: 50, height: 50 };

      // A point (zero-size rect) at (25,25) is inside rectB, so AABB returns true
      // This is mathematically correct: 25 < 50 && 25 > 0 && 25 < 50 && 25 > 0
      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(true);
    });

    it('should not detect collision with zero-size rectangle outside', () => {
      const rectA: Rectangle = { x: 100, y: 100, width: 0, height: 0 };
      const rectB: Rectangle = { x: 0, y: 0, width: 50, height: 50 };

      expect(collisionSystem.checkCollision(rectA, rectB)).toBe(false);
    });
  });

  describe('Player Bullet vs Enemy Collisions', () => {
    it('should detect collision between player bullet and enemy', () => {
      const bullet = new Bullet(100, 100, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      const enemy = new EnemyAircraft(90, 90, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerBulletCollisions([bullet], [enemy]);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(CollisionEventType.PLAYER_BULLET_ENEMY);
      expect(events[0].entityA).toBe(bullet);
      expect(events[0].entityB).toBe(enemy);
    });

    it('should not detect collision with inactive bullet', () => {
      const bullet = new Bullet(100, 100, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      bullet.active = false;
      const enemy = new EnemyAircraft(90, 90, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerBulletCollisions([bullet], [enemy]);

      expect(events.length).toBe(0);
    });

    it('should not detect collision with inactive enemy', () => {
      const bullet = new Bullet(100, 100, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      const enemy = new EnemyAircraft(90, 90, EnemyType.BASIC, DEFAULT_GAME_CONFIG);
      enemy.active = false;

      const events = collisionSystem.checkPlayerBulletCollisions([bullet], [enemy]);

      expect(events.length).toBe(0);
    });

    it('should ignore enemy bullets', () => {
      const bullet = new Bullet(100, 100, BulletOwner.ENEMY, 300, DEFAULT_GAME_CONFIG);
      const enemy = new EnemyAircraft(90, 90, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerBulletCollisions([bullet], [enemy]);

      expect(events.length).toBe(0);
    });

    it('should detect multiple collisions', () => {
      const bullet1 = new Bullet(100, 100, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      const bullet2 = new Bullet(200, 200, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      const enemy1 = new EnemyAircraft(90, 90, EnemyType.BASIC, DEFAULT_GAME_CONFIG);
      const enemy2 = new EnemyAircraft(190, 190, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerBulletCollisions(
        [bullet1, bullet2],
        [enemy1, enemy2]
      );

      expect(events.length).toBe(2);
    });
  });

  describe('Enemy Bullet vs Player Collisions', () => {
    it('should detect collision between enemy bullet and player', () => {
      const player = new PlayerAircraft(100, 700, DEFAULT_GAME_CONFIG);
      const bullet = new Bullet(110, 710, BulletOwner.ENEMY, 300, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkEnemyBulletCollisions([bullet], player);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(CollisionEventType.ENEMY_BULLET_PLAYER);
    });

    it('should not detect collision with inactive player', () => {
      const player = new PlayerAircraft(100, 700, DEFAULT_GAME_CONFIG);
      player.active = false;
      const bullet = new Bullet(110, 710, BulletOwner.ENEMY, 300, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkEnemyBulletCollisions([bullet], player);

      expect(events.length).toBe(0);
    });

    it('should ignore player bullets', () => {
      const player = new PlayerAircraft(100, 700, DEFAULT_GAME_CONFIG);
      const bullet = new Bullet(110, 710, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkEnemyBulletCollisions([bullet], player);

      expect(events.length).toBe(0);
    });
  });

  describe('Player vs Enemy Collisions', () => {
    it('should detect collision between player and enemy', () => {
      const player = new PlayerAircraft(100, 100, DEFAULT_GAME_CONFIG);
      const enemy = new EnemyAircraft(110, 110, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerEnemyCollisions(player, [enemy]);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(CollisionEventType.PLAYER_ENEMY);
    });

    it('should not detect collision with inactive player', () => {
      const player = new PlayerAircraft(100, 100, DEFAULT_GAME_CONFIG);
      player.active = false;
      const enemy = new EnemyAircraft(110, 110, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerEnemyCollisions(player, [enemy]);

      expect(events.length).toBe(0);
    });
  });

  describe('Player vs PowerUp Collisions', () => {
    it('should detect collision between player and power-up', () => {
      const player = new PlayerAircraft(100, 100, DEFAULT_GAME_CONFIG);
      const powerUp = new PowerUp(110, 110, PowerUpType.HEALTH, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkPlayerPowerUpCollisions(player, [powerUp]);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(CollisionEventType.PLAYER_POWERUP);
    });

    it('should not detect collision with inactive power-up', () => {
      const player = new PlayerAircraft(100, 100, DEFAULT_GAME_CONFIG);
      const powerUp = new PowerUp(110, 110, PowerUpType.HEALTH, DEFAULT_GAME_CONFIG);
      powerUp.active = false;

      const events = collisionSystem.checkPlayerPowerUpCollisions(player, [powerUp]);

      expect(events.length).toBe(0);
    });
  });

  describe('Check All Collisions', () => {
    it('should check all collision types', () => {
      const player = new PlayerAircraft(200, 200, DEFAULT_GAME_CONFIG);
      const enemy = new EnemyAircraft(210, 210, EnemyType.BASIC, DEFAULT_GAME_CONFIG);
      const playerBullet = new Bullet(210, 210, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      const enemyBullet = new Bullet(210, 210, BulletOwner.ENEMY, 300, DEFAULT_GAME_CONFIG);
      const powerUp = new PowerUp(210, 210, PowerUpType.HEALTH, DEFAULT_GAME_CONFIG);

      const events = collisionSystem.checkAllCollisions(
        player,
        [enemy],
        [playerBullet, enemyBullet],
        [powerUp]
      );

      // Should detect: player bullet vs enemy, enemy bullet vs player, player vs enemy, player vs powerup
      expect(events.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Collision Callbacks', () => {
    it('should register and trigger callbacks', () => {
      const callback = jest.fn();
      collisionSystem.onCollision(CollisionEventType.PLAYER_BULLET_ENEMY, callback);

      const event: CollisionEvent = {
        entityA: new Bullet(0, 0, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG),
        entityB: new EnemyAircraft(0, 0, EnemyType.BASIC, DEFAULT_GAME_CONFIG),
        type: CollisionEventType.PLAYER_BULLET_ENEMY
      };

      collisionSystem.processCollisions([event]);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it('should remove callbacks', () => {
      const callback = jest.fn();
      collisionSystem.onCollision(CollisionEventType.PLAYER_BULLET_ENEMY, callback);
      collisionSystem.offCollision(CollisionEventType.PLAYER_BULLET_ENEMY, callback);

      const event: CollisionEvent = {
        entityA: new Bullet(0, 0, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG),
        entityB: new EnemyAircraft(0, 0, EnemyType.BASIC, DEFAULT_GAME_CONFIG),
        type: CollisionEventType.PLAYER_BULLET_ENEMY
      };

      collisionSystem.processCollisions([event]);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear all callbacks', () => {
      const callback = jest.fn();
      collisionSystem.onCollision(CollisionEventType.PLAYER_BULLET_ENEMY, callback);
      collisionSystem.clearCallbacks();

      const event: CollisionEvent = {
        entityA: new Bullet(0, 0, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG),
        entityB: new EnemyAircraft(0, 0, EnemyType.BASIC, DEFAULT_GAME_CONFIG),
        type: CollisionEventType.PLAYER_BULLET_ENEMY
      };

      collisionSystem.processCollisions([event]);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Process Collisions', () => {
    it('should call onCollision on both entities', () => {
      const bullet = new Bullet(0, 0, BulletOwner.PLAYER, -500, DEFAULT_GAME_CONFIG);
      const enemy = new EnemyAircraft(0, 0, EnemyType.BASIC, DEFAULT_GAME_CONFIG);

      const bulletOnCollision = jest.spyOn(bullet, 'onCollision');
      const enemyOnCollision = jest.spyOn(enemy, 'onCollision');

      const event: CollisionEvent = {
        entityA: bullet,
        entityB: enemy,
        type: CollisionEventType.PLAYER_BULLET_ENEMY
      };

      collisionSystem.processCollisions([event]);

      expect(bulletOnCollision).toHaveBeenCalledWith(enemy);
      expect(enemyOnCollision).toHaveBeenCalledWith(bullet);
    });
  });
});
