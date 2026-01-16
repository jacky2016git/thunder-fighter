/**
 * SpawnSystem Unit Tests
 * 生成系统单元测试
 */
import { SpawnSystem } from '../../../src/systems/SpawnSystem';
import { EntityManager } from '../../../src/core/EntityManager';
import { EnemyAircraft } from '../../../src/entities/EnemyAircraft';
import { PowerUp } from '../../../src/entities/PowerUp';
import { EnemyType } from '../../../src/types/enums';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';

describe('SpawnSystem', () => {
  let spawnSystem: SpawnSystem;
  let entityManager: EntityManager;

  beforeEach(() => {
    spawnSystem = new SpawnSystem(undefined, DEFAULT_GAME_CONFIG);
    entityManager = new EntityManager();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const config = spawnSystem.getConfig();
      
      expect(config.enemySpawnRate).toBe(DEFAULT_GAME_CONFIG.spawn.initialRate);
      expect(config.difficultyIncreaseRate).toBe(DEFAULT_GAME_CONFIG.spawn.difficultyIncrease);
      expect(config.powerUpDropChance).toBe(DEFAULT_GAME_CONFIG.powerUp.dropChance);
    });

    it('should initialize with custom config', () => {
      const customSpawnSystem = new SpawnSystem({
        enemySpawnRate: 1000,
        difficultyIncreaseRate: 15000,
        powerUpDropChance: 0.25
      });

      const config = customSpawnSystem.getConfig();
      
      expect(config.enemySpawnRate).toBe(1000);
      expect(config.difficultyIncreaseRate).toBe(15000);
      expect(config.powerUpDropChance).toBe(0.25);
    });

    it('should start with difficulty level 1', () => {
      expect(spawnSystem.getCurrentDifficulty()).toBe(1);
    });

    it('should start with 0 enemies destroyed', () => {
      expect(spawnSystem.getEnemiesDestroyed()).toBe(0);
    });
  });

  describe('Enemy Spawning', () => {
    it('should spawn enemy at top of screen', () => {
      spawnSystem.spawnEnemy(entityManager);
      
      const enemies = entityManager.getEntitiesByType(EnemyAircraft);
      expect(enemies.length).toBe(1);
      expect(enemies[0].y).toBeLessThanOrEqual(0);
    });

    it('should spawn enemy within canvas width bounds', () => {
      // Spawn multiple enemies to test randomness
      for (let i = 0; i < 20; i++) {
        spawnSystem.spawnEnemy(entityManager);
      }
      
      const enemies = entityManager.getEntitiesByType(EnemyAircraft);
      for (const enemy of enemies) {
        expect(enemy.x).toBeGreaterThanOrEqual(0);
        expect(enemy.x + enemy.width).toBeLessThanOrEqual(DEFAULT_GAME_CONFIG.canvas.width);
      }
    });

    it('should not spawn regular enemies when boss is active', () => {
      spawnSystem.spawnBoss(entityManager);
      const initialCount = entityManager.getEntitiesByType(EnemyAircraft).length;
      
      spawnSystem.spawnEnemy(entityManager);
      
      expect(entityManager.getEntitiesByType(EnemyAircraft).length).toBe(initialCount);
    });
  });

  describe('Enemy Type Selection', () => {
    it('should select valid enemy types', () => {
      const validTypes = [EnemyType.BASIC, EnemyType.SHOOTER, EnemyType.ZIGZAG];
      
      // Test multiple selections
      for (let i = 0; i < 100; i++) {
        const type = spawnSystem.selectEnemyType();
        expect(validTypes).toContain(type);
      }
    });

    it('should follow approximate probability distribution', () => {
      const counts: Record<string, number> = {
        [EnemyType.BASIC]: 0,
        [EnemyType.SHOOTER]: 0,
        [EnemyType.ZIGZAG]: 0
      };

      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        const type = spawnSystem.selectEnemyType();
        counts[type]++;
      }

      // Check approximate probabilities (with tolerance)
      // BASIC: 60%, SHOOTER: 25%, ZIGZAG: 15%
      expect(counts[EnemyType.BASIC] / iterations).toBeGreaterThan(0.5);
      expect(counts[EnemyType.BASIC] / iterations).toBeLessThan(0.7);
      expect(counts[EnemyType.SHOOTER] / iterations).toBeGreaterThan(0.15);
      expect(counts[EnemyType.SHOOTER] / iterations).toBeLessThan(0.35);
      expect(counts[EnemyType.ZIGZAG] / iterations).toBeGreaterThan(0.05);
      expect(counts[EnemyType.ZIGZAG] / iterations).toBeLessThan(0.25);
    });
  });

  describe('Difficulty System', () => {
    it('should increase difficulty over time', () => {
      const initialDifficulty = spawnSystem.getCurrentDifficulty();
      
      // Simulate 30 seconds of game time
      spawnSystem.update(30, entityManager, 30000);
      
      expect(spawnSystem.getCurrentDifficulty()).toBeGreaterThan(initialDifficulty);
    });

    it('should decrease spawn rate as difficulty increases', () => {
      const initialRate = spawnSystem.calculateSpawnRate();
      
      // Simulate 60 seconds of game time (2 difficulty increases)
      spawnSystem.update(60, entityManager, 60000);
      
      const newRate = spawnSystem.calculateSpawnRate();
      expect(newRate).toBeLessThan(initialRate);
    });

    it('should not go below minimum spawn rate', () => {
      // Simulate very long game time
      for (let i = 0; i < 100; i++) {
        spawnSystem.update(30, entityManager, i * 30000);
      }
      
      const rate = spawnSystem.calculateSpawnRate();
      expect(rate).toBeGreaterThanOrEqual(DEFAULT_GAME_CONFIG.spawn.minRate);
    });
  });

  describe('Power-Up Spawning', () => {
    it('should spawn power-up at specified position', () => {
      spawnSystem.spawnPowerUp(100, 200, entityManager);
      
      const powerUps = entityManager.getEntitiesByType(PowerUp);
      expect(powerUps.length).toBe(1);
      expect(powerUps[0].x).toBe(100);
      expect(powerUps[0].y).toBe(200);
    });

    it('should respect drop chance probability', () => {
      let spawned = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const newEntityManager = new EntityManager();
        if (spawnSystem.trySpawnPowerUp(100, 100, newEntityManager)) {
          spawned++;
        }
      }
      
      const spawnRate = spawned / iterations;
      // Should be approximately 15% (with tolerance)
      expect(spawnRate).toBeGreaterThan(0.1);
      expect(spawnRate).toBeLessThan(0.2);
    });
  });

  describe('Boss Spawning', () => {
    it('should spawn boss at center top of screen', () => {
      spawnSystem.spawnBoss(entityManager);
      
      const enemies = entityManager.getEntitiesByType(EnemyAircraft);
      const boss = enemies.find(e => e.type === EnemyType.BOSS);
      
      expect(boss).toBeDefined();
      expect(boss!.y).toBeLessThanOrEqual(0);
      
      // Check center position (with some tolerance)
      const expectedX = (DEFAULT_GAME_CONFIG.canvas.width - DEFAULT_GAME_CONFIG.enemy.boss.width) / 2;
      expect(boss!.x).toBe(expectedX);
    });

    it('should set boss active flag', () => {
      expect(spawnSystem.isBossActive()).toBe(false);
      
      spawnSystem.spawnBoss(entityManager);
      
      expect(spawnSystem.isBossActive()).toBe(true);
    });

    it('should trigger boss spawn every 50 enemies destroyed', () => {
      // Destroy 49 enemies - no boss
      for (let i = 0; i < 49; i++) {
        spawnSystem.recordEnemyDestroyed(entityManager);
      }
      expect(spawnSystem.isBossActive()).toBe(false);
      
      // Destroy 50th enemy - boss spawns
      spawnSystem.recordEnemyDestroyed(entityManager);
      expect(spawnSystem.isBossActive()).toBe(true);
    });

    it('should clear boss active flag when boss defeated', () => {
      spawnSystem.spawnBoss(entityManager);
      expect(spawnSystem.isBossActive()).toBe(true);
      
      spawnSystem.onBossDefeated();
      expect(spawnSystem.isBossActive()).toBe(false);
    });
  });

  describe('Update Method', () => {
    it('should track game time', () => {
      expect(spawnSystem.getGameTime()).toBe(0);
      
      spawnSystem.update(1, entityManager, 1000);
      
      expect(spawnSystem.getGameTime()).toBe(1000);
    });

    it('should spawn enemies based on spawn rate', () => {
      // First update - should spawn
      spawnSystem.update(0.016, entityManager, 0);
      const initialCount = entityManager.getEntitiesByType(EnemyAircraft).length;
      
      // Update after spawn rate time - should spawn again
      spawnSystem.update(0.016, entityManager, DEFAULT_GAME_CONFIG.spawn.initialRate);
      
      expect(entityManager.getEntitiesByType(EnemyAircraft).length).toBeGreaterThan(initialCount);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      // Modify state
      spawnSystem.update(60, entityManager, 60000);
      spawnSystem.spawnBoss(entityManager);
      for (let i = 0; i < 10; i++) {
        spawnSystem.recordEnemyDestroyed(entityManager);
      }
      
      // Reset
      spawnSystem.reset();
      
      expect(spawnSystem.getCurrentDifficulty()).toBe(1);
      expect(spawnSystem.getEnemiesDestroyed()).toBe(0);
      expect(spawnSystem.isBossActive()).toBe(false);
      expect(spawnSystem.getGameTime()).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should allow updating config', () => {
      spawnSystem.setConfig({
        enemySpawnRate: 1500,
        powerUpDropChance: 0.3
      });
      
      const config = spawnSystem.getConfig();
      expect(config.enemySpawnRate).toBe(1500);
      expect(config.powerUpDropChance).toBe(0.3);
    });
  });
});
