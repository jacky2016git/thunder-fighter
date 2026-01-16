/**
 * ScoreSystem Class
 * 得分系统类
 * 
 * Manages scoring, high scores, and statistics.
 * 管理得分、最高分和统计数据。
 */

/**
 * Score Data Interface
 * 得分数据接口
 */
export interface ScoreData {
  /** Current score */
  currentScore: number;
  /** High score */
  highScore: number;
  /** Total enemies destroyed */
  enemiesDestroyed: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
}

/**
 * Local Storage Key for high score
 */
const HIGH_SCORE_KEY = 'thunderFighter_highScore';

/**
 * ScoreSystem Class
 * 得分系统
 */
export class ScoreSystem {
  private currentScore: number = 0;
  private highScore: number = 0;
  private enemiesDestroyed: number = 0;
  private totalShots: number = 0;
  private totalHits: number = 0;
  
  // Combo system
  private consecutiveKills: number = 0;
  private lastKillTime: number = 0;
  private readonly COMBO_TIMEOUT: number = 2000; // 2 seconds to maintain combo
  private readonly COMBO_THRESHOLD: number = 3; // 3+ kills for bonus
  private readonly COMBO_MULTIPLIER: number = 1.5; // 1.5x score for combo

  constructor() {
    this.loadHighScore();
  }

  /**
   * Add score points
   * 添加得分
   * @param points Base points to add
   * @param currentTime Current game time in milliseconds (optional, for combo)
   * @returns Actual points added (may include combo bonus)
   */
  addScore(points: number, currentTime?: number): number {
    let actualPoints = points;

    // Check for combo bonus
    if (currentTime !== undefined) {
      // Check if combo is still active
      if (currentTime - this.lastKillTime <= this.COMBO_TIMEOUT) {
        this.consecutiveKills++;
      } else {
        this.consecutiveKills = 1;
      }
      this.lastKillTime = currentTime;

      // Apply combo multiplier if threshold met
      if (this.consecutiveKills >= this.COMBO_THRESHOLD) {
        actualPoints = Math.floor(points * this.COMBO_MULTIPLIER);
      }
    }

    this.currentScore += actualPoints;

    // Update high score if current score exceeds it
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
    }

    return actualPoints;
  }

  /**
   * Record an enemy destroyed
   * 记录敌机被击毁
   */
  recordEnemyDestroyed(): void {
    this.enemiesDestroyed++;
  }

  /**
   * Record a shot fired
   * 记录发射的子弹
   */
  recordShot(): void {
    this.totalShots++;
  }

  /**
   * Record multiple shots fired
   * 记录发射的多个子弹
   * @param count Number of shots
   */
  recordShots(count: number): void {
    this.totalShots += count;
  }

  /**
   * Record a hit
   * 记录命中
   */
  recordHit(): void {
    this.totalHits++;
  }

  /**
   * Get current score data
   * 获取当前得分数据
   * @returns Score data object
   */
  getScoreData(): ScoreData {
    return {
      currentScore: this.currentScore,
      highScore: this.highScore,
      enemiesDestroyed: this.enemiesDestroyed,
      accuracy: this.calculateAccuracy()
    };
  }

  /**
   * Get current score
   * 获取当前得分
   */
  getCurrentScore(): number {
    return this.currentScore;
  }

  /**
   * Get high score
   * 获取最高分
   */
  getHighScore(): number {
    return this.highScore;
  }

  /**
   * Get enemies destroyed count
   * 获取击毁敌机数量
   */
  getEnemiesDestroyed(): number {
    return this.enemiesDestroyed;
  }

  /**
   * Get current combo count
   * 获取当前连击数
   */
  getComboCount(): number {
    return this.consecutiveKills;
  }

  /**
   * Check if combo is active
   * 检查连击是否激活
   * @param currentTime Current game time in milliseconds
   */
  isComboActive(currentTime: number): boolean {
    return (
      this.consecutiveKills >= this.COMBO_THRESHOLD &&
      currentTime - this.lastKillTime <= this.COMBO_TIMEOUT
    );
  }

  /**
   * Calculate accuracy percentage
   * 计算准确率百分比
   * @returns Accuracy as percentage (0-100)
   */
  calculateAccuracy(): number {
    if (this.totalShots === 0) {
      return 0;
    }
    return Math.round((this.totalHits / this.totalShots) * 100);
  }

  /**
   * Get total shots fired
   * 获取发射的子弹总数
   */
  getTotalShots(): number {
    return this.totalShots;
  }

  /**
   * Get total hits
   * 获取命中总数
   */
  getTotalHits(): number {
    return this.totalHits;
  }

  /**
   * Save high score to local storage
   * 保存最高分到本地存储
   */
  saveHighScore(): void {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, this.highScore.toString());
    } catch (error) {
      // localStorage not available, fail silently
      console.warn('Unable to save high score to localStorage:', error);
    }
  }

  /**
   * Load high score from local storage
   * 从本地存储加载最高分
   */
  loadHighScore(): void {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          this.highScore = parsed;
        }
      }
    } catch (error) {
      // localStorage not available, fail silently
      console.warn('Unable to load high score from localStorage:', error);
    }
  }

  /**
   * Reset score for new game (keeps high score)
   * 重置得分以开始新游戏（保留最高分）
   */
  reset(): void {
    // Save high score before reset
    this.saveHighScore();
    
    this.currentScore = 0;
    this.enemiesDestroyed = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.consecutiveKills = 0;
    this.lastKillTime = 0;
  }

  /**
   * Reset everything including high score
   * 重置所有数据包括最高分
   */
  resetAll(): void {
    this.currentScore = 0;
    this.highScore = 0;
    this.enemiesDestroyed = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.consecutiveKills = 0;
    this.lastKillTime = 0;

    // Clear from localStorage
    try {
      localStorage.removeItem(HIGH_SCORE_KEY);
    } catch (error) {
      console.warn('Unable to clear high score from localStorage:', error);
    }
  }

  /**
   * Calculate final score with accuracy bonus
   * 计算带准确率奖励的最终得分
   * @returns Final score with bonus applied
   */
  calculateFinalScore(): number {
    const accuracy = this.calculateAccuracy();
    let finalScore = this.currentScore;

    // Apply accuracy bonus if accuracy > 70%
    if (accuracy > 70) {
      finalScore = Math.floor(finalScore * 1.2);
    }

    return finalScore;
  }

  /**
   * Apply final score bonus and update high score
   * 应用最终得分奖励并更新最高分
   */
  applyFinalBonus(): void {
    const finalScore = this.calculateFinalScore();
    this.currentScore = finalScore;

    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
    }

    this.saveHighScore();
  }
}
