/**
 * Property-Based Tests for Collision System
 * 碰撞系统的属性测试
 * 
 * Tests properties related to collision detection and damage effects.
 */
import * as fc from 'fast-check';
import { CollisionSystem } from '../../src/systems/CollisionSystem';
import { PlayerAircraft } from '../../src/entities/PlayerAircraft';
import { EnemyAircraft } from '../../src/entities/EnemyAircraft';
import { Bullet } from '../../src/entities/Bullet';
import { PowerUp } from '../../src/entities/PowerUp';
import { Rectangle } from '../../src/types/Rectangle';
import { DEFAULT_GAME_CONFIG } from '../../src/types/GameConfig';
import { EnemyType, BulletOwner, PowerUpType } from '../../src/types/enums';

describe('Collision Property Tests', () => {
  // Feature: thunder-fighter-game, Property 9: AABB碰撞检测正确性
  /**
   * Property 9: AABB Collision Detection Correctness
   * 属性9：AABB碰撞检测正确性
   * 
   * For any two rectangles A and B, checkCollision(A, B) should return true
   * if and only if they overlap on both x-axis and y-axis.
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 9: AABB Collision Detection Correctness', () => {
    const collisionSystem = new CollisionSystem();

    it('collision iff overlap on both axes', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Rectangle A
            ax: fc.integer({ min: 0, max: 500 }),
            ay: fc.integer({ min: 0, max: 500 }),
            aWidth: fc.integer({ min: 10, max: 100 }),
            aHeight: fc.integer({ min: 10, max: 100 }),
            // Rectangle B
            bx: fc.integer({ min: 0, max: 500 }),
            by: fc.integer({ min: 0, max: 500 }),
            bWidth: fc.integer({ min: 10, max: 100 }),
            bHeight: fc.integer({ min: 10, max: 100 })
          }),
          ({ ax, ay, aWidth, aHeight, bx, by, bWidth, bHeight }) => {
            const rectA: Rectangle = { x: ax, y: ay, width: aWidth, height: aHeight };
            const rectB: Rectangle = { x: bx, y: by, width: bWidth, height: bHeight };
            
            // Calculate expected collision using AABB formula
            const xOverlap = ax < bx + bWidth && ax + aWidth > bx;
            const yOverlap = ay < by + bHeight && ay + aHeight > by;
            const expectedCollision = xOverlap && yOverlap;
            
            // Check actual collision
            const actualCollision = collisionSystem.checkCollision(rectA, rectB);
            
            expect(actualCollision).toBe(expectedCollision);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('collision is symmetric (A collides with B iff B collides with A)', () => {
      fc.assert(
        fc.property(
          fc.record({
            ax: fc.integer({ min: 0, max: 500 }),
            ay: fc.integer({ min: 0, max: 500 }),
            aWidth: fc.integer({ min: 10, max: 100 }),
            aHeight: fc.integer({ min: 10, max: 100 }),
            bx: fc.integer({ min: 0, max: 500 }),
            by: fc.integer({ min: 0, max: 500 }),
            bWidth: fc.integer({ min: 10, max: 100 }),
            bHeight: fc.integer({ min: 10, max: 100 })
          }),
          ({ ax, ay, aWidth, aHeight, bx, by, bWidth, bHeight }) => {
            const rectA: Rectangle = { x: ax, y: ay, width: aWidth, height: aHeight };
            const rectB: Rectangle = { x: bx, y: by, width: bWidth, height: bHeight };
            
            const collisionAB = collisionSystem.checkCollision(rectA, rectB);
            const collisionBA = collisionSystem.checkCollision(rectB, rectA);
            
            expect(collisionAB).toBe(collisionBA);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('no collision when rectangles are clearly separated', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Rectangle A in top-left quadrant
            ax: fc.integer({ min: 0, max: 100 }),
            ay: fc.integer({ min: 0, max: 100 }),
            aWidth: fc.integer({ min: 10, max: 50 }),
            aHeight: fc.integer({ min: 10, max: 50 }),
            // Gap between rectangles
            gap: fc.integer({ min: 10, max: 100 })
          }),
          ({ ax, ay, aWidth, aHeight, gap }) => {
            const rectA: Rectangle = { x: ax, y: ay, width: aWidth, height: aHeight };
            
            // Rectangle B is clearly to the right with a gap
            const rectB: Rectangle = {
              x: ax + aWidth + gap,
              y: ay,
              width: aWidth,
              height: aHeight
            };
            
            expect(collisionSystem.checkCollision(rectA, rectB)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('collision when rectangles overlap', () => {
      fc.assert(
        fc.property(
          fc.record({
            ax: fc.integer({ min: 100, max: 300 }),
            ay: fc.integer({ min: 100, max: 300 }),
            aWidth: fc.integer({ min: 50, max: 100 }),
            aHeight: fc.integer({ min: 50, max: 100 }),
            // Overlap amount
            overlapX: fc.integer({ min: 1, max: 30 }),
            overlapY: fc.integer({ min: 1, max: 30 })
          }),
          ({ ax, ay, aWidth, aHeight, overlapX, overlapY }) => {
            const rectA: Rectangle = { x: ax, y: ay, width: aWidth, height: aHeight };
            
            // Rectangle B overlaps with A
            const rectB: Rectangle = {
              x: ax + aWidth - overlapX,
              y: ay + aHeight - overlapY,
              width: aWidth,
              height: aHeight
            };
            
            expect(collisionSystem.checkCollision(rectA, rectB)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 10: 碰撞伤害效果
  /**
   * Property 10: Collision Damage Effect
   * 属性10：碰撞伤害效果
   * 
   * For any collision between player and hostile object (enemy or enemy bullet),
   * if the player is not invincible, the player's health should decrease.
   * 
   * **Validates: Requirements 4.2, 4.3**
   */
  describe('Property 10: Collision Damage Effect', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('non-invincible player health decreases on enemy collision', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            enemyType: fc.constantFrom(EnemyType.BASIC, EnemyType.SHOOTER, EnemyType.ZIGZAG)
          }),
          ({ playerX, playerY, enemyType }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            const enemy = new EnemyAircraft(playerX, playerY, enemyType, config);
            
            // Ensure player is not invincible
            player.invincible = false;
            const initialHealth = player.health;
            
            // Simulate collision
            player.onCollision(enemy);
            
            // Health should decrease
            expect(player.health).toBeLessThan(initialHealth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-invincible player health decreases on enemy bullet collision', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 })
          }),
          ({ playerX, playerY }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            const enemyBullet = new Bullet(
              playerX, playerY,
              BulletOwner.ENEMY,
              config.bullet.enemy.speed,
              config
            );
            
            // Ensure player is not invincible
            player.invincible = false;
            const initialHealth = player.health;
            
            // Simulate collision
            player.onCollision(enemyBullet);
            
            // Health should decrease
            expect(player.health).toBeLessThan(initialHealth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invincible player health does not decrease on collision', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            enemyType: fc.constantFrom(EnemyType.BASIC, EnemyType.SHOOTER)
          }),
          ({ playerX, playerY, enemyType }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            const enemy = new EnemyAircraft(playerX, playerY, enemyType, config);
            
            // Make player invincible
            player.invincible = true;
            player.invincibleTime = 1000;
            const initialHealth = player.health;
            
            // Simulate collision
            player.onCollision(enemy);
            
            // Health should NOT decrease
            expect(player.health).toBe(initialHealth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('player becomes invincible after taking damage', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 })
          }),
          ({ playerX, playerY }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Ensure player is not invincible and has health
            player.invincible = false;
            player.health = config.player.maxHealth;
            
            // Take damage
            player.takeDamage(1);
            
            // If player is still alive, should be invincible
            if (player.health > 0) {
              expect(player.invincible).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 11: 道具效果应用
  /**
   * Property 11: Power-Up Effect Application
   * 属性11：道具效果应用
   * 
   * For any power-up type and player state, collecting the power-up should
   * produce the corresponding effect based on type.
   * 
   * **Validates: Requirements 4.4, 7.3, 7.4**
   */
  describe('Property 11: Power-Up Effect Application', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('WEAPON_UPGRADE increases weaponLevel (max 3)', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            initialWeaponLevel: fc.integer({ min: 1, max: 3 })
          }),
          ({ playerX, playerY, initialWeaponLevel }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Set initial weapon level
            player.weaponLevel = initialWeaponLevel;
            
            const powerUp = new PowerUp(playerX, playerY, PowerUpType.WEAPON_UPGRADE, config);
            
            // Apply power-up
            powerUp.apply(player);
            
            // Weapon level should increase (capped at 3)
            const expectedLevel = Math.min(initialWeaponLevel + 1, 3);
            expect(player.weaponLevel).toBe(expectedLevel);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('HEALTH increases health (max maxHealth)', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            initialHealth: fc.integer({ min: 1, max: config.player.maxHealth })
          }),
          ({ playerX, playerY, initialHealth }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Set initial health
            player.health = initialHealth;
            
            const powerUp = new PowerUp(playerX, playerY, PowerUpType.HEALTH, config);
            
            // Apply power-up
            powerUp.apply(player);
            
            // Health should increase (capped at maxHealth)
            const expectedHealth = Math.min(initialHealth + 1, config.player.maxHealth);
            expect(player.health).toBe(expectedHealth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('SHIELD activates invincibility', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 })
          }),
          ({ playerX, playerY }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Ensure player is not invincible
            player.invincible = false;
            player.invincibleTime = 0;
            
            const powerUp = new PowerUp(playerX, playerY, PowerUpType.SHIELD, config);
            
            // Apply power-up
            powerUp.apply(player);
            
            // Player should be invincible
            expect(player.invincible).toBe(true);
            expect(player.invincibleTime).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('power-up becomes inactive after collection', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            powerUpType: fc.constantFrom(
              PowerUpType.WEAPON_UPGRADE,
              PowerUpType.HEALTH,
              PowerUpType.SHIELD
            )
          }),
          ({ playerX, playerY, powerUpType }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            const powerUp = new PowerUp(playerX, playerY, powerUpType, config);
            
            expect(powerUp.active).toBe(true);
            
            // Apply power-up
            powerUp.apply(player);
            
            // Power-up should be inactive
            expect(powerUp.active).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
