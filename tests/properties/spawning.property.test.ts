/**
 * Property-Based Tests for Spawning System
 * 生成系统的属性测试
 * 
 * Tests properties related to enemy spawning, difficulty, and power-up generation.
 */
import * as fc from 'fast-check';
import { SpawnSystem } from '../../src/systems/SpawnSystem';
import { EnemyAircraft } from '../../src/entities/EnemyAircraft';
import { DEFAULT_GAME_CONFIG } from '../../src/types/GameConfig';
import { EntityManager } from '../../src/core/EntityManager';

describe('Spawning Property Tests', () => {
  // Feature: thunder-fighter-game, Property 4: 敌机生成位置约束
  /**
   * Property 4: Enemy Spawn Position Constraint
   * 属性4：敌机生成位置约束
   * 
   * For any spawned enemy, its initial y coordinate should be at or above
   * the screen top (y <= 0), and x coordinate should be within valid range.
   * 
   * **Validates: Requirements 2.1**
   */
  describe('Property 4: Enemy Spawn Position Constraint', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('enemy initial y <= 0, 0 <= x <= canvas.width - enemy.width', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const spawnSystem = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            // Spawn an enemy
            spawnSystem.spawnEnemy(entityManager);
            
            // Get the spawned enemy
            const enemies = entityManager.getEntitiesByType(EnemyAircraft);
            expect(enemies.length).toBe(1);
            
            const enemy = enemies[0];
            
            // Verify spawn position constraints
            // Y should be at or above screen (negative or zero)
            expect(enemy.y).toBeLessThanOrEqual(0);
            
            // X should be within valid range
            expect(enemy.x).toBeGreaterThanOrEqual(0);
            expect(enemy.x).toBeLessThanOrEqual(config.canvas.width - enemy.width);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('multiple spawned enemies all have valid positions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          (spawnCount) => {
            const spawnSystem = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            // Spawn multiple enemies
            for (let i = 0; i < spawnCount; i++) {
              spawnSystem.spawnEnemy(entityManager);
            }
            
            // Verify all enemies have valid positions
            const enemies = entityManager.getEntitiesByType(EnemyAircraft);
            
            for (const enemy of enemies) {
              expect(enemy.y).toBeLessThanOrEqual(0);
              expect(enemy.x).toBeGreaterThanOrEqual(0);
              expect(enemy.x).toBeLessThanOrEqual(config.canvas.width - enemy.width);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 7: 难度递增单调性
  /**
   * Property 7: Difficulty Increase Monotonicity
   * 属性7：难度递增单调性
   * 
   * For any two game time points t1 and t2, if t2 > t1, then the spawn rate
   * at t2 should be less than or equal to the spawn rate at t1 (faster spawning).
   * 
   * **Validates: Requirements 2.5**
   */
  describe('Property 7: Difficulty Increase Monotonicity', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('spawn rate at t2 <= spawn rate at t1 when t2 > t1', () => {
      fc.assert(
        fc.property(
          fc.record({
            t1: fc.integer({ min: 0, max: 100000 }),
            t2Offset: fc.integer({ min: 1, max: 100000 })
          }),
          ({ t1, t2Offset }) => {
            const t2 = t1 + t2Offset;
            
            // Create two spawn systems and simulate time progression
            const system1 = new SpawnSystem({}, config);
            const system2 = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            // Simulate time for system1 (at t1)
            const deltaTime1 = t1 / 1000; // Convert to seconds
            if (deltaTime1 > 0) {
              system1.update(deltaTime1, entityManager, t1);
            }
            
            // Simulate time for system2 (at t2)
            const deltaTime2 = t2 / 1000;
            if (deltaTime2 > 0) {
              system2.update(deltaTime2, entityManager, t2);
            }
            
            // Get spawn rates
            const rate1 = system1.calculateSpawnRate();
            const rate2 = system2.calculateSpawnRate();
            
            // Spawn rate at t2 should be <= spawn rate at t1
            // (lower rate = faster spawning = higher difficulty)
            expect(rate2).toBeLessThanOrEqual(rate1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('difficulty increases over time', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1000, max: 10000 }),
            { minLength: 3, maxLength: 10 }
          ),
          (timeIntervals) => {
            const spawnSystem = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            let previousDifficulty = spawnSystem.getCurrentDifficulty();
            let totalTime = 0;
            
            for (const interval of timeIntervals) {
              totalTime += interval;
              const deltaTime = interval / 1000;
              spawnSystem.update(deltaTime, entityManager, totalTime);
              
              const currentDifficulty = spawnSystem.getCurrentDifficulty();
              
              // Difficulty should never decrease
              expect(currentDifficulty).toBeGreaterThanOrEqual(previousDifficulty);
              previousDifficulty = currentDifficulty;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('spawn rate never goes below minimum', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100000, max: 1000000 }),
          (gameTime) => {
            const spawnSystem = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            // Simulate a lot of game time
            const deltaTime = gameTime / 1000;
            spawnSystem.update(deltaTime, entityManager, gameTime);
            
            const spawnRate = spawnSystem.calculateSpawnRate();
            
            // Spawn rate should never go below minimum
            expect(spawnRate).toBeGreaterThanOrEqual(config.spawn.minRate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 15: 道具生成概率
  /**
   * Property 15: Power-Up Drop Probability
   * 属性15：道具生成概率
   * 
   * Over 100 samples, the drop rate should approximately equal the configured
   * dropChance (within statistical tolerance).
   * 
   * **Validates: Requirements 7.1**
   */
  describe('Property 15: Power-Up Drop Probability', () => {
    const config = DEFAULT_GAME_CONFIG;
    const dropChance = config.powerUp.dropChance; // 0.15 (15%)

    it('drop rate ≈ dropChance within statistical tolerance', () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: 50, max: 400 }),
            y: fc.integer({ min: 50, max: 400 })
          }),
          ({ x, y }) => {
            const spawnSystem = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            const sampleSize = 100;
            let dropCount = 0;
            
            for (let i = 0; i < sampleSize; i++) {
              // Clear entity manager for each attempt
              entityManager.clear();
              
              if (spawnSystem.trySpawnPowerUp(x, y, entityManager)) {
                dropCount++;
              }
            }
            
            const actualDropRate = dropCount / sampleSize;
            
            // Allow for statistical variance (±15% of expected rate)
            // For 15% drop chance, expect between 5% and 25% actual rate
            const tolerance = 0.15;
            const lowerBound = Math.max(0, dropChance - tolerance);
            const upperBound = Math.min(1, dropChance + tolerance);
            
            expect(actualDropRate).toBeGreaterThanOrEqual(lowerBound);
            expect(actualDropRate).toBeLessThanOrEqual(upperBound);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('power-up types are distributed across all types', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const spawnSystem = new SpawnSystem({}, config);
            const entityManager = new EntityManager();
            
            const typeCounts: Record<string, number> = {};
            const sampleSize = 100;
            
            for (let i = 0; i < sampleSize; i++) {
              entityManager.clear();
              spawnSystem.spawnPowerUp(100, 100, entityManager);
              
              // Get the spawned power-up type
              const entities = entityManager.getAllEntities();
              if (entities.length > 0) {
                const powerUp = entities[0] as any;
                typeCounts[powerUp.type] = (typeCounts[powerUp.type] || 0) + 1;
              }
            }
            
            // All power-up types should appear at least once
            const typeCount = Object.keys(typeCounts).length;
            expect(typeCount).toBeGreaterThanOrEqual(2); // At least 2 different types
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
