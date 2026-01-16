/**
 * PlayerAircraft Class
 * 玩家飞机类
 * 
 * The player-controlled aircraft with movement, shooting, and health management.
 * 玩家控制的飞机，具有移动、射击和生命值管理功能。
 */
import { Collidable } from '../interfaces/Collidable';
import { Movable } from '../interfaces/Movable';
import { Rectangle } from '../types/Rectangle';
import { CollisionType, BulletOwner } from '../types/enums';
import { DEFAULT_GAME_CONFIG, GameConfig } from '../types/GameConfig';
import { Bullet } from './Bullet';

export class PlayerAircraft implements Collidable, Movable {
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

  // Player-specific properties
  health: number;
  maxHealth: number;
  fireRate: number;
  lastFireTime: number;
  weaponLevel: number;

  invincible: boolean;
  invincibleTime: number;
  invincibleDuration: number;

  // Canvas bounds for boundary constraints
  private canvasWidth: number;
  private canvasHeight: number;
  private config: GameConfig;

  constructor(x: number, y: number, config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.x = x;
    this.y = y;
    this.config = config;
    this.width = config.player.width;
    this.height = config.player.height;
    this.active = true;

    // Movable initialization
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = config.player.speed;

    // Collidable initialization
    this.collisionBox = { x: this.x, y: this.y, width: this.width, height: this.height };
    this.collisionType = CollisionType.PLAYER;

    // Player-specific initialization
    this.health = config.player.maxHealth;
    this.maxHealth = config.player.maxHealth;
    this.fireRate = config.player.fireRate;
    this.lastFireTime = 0;
    this.weaponLevel = 1;

    this.invincible = false;
    this.invincibleTime = 0;
    this.invincibleDuration = config.player.invincibleDuration;

    // Canvas bounds
    this.canvasWidth = config.canvas.width;
    this.canvasHeight = config.canvas.height;
  }

  /**
   * Update the player aircraft state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Move based on velocity
    this.move(deltaTime);

    // Update invincibility timer
    if (this.invincible) {
      this.invincibleTime -= deltaTime * 1000; // Convert to milliseconds
      if (this.invincibleTime <= 0) {
        this.invincible = false;
        this.invincibleTime = 0;
      }
    }

    // Update collision box position
    this.collisionBox.x = this.x;
    this.collisionBox.y = this.y;
  }

  /**
   * Move the player aircraft based on velocity
   * Implements boundary constraints to keep player within canvas
   * @param deltaTime Time elapsed since last frame in seconds
   */
  move(deltaTime: number): void {
    // Calculate new position
    let newX = this.x + this.velocityX * deltaTime;
    let newY = this.y + this.velocityY * deltaTime;

    // Apply boundary constraints
    newX = Math.max(0, Math.min(newX, this.canvasWidth - this.width));
    newY = Math.max(0, Math.min(newY, this.canvasHeight - this.height));

    this.x = newX;
    this.y = newY;
  }

  /**
   * Set the velocity of the player aircraft
   * @param vx Velocity in X direction
   * @param vy Velocity in Y direction
   */
  setVelocity(vx: number, vy: number): void {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  /**
   * Fire bullets based on current weapon level
   * Implements fire rate limiting
   * @param currentTime Current game time in milliseconds
   * @returns Array of bullets fired, empty if fire rate not met
   */
  fire(currentTime: number): Bullet[] {
    // Check fire rate limit
    if (currentTime - this.lastFireTime < this.fireRate) {
      return [];
    }

    this.lastFireTime = currentTime;
    const bullets: Bullet[] = [];
    const bulletConfig = this.config.bullet.player;

    // Calculate bullet spawn position (center top of player)
    const centerX = this.x + this.width / 2;
    const bulletY = this.y - bulletConfig.height;

    // Spawn bullets based on weapon level
    switch (this.weaponLevel) {
      case 1:
        // Single bullet from center
        bullets.push(new Bullet(
          centerX - bulletConfig.width / 2,
          bulletY,
          BulletOwner.PLAYER,
          -bulletConfig.speed, // Negative Y velocity (moving up)
          this.config
        ));
        break;

      case 2:
        // Two bullets side by side
        const offset2 = 10;
        bullets.push(new Bullet(
          centerX - bulletConfig.width / 2 - offset2,
          bulletY,
          BulletOwner.PLAYER,
          -bulletConfig.speed,
          this.config
        ));
        bullets.push(new Bullet(
          centerX - bulletConfig.width / 2 + offset2,
          bulletY,
          BulletOwner.PLAYER,
          -bulletConfig.speed,
          this.config
        ));
        break;

      case 3:
      default:
        // Three bullets in a spread pattern
        const offset3 = 15;
        bullets.push(new Bullet(
          centerX - bulletConfig.width / 2 - offset3,
          bulletY,
          BulletOwner.PLAYER,
          -bulletConfig.speed,
          this.config
        ));
        bullets.push(new Bullet(
          centerX - bulletConfig.width / 2,
          bulletY,
          BulletOwner.PLAYER,
          -bulletConfig.speed,
          this.config
        ));
        bullets.push(new Bullet(
          centerX - bulletConfig.width / 2 + offset3,
          bulletY,
          BulletOwner.PLAYER,
          -bulletConfig.speed,
          this.config
        ));
        break;
    }

    return bullets;
  }

  /**
   * Apply damage to the player
   * Triggers invincibility if not already invincible
   * @param damage Amount of damage to apply
   */
  takeDamage(damage: number): void {
    if (this.invincible || !this.active) return;

    this.health -= damage;

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
    } else {
      // Trigger invincibility after taking damage
      this.invincible = true;
      this.invincibleTime = this.invincibleDuration;
    }
  }

  /**
   * Heal the player
   * @param amount Amount of health to restore
   */
  heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  /**
   * Upgrade the weapon level
   * Maximum weapon level is 3
   */
  upgradeWeapon(): void {
    if (this.weaponLevel < 3) {
      this.weaponLevel++;
    }
  }

  /**
   * Activate shield (temporary invincibility)
   * @param duration Duration in milliseconds
   */
  activateShield(duration: number): void {
    this.invincible = true;
    this.invincibleTime = duration;
  }

  /**
   * Handle collision with another object
   * @param other The other collidable object
   */
  onCollision(other: Collidable): void {
    switch (other.collisionType) {
      case CollisionType.ENEMY:
      case CollisionType.ENEMY_BULLET:
        this.takeDamage(1);
        break;
      case CollisionType.POWER_UP:
        // Power-up effects are handled by the PowerUp class
        break;
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
   * Render the player aircraft
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Apply blinking effect when invincible
    if (this.invincible && Math.floor(this.invincibleTime / 100) % 2 === 0) {
      return; // Skip rendering for blink effect
    }

    context.save();

    // Draw player aircraft as a triangle (placeholder)
    context.fillStyle = '#00BFFF'; // Deep sky blue
    context.beginPath();
    context.moveTo(this.x + this.width / 2, this.y); // Top center
    context.lineTo(this.x, this.y + this.height); // Bottom left
    context.lineTo(this.x + this.width, this.y + this.height); // Bottom right
    context.closePath();
    context.fill();

    // Draw cockpit
    context.fillStyle = '#87CEEB'; // Light sky blue
    context.beginPath();
    context.arc(
      this.x + this.width / 2,
      this.y + this.height * 0.4,
      this.width * 0.15,
      0,
      Math.PI * 2
    );
    context.fill();

    context.restore();
  }

  /**
   * Clean up and mark the player for removal
   */
  destroy(): void {
    this.active = false;
  }

  /**
   * Reset player to initial state
   * @param x Initial X position
   * @param y Initial Y position
   */
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.health = this.maxHealth;
    this.weaponLevel = 1;
    this.invincible = false;
    this.invincibleTime = 0;
    this.lastFireTime = 0;
    this.active = true;
    this.collisionBox.x = this.x;
    this.collisionBox.y = this.y;
  }
}
