/**
 * Property-Based Tests for Movement and Boundary Constraints
 * 移动和边界约束的属性测试
 * 
 * Tests properties related to player movement, enemy movement, and boundary constraints.
 */
import * as fc from 'fast-check';
import { PlayerAircraft } from '../../src/entities/PlayerAircraft';
import { EnemyAircraft } from '../../src/entities/EnemyAircraft';
import { PowerUp } from '../../src/entities/PowerUp';
import { Bullet } from '../../src/entities/Bullet';
import { DEFAULT_GAME_CONFIG } from '../../src/types/GameConfig';
import { EnemyType, PowerUpType, BulletOwner } from '../../src/types/enums';

describe('Movement Property Tests', () => {
  // Feature: thunder-fighter-game, Property 1: 边界约束不变量
  /**
   * Property 1: Boundary Constraint Invariant
   * 属性1：边界约束不变量
   * 
   * For any player aircraft position and movement input, the position after movement
   * should always be within the game area bounds.
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: Player Boundary Constraints', () => {
    const config = DEFAULT_GAME_CONFIG;
    const canvasWidth = config.canvas.width;
    const canvasHeight = config.canvas.height;
    const playerWidth = config.player.width;
    const playerHeight = config.player.height;

    it('player position always within canvas bounds after any movement', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Initial position can be anywhere (even outside bounds initially)
            startX: fc.integer({ min: -100, max: canvasWidth + 100 }),
            startY: fc.integer({ min: -100, max: canvasHeight + 100 }),
            // Velocity can be any reasonable value
            velocityX: fc.integer({ min: -1000, max: 1000 }),
            velocityY: fc.integer({ min: -1000, max: 1000 }),
            // Delta time in seconds (up to 1 second)
            deltaTime: fc.float({ min: Math.fround(0.001), max: Math.fround(1.0), noNaN: true })
          }),
          ({ startX, startY, velocityX, velocityY, deltaTime }) => {
            // Create player at arbitrary position
            const player = new PlayerAircraft(startX, startY, config);
            player.setVelocity(velocityX, velocityY);
            
            // Move the player
            player.move(deltaTime);
            
            // Verify boundary constraints
            expect(player.x).toBeGreaterThanOrEqual(0);
            expect(player.x).toBeLessThanOrEqual(canvasWidth - playerWidth);
            expect(player.y).toBeGreaterThanOrEqual(0);
            expect(player.y).toBeLessThanOrEqual(canvasHeight - playerHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('player stays within bounds with extreme velocities', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Start at valid position
            startX: fc.integer({ min: 0, max: canvasWidth - playerWidth }),
            startY: fc.integer({ min: 0, max: canvasHeight - playerHeight }),
            // Extreme velocities
            velocityX: fc.oneof(
              fc.constant(-10000),
              fc.constant(10000),
              fc.integer({ min: -10000, max: 10000 })
            ),
            velocityY: fc.oneof(
              fc.constant(-10000),
              fc.constant(10000),
              fc.integer({ min: -10000, max: 10000 })
            ),
            deltaTime: fc.float({ min: Math.fround(0.016), max: Math.fround(0.5), noNaN: true })
          }),
          ({ startX, startY, velocityX, velocityY, deltaTime }) => {
            const player = new PlayerAircraft(startX, startY, config);
            player.setVelocity(velocityX, velocityY);
            
            // Multiple movement updates
            for (let i = 0; i < 10; i++) {
              player.move(deltaTime);
            }
            
            // Still within bounds
            expect(player.x).toBeGreaterThanOrEqual(0);
            expect(player.x).toBeLessThanOrEqual(canvasWidth - playerWidth);
            expect(player.y).toBeGreaterThanOrEqual(0);
            expect(player.y).toBeLessThanOrEqual(canvasHeight - playerHeight);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 5: 实体移动方向一致性
  /**
   * Property 5: Entity Movement Direction Consistency
   * 属性5：实体移动方向一致性
   * 
   * For any enemy or power-up, in consecutive update calls, the y coordinate
   * should monotonically increase (moving downward).
   * 
   * **Validates: Requirements 2.2, 7.2**
   */
  describe('Property 5: Entity Movement Direction Consistency', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('enemy y coordinate monotonically increases (moves down)', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: config.canvas.width - 50 }),
            startY: fc.integer({ min: -100, max: 100 }),
            enemyType: fc.constantFrom(EnemyType.BASIC, EnemyType.SHOOTER),
            deltaTime: fc.float({ min: Math.fround(0.016), max: Math.fround(0.1), noNaN: true }),
            updateCount: fc.integer({ min: 1, max: 20 })
          }),
          ({ startX, startY, enemyType, deltaTime, updateCount }) => {
            const enemy = new EnemyAircraft(startX, startY, enemyType, config);
            
            let previousY = enemy.y;
            
            for (let i = 0; i < updateCount; i++) {
              enemy.update(deltaTime);
              
              // Y should increase or stay the same (moving down)
              expect(enemy.y).toBeGreaterThanOrEqual(previousY);
              previousY = enemy.y;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('power-up y coordinate monotonically increases (falls down)', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: config.canvas.width - 30 }),
            startY: fc.integer({ min: 0, max: 200 }),
            powerUpType: fc.constantFrom(
              PowerUpType.WEAPON_UPGRADE,
              PowerUpType.HEALTH,
              PowerUpType.SHIELD
            ),
            deltaTime: fc.float({ min: Math.fround(0.016), max: Math.fround(0.1), noNaN: true }),
            updateCount: fc.integer({ min: 1, max: 20 })
          }),
          ({ startX, startY, powerUpType, deltaTime, updateCount }) => {
            const powerUp = new PowerUp(startX, startY, powerUpType, config);
            
            let previousY = powerUp.y;
            
            for (let i = 0; i < updateCount; i++) {
              powerUp.update(deltaTime);
              
              // Y should increase (falling down)
              expect(powerUp.y).toBeGreaterThanOrEqual(previousY);
              previousY = powerUp.y;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 6: 超出边界实体清理
  /**
   * Property 6: Out of Bounds Entity Cleanup
   * 属性6：超出边界实体清理
   * 
   * For any game entity (enemy, bullet, power-up), when it completely moves
   * out of screen bounds, it should be marked as inactive.
   * 
   * **Validates: Requirements 2.3, 3.2, 3.3**
   */
  describe('Property 6: Out of Bounds Entity Cleanup', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('enemy becomes inactive when moving below screen', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: config.canvas.width - 50 }),
            // Start near bottom of screen
            startY: fc.integer({ min: config.canvas.height - 100, max: config.canvas.height }),
            enemyType: fc.constantFrom(EnemyType.BASIC, EnemyType.SHOOTER)
          }),
          ({ startX, startY, enemyType }) => {
            const enemy = new EnemyAircraft(startX, startY, enemyType, config);
            
            // Update until enemy should be off screen
            const deltaTime = 0.1;
            for (let i = 0; i < 50; i++) {
              enemy.update(deltaTime);
              if (!enemy.active) break;
            }
            
            // If enemy moved past canvas height, it should be inactive
            if (enemy.y > config.canvas.height) {
              expect(enemy.active).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('player bullet becomes inactive when moving above screen', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: config.canvas.width - 10 }),
            // Start near top of screen
            startY: fc.integer({ min: 0, max: 100 })
          }),
          ({ startX, startY }) => {
            const bullet = new Bullet(
              startX,
              startY,
              BulletOwner.PLAYER,
              -config.bullet.player.speed, // Moving up
              config
            );
            
            // Update until bullet should be off screen
            const deltaTime = 0.1;
            for (let i = 0; i < 50; i++) {
              bullet.update(deltaTime);
              if (!bullet.active) break;
            }
            
            // If bullet moved above screen (y + height < 0), it should be inactive
            if (bullet.y + bullet.height < 0) {
              expect(bullet.active).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('enemy bullet becomes inactive when moving below screen', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: config.canvas.width - 10 }),
            // Start near bottom of screen
            startY: fc.integer({ min: config.canvas.height - 100, max: config.canvas.height })
          }),
          ({ startX, startY }) => {
            const bullet = new Bullet(
              startX,
              startY,
              BulletOwner.ENEMY,
              config.bullet.enemy.speed, // Moving down
              config
            );
            
            // Update until bullet should be off screen
            const deltaTime = 0.1;
            for (let i = 0; i < 50; i++) {
              bullet.update(deltaTime);
              if (!bullet.active) break;
            }
            
            // If bullet moved below screen, it should be inactive
            if (bullet.y > config.canvas.height) {
              expect(bullet.active).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('power-up becomes inactive when falling below screen', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: config.canvas.width - 30 }),
            // Start near bottom of screen
            startY: fc.integer({ min: config.canvas.height - 100, max: config.canvas.height }),
            powerUpType: fc.constantFrom(
              PowerUpType.WEAPON_UPGRADE,
              PowerUpType.HEALTH,
              PowerUpType.SHIELD
            )
          }),
          ({ startX, startY, powerUpType }) => {
            const powerUp = new PowerUp(startX, startY, powerUpType, config);
            
            // Update until power-up should be off screen
            const deltaTime = 0.1;
            for (let i = 0; i < 100; i++) {
              powerUp.update(deltaTime);
              if (!powerUp.active) break;
            }
            
            // If power-up moved below screen, it should be inactive
            if (powerUp.y > config.canvas.height) {
              expect(powerUp.active).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
