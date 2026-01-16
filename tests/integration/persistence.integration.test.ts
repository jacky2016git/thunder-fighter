/**
 * Persistence Integration Tests
 * 持久化集成测试
 * 
 * Tests score persistence and round-trip functionality.
 * 测试得分持久化和往返功能。
 */
import { ScoreSystem } from '../../src/systems/ScoreSystem';

describe('Persistence Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('7.1.3 Score Persistence Round-Trip', () => {
    it('should save and load high score correctly', () => {
      const scoreSystem = new ScoreSystem();
      
      // Add score and save
      scoreSystem.addScore(1000);
      scoreSystem.saveHighScore();
      
      // Create new instance and verify loaded score
      const newScoreSystem = new ScoreSystem();
      
      expect(newScoreSystem.getHighScore()).toBe(1000);
    });

    it('should persist high score across multiple game sessions', () => {
      // First session
      const session1 = new ScoreSystem();
      session1.addScore(500);
      session1.saveHighScore();
      
      // Second session - higher score
      const session2 = new ScoreSystem();
      expect(session2.getHighScore()).toBe(500);
      
      session2.addScore(800);
      session2.saveHighScore();
      
      // Third session - verify highest score persisted
      const session3 = new ScoreSystem();
      expect(session3.getHighScore()).toBe(800);
    });

    it('should not overwrite higher score with lower score', () => {
      // First session - high score
      const session1 = new ScoreSystem();
      session1.addScore(1000);
      session1.saveHighScore();
      
      // Second session - lower score
      const session2 = new ScoreSystem();
      session2.addScore(500);
      session2.saveHighScore();
      
      // Verify high score is still 1000
      const session3 = new ScoreSystem();
      expect(session3.getHighScore()).toBe(1000);
    });

    it('should handle reset correctly while preserving high score', () => {
      const scoreSystem = new ScoreSystem();
      
      // Play first game
      scoreSystem.addScore(1000);
      scoreSystem.recordEnemyDestroyed();
      scoreSystem.recordShot();
      scoreSystem.recordHit();
      
      // Reset for new game
      scoreSystem.reset();
      
      // Verify current score is reset but high score preserved
      expect(scoreSystem.getCurrentScore()).toBe(0);
      expect(scoreSystem.getEnemiesDestroyed()).toBe(0);
      expect(scoreSystem.getHighScore()).toBe(1000);
    });

    it('should persist high score after reset', () => {
      const scoreSystem = new ScoreSystem();
      
      scoreSystem.addScore(1500);
      scoreSystem.reset(); // This should save high score
      
      // New instance should have the high score
      const newScoreSystem = new ScoreSystem();
      expect(newScoreSystem.getHighScore()).toBe(1500);
    });

    it('should handle multiple score additions correctly', () => {
      const scoreSystem = new ScoreSystem();
      
      // Simulate destroying multiple enemies
      const enemyScores = [10, 20, 30, 10, 20];
      enemyScores.forEach(score => {
        scoreSystem.addScore(score);
        scoreSystem.recordEnemyDestroyed();
      });
      
      const expectedTotal = enemyScores.reduce((a, b) => a + b, 0);
      expect(scoreSystem.getCurrentScore()).toBe(expectedTotal);
      expect(scoreSystem.getEnemiesDestroyed()).toBe(enemyScores.length);
    });

    it('should calculate and persist final score with accuracy bonus', () => {
      const scoreSystem = new ScoreSystem();
      
      // Simulate gameplay with high accuracy (>70%)
      scoreSystem.addScore(1000);
      
      // 8 hits out of 10 shots = 80% accuracy
      for (let i = 0; i < 10; i++) {
        scoreSystem.recordShot();
      }
      for (let i = 0; i < 8; i++) {
        scoreSystem.recordHit();
      }
      
      expect(scoreSystem.calculateAccuracy()).toBe(80);
      
      // Apply final bonus (1.2x for >70% accuracy)
      scoreSystem.applyFinalBonus();
      
      expect(scoreSystem.getCurrentScore()).toBe(1200); // 1000 * 1.2
      expect(scoreSystem.getHighScore()).toBe(1200);
    });

    it('should not apply accuracy bonus for low accuracy', () => {
      const scoreSystem = new ScoreSystem();
      
      scoreSystem.addScore(1000);
      
      // 5 hits out of 10 shots = 50% accuracy
      for (let i = 0; i < 10; i++) {
        scoreSystem.recordShot();
      }
      for (let i = 0; i < 5; i++) {
        scoreSystem.recordHit();
      }
      
      expect(scoreSystem.calculateAccuracy()).toBe(50);
      
      scoreSystem.applyFinalBonus();
      
      // No bonus applied
      expect(scoreSystem.getCurrentScore()).toBe(1000);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const scoreSystem = new ScoreSystem();
      scoreSystem.addScore(1000);
      
      // Should not throw
      expect(() => scoreSystem.saveHighScore()).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data', () => {
      // Set invalid data
      localStorage.setItem('thunderFighter_highScore', 'invalid');
      
      // Should handle gracefully and default to 0
      const scoreSystem = new ScoreSystem();
      expect(scoreSystem.getHighScore()).toBe(0);
    });

    it('should handle negative score values in localStorage', () => {
      localStorage.setItem('thunderFighter_highScore', '-100');
      
      const scoreSystem = new ScoreSystem();
      // Should ignore negative values
      expect(scoreSystem.getHighScore()).toBe(0);
    });

    it('should support resetAll to clear everything including high score', () => {
      const scoreSystem = new ScoreSystem();
      
      scoreSystem.addScore(1000);
      scoreSystem.saveHighScore();
      
      scoreSystem.resetAll();
      
      expect(scoreSystem.getCurrentScore()).toBe(0);
      expect(scoreSystem.getHighScore()).toBe(0);
      
      // Verify localStorage is also cleared
      const newScoreSystem = new ScoreSystem();
      expect(newScoreSystem.getHighScore()).toBe(0);
    });

    it('should track combo kills correctly', () => {
      const scoreSystem = new ScoreSystem();
      
      // Simulate rapid kills (within combo timeout)
      const baseTime = 1000;
      
      // First kill
      scoreSystem.addScore(10, baseTime);
      expect(scoreSystem.getComboCount()).toBe(1);
      
      // Second kill within timeout
      scoreSystem.addScore(10, baseTime + 500);
      expect(scoreSystem.getComboCount()).toBe(2);
      
      // Third kill - combo threshold reached
      const points = scoreSystem.addScore(10, baseTime + 1000);
      expect(scoreSystem.getComboCount()).toBe(3);
      expect(points).toBe(15); // 10 * 1.5 combo multiplier
    });

    it('should reset combo after timeout', () => {
      const scoreSystem = new ScoreSystem();
      
      // Build combo
      scoreSystem.addScore(10, 1000);
      scoreSystem.addScore(10, 1500);
      scoreSystem.addScore(10, 2000);
      
      expect(scoreSystem.getComboCount()).toBe(3);
      
      // Kill after timeout (>2000ms)
      scoreSystem.addScore(10, 5000);
      
      expect(scoreSystem.getComboCount()).toBe(1);
    });

    it('should correctly report combo active status', () => {
      const scoreSystem = new ScoreSystem();
      
      // No combo initially
      expect(scoreSystem.isComboActive(0)).toBe(false);
      
      // Build combo to threshold
      scoreSystem.addScore(10, 1000);
      scoreSystem.addScore(10, 1500);
      scoreSystem.addScore(10, 2000);
      
      // Combo should be active
      expect(scoreSystem.isComboActive(2500)).toBe(true);
      
      // Combo should expire after timeout
      expect(scoreSystem.isComboActive(5000)).toBe(false);
    });
  });
});
