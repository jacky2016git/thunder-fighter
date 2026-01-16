/**
 * UIRenderer Class
 * UI渲染器类
 * 
 * Handles rendering of all UI elements with enhanced visual styling.
 * 处理所有UI元素的渲染，具有增强的视觉样式。
 */
import { GameConfig, DEFAULT_GAME_CONFIG } from '../types/GameConfig';
import { ScoreData } from './ScoreSystem';

/**
 * Button State Interface
 * 按钮状态接口
 */
export interface ButtonState {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  hovered: boolean;
  selected: boolean;
}

/**
 * UIRenderer Class
 * UI渲染器
 */
export class UIRenderer {
  private config: GameConfig;
  private time: number = 0;
  
  // Font settings
  private readonly titleFont = 'bold 48px "Segoe UI", Arial, sans-serif';
  private readonly subtitleFont = '24px "Segoe UI", Arial, sans-serif';
  private readonly buttonFont = 'bold 22px "Segoe UI", Arial, sans-serif';
  private readonly textFont = '18px "Segoe UI", Arial, sans-serif';
  private readonly smallFont = '14px "Segoe UI", Arial, sans-serif';

  // Color scheme
  private readonly colors = {
    primary: '#00d4ff',
    secondary: '#ff6b6b',
    accent: '#ffd700',
    success: '#00ff88',
    danger: '#ff4444',
    text: '#ffffff',
    textMuted: '#aaaaaa',
    background: 'rgba(0, 0, 0, 0.8)',
    panel: 'rgba(20, 30, 50, 0.9)'
  };

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
  }

  /**
   * Update UI state
   * 更新UI状态
   */
  update(deltaTime: number): void {
    this.time += deltaTime;
  }

  /**
   * Render main menu screen
   * 渲染主菜单界面
   */
  renderMenuScreen(ctx: CanvasRenderingContext2D, selectedOption: number = 0): void {
    const { width, height } = this.config.canvas;

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw title with glow effect
    this.drawGlowText(ctx, 'THUNDER FIGHTER', width / 2, height * 0.25, {
      font: this.titleFont,
      color: this.colors.primary,
      glowColor: this.colors.primary,
      glowSize: 20
    });

    // Draw Chinese subtitle
    ctx.fillStyle = this.colors.text;
    ctx.font = this.subtitleFont;
    ctx.textAlign = 'center';
    ctx.fillText('雷霆战机', width / 2, height * 0.25 + 50);

    // Draw animated decorative line
    this.drawAnimatedLine(ctx, width / 2 - 100, height * 0.35, 200);

    // Draw menu options
    const options = ['开始游戏 / START GAME', '设置 / SETTINGS', '关于 / ABOUT'];
    const optionY = height * 0.5;
    const optionSpacing = 60;

    options.forEach((option, index) => {
      const y = optionY + index * optionSpacing;
      const isSelected = index === selectedOption;
      this.drawMenuButton(ctx, option, width / 2, y, isSelected);
    });

    // Draw controls hint
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.smallFont;
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ 选择 / Select   ENTER 确认 / Confirm', width / 2, height - 60);
    ctx.fillText('WASD/方向键 移动 | SPACE 射击 | P 暂停', width / 2, height - 35);

    // Draw version
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.smallFont;
    ctx.textAlign = 'right';
    ctx.fillText('v1.0.0', width - 15, height - 15);
  }

  /**
   * Draw menu button with hover effect
   * 绘制带悬停效果的菜单按钮
   */
  private drawMenuButton(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    selected: boolean
  ): void {
    const buttonWidth = 280;
    const buttonHeight = 45;
    const bx = x - buttonWidth / 2;
    const by = y - buttonHeight / 2;

    ctx.save();

    if (selected) {
      // Selected button with glow
      const pulse = Math.sin(this.time * 4) * 0.1 + 0.9;
      
      // Glow effect
      ctx.shadowColor = this.colors.primary;
      ctx.shadowBlur = 15 * pulse;
      
      // Button background
      const gradient = ctx.createLinearGradient(bx, by, bx + buttonWidth, by + buttonHeight);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(bx, by, buttonWidth, buttonHeight, 8);
      ctx.fill();

      // Border
      ctx.strokeStyle = this.colors.primary;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Selection indicator
      ctx.fillStyle = this.colors.primary;
      ctx.beginPath();
      ctx.moveTo(bx - 20, y);
      ctx.lineTo(bx - 8, y - 8);
      ctx.lineTo(bx - 8, y + 8);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = this.colors.text;
      ctx.font = this.buttonFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    } else {
      // Unselected button
      ctx.fillStyle = 'rgba(50, 50, 70, 0.5)';
      ctx.beginPath();
      ctx.roundRect(bx, by, buttonWidth, buttonHeight, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.colors.textMuted;
      ctx.font = '20px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }

    ctx.restore();
  }

  /**
   * Render in-game HUD
   * 渲染游戏中的HUD
   */
  renderGameHUD(
    ctx: CanvasRenderingContext2D,
    scoreData: ScoreData,
    health: number,
    maxHealth: number,
    weaponLevel: number
  ): void {
    const { width } = this.config.canvas;

    ctx.save();

    // Top bar background
    const topBarGradient = ctx.createLinearGradient(0, 0, 0, 50);
    topBarGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    topBarGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topBarGradient;
    ctx.fillRect(0, 0, width, 50);

    // Score display (left side)
    this.drawScoreDisplay(ctx, scoreData.currentScore, 15, 12);

    // High score (center)
    ctx.fillStyle = this.colors.accent;
    ctx.font = this.smallFont;
    ctx.textAlign = 'center';
    ctx.fillText(`HIGH: ${scoreData.highScore}`, width / 2, 25);

    // Health bar (right side)
    this.drawHealthBar(ctx, health, maxHealth, width - 130, 10, 115, 18);

    // Weapon level indicator
    this.drawWeaponLevel(ctx, weaponLevel, width - 130, 35);

    // Bottom bar with stats
    const bottomBarGradient = ctx.createLinearGradient(0, this.config.canvas.height - 40, 0, this.config.canvas.height);
    bottomBarGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomBarGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = bottomBarGradient;
    ctx.fillRect(0, this.config.canvas.height - 40, width, 40);

    // Stats at bottom
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.smallFont;
    ctx.textAlign = 'left';
    ctx.fillText(`击毁: ${scoreData.enemiesDestroyed}`, 15, this.config.canvas.height - 15);
    
    ctx.textAlign = 'right';
    ctx.fillText(`命中率: ${scoreData.accuracy}%`, width - 15, this.config.canvas.height - 15);

    ctx.restore();
  }

  /**
   * Draw score display with animation
   * 绘制带动画的分数显示
   */
  private drawScoreDisplay(ctx: CanvasRenderingContext2D, score: number, x: number, y: number): void {
    // Score label
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.smallFont;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', x, y + 8);

    // Score value with glow
    ctx.shadowColor = this.colors.accent;
    ctx.shadowBlur = 5;
    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(score.toLocaleString(), x, y + 32);
    ctx.shadowBlur = 0;
  }

  /**
   * Draw health bar
   * 绘制生命值条
   */
  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    health: number,
    maxHealth: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const healthPercent = health / maxHealth;
    const healthColor = healthPercent > 0.5 ? this.colors.success : 
                        healthPercent > 0.25 ? this.colors.accent : this.colors.danger;

    // Background
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.fill();

    // Health fill with gradient
    if (healthPercent > 0) {
      const healthGradient = ctx.createLinearGradient(x, y, x, y + height);
      healthGradient.addColorStop(0, healthColor);
      healthGradient.addColorStop(1, this.adjustColor(healthColor, -30));
      ctx.fillStyle = healthGradient;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, (width - 4) * healthPercent, height - 4, 2);
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.stroke();

    // Health text
    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${health}/${maxHealth}`, x + width / 2, y + height / 2);
  }

  /**
   * Draw weapon level indicator
   * 绘制武器等级指示器
   */
  private drawWeaponLevel(ctx: CanvasRenderingContext2D, level: number, x: number, y: number): void {
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.smallFont;
    ctx.textAlign = 'left';
    ctx.fillText('WEAPON:', x, y);

    // Draw level indicators
    for (let i = 1; i <= 3; i++) {
      const indicatorX = x + 60 + (i - 1) * 18;
      if (i <= level) {
        ctx.fillStyle = this.colors.accent;
        ctx.shadowColor = this.colors.accent;
        ctx.shadowBlur = 5;
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(indicatorX, y - 4, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /**
   * Render pause screen
   * 渲染暂停界面
   */
  renderPauseScreen(ctx: CanvasRenderingContext2D, selectedOption: number = 0): void {
    const { width, height } = this.config.canvas;

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    // Pause panel
    const panelWidth = 320;
    const panelHeight = 280;
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    this.drawPanel(ctx, panelX, panelY, panelWidth, panelHeight);

    // Title
    this.drawGlowText(ctx, 'PAUSED', width / 2, panelY + 50, {
      font: 'bold 36px "Segoe UI", Arial, sans-serif',
      color: this.colors.text,
      glowColor: this.colors.primary,
      glowSize: 10
    });

    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.subtitleFont;
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', width / 2, panelY + 85);

    // Options
    const options = ['继续游戏 / RESUME', '重新开始 / RESTART', '返回菜单 / MAIN MENU'];
    const optionY = panelY + 130;
    const optionSpacing = 50;

    options.forEach((option, index) => {
      const y = optionY + index * optionSpacing;
      const isSelected = index === selectedOption;
      this.drawMenuButton(ctx, option, width / 2, y, isSelected);
    });
  }

  /**
   * Render game over screen
   * 渲染游戏结束界面
   */
  renderGameOverScreen(
    ctx: CanvasRenderingContext2D,
    scoreData: ScoreData,
    isNewHighScore: boolean,
    selectedOption: number = 0
  ): void {
    const { width, height } = this.config.canvas;

    // Dark overlay with red tint
    const overlay = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
    overlay.addColorStop(0, 'rgba(50, 0, 0, 0.8)');
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Game Over title
    this.drawGlowText(ctx, 'GAME OVER', width / 2, height * 0.2, {
      font: 'bold 52px "Segoe UI", Arial, sans-serif',
      color: this.colors.secondary,
      glowColor: this.colors.secondary,
      glowSize: 25
    });

    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.subtitleFont;
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', width / 2, height * 0.2 + 50);

    // Score panel
    const panelY = height * 0.35;
    this.drawPanel(ctx, width / 2 - 150, panelY, 300, 150);

    // Final score
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.textFont;
    ctx.fillText('最终得分 / FINAL SCORE', width / 2, panelY + 35);

    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
    ctx.fillText(scoreData.currentScore.toLocaleString(), width / 2, panelY + 80);

    // New high score indicator
    if (isNewHighScore) {
      const pulse = Math.sin(this.time * 5) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillText('🎉 NEW HIGH SCORE! 新纪录! 🎉', width / 2, panelY + 115);
    } else {
      ctx.fillStyle = this.colors.accent;
      ctx.font = this.smallFont;
      ctx.fillText(`最高分: ${scoreData.highScore}`, width / 2, panelY + 115);
    }

    // Stats
    ctx.fillStyle = this.colors.textMuted;
    ctx.font = this.smallFont;
    ctx.fillText(`击毁敌机: ${scoreData.enemiesDestroyed} | 命中率: ${scoreData.accuracy}%`, 
                 width / 2, panelY + 140);

    // Options
    const options = ['重新开始 / RESTART', '返回菜单 / MAIN MENU'];
    const optionY = height * 0.72;
    const optionSpacing = 55;

    options.forEach((option, index) => {
      const y = optionY + index * optionSpacing;
      const isSelected = index === selectedOption;
      this.drawMenuButton(ctx, option, width / 2, y, isSelected);
    });
  }

  /**
   * Draw a panel with border and background
   * 绘制带边框和背景的面板
   */
  private drawPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    ctx.save();

    // Panel background
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(30, 40, 60, 0.95)');
    gradient.addColorStop(1, 'rgba(20, 30, 50, 0.95)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 8);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw text with glow effect
   * 绘制带发光效果的文字
   */
  private drawGlowText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options: {
      font: string;
      color: string;
      glowColor: string;
      glowSize: number;
    }
  ): void {
    ctx.save();
    ctx.font = options.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow layers
    ctx.shadowColor = options.glowColor;
    ctx.shadowBlur = options.glowSize;
    ctx.fillStyle = options.color;
    
    // Draw multiple times for stronger glow
    for (let i = 0; i < 3; i++) {
      ctx.fillText(text, x, y);
    }

    ctx.restore();
  }

  /**
   * Draw animated decorative line
   * 绘制动画装饰线
   */
  private drawAnimatedLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const progress = (Math.sin(this.time * 2) + 1) / 2;
    
    ctx.save();
    
    // Base line
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();

    // Animated highlight
    const highlightWidth = width * 0.3;
    const highlightX = x + (width - highlightWidth) * progress;
    
    const gradient = ctx.createLinearGradient(highlightX, y, highlightX + highlightWidth, y);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(highlightX, y);
    ctx.lineTo(highlightX + highlightWidth, y);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Adjust color brightness
   * 调整颜色亮度
   */
  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Check if a point is inside a button
   * 检查点是否在按钮内
   */
  isPointInButton(px: number, py: number, button: ButtonState): boolean {
    return px >= button.x && px <= button.x + button.width &&
           py >= button.y && py <= button.y + button.height;
  }
}
