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
   * Render weapon upgrade power-up (yellow star)
   */
  private renderWeaponUpgrade(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const outerRadius = this.width / 2;
    const innerRadius = this.width / 4;
    const spikes = 5;

    // Draw star
    context.fillStyle = '#FFD700';
    context.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
    context.fill();

    // Add glow
    context.shadowColor = '#FFD700';
    context.shadowBlur = 10;
    context.fill();
  }

  /**
   * Render health power-up (green cross/plus)
   */
  private renderHealth(context: CanvasRenderingContext2D): void {
    const crossWidth = this.width * 0.3;
    const crossLength = this.height * 0.8;

    context.fillStyle = '#00FF00';

    // Vertical bar
    context.fillRect(
      this.x + (this.width - crossWidth) / 2,
      this.y + (this.height - crossLength) / 2,
      crossWidth,
      crossLength
    );

    // Horizontal bar
    context.fillRect(
      this.x + (this.width - crossLength) / 2,
      this.y + (this.height - crossWidth) / 2,
      crossLength,
      crossWidth
    );

    // Add glow
    context.shadowColor = '#00FF00';
    context.shadowBlur = 10;
    context.fillRect(
      this.x + (this.width - crossWidth) / 2,
      this.y + (this.height - crossLength) / 2,
      crossWidth,
      crossLength
    );
  }

  /**
   * Render shield power-up (blue circle with shield icon)
   */
  private renderShield(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const radius = this.width / 2;

    // Draw outer circle
    context.fillStyle = '#4169E1';
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();

    // Draw shield shape inside
    context.fillStyle = '#87CEEB';
    context.beginPath();
    context.moveTo(cx, cy - radius * 0.6);
    context.lineTo(cx + radius * 0.5, cy - radius * 0.3);
    context.lineTo(cx + radius * 0.5, cy + radius * 0.2);
    context.lineTo(cx, cy + radius * 0.6);
    context.lineTo(cx - radius * 0.5, cy + radius * 0.2);
    context.lineTo(cx - radius * 0.5, cy - radius * 0.3);
    context.closePath();
    context.fill();

    // Add glow
    context.shadowColor = '#4169E1';
    context.shadowBlur = 10;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();
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
