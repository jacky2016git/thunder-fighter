/**
 * BackgroundRenderer Class
 * 背景渲染器类
 * 
 * Handles procedural background generation and scrolling effects.
 * 处理程序化背景生成和滚动效果。
 */
import { GameConfig, DEFAULT_GAME_CONFIG } from '../types/GameConfig';

/**
 * Star Interface
 * 星星接口
 */
interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinklePhase: number;
}

/**
 * Nebula Interface
 * 星云接口
 */
interface Nebula {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alpha: number;
}

/**
 * BackgroundRenderer Class
 * 背景渲染器
 */
export class BackgroundRenderer {
  private config: GameConfig;
  private stars: Star[] = [];
  private nebulae: Nebula[] = [];
  private scrollOffset: number = 0;
  private scrollSpeed: number = 50;
  private time: number = 0;
  
  // Pre-rendered background layers
  private starfieldCanvas: HTMLCanvasElement | null = null;
  private nebulaCanvas: HTMLCanvasElement | null = null;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize background elements
   * 初始化背景元素
   */
  private initialize(): void {
    this.generateStars();
    this.generateNebulae();
    this.preRenderLayers();
  }

  /**
   * Generate star field
   * 生成星空
   */
  private generateStars(): void {
    const { width, height } = this.config.canvas;
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 2, // Double height for seamless scrolling
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.3,
        brightness: Math.random() * 0.5 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Generate nebula clouds
   * 生成星云
   */
  private generateNebulae(): void {
    const { width, height } = this.config.canvas;
    const nebulaColors = [
      'rgba(100, 50, 150, 0.1)',
      'rgba(50, 100, 150, 0.08)',
      'rgba(150, 50, 100, 0.06)',
      'rgba(50, 150, 100, 0.05)'
    ];

    for (let i = 0; i < 5; i++) {
      this.nebulae.push({
        x: Math.random() * width - 100,
        y: Math.random() * height * 2,
        width: 200 + Math.random() * 200,
        height: 150 + Math.random() * 150,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        alpha: 0.3 + Math.random() * 0.3
      });
    }
  }

  /**
   * Pre-render static background layers
   * 预渲染静态背景层
   */
  private preRenderLayers(): void {
    const { width, height } = this.config.canvas;
    const doubleHeight = height * 2;

    // Create starfield canvas
    this.starfieldCanvas = document.createElement('canvas');
    this.starfieldCanvas.width = width;
    this.starfieldCanvas.height = doubleHeight;
    const starCtx = this.starfieldCanvas.getContext('2d')!;

    // Draw base gradient
    const gradient = starCtx.createLinearGradient(0, 0, 0, doubleHeight);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.3, '#0f0f2a');
    gradient.addColorStop(0.5, '#1a1a3a');
    gradient.addColorStop(0.7, '#0f0f2a');
    gradient.addColorStop(1, '#0a0a1a');
    starCtx.fillStyle = gradient;
    starCtx.fillRect(0, 0, width, doubleHeight);

    // Draw static stars
    for (const star of this.stars) {
      starCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      starCtx.beginPath();
      starCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      starCtx.fill();
    }

    // Create nebula canvas
    this.nebulaCanvas = document.createElement('canvas');
    this.nebulaCanvas.width = width;
    this.nebulaCanvas.height = doubleHeight;
    const nebulaCtx = this.nebulaCanvas.getContext('2d')!;

    // Draw nebulae
    for (const nebula of this.nebulae) {
      const nebulaGradient = nebulaCtx.createRadialGradient(
        nebula.x + nebula.width / 2,
        nebula.y + nebula.height / 2,
        0,
        nebula.x + nebula.width / 2,
        nebula.y + nebula.height / 2,
        Math.max(nebula.width, nebula.height) / 2
      );
      nebulaGradient.addColorStop(0, nebula.color);
      nebulaGradient.addColorStop(1, 'transparent');
      nebulaCtx.fillStyle = nebulaGradient;
      nebulaCtx.fillRect(nebula.x, nebula.y, nebula.width, nebula.height);
    }
  }

  /**
   * Update background state
   * 更新背景状态
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
    this.scrollOffset += this.scrollSpeed * deltaTime;
    
    const { height } = this.config.canvas;
    if (this.scrollOffset >= height) {
      this.scrollOffset -= height;
    }
  }

  /**
   * Render the background
   * 渲染背景
   * @param ctx Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;

    // Draw base color
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw scrolling starfield
    if (this.starfieldCanvas) {
      // Draw two copies for seamless scrolling
      ctx.drawImage(
        this.starfieldCanvas,
        0, this.scrollOffset,
        width, height,
        0, 0,
        width, height
      );
      
      if (this.scrollOffset > 0) {
        ctx.drawImage(
          this.starfieldCanvas,
          0, this.scrollOffset - height,
          width, height,
          0, 0,
          width, height
        );
      }
    }

    // Draw nebulae with parallax
    if (this.nebulaCanvas) {
      const parallaxOffset = this.scrollOffset * 0.3;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(
        this.nebulaCanvas,
        0, parallaxOffset % height,
        width, height,
        0, 0,
        width, height
      );
      ctx.globalAlpha = 1;
    }

    // Draw twinkling stars overlay
    this.renderTwinklingStars(ctx);

    // Draw distant planets/objects occasionally
    this.renderDistantObjects(ctx);
  }

  /**
   * Render twinkling star effect
   * 渲染闪烁星星效果
   */
  private renderTwinklingStars(ctx: CanvasRenderingContext2D): void {
    const { height } = this.config.canvas;
    
    for (let i = 0; i < 20; i++) {
      const star = this.stars[i % this.stars.length];
      const twinkle = Math.sin(this.time * 3 + star.twinklePhase) * 0.5 + 0.5;
      const y = (star.y + this.scrollOffset * star.speed) % height;
      
      if (twinkle > 0.7) {
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, y, star.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Add cross flare for bright stars
        if (twinkle > 0.9 && star.size > 1.5) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(star.x - 5, y);
          ctx.lineTo(star.x + 5, y);
          ctx.moveTo(star.x, y - 5);
          ctx.lineTo(star.x, y + 5);
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Render distant space objects
   * 渲染远处的太空物体
   */
  private renderDistantObjects(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.config.canvas;
    
    // Draw a distant planet
    const planetY = ((this.scrollOffset * 0.1) % (height * 3)) - height;
    if (planetY > -100 && planetY < height + 100) {
      const planetGradient = ctx.createRadialGradient(
        width * 0.8 - 10, planetY - 10, 0,
        width * 0.8, planetY, 40
      );
      planetGradient.addColorStop(0, 'rgba(100, 80, 120, 0.3)');
      planetGradient.addColorStop(0.5, 'rgba(60, 50, 80, 0.2)');
      planetGradient.addColorStop(1, 'rgba(30, 25, 40, 0.1)');
      
      ctx.fillStyle = planetGradient;
      ctx.beginPath();
      ctx.arc(width * 0.8, planetY, 40, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Set scroll speed
   * 设置滚动速度
   */
  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  /**
   * Get current scroll offset
   * 获取当前滚动偏移
   */
  getScrollOffset(): number {
    return this.scrollOffset;
  }

  /**
   * Reset background state
   * 重置背景状态
   */
  reset(): void {
    this.scrollOffset = 0;
    this.time = 0;
  }
}
