/**
 * Property-Based Tests for Shooting System
 * 射击系统的属性测试
 * 
 * Tests properties related to shooting mechanics, fire rate, and bullet behavior.
 */
import * as fc from 'fast-check';
import { PlayerAircraft } from '../../src/entities/PlayerAircraft';
import { Bullet } from '../../src/entities/Bullet';
import { DEFAULT_GAME_CONFIG } from '../../src/types/GameConfig';
import { BulletOwner } from '../../src/types/enums';

describe('Shooting Property Tests', () => {
  // Feature: thunder-fighter-game, Property 2: 射击频率限制
  /**
   * Property 2: Fire Rate Limiting
   * 属性2：射击频率限制
   * 
   * For any sequence of consecutive shooting requests, the time interval between
   * two successful shots should not be less than the configured fireRate value.
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Fire Rate Limiting', () => {
    const config = DEFAULT_GAME_CONFIG;
    const fireRate = config.player.fireRate;

    it('time between successful shots >= fireRate', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 50, max: config.canvas.width - 100 }),
            startY: fc.integer({ min: 50, max: config.canvas.height - 100 }),
            // Generate a sequence of fire attempt times
            fireAttempts: fc.array(
              fc.integer({ min: 0, max: 10000 }),
              { minLength: 5, maxLength: 20 }
            )
          }),
          ({ startX, startY, fireAttempts }) => {
            const player = new PlayerAircraft(startX, startY, config);
            
            // Sort fire attempts to simulate time progression
            const sortedAttempts = [...fireAttempts].sort((a, b) => a - b);
            
            const successfulFireTimes: number[] = [];
            
            for (const time of sortedAttempts) {
              const bullets = player.fire(time);
              if (bullets.length > 0) {
                successfulFireTimes.push(time);
              }
            }
            
            // Check that time between consecutive successful fires >= fireRate
            for (let i = 1; i < successfulFireTimes.length; i++) {
              const timeDiff = successfulFireTimes[i] - successfulFireTimes[i - 1];
              expect(timeDiff).toBeGreaterThanOrEqual(fireRate);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rapid fire attempts within fireRate window produce no bullets', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 50, max: config.canvas.width - 100 }),
            startY: fc.integer({ min: 50, max: config.canvas.height - 100 }),
            baseTime: fc.integer({ min: 1000, max: 5000 }),
            // Time offsets within fireRate window
            rapidOffsets: fc.array(
              fc.integer({ min: 1, max: fireRate - 1 }),
              { minLength: 3, maxLength: 10 }
            )
          }),
          ({ startX, startY, baseTime, rapidOffsets }) => {
            const player = new PlayerAircraft(startX, startY, config);
            
            // First shot should succeed
            const firstShot = player.fire(baseTime);
            expect(firstShot.length).toBeGreaterThan(0);
            
            // Rapid shots within fireRate window should fail
            for (const offset of rapidOffsets) {
              const rapidShot = player.fire(baseTime + offset);
              expect(rapidShot.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 3: 武器升级效果
  /**
   * Property 3: Weapon Upgrade Effect
   * 属性3：武器升级效果
   * 
   * For any weapon level (1-3), calling fire() should return bullets.length === weaponLevel.
   * 
   * **Validates: Requirements 3.5**
   */
  describe('Property 3: Weapon Upgrade Effect', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('fire() returns bullets.length === weaponLevel', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 50, max: config.canvas.width - 100 }),
            startY: fc.integer({ min: 50, max: config.canvas.height - 100 }),
            weaponLevel: fc.integer({ min: 1, max: 3 }),
            fireTime: fc.integer({ min: 1000, max: 10000 })
          }),
          ({ startX, startY, weaponLevel, fireTime }) => {
            const player = new PlayerAircraft(startX, startY, config);
            
            // Upgrade weapon to desired level
            for (let i = 1; i < weaponLevel; i++) {
              player.upgradeWeapon();
            }
            
            expect(player.weaponLevel).toBe(weaponLevel);
            
            // Fire and check bullet count
            const bullets = player.fire(fireTime);
            expect(bullets.length).toBe(weaponLevel);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('weapon level caps at 3', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 50, max: config.canvas.width - 100 }),
            startY: fc.integer({ min: 50, max: config.canvas.height - 100 }),
            upgradeCount: fc.integer({ min: 1, max: 10 }),
            fireTime: fc.integer({ min: 1000, max: 10000 })
          }),
          ({ startX, startY, upgradeCount, fireTime }) => {
            const player = new PlayerAircraft(startX, startY, config);
            
            // Upgrade weapon multiple times
            for (let i = 0; i < upgradeCount; i++) {
              player.upgradeWeapon();
            }
            
            // Weapon level should cap at 3
            expect(player.weaponLevel).toBeLessThanOrEqual(3);
            
            // Fire and check bullet count matches weapon level
            const bullets = player.fire(fireTime);
            expect(bullets.length).toBe(player.weaponLevel);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 8: 子弹速度差异
  /**
   * Property 8: Bullet Speed Difference
   * 属性8：子弹速度差异
   * 
   * For any player bullet and enemy bullet, the player bullet's speed should be
   * strictly greater than the enemy bullet's speed.
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Property 8: Bullet Speed Difference', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('player bullet speed > enemy bullet speed', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 0, max: config.canvas.width - 10 }),
            y: fc.integer({ min: 100, max: config.canvas.height - 100 })
          }),
          ({ x, y }) => {
            const playerBullet = new Bullet(
              x, y,
              BulletOwner.PLAYER,
              -config.bullet.player.speed,
              config
            );
            
            const enemyBullet = new Bullet(
              x, y,
              BulletOwner.ENEMY,
              config.bullet.enemy.speed,
              config
            );
            
            // Player bullet speed should be greater than enemy bullet speed
            expect(playerBullet.speed).toBeGreaterThan(enemyBullet.speed);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('player bullets move faster than enemy bullets over same time', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 50, max: config.canvas.width - 50 }),
            y: fc.integer({ min: 200, max: config.canvas.height - 200 }),
            deltaTime: fc.float({ min: Math.fround(0.016), max: Math.fround(0.5), noNaN: true })
          }),
          ({ x, y, deltaTime }) => {
            const playerBullet = new Bullet(
              x, y,
              BulletOwner.PLAYER,
              -config.bullet.player.speed,
              config
            );
            
            const enemyBullet = new Bullet(
              x, y,
              BulletOwner.ENEMY,
              config.bullet.enemy.speed,
              config
            );
            
            const playerStartY = playerBullet.y;
            const enemyStartY = enemyBullet.y;
            
            // Move both bullets
            playerBullet.move(deltaTime);
            enemyBullet.move(deltaTime);
            
            // Calculate distance traveled (absolute value)
            const playerDistance = Math.abs(playerBullet.y - playerStartY);
            const enemyDistance = Math.abs(enemyBullet.y - enemyStartY);
            
            // Player bullet should travel farther
            expect(playerDistance).toBeGreaterThan(enemyDistance);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
