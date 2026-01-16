/**
 * SpriteManager Class
 * 精灵管理器类
 * 
 * Manages sprite generation and caching for game entities.
 * Uses Canvas-based procedural generation for placeholder sprites.
 * 管理游戏实体的精灵生成和缓存。使用Canvas程序化生成占位精灵。
 */
import { EnemyType, PowerUpType } from '../types/enums';

/**
 * Sprite Type Enum
 * 精灵类型枚举
 */
export enum SpriteType {
  PLAYER = 'player',
  ENEMY_BASIC = 'enemy_basic',
  ENEMY_SHOOTER = 'enemy_shooter',
  ENEMY_ZIGZAG = 'enemy_zigzag',
  ENEMY_BOSS = 'enemy_boss',
  BULLET_PLAYER = 'bullet_player',
  BULLET_ENEMY = 'bullet_enemy',
  POWERUP_WEAPON = 'powerup_weapon',
  POWERUP_HEALTH = 'powerup_health',
  POWERUP_SHIELD = 'powerup_shield',
  EXPLOSION_1 = 'explosion_1',
  EXPLOSION_2 = 'explosion_2',
  EXPLOSION_3 = 'explosion_3',
  EXPLOSION_4 = 'explosion_4'
}

/**
 * Sprite Definition Interface
 * 精灵定义接口
 */
export interface SpriteDefinition {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}

/**
 * SpriteManager Class
 * 精灵管理器
 */
export class SpriteManager {
  private sprites: Map<SpriteType, SpriteDefinition> = new Map();
  private initialized: boolean = false;
  private playerSpriteImage: HTMLImageElement | null = null;

  constructor() {}

  /**
   * Initialize all sprites
   * 初始化所有精灵
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load player SVG sprite first
    await this.loadPlayerSVG();
    
    // Generate player sprite
    this.generatePlayerSprite();
    
    // Generate enemy sprites
    this.generateEnemySprites();
    
    // Generate bullet sprites
    this.generateBulletSprites();
    
    // Generate power-up sprites
    this.generatePowerUpSprites();
    
    // Generate explosion sprites
    this.generateExplosionSprites();

    this.initialized = true;
  }

  /**
   * Load player SVG as image
   * 加载玩家飞机SVG图像
   */
  private loadPlayerSVG(): Promise<void> {
    return new Promise((resolve) => {
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="200" height="200"><path d="M241.493333 136.533333l246.272 283.221334-233.941333-18.901334L179.925333 136.533333H241.493333zM241.493333 887.637333l246.272-283.221333-233.941333 18.901333-73.898667 264.32H241.493333zM526.890667 425.898667l71.68 6.144-65.152-61.568h-45.653334l39.125334 55.424zM526.890667 598.272l71.68-6.186667-65.152 61.568h-45.653334l39.125334-55.381333zM296.96 561.322667l-18.517333-24.618667h-172.373334l-24.618666 18.474667v43.093333l215.466666-36.949333zM296.96 462.805333l-24.661333 24.661334-166.229334 6.144-24.618666-21.888v-39.68l215.466666 30.762666z" fill="#1F5596"/><path d="M721.749333 468.992c9.813333 0 233.941333 18.474667 233.941334 43.093333s-209.322667 43.093333-233.941334 43.093334l-73.898666 24.618666-541.781334 30.762667 227.84-36.906667-43.093333-49.28-178.56-6.144v-12.330666l178.517333-6.144 43.093334-49.237334-227.797334-36.949333 541.781334 30.805333 73.898666 24.618667z m0 24.618667l36.906667 6.144 36.949333 12.330666-36.949333 12.288-36.949333 6.186667v-36.949333z m-24.661333 36.949333v-36.949333h-91.946667c-19.626667 4.522667-19.626667 32.426667 0 36.949333h91.946667z" fill="#1F5596"/><path d="M69.12 388.949333l135.466667 6.144-104.661334-110.805333-43.093333 24.618667 12.330667 80.042666zM69.12 635.221333l135.466667-6.186666-104.661334 110.848-43.093333-24.661334 12.330667-80z" fill="#1F5596"/></svg>`;
      
      const img = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        this.playerSpriteImage = img;
        URL.revokeObjectURL(url);
        resolve();
      };
      
      img.onerror = () => {
        console.warn('Failed to load player SVG, using fallback');
        URL.revokeObjectURL(url);
        resolve();
      };
      
      img.src = url;
    });
  }

  /**
   * Get a sprite by type
   * 根据类型获取精灵
   */
  getSprite(type: SpriteType): SpriteDefinition | undefined {
    return this.sprites.get(type);
  }

  /**
   * Get enemy sprite by enemy type
   * 根据敌机类型获取精灵
   */
  getEnemySprite(enemyType: EnemyType): SpriteDefinition | undefined {
    switch (enemyType) {
      case EnemyType.BASIC:
        return this.sprites.get(SpriteType.ENEMY_BASIC);
      case EnemyType.SHOOTER:
        return this.sprites.get(SpriteType.ENEMY_SHOOTER);
      case EnemyType.ZIGZAG:
        return this.sprites.get(SpriteType.ENEMY_ZIGZAG);
      case EnemyType.BOSS:
        return this.sprites.get(SpriteType.ENEMY_BOSS);
      default:
        return this.sprites.get(SpriteType.ENEMY_BASIC);
    }
  }

  /**
   * Get power-up sprite by type
   * 根据道具类型获取精灵
   */
  getPowerUpSprite(powerUpType: PowerUpType): SpriteDefinition | undefined {
    switch (powerUpType) {
      case PowerUpType.WEAPON_UPGRADE:
        return this.sprites.get(SpriteType.POWERUP_WEAPON);
      case PowerUpType.HEALTH:
        return this.sprites.get(SpriteType.POWERUP_HEALTH);
      case PowerUpType.SHIELD:
        return this.sprites.get(SpriteType.POWERUP_SHIELD);
      default:
        return this.sprites.get(SpriteType.POWERUP_WEAPON);
    }
  }

  /**
   * Generate player aircraft sprite
   * 生成玩家飞机精灵 - 使用自定义SVG
   */
  private generatePlayerSprite(): void {
    const width = 64;
    const height = 48;
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    if (this.playerSpriteImage) {
      // Use the loaded SVG image - rotate 90 degrees to face up
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 2); // Rotate -90 degrees so it faces up
      // Draw centered, scaled to fit
      const scale = Math.min(height / this.playerSpriteImage.width, width / this.playerSpriteImage.height) * 0.9;
      const drawWidth = this.playerSpriteImage.width * scale;
      const drawHeight = this.playerSpriteImage.height * scale;
      ctx.drawImage(this.playerSpriteImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    } else {
      // Fallback: draw a simple triangle if SVG failed to load
      const bodyGradient = ctx.createLinearGradient(0, 0, width, height);
      bodyGradient.addColorStop(0, '#1F5596');
      bodyGradient.addColorStop(1, '#0d2d4d');

      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    this.sprites.set(SpriteType.PLAYER, { width, height, canvas });
  }

  /**
   * Generate enemy aircraft sprites
   * 生成敌机精灵
   */
  private generateEnemySprites(): void {
    // Basic enemy (red triangle)
    this.generateBasicEnemySprite();
    
    // Shooter enemy (orange diamond)
    this.generateShooterEnemySprite();
    
    // Zigzag enemy (purple hexagon)
    this.generateZigzagEnemySprite();
    
    // Boss enemy (large red ship)
    this.generateBossEnemySprite();
  }

  private generateBasicEnemySprite(): void {
    const width = 32;
    const height = 32;
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#cc4444');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(width / 2, height); // Bottom center
    ctx.lineTo(0, 0); // Top left
    ctx.lineTo(width, 0); // Top right
    ctx.closePath();
    ctx.fill();

    // Eye/cockpit
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.4, 4, 0, Math.PI * 2);
    ctx.fill();

    this.sprites.set(SpriteType.ENEMY_BASIC, { width, height, canvas });
  }

  private generateShooterEnemySprite(): void {
    const width = 36;
    const height = 40;
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ffa500');
    gradient.addColorStop(1, '#cc7700');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0); // Top
    ctx.lineTo(width, height / 2); // Right
    ctx.lineTo(width / 2, height); // Bottom
    ctx.lineTo(0, height / 2); // Left
    ctx.closePath();
    ctx.fill();

    // Cannon
    ctx.fillStyle = '#ff4500';
    ctx.fillRect(width / 2 - 4, height - 8, 8, 10);

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.4, 2, 0, Math.PI * 2);
    ctx.fill();

    this.sprites.set(SpriteType.ENEMY_SHOOTER, { width, height, canvas });
  }

  private generateZigzagEnemySprite(): void {
    const width = 36;
    const height = 36;
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#9b59b6');
    gradient.addColorStop(1, '#6c3483');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(width * 0.3, 0);
    ctx.lineTo(width * 0.7, 0);
    ctx.lineTo(width, height * 0.4);
    ctx.lineTo(width * 0.8, height);
    ctx.lineTo(width * 0.2, height);
    ctx.lineTo(0, height * 0.4);
    ctx.closePath();
    ctx.fill();

    // Glowing core
    const coreGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, 8
    );
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.5, '#e74c3c');
    coreGradient.addColorStop(1, '#9b59b6');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    this.sprites.set(SpriteType.ENEMY_ZIGZAG, { width, height, canvas });
  }

  private generateBossEnemySprite(): void {
    const width = 96;
    const height = 80;
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    // Main body gradient
    const bodyGradient = ctx.createLinearGradient(0, 0, width, height);
    bodyGradient.addColorStop(0, '#8b0000');
    bodyGradient.addColorStop(0.5, '#cc0000');
    bodyGradient.addColorStop(1, '#660000');

    // Main body
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(width / 2, height); // Bottom center
    ctx.lineTo(0, height * 0.3); // Left wing
    ctx.lineTo(width * 0.2, 0); // Top left
    ctx.lineTo(width * 0.8, 0); // Top right
    ctx.lineTo(width, height * 0.3); // Right wing
    ctx.closePath();
    ctx.fill();

    // Wing details
    ctx.fillStyle = '#4a0000';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.35);
    ctx.lineTo(width * 0.25, height * 0.5);
    ctx.lineTo(width * 0.15, height * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width, height * 0.35);
    ctx.lineTo(width * 0.75, height * 0.5);
    ctx.lineTo(width * 0.85, height * 0.7);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    const cockpitGradient = ctx.createRadialGradient(
      width / 2, height * 0.35, 0,
      width / 2, height * 0.35, 15
    );
    cockpitGradient.addColorStop(0, '#ff0000');
    cockpitGradient.addColorStop(0.7, '#990000');
    cockpitGradient.addColorStop(1, '#660000');
    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.35, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cannons
    ctx.fillStyle = '#333333';
    ctx.fillRect(width * 0.3 - 4, height - 10, 8, 12);
    ctx.fillRect(width * 0.5 - 4, height - 10, 8, 12);
    ctx.fillRect(width * 0.7 - 4, height - 10, 8, 12);

    this.sprites.set(SpriteType.ENEMY_BOSS, { width, height, canvas });
  }

  /**
   * Generate bullet sprites
   * 生成子弹精灵
   */
  private generateBulletSprites(): void {
    // Player bullet (yellow/gold)
    const playerWidth = 6;
    const playerHeight = 16;
    const playerCanvas = this.createCanvas(playerWidth, playerHeight);
    const playerCtx = playerCanvas.getContext('2d')!;

    const playerGradient = playerCtx.createLinearGradient(0, 0, playerWidth, 0);
    playerGradient.addColorStop(0, '#ffcc00');
    playerGradient.addColorStop(0.5, '#ffff00');
    playerGradient.addColorStop(1, '#ffcc00');

    playerCtx.fillStyle = playerGradient;
    playerCtx.beginPath();
    playerCtx.roundRect(0, 0, playerWidth, playerHeight, 3);
    playerCtx.fill();

    // Glow effect
    playerCtx.shadowColor = '#ffff00';
    playerCtx.shadowBlur = 5;
    playerCtx.fill();

    this.sprites.set(SpriteType.BULLET_PLAYER, { 
      width: playerWidth, 
      height: playerHeight, 
      canvas: playerCanvas 
    });

    // Enemy bullet (red)
    const enemyWidth = 8;
    const enemyHeight = 8;
    const enemyCanvas = this.createCanvas(enemyWidth, enemyHeight);
    const enemyCtx = enemyCanvas.getContext('2d')!;

    const enemyGradient = enemyCtx.createRadialGradient(
      enemyWidth / 2, enemyHeight / 2, 0,
      enemyWidth / 2, enemyHeight / 2, enemyWidth / 2
    );
    enemyGradient.addColorStop(0, '#ffffff');
    enemyGradient.addColorStop(0.3, '#ff6666');
    enemyGradient.addColorStop(1, '#ff0000');

    enemyCtx.fillStyle = enemyGradient;
    enemyCtx.beginPath();
    enemyCtx.arc(enemyWidth / 2, enemyHeight / 2, enemyWidth / 2, 0, Math.PI * 2);
    enemyCtx.fill();

    this.sprites.set(SpriteType.BULLET_ENEMY, { 
      width: enemyWidth, 
      height: enemyHeight, 
      canvas: enemyCanvas 
    });
  }

  /**
   * Generate power-up sprites
   * 生成道具精灵
   */
  private generatePowerUpSprites(): void {
    const size = 28;

    // Weapon upgrade (golden star)
    const weaponCanvas = this.createCanvas(size, size);
    const weaponCtx = weaponCanvas.getContext('2d')!;
    this.drawStar(weaponCtx, size / 2, size / 2, 5, size / 2, size / 4, '#ffd700', '#ffaa00');
    this.sprites.set(SpriteType.POWERUP_WEAPON, { width: size, height: size, canvas: weaponCanvas });

    // Health (green cross)
    const healthCanvas = this.createCanvas(size, size);
    const healthCtx = healthCanvas.getContext('2d')!;
    this.drawHealthCross(healthCtx, size);
    this.sprites.set(SpriteType.POWERUP_HEALTH, { width: size, height: size, canvas: healthCanvas });

    // Shield (blue shield)
    const shieldCanvas = this.createCanvas(size, size);
    const shieldCtx = shieldCanvas.getContext('2d')!;
    this.drawShield(shieldCtx, size);
    this.sprites.set(SpriteType.POWERUP_SHIELD, { width: size, height: size, canvas: shieldCanvas });
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    fillColor: string,
    strokeColor: string
  ): void {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, fillColor);
    gradient.addColorStop(1, strokeColor);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawHealthCross(ctx: CanvasRenderingContext2D, size: number): void {
    const crossWidth = size * 0.35;
    const crossLength = size * 0.85;
    const offset = (size - crossLength) / 2;
    const widthOffset = (size - crossWidth) / 2;

    // Background circle
    const bgGradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(0.7, '#00ff00');
    bgGradient.addColorStop(1, '#00aa00');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Cross
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(widthOffset, offset, crossWidth, crossLength);
    ctx.fillRect(offset, widthOffset, crossLength, crossWidth);
  }

  private drawShield(ctx: CanvasRenderingContext2D, size: number): void {
    const cx = size / 2;
    const cy = size / 2;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    glowGradient.addColorStop(0, 'rgba(65, 105, 225, 0.8)');
    glowGradient.addColorStop(0.7, 'rgba(65, 105, 225, 0.4)');
    glowGradient.addColorStop(1, 'rgba(65, 105, 225, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Shield shape
    const shieldGradient = ctx.createLinearGradient(0, 0, size, size);
    shieldGradient.addColorStop(0, '#87ceeb');
    shieldGradient.addColorStop(0.5, '#4169e1');
    shieldGradient.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = shieldGradient;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.35);
    ctx.lineTo(cx + size * 0.3, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.3, cy + size * 0.1);
    ctx.lineTo(cx, cy + size * 0.35);
    ctx.lineTo(cx - size * 0.3, cy + size * 0.1);
    ctx.lineTo(cx - size * 0.3, cy - size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Generate explosion animation sprites
   * 生成爆炸动画精灵
   */
  private generateExplosionSprites(): void {
    const size = 64;
    const frames = [
      { radius: 0.2, alpha: 1.0, colors: ['#ffffff', '#ffff00', '#ff6600'] },
      { radius: 0.5, alpha: 0.9, colors: ['#ffff00', '#ff6600', '#ff0000'] },
      { radius: 0.8, alpha: 0.6, colors: ['#ff6600', '#ff0000', '#990000'] },
      { radius: 1.0, alpha: 0.3, colors: ['#ff0000', '#990000', '#330000'] }
    ];

    const spriteTypes = [
      SpriteType.EXPLOSION_1,
      SpriteType.EXPLOSION_2,
      SpriteType.EXPLOSION_3,
      SpriteType.EXPLOSION_4
    ];

    frames.forEach((frame, index) => {
      const canvas = this.createCanvas(size, size);
      const ctx = canvas.getContext('2d')!;
      
      const cx = size / 2;
      const cy = size / 2;
      const maxRadius = (size / 2) * frame.radius;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.5);
      glowGradient.addColorStop(0, `rgba(255, 200, 0, ${frame.alpha * 0.5})`);
      glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main explosion
      const mainGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      mainGradient.addColorStop(0, frame.colors[0]);
      mainGradient.addColorStop(0.5, frame.colors[1]);
      mainGradient.addColorStop(1, frame.colors[2]);
      ctx.globalAlpha = frame.alpha;
      ctx.fillStyle = mainGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sparks
      ctx.globalAlpha = frame.alpha * 0.8;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const sparkRadius = maxRadius * (0.8 + Math.random() * 0.4);
        const sparkX = cx + Math.cos(angle) * sparkRadius;
        const sparkY = cy + Math.sin(angle) * sparkRadius;
        
        ctx.fillStyle = frame.colors[Math.floor(Math.random() * frame.colors.length)];
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      this.sprites.set(spriteTypes[index], { width: size, height: size, canvas });
    });
  }

  /**
   * Create a canvas element
   * 创建画布元素
   */
  private createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Draw a sprite to a context
   * 将精灵绘制到上下文
   */
  drawSprite(
    ctx: CanvasRenderingContext2D,
    type: SpriteType,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    const sprite = this.sprites.get(type);
    if (!sprite) return;

    const drawWidth = width ?? sprite.width;
    const drawHeight = height ?? sprite.height;
    ctx.drawImage(sprite.canvas, x, y, drawWidth, drawHeight);
  }

  /**
   * Check if sprites are initialized
   * 检查精灵是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
