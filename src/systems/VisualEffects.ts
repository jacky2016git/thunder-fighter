/**
 * VisualEffects Class
 * 视觉效果类
 * 
 * Manages all visual effects including explosions, particles, and screen effects.
 * 管理所有视觉效果，包括爆炸、粒子和屏幕效果。
 */
import { GameConfig, DEFAULT_GAME_CONFIG } from '../types/GameConfig';

/**
 * Particle Interface
 * 粒子接口
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: ParticleType;
  rotation?: number;
  rotationSpeed?: number;
}

/**
 * Particle Type Enum
 * 粒子类型枚举
 */
export enum ParticleType {
  SPARK = 'spark',
  SMOKE = 'smoke',
  FIRE = 'fire',
  DEBRIS = 'debris',
  TRAIL = 'trail',
  STAR = 'star'
}

/**
 * Explosion Interface
 * 爆炸接口
 */
export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  particles: Particle[];
  shockwave: boolean;
  shockwaveRadius: number;
}

/**
 * Screen Effect Interface
 * 屏幕效果接口
 */
export interface ScreenEffect {
  type: 'shake' | 'flash' | 'damage';
  duration: number;
  elapsed: number;
  intensity: number;
  color?: string;
}

/**
 * VisualEffects Class
 * 视觉效果
 */
export class VisualEffects {
  private config: GameConfig;
  private particles: Particle[] = [];
  private explosions: Explosion[] = [];
  private screenEffects: ScreenEffect[] = [];
  private time: number = 0;

  // Explosion color palettes
  private readonly explosionColors = {
    normal: ['#ffffff', '#ffff00', '#ff8800', '#ff4400', '#ff0000'],
    blue: ['#ffffff', '#88ffff', '#00ccff', '#0088ff', '#0044aa'],
    green: ['#ffffff', '#88ff88', '#00ff00', '#00cc00', '#008800'],
    purple: ['#ffffff', '#ff88ff', '#ff00ff', '#cc00cc', '#880088']
  };

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
  }

  /**
   * Update all visual effects
   * 更新所有视觉效果
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
    this.updateParticles(deltaTime);
    this.updateExplosions(deltaTime);
    this.updateScreenEffects(deltaTime);
  }

  /**
   * Create an explosion at position
   * 在指定位置创建爆炸
   */
  createExplosion(
    x: number,
    y: number,
    size: number = 1,
    colorPalette: keyof typeof this.explosionColors = 'normal'
  ): void {
    const colors = this.explosionColors[colorPalette];
    const particles: Particle[] = [];
    const particleCount = Math.floor(25 * size);

    // Create fire particles
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 150 * size;
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 3 + Math.random() * 6 * size,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        type: ParticleType.FIRE
      });
    }

    // Create smoke particles
    for (let i = 0; i < particleCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.6 + Math.random() * 0.6,
        maxLife: 1.2,
        size: 8 + Math.random() * 12 * size,
        color: '#444444',
        alpha: 0.6,
        type: ParticleType.SMOKE
      });
    }

    // Create debris particles
    for (let i = 0; i < 8 * size; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 2 + Math.random() * 4,
        color: '#888888',
        alpha: 1,
        type: ParticleType.DEBRIS,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 20
      });
    }

    this.explosions.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 40 * size,
      life: 0.3,
      maxLife: 0.3,
      particles: particles,
      shockwave: size >= 1,
      shockwaveRadius: 0
    });

    // Add screen shake for large explosions
    if (size >= 1.5) {
      this.addScreenShake(0.2, size * 3);
    }
  }

  /**
   * Create engine trail particles
   * 创建引擎尾迹粒子
   */
  createEngineTrail(x: number, y: number, isPlayer: boolean = true): void {
    const color = isPlayer ? '#00aaff' : '#ff6600';
    const secondaryColor = isPlayer ? '#ffffff' : '#ffff00';

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: 80 + Math.random() * 40,
        life: 0.15 + Math.random() * 0.1,
        maxLife: 0.25,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.5 ? color : secondaryColor,
        alpha: 0.8,
        type: ParticleType.TRAIL
      });
    }
  }

  /**
   * Create bullet impact sparks
   * 创建子弹撞击火花
   */
  createImpactSparks(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 150;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.1 + Math.random() * 0.15,
        maxLife: 0.25,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#ffff00' : '#ffffff',
        alpha: 1,
        type: ParticleType.SPARK
      });
    }
  }

  /**
   * Create power-up collection effect
   * 创建道具收集效果
   */
  createPowerUpEffect(x: number, y: number, color: string): void {
    // Star burst
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 80 + Math.random() * 40;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        size: 4 + Math.random() * 4,
        color: color,
        alpha: 1,
        type: ParticleType.STAR
      });
    }

    // Add screen flash
    this.addScreenFlash(0.1, color);
  }

  /**
   * Create ultimate ability activation effect
   * 创建大招激活效果
   */
  createUltimateActivationEffect(x: number, y: number): void {
    // Create expanding shockwave rings
    for (let ring = 0; ring < 3; ring++) {
      const delay = ring * 0.1;
      setTimeout(() => {
        // Create ring of particles
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2;
          const speed = 300 + Math.random() * 100;

          this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.8 + Math.random() * 0.4,
            maxLife: 1.2,
            size: 6 + Math.random() * 4,
            color: ring % 2 === 0 ? '#00ffff' : '#ffffff',
            alpha: 1,
            type: ParticleType.STAR
          });
        }
      }, delay * 1000);
    }

    // Create central burst
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 200;

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        size: 5 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#00ffff' : '#ffffff',
        alpha: 1,
        type: ParticleType.FIRE
      });
    }

    // Add screen shake
    this.addScreenShake(0.4, 8);
  }

  /**
   * Create damage flash effect for player
   * 创建玩家受伤闪烁效果
   */
  createDamageEffect(): void {
    this.screenEffects.push({
      type: 'damage',
      duration: 0.3,
      elapsed: 0,
      intensity: 0.4,
      color: '#ff0000'
    });
  }

  /**
   * Add screen shake effect
   * 添加屏幕震动效果
   */
  addScreenShake(duration: number, intensity: number): void {
    this.screenEffects.push({
      type: 'shake',
      duration: duration,
      elapsed: 0,
      intensity: intensity
    });
  }

  /**
   * Add screen flash effect
   * 添加屏幕闪光效果
   */
  addScreenFlash(duration: number, color: string): void {
    this.screenEffects.push({
      type: 'flash',
      duration: duration,
      elapsed: 0,
      intensity: 0.3,
      color: color
    });
  }

  /**
   * Update particles
   * 更新粒子
   */
  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Apply gravity to certain particle types
      if (particle.type === ParticleType.DEBRIS || particle.type === ParticleType.SMOKE) {
        particle.vy += 200 * deltaTime;
      }

      // Update rotation
      if (particle.rotation !== undefined && particle.rotationSpeed !== undefined) {
        particle.rotation += particle.rotationSpeed * deltaTime;
      }

      // Update life and alpha
      particle.life -= deltaTime;
      particle.alpha = Math.max(0, particle.life / particle.maxLife);

      // Shrink particles as they die
      if (particle.type === ParticleType.SMOKE) {
        particle.size += 10 * deltaTime;
      }

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Update explosions
   * 更新爆炸
   */
  private updateExplosions(deltaTime: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];

      // Update explosion
      explosion.life -= deltaTime;
      const progress = 1 - (explosion.life / explosion.maxLife);
      explosion.radius = explosion.maxRadius * progress;

      // Update shockwave
      if (explosion.shockwave) {
        explosion.shockwaveRadius = explosion.maxRadius * 2 * progress;
      }

      // Update explosion particles
      for (const particle of explosion.particles) {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.life -= deltaTime;
        particle.alpha = Math.max(0, particle.life / particle.maxLife);

        // Apply gravity
        if (particle.type === ParticleType.DEBRIS || particle.type === ParticleType.SMOKE) {
          particle.vy += 150 * deltaTime;
        }

        // Slow down fire particles
        if (particle.type === ParticleType.FIRE) {
          particle.vx *= 0.95;
          particle.vy *= 0.95;
        }

        // Update rotation
        if (particle.rotation !== undefined && particle.rotationSpeed !== undefined) {
          particle.rotation += particle.rotationSpeed * deltaTime;
        }
      }

      // Remove dead explosions
      if (explosion.life <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  /**
   * Update screen effects
   * 更新屏幕效果
   */
  private updateScreenEffects(deltaTime: number): void {
    for (let i = this.screenEffects.length - 1; i >= 0; i--) {
      const effect = this.screenEffects[i];
      effect.elapsed += deltaTime;

      if (effect.elapsed >= effect.duration) {
        this.screenEffects.splice(i, 1);
      }
    }
  }

  /**
   * Render all visual effects
   * 渲染所有视觉效果
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Apply screen shake
    const shakeEffect = this.screenEffects.find(e => e.type === 'shake');
    if (shakeEffect) {
      const progress = 1 - (shakeEffect.elapsed / shakeEffect.duration);
      const shakeX = (Math.random() - 0.5) * shakeEffect.intensity * progress * 2;
      const shakeY = (Math.random() - 0.5) * shakeEffect.intensity * progress * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Render explosions
    this.renderExplosions(ctx);

    // Render particles
    this.renderParticles(ctx);

    ctx.restore();

    // Render screen effects (after restore to not be affected by shake)
    this.renderScreenEffects(ctx);
  }

  /**
   * Render explosions
   * 渲染爆炸
   */
  private renderExplosions(ctx: CanvasRenderingContext2D): void {
    for (const explosion of this.explosions) {
      const alpha = explosion.life / explosion.maxLife;

      // Render shockwave
      if (explosion.shockwave && explosion.shockwaveRadius > 0) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Render explosion flash
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      const flashGradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.radius
      );
      flashGradient.addColorStop(0, '#ffffff');
      flashGradient.addColorStop(0.3, '#ffff00');
      flashGradient.addColorStop(0.6, '#ff6600');
      flashGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render explosion particles
      for (const particle of explosion.particles) {
        this.renderParticle(ctx, particle);
      }
    }
  }

  /**
   * Render particles
   * 渲染粒子
   */
  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      this.renderParticle(ctx, particle);
    }
  }

  /**
   * Render a single particle
   * 渲染单个粒子
   */
  private renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
    if (particle.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = particle.alpha;

    switch (particle.type) {
      case ParticleType.SPARK:
      case ParticleType.FIRE:
        // Glowing circle
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.5, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case ParticleType.SMOKE:
        // Soft smoke circle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha * 0.4;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case ParticleType.DEBRIS:
        // Rotating square
        ctx.translate(particle.x, particle.y);
        if (particle.rotation !== undefined) {
          ctx.rotate(particle.rotation);
        }
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        break;

      case ParticleType.TRAIL:
        // Elongated trail
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.ellipse(particle.x, particle.y, particle.size / 2, particle.size, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case ParticleType.STAR:
        // Star shape
        this.drawStar(ctx, particle.x, particle.y, 5, particle.size, particle.size / 2, particle.color);
        break;
    }

    ctx.restore();
  }

  /**
   * Render screen effects
   * 渲染屏幕效果
   */
  private renderScreenEffects(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;

    for (const effect of this.screenEffects) {
      const progress = effect.elapsed / effect.duration;

      switch (effect.type) {
        case 'flash':
          ctx.save();
          ctx.globalAlpha = effect.intensity * (1 - progress);
          ctx.fillStyle = effect.color || '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
          break;

        case 'damage':
          // Red vignette effect
          ctx.save();
          const vignetteAlpha = effect.intensity * (1 - progress);
          const vignetteGradient = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.3,
            width / 2, height / 2, height * 0.8
          );
          vignetteGradient.addColorStop(0, 'transparent');
          vignetteGradient.addColorStop(1, `rgba(255, 0, 0, ${vignetteAlpha})`);
          ctx.fillStyle = vignetteGradient;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
          break;
      }
    }
  }

  /**
   * Draw a star shape
   * 绘制星形
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Clear all effects
   * 清除所有效果
   */
  clear(): void {
    this.particles = [];
    this.explosions = [];
    this.screenEffects = [];
  }

  /**
   * Get particle count (for debugging)
   * 获取粒子数量（用于调试）
   */
  getParticleCount(): number {
    let count = this.particles.length;
    for (const explosion of this.explosions) {
      count += explosion.particles.length;
    }
    return count;
  }

  /**
   * Check if there are active screen effects
   * 检查是否有活动的屏幕效果
   */
  hasActiveScreenEffects(): boolean {
    return this.screenEffects.length > 0;
  }
}
