/**
 * Bullet Class
 * 子弹类
 * 
 * Represents bullets fired by player or enemies.
 * 表示玩家或敌机发射的子弹。
 */
import { Collidable } from '../interfaces/Collidable';
import { Movable } from '../interfaces/Movable';
import { Rectangle } from '../types/Rectangle';
import { CollisionType, BulletOwner } from '../types/enums';
import { DEFAULT_GAME_CONFIG, GameConfig } from '../types/GameConfig';

export class Bullet implements Collidable, Movable {
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

  // Bullet-specific properties
  owner: BulletOwner;
  damage: number;

  // Canvas bounds for boundary checking
  private canvasWidth: number;
  private canvasHeight: number;

  /**
   * Create a new bullet
   * @param x Initial X position
   * @param y Initial Y position
   * @param owner Who fired the bullet (PLAYER or ENEMY)
   * @param velocityY Y velocity (negative for player bullets going up, positive for enemy bullets going down)
   * @param config Game configuration
   */
  constructor(
    x: number,
    y: number,
    owner: BulletOwner,
    velocityY: number,
    config: GameConfig = DEFAULT_GAME_CONFIG
  ) {
    this.id = `bullet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.active = true;

    // Set properties based on owner
    const bulletConfig = owner === BulletOwner.PLAYER 
      ? config.bullet.player 
      : config.bullet.enemy;

    this.width = bulletConfig.width;
    this.height = bulletConfig.height;
    this.speed = bulletConfig.speed;
    this.damage = bulletConfig.damage;

    // Movable initialization
    this.velocityX = 0;
    this.velocityY = velocityY;

    // Collidable initialization
    this.collisionBox = { x: this.x, y: this.y, width: this.width, height: this.height };
    this.collisionType = owner === BulletOwner.PLAYER 
      ? CollisionType.PLAYER_BULLET 
      : CollisionType.ENEMY_BULLET;

    // Canvas bounds
    this.canvasWidth = config.canvas.width;
    this.canvasHeight = config.canvas.height;
  }

  /**
   * Update the bullet state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Move the bullet
    this.move(deltaTime);

    // Check if bullet is out of bounds
    this.checkBounds();

    // Update collision box position
    this.collisionBox.x = this.x;
    this.collisionBox.y = this.y;
  }

  /**
   * Move the bullet based on velocity
   * @param deltaTime Time elapsed since last frame in seconds
   */
  move(deltaTime: number): void {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }

  /**
   * Set the velocity of the bullet
   * @param vx Velocity in X direction
   * @param vy Velocity in Y direction
   */
  setVelocity(vx: number, vy: number): void {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  /**
   * Check if bullet is out of canvas bounds and deactivate if so
   */
  private checkBounds(): void {
    // Check if completely out of bounds
    if (
      this.y + this.height < 0 || // Above screen
      this.y > this.canvasHeight || // Below screen
      this.x + this.width < 0 || // Left of screen
      this.x > this.canvasWidth // Right of screen
    ) {
      this.active = false;
    }
  }

  /**
   * Handle collision with another object
   * @param other The other collidable object
   */
  onCollision(other: Collidable): void {
    // Deactivate bullet on collision with valid target
    if (this.owner === BulletOwner.PLAYER) {
      if (other.collisionType === CollisionType.ENEMY) {
        this.active = false;
      }
    } else {
      if (other.collisionType === CollisionType.PLAYER) {
        this.active = false;
      }
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
   * Render the bullet
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    if (!this.active) return;

    context.save();

    // Different colors for player and enemy bullets
    if (this.owner === BulletOwner.PLAYER) {
      // Player bullet - yellow/gold
      context.fillStyle = '#FFD700';
      
      // Draw as elongated rectangle with rounded ends
      context.beginPath();
      context.roundRect(this.x, this.y, this.width, this.height, 2);
      context.fill();
      
      // Add glow effect
      context.shadowColor = '#FFD700';
      context.shadowBlur = 5;
      context.fill();
    } else {
      // Enemy bullet - red
      context.fillStyle = '#FF4444';
      
      // Draw as circle/oval
      context.beginPath();
      context.ellipse(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2,
        this.height / 2,
        0,
        0,
        Math.PI * 2
      );
      context.fill();
      
      // Add glow effect
      context.shadowColor = '#FF4444';
      context.shadowBlur = 5;
      context.fill();
    }

    context.restore();
  }

  /**
   * Clean up and mark the bullet for removal
   */
  destroy(): void {
    this.active = false;
  }
}
