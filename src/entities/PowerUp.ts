/**
 * PowerUp Class
 * 道具类
 * 
 * Collectible power-up items that enhance player abilities.
 * 可收集的道具，用于增强玩家能力。
 */
import { Collidable } from '../interfaces/Collidable';
import { Movable } from '../interfaces/Movable';
import { Rectangle } from '../types/Rectangle';
import { CollisionType, PowerUpType } from '../types/enums';
import { DEFAULT_GAME_CONFIG, GameConfig } from '../types/GameConfig';
import { PlayerAircraft } from './PlayerAircraft';

export class PowerUp implements Collidable, Movable {
  // GameObject properties
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;

  // Movable properties
  velocityX: number;
  velocityY: number;
  speed: number;

  // Collidable properties
  collisionBox: Rectangle;
  collisionType: CollisionType;

  // PowerUp-specific properties
  type: PowerUpType;

  // Animation state
  private animationTime: number = 0;
  private pulseScale: number = 1;

  // Canvas bounds
  private canvasHeight: number;
  private config: GameConfig;

  // Power-up dimensions
  static readonly POWERUP_SIZE = 24;

  /**
   * Create a new power-up
   * @param x Initial X position
   * @param y Initial Y position
   * @param type Power-up type
   * @param config Game configuration
   */
  constructor(
    x: number,
    y: number,
    type: PowerUpType,
    config: GameConfig = DEFAULT_GAME_CONFIG
  ) {
    this.id = `powerup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.config = config;

    this.width = PowerUp.POWERUP_SIZE;
    this.height = PowerUp.POWERUP_SIZE;
    this.speed = config.powerUp.fallSpeed;

    // Movable initialization
    this.velocityX = 0;
    this.velocityY = this.speed;

    // Collidable initialization
    this.collisionBox = { x: this.x, y: this.y, width: this.width, height: this.height };
    this.collisionType = CollisionType.POWER_UP;

    // Canvas bounds
    this.canvasHeight = config.canvas.height;
  }

  /**
   * Update the power-up state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Update animation
    this.animationTime += deltaTime;
    this.pulseScale = 1 + Math.sin(this.animationTime * 4) * 0.1;

    // Move the power-up
    this.move(deltaTime);

    // Check if power-up is out of bounds (below screen)
    if (this.y > this.canvasHeight) {
      this.active = false;
    }

    // Update collision box position
    this.collisionBox.x = this.x;
    this.collisionBox.y = this.y;
  }

  /**
   * Move the power-up (falls down)
   * @param deltaTime Time elapsed since last frame in seconds
   */
  move(deltaTime: number): void {
    this.y += this.velocityY * deltaTime;
  }

  /**
   * Set the velocity of the power-up
   * @param vx Velocity in X direction
   * @param vy Velocity in Y direction
   */
  setVelocity(vx: number, vy: number): void {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  /**
   * Apply the power-up effect to the player
   * @param player The player aircraft to apply the effect to
   */
  apply(player: PlayerAircraft): void {
    switch (this.type) {
      case PowerUpType.WEAPON_UPGRADE:
        player.upgradeWeapon();
        break;

      case PowerUpType.HEALTH:
        player.heal(1);
        break;

      case PowerUpType.SHIELD:
        player.activateShield(this.config.player.invincibleDuration);
        break;
    }

    // Deactivate power-up after collection
    this.active = false;
  }

  /**
   * Handle collision with another object
   * @param other The other collidable object
   */
  onCollision(other: Collidable): void {
    if (other.collisionType === CollisionType.PLAYER) {
      // Effect is applied through the apply() method
      this.active = false;
    }
  }

  /**
   * Check collision with another object using AABB
   * @param other The other collidable object
   * @returns true if collision detected
   */
  checkCollision(other: Collidable): boolean {
    const a = this.collisionBox;
    const b = other.collisionBox;

    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Render the power-up
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    if (!this.active) return;

    context.save();

    // Apply pulse animation
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    context.translate(centerX, centerY);
    context.scale(this.pulseScale, this.pulseScale);
    context.translate(-centerX, -centerY);

    // Draw based on power-up type
    switch (this.type) {
      case PowerUpType.WEAPON_UPGRADE:
        this.renderWeaponUpgrade(context);
        break;

      case PowerUpType.HEALTH:
        this.renderHealth(context);
        break;

      case PowerUpType.SHIELD:
        this.renderShield(context);
        break;
    }

    context.restore();
  }

  /**
   * Render weapon upgrade power-up (golden lightning bolt)
   */
  private renderWeaponUpgrade(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const size = this.width;

    // Outer glow circle
    const glowGradient = context.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    glowGradient.addColorStop(0.7, 'rgba(255, 165, 0, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
    context.fillStyle = glowGradient;
    context.beginPath();
    context.arc(cx, cy, size / 2, 0, Math.PI * 2);
    context.fill();

    // Lightning bolt shape
    context.fillStyle = '#FFD700';
    context.beginPath();
    context.moveTo(cx + size * 0.1, this.y + size * 0.1);
    context.lineTo(cx - size * 0.15, cy + size * 0.05);
    context.lineTo(cx + size * 0.05, cy);
    context.lineTo(cx - size * 0.1, this.y + this.height - size * 0.1);
    context.lineTo(cx + size * 0.15, cy - size * 0.05);
    context.lineTo(cx - size * 0.05, cy);
    context.closePath();
    context.fill();

    // Inner highlight
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.moveTo(cx + size * 0.05, this.y + size * 0.2);
    context.lineTo(cx - size * 0.05, cy);
    context.lineTo(cx + size * 0.02, cy - size * 0.05);
    context.closePath();
    context.fill();
  }

  /**
   * Render health power-up (red heart with cross)
   */
  private renderHealth(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const size = this.width;

    // Outer glow
    const glowGradient = context.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    glowGradient.addColorStop(0, 'rgba(0, 255, 0, 0.6)');
    glowGradient.addColorStop(0.7, 'rgba(0, 200, 0, 0.3)');
    glowGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
    context.fillStyle = glowGradient;
    context.beginPath();
    context.arc(cx, cy, size / 2, 0, Math.PI * 2);
    context.fill();

    // Heart shape
    const heartGradient = context.createRadialGradient(cx, cy - size * 0.1, 0, cx, cy, size * 0.4);
    heartGradient.addColorStop(0, '#FF6B6B');
    heartGradient.addColorStop(0.5, '#FF0000');
    heartGradient.addColorStop(1, '#CC0000');
    context.fillStyle = heartGradient;
    
    context.beginPath();
    const topY = this.y + size * 0.25;
    // Left curve
    context.moveTo(cx, this.y + this.height - size * 0.15);
    context.bezierCurveTo(
      this.x + size * 0.1, cy,
      this.x + size * 0.1, topY,
      cx - size * 0.15, topY
    );
    context.bezierCurveTo(
      this.x + size * 0.15, topY - size * 0.1,
      cx - size * 0.05, topY - size * 0.05,
      cx, topY + size * 0.1
    );
    // Right curve
    context.bezierCurveTo(
      cx + size * 0.05, topY - size * 0.05,
      this.x + this.width - size * 0.15, topY - size * 0.1,
      cx + size * 0.15, topY
    );
    context.bezierCurveTo(
      this.x + this.width - size * 0.1, topY,
      this.x + this.width - size * 0.1, cy,
      cx, this.y + this.height - size * 0.15
    );
    context.fill();

    // White cross on heart
    context.fillStyle = '#FFFFFF';
    const crossSize = size * 0.25;
    context.fillRect(cx - crossSize * 0.15, cy - crossSize * 0.4, crossSize * 0.3, crossSize * 0.8);
    context.fillRect(cx - crossSize * 0.4, cy - crossSize * 0.15, crossSize * 0.8, crossSize * 0.3);
  }

  /**
   * Render shield power-up (blue energy shield)
   */
  private renderShield(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const size = this.width;

    // Outer energy glow
    const glowGradient = context.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    glowGradient.addColorStop(0, 'rgba(65, 105, 225, 0.8)');
    glowGradient.addColorStop(0.6, 'rgba(30, 144, 255, 0.4)');
    glowGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
    context.fillStyle = glowGradient;
    context.beginPath();
    context.arc(cx, cy, size / 2, 0, Math.PI * 2);
    context.fill();

    // Shield body
    const shieldGradient = context.createLinearGradient(this.x, this.y, this.x + size, this.y + size);
    shieldGradient.addColorStop(0, '#87CEEB');
    shieldGradient.addColorStop(0.3, '#4169E1');
    shieldGradient.addColorStop(0.7, '#1E90FF');
    shieldGradient.addColorStop(1, '#0000CD');
    
    context.fillStyle = shieldGradient;
    context.beginPath();
    // Shield shape - pointed bottom
    context.moveTo(cx, this.y + size * 0.1);
    context.lineTo(this.x + size * 0.85, this.y + size * 0.2);
    context.lineTo(this.x + size * 0.85, cy + size * 0.1);
    context.lineTo(cx, this.y + size * 0.9);
    context.lineTo(this.x + size * 0.15, cy + size * 0.1);
    context.lineTo(this.x + size * 0.15, this.y + size * 0.2);
    context.closePath();
    context.fill();

    // Shield border
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.stroke();

    // Inner highlight
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.beginPath();
    context.moveTo(cx - size * 0.15, this.y + size * 0.2);
    context.lineTo(this.x + size * 0.25, this.y + size * 0.25);
    context.lineTo(this.x + size * 0.25, cy);
    context.lineTo(cx - size * 0.1, cy + size * 0.15);
    context.closePath();
    context.fill();

    // Energy symbol in center
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    context.stroke();
  }

  /**
   * Clean up and mark the power-up for removal
   */
  destroy(): void {
    this.active = false;
  }

  /**
   * Get a random power-up type
   * @returns Random PowerUpType
   */
  static getRandomType(): PowerUpType {
    const types = [PowerUpType.WEAPON_UPGRADE, PowerUpType.HEALTH, PowerUpType.SHIELD];
    const weights = [0.4, 0.4, 0.2]; // 40% weapon, 40% health, 20% shield
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return types[i];
      }
    }
    
    return types[0];
  }
}
