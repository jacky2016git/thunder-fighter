/**
 * ScoreSystem Unit Tests
 * 得分系统单元测试
 */
import { ScoreSystem } from '../../../src/systems/ScoreSystem';

describe('ScoreSystem', () => {
  let scoreSystem: ScoreSystem;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    scoreSystem = new ScoreSystem();
  });

  describe('Initialization', () => {
    it('should initialize with zero score', () => {
      expect(scoreSystem.getCurrentScore()).toBe(0);
    });

    it('should initialize with zero enemies destroyed', () => {
      expect(scoreSystem.getEnemiesDestroyed()).toBe(0);
    });

    it('should initialize with zero shots and hits', () => {
      expect(scoreSystem.getTotalShots()).toBe(0);
      expect(scoreSystem.getTotalHits()).toBe(0);
    });

    it('should load high score from localStorage', () => {
      localStorage.setItem('thunderFighter_highScore', '5000');
      const newScoreSystem = new ScoreSystem();
      
      expect(newScoreSystem.getHighScore()).toBe(5000);
    });
  });

  describe('Score Addition', () => {
    it('should add score correctly', () => {
      scoreSystem.addScore(100);
      expect(scoreSystem.getCurrentScore()).toBe(100);
      
      scoreSystem.addScore(50);
      expect(scoreSystem.getCurrentScore()).toBe(150);
    });

    it('should update high score when current score exceeds it', () => {
      scoreSystem.addScore(1000);
      expect(scoreSystem.getHighScore()).toBe(1000);
      
      scoreSystem.addScore(500);
      expect(scoreSystem.getHighScore()).toBe(1500);
    });

    it('should not decrease high score', () => {
      scoreSystem.addScore(1000);
      scoreSystem.reset();
      scoreSystem.addScore(500);
      
      expect(scoreSystem.getHighScore()).toBe(1000);
    });
  });

  describe('Combo System', () => {
    it('should track consecutive kills', () => {
      scoreSystem.addScore(10, 1000);
      expect(scoreSystem.getComboCount()).toBe(1);
      
      scoreSystem.addScore(10, 1500);
      expect(scoreSystem.getComboCount()).toBe(2);
      
      scoreSystem.addScore(10, 2000);
      expect(scoreSystem.getComboCount()).toBe(3);
    });

    it('should reset combo after timeout', () => {
      scoreSystem.addScore(10, 1000);
      scoreSystem.addScore(10, 1500);
      scoreSystem.addScore(10, 2000);
      expect(scoreSystem.getComboCount()).toBe(3);
      
      // Wait longer than combo timeout (2000ms)
      scoreSystem.addScore(10, 5000);
      expect(scoreSystem.getComboCount()).toBe(1);
    });

    it('should apply combo multiplier for 3+ consecutive kills', () => {
      // Build up combo
      scoreSystem.addScore(10, 1000);
      scoreSystem.addScore(10, 1500);
      
      // Third kill should get 1.5x multiplier
      const points = scoreSystem.addScore(10, 2000);
      expect(points).toBe(15); // 10 * 1.5 = 15
    });

    it('should check if combo is active', () => {
      scoreSystem.addScore(10, 1000);
      scoreSystem.addScore(10, 1500);
      scoreSystem.addScore(10, 2000);
      
      expect(scoreSystem.isComboActive(2500)).toBe(true);
      expect(scoreSystem.isComboActive(5000)).toBe(false);
    });
  });

  describe('Enemy Destroyed Tracking', () => {
    it('should track enemies destroyed', () => {
      scoreSystem.recordEnemyDestroyed();
      scoreSystem.recordEnemyDestroyed();
      scoreSystem.recordEnemyDestroyed();
      
      expect(scoreSystem.getEnemiesDestroyed()).toBe(3);
    });
  });

  describe('Accuracy Calculation', () => {
    it('should calculate accuracy correctly', () => {
      scoreSystem.recordShot();
      scoreSystem.recordShot();
      scoreSystem.recordShot();
      scoreSystem.recordShot();
      scoreSystem.recordHit();
      scoreSystem.recordHit();
      scoreSystem.recordHit();
      
      expect(scoreSystem.calculateAccuracy()).toBe(75); // 3/4 = 75%
    });

    it('should return 0 accuracy when no shots fired', () => {
      expect(scoreSystem.calculateAccuracy()).toBe(0);
    });

    it('should record multiple shots at once', () => {
      scoreSystem.recordShots(5);
      expect(scoreSystem.getTotalShots()).toBe(5);
    });
  });

  describe('Score Data', () => {
    it('should return complete score data', () => {
      scoreSystem.addScore(500);
      scoreSystem.recordEnemyDestroyed();
      scoreSystem.recordEnemyDestroyed();
      scoreSystem.recordShot();
      scoreSystem.recordHit();
      
      const data = scoreSystem.getScoreData();
      
      expect(data.currentScore).toBe(500);
      expect(data.highScore).toBe(500);
      expect(data.enemiesDestroyed).toBe(2);
      expect(data.accuracy).toBe(100);
    });
  });

  describe('High Score Persistence', () => {
    it('should save high score to localStorage', () => {
      scoreSystem.addScore(2500);
      scoreSystem.saveHighScore();
      
      expect(localStorage.getItem('thunderFighter_highScore')).toBe('2500');
    });

    it('should load high score from localStorage', () => {
      localStorage.setItem('thunderFighter_highScore', '3000');
      scoreSystem.loadHighScore();
      
      expect(scoreSystem.getHighScore()).toBe(3000);
    });

    it('should handle invalid localStorage data', () => {
      localStorage.setItem('thunderFighter_highScore', 'invalid');
      const newScoreSystem = new ScoreSystem();
      
      expect(newScoreSystem.getHighScore()).toBe(0);
    });

    it('should handle negative localStorage data', () => {
      localStorage.setItem('thunderFighter_highScore', '-100');
      const newScoreSystem = new ScoreSystem();
      
      expect(newScoreSystem.getHighScore()).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should reset current game stats but keep high score', () => {
      scoreSystem.addScore(1000);
      scoreSystem.recordEnemyDestroyed();
      scoreSystem.recordShot();
      scoreSystem.recordHit();
      
      scoreSystem.reset();
      
      expect(scoreSystem.getCurrentScore()).toBe(0);
      expect(scoreSystem.getEnemiesDestroyed()).toBe(0);
      expect(scoreSystem.getTotalShots()).toBe(0);
      expect(scoreSystem.getTotalHits()).toBe(0);
      expect(scoreSystem.getHighScore()).toBe(1000); // High score preserved
    });

    it('should save high score on reset', () => {
      scoreSystem.addScore(1500);
      scoreSystem.reset();
      
      expect(localStorage.getItem('thunderFighter_highScore')).toBe('1500');
    });
  });

  describe('Reset All', () => {
    it('should reset everything including high score', () => {
      scoreSystem.addScore(1000);
      scoreSystem.saveHighScore();
      
      scoreSystem.resetAll();
      
      expect(scoreSystem.getCurrentScore()).toBe(0);
      expect(scoreSystem.getHighScore()).toBe(0);
      expect(localStorage.getItem('thunderFighter_highScore')).toBeNull();
    });
  });

  describe('Final Score Calculation', () => {
    it('should apply accuracy bonus for >70% accuracy', () => {
      scoreSystem.addScore(1000);
      scoreSystem.recordShots(10);
      for (let i = 0; i < 8; i++) {
        scoreSystem.recordHit();
      }
      
      const finalScore = scoreSystem.calculateFinalScore();
      expect(finalScore).toBe(1200); // 1000 * 1.2 = 1200
    });

    it('should not apply bonus for <=70% accuracy', () => {
      scoreSystem.addScore(1000);
      scoreSystem.recordShots(10);
      for (let i = 0; i < 7; i++) {
        scoreSystem.recordHit();
      }
      
      const finalScore = scoreSystem.calculateFinalScore();
      expect(finalScore).toBe(1000);
    });

    it('should apply final bonus and update high score', () => {
      scoreSystem.addScore(1000);
      scoreSystem.recordShots(10);
      for (let i = 0; i < 8; i++) {
        scoreSystem.recordHit();
      }
      
      scoreSystem.applyFinalBonus();
      
      expect(scoreSystem.getCurrentScore()).toBe(1200);
      expect(scoreSystem.getHighScore()).toBe(1200);
    });
  });
});
