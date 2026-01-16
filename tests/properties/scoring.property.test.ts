/**
 * Property-Based Tests for Scoring System
 * 得分系统的属性测试
 * 
 * Tests properties related to score calculation and persistence.
 */
import * as fc from 'fast-check';
import { ScoreSystem } from '../../src/systems/ScoreSystem';

describe('Scoring Property Tests', () => {
  // Feature: thunder-fighter-game, Property 13: 得分累加正确性
  /**
   * Property 13: Score Accumulation Correctness
   * 属性13：得分累加正确性
   * 
   * For any initial score and sequence of destroyed enemies,
   * the final score should equal initial score plus sum of all enemy scoreValues.
   * 
   * **Validates: Requirements 6.1, 6.2**
   */
  describe('Property 13: Score Accumulation Correctness', () => {
    it('final score = initial + sum of all enemy scoreValues', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Array of score values from destroyed enemies
            scoreValues: fc.array(
              fc.integer({ min: 10, max: 200 }),
              { minLength: 1, maxLength: 20 }
            )
          }),
          ({ scoreValues }) => {
            const scoreSystem = new ScoreSystem();
            
            // Reset to ensure clean state
            scoreSystem.resetAll();
            
            const initialScore = scoreSystem.getCurrentScore();
            expect(initialScore).toBe(0);
            
            // Add scores for each enemy destroyed
            let expectedTotal = initialScore;
            for (const value of scoreValues) {
              scoreSystem.addScore(value);
              expectedTotal += value;
            }
            
            // Final score should equal sum
            expect(scoreSystem.getCurrentScore()).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('score never decreases when adding positive values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 500 }),
            { minLength: 1, maxLength: 30 }
          ),
          (scoreValues) => {
            const scoreSystem = new ScoreSystem();
            scoreSystem.resetAll();
            
            let previousScore = scoreSystem.getCurrentScore();
            
            for (const value of scoreValues) {
              scoreSystem.addScore(value);
              const currentScore = scoreSystem.getCurrentScore();
              
              // Score should never decrease
              expect(currentScore).toBeGreaterThanOrEqual(previousScore);
              previousScore = currentScore;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('different enemy types contribute different scores', () => {
      fc.assert(
        fc.property(
          fc.record({
            basicCount: fc.integer({ min: 0, max: 10 }),
            shooterCount: fc.integer({ min: 0, max: 10 }),
            zigzagCount: fc.integer({ min: 0, max: 10 }),
            bossCount: fc.integer({ min: 0, max: 3 })
          }),
          ({ basicCount, shooterCount, zigzagCount, bossCount }) => {
            const scoreSystem = new ScoreSystem();
            scoreSystem.resetAll();
            
            // Enemy score values from config
            const BASIC_SCORE = 10;
            const SHOOTER_SCORE = 20;
            const ZIGZAG_SCORE = 30;
            const BOSS_SCORE = 200;
            
            // Add scores for each enemy type
            for (let i = 0; i < basicCount; i++) {
              scoreSystem.addScore(BASIC_SCORE);
            }
            for (let i = 0; i < shooterCount; i++) {
              scoreSystem.addScore(SHOOTER_SCORE);
            }
            for (let i = 0; i < zigzagCount; i++) {
              scoreSystem.addScore(ZIGZAG_SCORE);
            }
            for (let i = 0; i < bossCount; i++) {
              scoreSystem.addScore(BOSS_SCORE);
            }
            
            const expectedScore = 
              basicCount * BASIC_SCORE +
              shooterCount * SHOOTER_SCORE +
              zigzagCount * ZIGZAG_SCORE +
              bossCount * BOSS_SCORE;
            
            expect(scoreSystem.getCurrentScore()).toBe(expectedScore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: thunder-fighter-game, Property 14: 最高分持久化往返
  /**
   * Property 14: High Score Persistence Round-Trip
   * 属性14：最高分持久化往返
   * 
   * For any valid score value, calling saveHighScore() then loadHighScore()
   * should return the same score value.
   * 
   * **Validates: Requirements 6.4, 6.5**
   */
  describe('Property 14: High Score Persistence Round-Trip', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('saveHighScore() then loadHighScore() returns same value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          (scoreValue) => {
            const scoreSystem = new ScoreSystem();
            scoreSystem.resetAll();
            
            // Add score to set high score
            scoreSystem.addScore(scoreValue);
            
            // Save high score
            scoreSystem.saveHighScore();
            
            // Create new score system and load
            const newScoreSystem = new ScoreSystem();
            newScoreSystem.loadHighScore();
            
            // High score should match
            expect(newScoreSystem.getHighScore()).toBe(scoreValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('high score persists across multiple save/load cycles', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 100, max: 10000 }),
            { minLength: 2, maxLength: 10 }
          ),
          (scores) => {
            // Clear localStorage at the start
            localStorage.clear();
            
            // Find the maximum score
            const maxScore = Math.max(...scores);
            
            // Process each score - each one creates a new system that loads existing high score
            for (const score of scores) {
              const scoreSystem = new ScoreSystem();
              scoreSystem.addScore(score);
              scoreSystem.saveHighScore();
            }
            
            // Load and verify high score is the maximum
            const finalSystem = new ScoreSystem();
            
            expect(finalSystem.getHighScore()).toBe(maxScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('high score only updates when current score exceeds it', () => {
      fc.assert(
        fc.property(
          fc.record({
            initialHighScore: fc.integer({ min: 1000, max: 5000 }),
            newScore: fc.integer({ min: 0, max: 10000 })
          }),
          ({ initialHighScore, newScore }) => {
            // Set initial high score
            const system1 = new ScoreSystem();
            system1.resetAll();
            system1.addScore(initialHighScore);
            system1.saveHighScore();
            
            // Try to set new score
            const system2 = new ScoreSystem();
            system2.loadHighScore();
            system2.addScore(newScore);
            system2.saveHighScore();
            
            // Load and verify
            const system3 = new ScoreSystem();
            system3.loadHighScore();
            
            // High score should be the maximum of the two
            expect(system3.getHighScore()).toBe(Math.max(initialHighScore, newScore));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
