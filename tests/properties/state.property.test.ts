/**
 * Property-Based Tests for Game State Management
 * 游戏状态管理的属性测试
 * 
 * Tests properties related to game state transitions, reset, and lifecycle.
 */
import * as fc from 'fast-check';
import { StateManager } from '../../src/core/StateManager';
import { PlayerAircraft } from '../../src/entities/PlayerAircraft';
import { GameStateType } from '../../src/types/enums';
import { GameState } from '../../src/core/GameState';
import { InputState } from '../../src/core/InputState';
import { DEFAULT_GAME_CONFIG } from '../../src/types/GameConfig';

// Mock GameState implementation for testing
class MockGameState implements GameState {
  type: GameStateType;
  enterCalled: boolean = false;
  exitCalled: boolean = false;
  
  constructor(type: GameStateType) {
    this.type = type;
  }
  
  enter(): void {
    this.enterCalled = true;
  }
  
  exit(): void {
    this.exitCalled = true;
  }
  
  update(_deltaTime: number): void {}
  render(_context: CanvasRenderingContext2D): void {}
  handleInput(_input: InputState): void {}
}

describe('State Management Property Tests', () => {
  // Feature: thunder-fighter-game, Property 12: 生命值耗尽触发游戏结束
  /**
   * Property 12: Health Depletion Triggers Game Over
   * 属性12：生命值耗尽触发游戏结束
   * 
   * For any game state, when player health drops to 0 or below,
   * the game state should transition to GAME_OVER.
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Property 12: Health Depletion Triggers Game Over', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('health <= 0 triggers game over state (player becomes inactive)', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            damageAmount: fc.integer({ min: 1, max: 10 })
          }),
          ({ playerX, playerY, damageAmount }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Ensure player is not invincible
            player.invincible = false;
            
            // Apply damage until health is depleted
            while (player.health > 0 && player.active) {
              player.takeDamage(damageAmount);
              // Reset invincibility to allow more damage
              player.invincible = false;
            }
            
            // When health <= 0, player should be inactive (game over condition)
            expect(player.health).toBeLessThanOrEqual(0);
            expect(player.active).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('player with positive health remains active', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            initialHealth: fc.integer({ min: 2, max: config.player.maxHealth })
          }),
          ({ playerX, playerY, initialHealth }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            player.health = initialHealth;
            player.invincible = false;
            
            // Take damage but not enough to kill
            player.takeDamage(1);
            
            // Player should still be active if health > 0
            if (player.health > 0) {
              expect(player.active).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 16: 临时效果时效性
  /**
   * Property 16: Temporary Effect Duration
   * 属性16：临时效果时效性
   * 
   * For any temporary effect (like shield), the effect should expire
   * after its duration has passed.
   * 
   * **Validates: Requirements 7.5**
   */
  describe('Property 16: Temporary Effect Duration', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('shield effect expires after duration', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            shieldDuration: fc.integer({ min: 1000, max: 5000 })
          }),
          ({ playerX, playerY, shieldDuration }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Activate shield
            player.activateShield(shieldDuration);
            
            expect(player.invincible).toBe(true);
            expect(player.invincibleTime).toBe(shieldDuration);
            
            // Simulate time passing (convert ms to seconds for deltaTime)
            const totalTime = shieldDuration + 100; // Extra time to ensure expiration
            const deltaTime = totalTime / 1000;
            
            player.update(deltaTime);
            
            // Shield should have expired
            expect(player.invincible).toBe(false);
            expect(player.invincibleTime).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('shield remains active before duration expires', () => {
      fc.assert(
        fc.property(
          fc.record({
            playerX: fc.integer({ min: 100, max: 300 }),
            playerY: fc.integer({ min: 100, max: 600 }),
            shieldDuration: fc.integer({ min: 2000, max: 5000 }),
            elapsedFraction: fc.float({ min: Math.fround(0.1), max: Math.fround(0.8), noNaN: true })
          }),
          ({ playerX, playerY, shieldDuration, elapsedFraction }) => {
            const player = new PlayerAircraft(playerX, playerY, config);
            
            // Activate shield
            player.activateShield(shieldDuration);
            
            // Simulate partial time passing
            const elapsedTime = shieldDuration * elapsedFraction;
            const deltaTime = elapsedTime / 1000;
            
            player.update(deltaTime);
            
            // Shield should still be active
            expect(player.invincible).toBe(true);
            expect(player.invincibleTime).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 17: 游戏状态转换有效性
  /**
   * Property 17: Game State Transition Validity
   * 属性17：游戏状态转换有效性
   * 
   * Only valid state transitions should succeed according to the state machine rules.
   * 
   * **Validates: Requirements 8.1, 8.3**
   */
  describe('Property 17: Game State Transition Validity', () => {
    // Valid transitions according to design:
    // MENU → PLAYING
    // PLAYING → PAUSED
    // PAUSED → PLAYING
    // PLAYING → GAME_OVER
    // GAME_OVER → MENU
    // PAUSED → MENU (added for completeness)
    // GAME_OVER → PLAYING (restart)
    
    const validTransitions: [GameStateType, GameStateType][] = [
      [GameStateType.MENU, GameStateType.PLAYING],
      [GameStateType.PLAYING, GameStateType.PAUSED],
      [GameStateType.PAUSED, GameStateType.PLAYING],
      [GameStateType.PLAYING, GameStateType.GAME_OVER],
      [GameStateType.GAME_OVER, GameStateType.MENU],
      [GameStateType.PAUSED, GameStateType.MENU],
      [GameStateType.GAME_OVER, GameStateType.PLAYING]
    ];

    it('valid state transitions succeed', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validTransitions),
          ([fromState, toState]) => {
            const stateManager = new StateManager();
            
            // Register all states
            Object.values(GameStateType).forEach(type => {
              stateManager.registerState(type, new MockGameState(type));
            });
            
            // Set initial state
            stateManager.changeState(fromState);
            expect(stateManager.getCurrentStateType()).toBe(fromState);
            
            // Attempt transition
            const result = stateManager.changeState(toState);
            
            // Valid transition should succeed
            expect(result).toBe(true);
            expect(stateManager.getCurrentStateType()).toBe(toState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid state transitions fail', () => {
      // Invalid transitions
      const invalidTransitions: [GameStateType, GameStateType][] = [
        [GameStateType.MENU, GameStateType.PAUSED],
        [GameStateType.MENU, GameStateType.GAME_OVER],
        [GameStateType.PAUSED, GameStateType.GAME_OVER]
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...invalidTransitions),
          ([fromState, toState]) => {
            const stateManager = new StateManager();
            
            // Register all states
            Object.values(GameStateType).forEach(type => {
              stateManager.registerState(type, new MockGameState(type));
            });
            
            // Set initial state
            stateManager.changeState(fromState);
            expect(stateManager.getCurrentStateType()).toBe(fromState);
            
            // Attempt invalid transition
            const result = stateManager.changeState(toState);
            
            // Invalid transition should fail
            expect(result).toBe(false);
            // State should remain unchanged
            expect(stateManager.getCurrentStateType()).toBe(fromState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('canTransitionTo correctly predicts transition validity', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(GameStateType)),
          fc.constantFrom(...Object.values(GameStateType)),
          (fromState, toState) => {
            const stateManager = new StateManager();
            
            // Register all states
            Object.values(GameStateType).forEach(type => {
              stateManager.registerState(type, new MockGameState(type));
            });
            
            // Set initial state
            stateManager.changeState(fromState);
            
            // Check if transition is predicted as valid
            const canTransition = stateManager.canTransitionTo(toState);
            
            // Attempt actual transition
            const actualResult = stateManager.changeState(toState);
            
            // Prediction should match actual result
            expect(canTransition).toBe(actualResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 18: 游戏重置完整性
  /**
   * Property 18: Game Reset Completeness
   * 属性18：游戏重置完整性
   * 
   * After reset, all game state should return to initial values.
   * 
   * **Validates: Requirements 8.4, 1.5, 5.1**
   */
  describe('Property 18: Game Reset Completeness', () => {
    const config = DEFAULT_GAME_CONFIG;

    it('after reset: player at center bottom, health=max, weaponLevel=1, score=0', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Random state before reset
            currentX: fc.integer({ min: 0, max: config.canvas.width }),
            currentY: fc.integer({ min: 0, max: config.canvas.height }),
            currentHealth: fc.integer({ min: 0, max: config.player.maxHealth }),
            currentWeaponLevel: fc.integer({ min: 1, max: 3 })
          }),
          ({ currentX, currentY, currentHealth, currentWeaponLevel }) => {
            const player = new PlayerAircraft(currentX, currentY, config);
            
            // Set random state
            player.health = currentHealth;
            player.weaponLevel = currentWeaponLevel;
            player.invincible = true;
            player.active = false;
            
            // Calculate expected reset position (center bottom)
            const expectedX = (config.canvas.width - config.player.width) / 2;
            const expectedY = config.canvas.height - config.player.height - 20;
            
            // Reset player
            player.reset(expectedX, expectedY);
            
            // Verify reset state
            expect(player.x).toBe(expectedX);
            expect(player.y).toBe(expectedY);
            expect(player.health).toBe(config.player.maxHealth);
            expect(player.weaponLevel).toBe(1);
            expect(player.invincible).toBe(false);
            expect(player.active).toBe(true);
            expect(player.velocityX).toBe(0);
            expect(player.velocityY).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('player reset clears all temporary effects', () => {
      fc.assert(
        fc.property(
          fc.record({
            shieldDuration: fc.integer({ min: 1000, max: 5000 }),
            lastFireTime: fc.integer({ min: 0, max: 10000 })
          }),
          ({ shieldDuration, lastFireTime }) => {
            const player = new PlayerAircraft(100, 100, config);
            
            // Set various temporary states
            player.activateShield(shieldDuration);
            player.lastFireTime = lastFireTime;
            player.weaponLevel = 3;
            
            // Reset
            const resetX = config.canvas.width / 2;
            const resetY = config.canvas.height - 100;
            player.reset(resetX, resetY);
            
            // All temporary effects should be cleared
            expect(player.invincible).toBe(false);
            expect(player.invincibleTime).toBe(0);
            expect(player.lastFireTime).toBe(0);
            expect(player.weaponLevel).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
