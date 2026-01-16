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
   * Render the player aircraft using SVG sprite
   * 使用SVG精灵渲染玩家飞机
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // Apply blinking effect when invincible
    if (this.invincible && Math.floor(this.invincibleTime / 100) % 2 === 0) {
      return; // Skip rendering for blink effect
    }

    context.save();

    // Draw player aircraft using SVG
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="200" height="200"><path d="M241.493333 136.533333l246.272 283.221334-233.941333-18.901334L179.925333 136.533333H241.493333zM241.493333 887.637333l246.272-283.221333-233.941333 18.901333-73.898667 264.32H241.493333zM526.890667 425.898667l71.68 6.144-65.152-61.568h-45.653334l39.125334 55.424zM526.890667 598.272l71.68-6.186667-65.152 61.568h-45.653334l39.125334-55.381333zM296.96 561.322667l-18.517333-24.618667h-172.373334l-24.618666 18.474667v43.093333l215.466666-36.949333zM296.96 462.805333l-24.661333 24.661334-166.229334 6.144-24.618666-21.888v-39.68l215.466666 30.762666z" fill="#1F5596"/><path d="M721.749333 468.992c9.813333 0 233.941333 18.474667 233.941334 43.093333s-209.322667 43.093333-233.941334 43.093334l-73.898666 24.618666-541.781334 30.762667 227.84-36.906667-43.093333-49.28-178.56-6.144v-12.330666l178.517333-6.144 43.093334-49.237334-227.797334-36.949333 541.781334 30.805333 73.898666 24.618667z m0 24.618667l36.906667 6.144 36.949333 12.330666-36.949333 12.288-36.949333 6.186667v-36.949333z m-24.661333 36.949333v-36.949333h-91.946667c-19.626667 4.522667-19.626667 32.426667 0 36.949333h91.946667z" fill="#1F5596"/><path d="M69.12 388.949333l135.466667 6.144-104.661334-110.805333-43.093333 24.618667 12.330667 80.042666zM69.12 635.221333l135.466667-6.186666-104.661334 110.848-43.093333-24.661334 12.330667-80z" fill="#1F5596"/></svg>`;
    
    // Try to use cached image if available and URL API exists (browser environment)
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      if (!PlayerAircraft.cachedSpriteImage) {
        PlayerAircraft.cachedSpriteImage = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        PlayerAircraft.cachedSpriteImage.src = url;
        PlayerAircraft.cachedSpriteImage.onload = () => {
          URL.revokeObjectURL(url);
        };
      }
      
      if (PlayerAircraft.cachedSpriteImage.complete && PlayerAircraft.cachedSpriteImage.naturalWidth > 0) {
        // Draw the SVG image rotated -90 degrees to face up
        context.translate(this.x + this.width / 2, this.y + this.height / 2);
        context.rotate(-Math.PI / 2);
        context.drawImage(
          PlayerAircraft.cachedSpriteImage,
          -this.height / 2,
          -this.width / 2,
          this.height,
          this.width
        );
        context.restore();
        return;
      }
    }
    
    // Fallback: draw a stylized fighter shape
    context.fillStyle = '#1F5596';
    context.beginPath();
    // Main body
    context.moveTo(this.x + this.width / 2, this.y); // Nose
    context.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.3);
    context.lineTo(this.x + this.width, this.y + this.height * 0.6); // Right wing
    context.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.7);
    context.lineTo(this.x + this.width * 0.6, this.y + this.height);
    context.lineTo(this.x + this.width * 0.4, this.y + this.height);
    context.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.7);
    context.lineTo(this.x, this.y + this.height * 0.6); // Left wing
    context.lineTo(this.x + this.width * 0.15, this.y + this.height * 0.3);
    context.closePath();
    context.fill();

    // Cockpit
    context.fillStyle = '#87CEEB';
    context.beginPath();
    context.arc(
      this.x + this.width / 2,
      this.y + this.height * 0.35,
      this.width * 0.12,
      0, Math.PI * 2
    );
    context.fill();

    context.restore();
  }

  // Static cached sprite image
  private static cachedSpriteImage: HTMLImageElement | null = null;

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
