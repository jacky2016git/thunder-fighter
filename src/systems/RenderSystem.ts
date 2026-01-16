/**
 * RenderSystem Class
 * 渲染系统类
 * 
 * Handles all visual rendering including background, entities, UI, and effects.
 * 处理所有视觉渲染，包括背景、实体、UI和特效。
 */
import { GameObject } from '../interfaces/GameObject';
import { DEFAULT_GAME_CONFIG, GameConfig } from '../types/GameConfig';
import { ScoreData } from './ScoreSystem';

/**
 * Particle Interface
 * 粒子接口
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

/**
 * Explosion Interface
 * 爆炸接口
 */
interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  particles: Particle[];
}

/**
 * Render Layer Enum
 * 渲染层枚举
 */
export enum RenderLayer {
  BACKGROUND = 0,
  POWERUPS = 1,
  BULLETS = 2,
  ENEMIES = 3,
  PLAYER = 4,
  EFFECTS = 5,
  UI = 6
}

/**
 * RenderSystem Class
 * 渲染系统
 */
export class RenderSystem {
  private context: CanvasRenderingContext2D;
  private config: GameConfig;
  
  // Background scrolling
  private backgroundOffset: number = 0;
  private backgroundSpeed: number = 50; // pixels per second
  
  // Particle system
  private particles: Particle[] = [];
  private explosions: Explosion[] = [];
  
  // Sprite sheet (optional)
  private spriteSheet: HTMLImageElement | null = null;

  /**
   * Create a new render system
   * @param context Canvas 2D rendering context
   * @param config Game configuration
   */
  constructor(
    context: CanvasRenderingContext2D,
    config: GameConfig = DEFAULT_GAME_CONFIG
  ) {
    this.context = context;
    this.config = config;
  }

  /**
   * Load sprite sheet image
   * 加载精灵图
   * @param path Path to sprite sheet image
   */
  loadSpriteSheet(path: string): Promise<void> {
    return new Promise((resolve) => {
      this.spriteSheet = new Image();
      this.spriteSheet.onload = () => {
        resolve();
      };
      this.spriteSheet.onerror = (error) => {
        console.warn('Failed to load sprite sheet, using placeholders:', error);
        resolve(); // Resolve anyway, we'll use placeholders
      };
      this.spriteSheet.src = path;
    });
  }

  /**
   * Clear the canvas
   * 清除画布
   */
  clear(): void {
    this.context.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);
  }

  /**
   * Update render system (background scroll, particles, explosions)
   * 更新渲染系统（背景滚动、粒子、爆炸）
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    // Update background scroll
    this.backgroundOffset += this.backgroundSpeed * deltaTime;
    if (this.backgroundOffset >= this.config.canvas.height) {
      this.backgroundOffset = 0;
    }

    // Update particles
    this.updateParticles(deltaTime);

    // Update explosions
    this.updateExplosions(deltaTime);
  }

  /**
   * Render scrolling background
   * 渲染滚动背景
   */
  renderBackground(): void {
    const { width, height } = this.config.canvas;
    const ctx = this.context;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(0.5, '#1a1a4e');
    gradient.addColorStop(1, '#0a0a2e');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw scrolling stars
    ctx.fillStyle = '#ffffff';
    const starCount = 50;
    const starSeed = 12345;
    
    for (let i = 0; i < starCount; i++) {
      // Pseudo-random positions based on seed
      const baseX = ((starSeed * (i + 1) * 7) % width);
      const baseY = ((starSeed * (i + 1) * 13) % height);
      const size = ((starSeed * (i + 1)) % 3) + 1;
      const speed = size * 0.5;
      
      // Apply scroll offset
      let y = (baseY + this.backgroundOffset * speed) % height;
      
      ctx.globalAlpha = 0.3 + (size / 4) * 0.7;
      ctx.beginPath();
      ctx.arc(baseX, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }

  /**
   * Render a game entity
   * 渲染游戏实体
   * @param entity The entity to render
   */
  renderEntity(entity: GameObject): void {
    if (!entity.active) return;
    entity.render(this.context);
  }

  /**
   * Render multiple entities sorted by layer
   * 按层次渲染多个实体
   * @param entities Array of entities to render
   * @param _layer Render layer (for future use)
   */
  renderEntities(entities: GameObject[], _layer: RenderLayer): void {
    for (const entity of entities) {
      if (entity.active) {
        entity.render(this.context);
      }
    }
  }

  /**
   * Render UI elements (score, health)
   * 渲染UI元素（得分、生命值）
   * @param scoreData Score data
   * @param health Current player health
   * @param maxHealth Maximum player health
   */
  renderUI(scoreData: ScoreData, health: number, maxHealth: number): void {
    const ctx = this.context;
    const { width } = this.config.canvas;

    ctx.save();

    // Score display (top left)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${scoreData.currentScore}`, 10, 30);

    // High score display (top center)
    ctx.textAlign = 'center';
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`High Score: ${scoreData.highScore}`, width / 2, 30);

    // Health display (top right)
    this.renderHealthBar(health, maxHealth);

    // Enemies destroyed (bottom left)
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Enemies: ${scoreData.enemiesDestroyed}`, 10, this.config.canvas.height - 10);

    // Accuracy (bottom right)
    ctx.textAlign = 'right';
    ctx.fillText(`Accuracy: ${scoreData.accuracy}%`, width - 10, this.config.canvas.height - 10);

    ctx.restore();
  }

  /**
   * Render health bar
   * 渲染生命值条
   * @param health Current health
   * @param maxHealth Maximum health
   */
  private renderHealthBar(health: number, maxHealth: number): void {
    const ctx = this.context;
    const { width } = this.config.canvas;
    
    const barWidth = 100;
    const barHeight = 15;
    const barX = width - barWidth - 10;
    const barY = 15;

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health fill
    const healthPercent = health / maxHealth;
    ctx.fillStyle = healthPercent > 0.3 ? '#00ff00' : '#ff0000';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Health text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${health}/${maxHealth}`, barX + barWidth / 2, barY + 12);
  }

  /**
   * Create an explosion effect at position
   * 在指定位置创建爆炸效果
   * @param x X position
   * @param y Y position
   * @param size Size multiplier (default 1)
   */
  createExplosion(x: number, y: number, size: number = 1): void {
    const particles: Particle[] = [];
    const particleCount = Math.floor(15 * size);

    // Create explosion particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100 * size;
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 2 + Math.random() * 4 * size,
        color: this.getExplosionColor(),
        alpha: 1
      });
    }

    this.explosions.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 30 * size,
      life: 0.3,
      maxLife: 0.3,
      particles: particles
    });
  }

  /**
   * Get random explosion color
   * 获取随机爆炸颜色
   */
  private getExplosionColor(): string {
    const colors = ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffffff'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Update particles
   * 更新粒子
   * @param deltaTime Time elapsed since last frame
   */
  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Update life
      particle.life -= deltaTime;
      particle.alpha = particle.life / particle.maxLife;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Update explosions
   * 更新爆炸
   * @param deltaTime Time elapsed since last frame
   */
  private updateExplosions(deltaTime: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      
      // Update explosion radius
      explosion.life -= deltaTime;
      const progress = 1 - (explosion.life / explosion.maxLife);
      explosion.radius = explosion.maxRadius * progress;
      
      // Update explosion particles
      for (const particle of explosion.particles) {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.life -= deltaTime;
        particle.alpha = Math.max(0, particle.life / particle.maxLife);
        
        // Apply gravity
        particle.vy += 100 * deltaTime;
      }
      
      // Remove dead explosions
      if (explosion.life <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  /**
   * Render all explosions and particles
   * 渲染所有爆炸和粒子
   */
  renderExplosions(): void {
    const ctx = this.context;

    // Render explosions
    for (const explosion of this.explosions) {
      // Render explosion flash
      const alpha = explosion.life / explosion.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render explosion particles
      for (const particle of explosion.particles) {
        if (particle.alpha <= 0) continue;
        
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Render standalone particles
    for (const particle of this.particles) {
      if (particle.alpha <= 0) continue;
      
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Add a particle to the system
   * 向系统添加粒子
   * @param particle Particle to add
   */
  addParticle(particle: Particle): void {
    this.particles.push(particle);
  }

  /**
   * Create trail particles behind an entity
   * 在实体后面创建尾迹粒子
   * @param x X position
   * @param y Y position
   * @param color Particle color
   */
  createTrailParticle(x: number, y: number, color: string): void {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y,
      vx: (Math.random() - 0.5) * 20,
      vy: 50 + Math.random() * 30,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      size: 2 + Math.random() * 2,
      color: color,
      alpha: 1
    });
  }

  /**
   * Render game over screen
   * 渲染游戏结束画面
   * @param scoreData Final score data
   */
  renderGameOver(scoreData: ScoreData): void {
    const ctx = this.context;
    const { width, height } = this.config.canvas;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    // Game Over text
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 80);

    // Final score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Final Score: ${scoreData.currentScore}`, width / 2, height / 2 - 20);

    // High score
    ctx.fillStyle = '#ffcc00';
    ctx.font = '24px Arial';
    ctx.fillText(`High Score: ${scoreData.highScore}`, width / 2, height / 2 + 20);

    // Statistics
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px Arial';
    ctx.fillText(`Enemies Destroyed: ${scoreData.enemiesDestroyed}`, width / 2, height / 2 + 60);
    ctx.fillText(`Accuracy: ${scoreData.accuracy}%`, width / 2, height / 2 + 85);

    // Restart instruction
    ctx.fillStyle = '#00ff00';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE or Click to Restart', width / 2, height / 2 + 140);
  }

  /**
   * Render pause screen
   * 渲染暂停画面
   */
  renderPauseScreen(): void {
    const ctx = this.context;
    const { width, height } = this.config.canvas;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Paused text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', width / 2, height / 2 - 20);

    // Resume instruction
    ctx.font = '20px Arial';
    ctx.fillText('Press P or ESC to Resume', width / 2, height / 2 + 30);
  }

  /**
   * Render menu screen
   * 渲染菜单画面
   */
  renderMenuScreen(): void {
    const ctx = this.context;
    const { width, height } = this.config.canvas;

    // Background
    this.renderBackground();

    // Title
    ctx.fillStyle = '#00bfff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('THUNDER FIGHTER', width / 2, height / 2 - 80);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('雷霆战机', width / 2, height / 2 - 40);

    // Start instruction
    ctx.fillStyle = '#00ff00';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE or Click to Start', width / 2, height / 2 + 40);

    // Controls
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.fillText('Arrow Keys / WASD - Move', width / 2, height / 2 + 100);
    ctx.fillText('Space / Mouse - Shoot', width / 2, height / 2 + 125);
    ctx.fillText('P / ESC - Pause', width / 2, height / 2 + 150);
  }

  /**
   * Set background scroll speed
   * 设置背景滚动速度
   * @param speed Speed in pixels per second
   */
  setBackgroundSpeed(speed: number): void {
    this.backgroundSpeed = speed;
  }

  /**
   * Clear all particles and explosions
   * 清除所有粒子和爆炸
   */
  clearEffects(): void {
    this.particles = [];
    this.explosions = [];
  }

  /**
   * Reset render system
   * 重置渲染系统
   */
  reset(): void {
    this.backgroundOffset = 0;
    this.clearEffects();
  }

  /**
   * Get canvas context
   * 获取画布上下文
   */
  getContext(): CanvasRenderingContext2D {
    return this.context;
  }
}
