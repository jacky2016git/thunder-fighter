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

  // Ultimate ability properties
  ultimateActive: boolean;
  ultimateTime: number;
  ultimateDuration: number;
  ultimateCooldown: number;
  lastUltimateTime: number;

  // Auto-fire property
  autoFire: boolean;

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

    // Ultimate ability initialization
    this.ultimateActive = false;
    this.ultimateTime = 0;
    this.ultimateDuration = 30000; // 30 seconds in milliseconds
    this.ultimateCooldown = 60000; // 60 seconds cooldown
    this.lastUltimateTime = -this.ultimateCooldown; // Allow immediate use

    // Auto-fire initialization (enabled by default)
    this.autoFire = true;

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

    // Update ultimate ability timer
    if (this.ultimateActive) {
      this.ultimateTime -= deltaTime * 1000; // Convert to milliseconds
      if (this.ultimateTime <= 0) {
        this.ultimateActive = false;
        this.ultimateTime = 0;
        this.invincible = false; // Remove invincibility when ultimate ends
      }
    }

    // Update invincibility timer (only if not from ultimate)
    if (this.invincible && !this.ultimateActive) {
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
   * Activate ultimate ability (大招)
   * Destroys all enemies on screen and makes player invincible for 30 seconds
   * @param currentTime Current game time in milliseconds
   * @returns true if ultimate was activated, false if on cooldown
   */
  activateUltimate(currentTime: number): boolean {
    // Check if ultimate is on cooldown
    if (currentTime - this.lastUltimateTime < this.ultimateCooldown) {
      return false;
    }

    // Activate ultimate
    this.ultimateActive = true;
    this.ultimateTime = this.ultimateDuration;
    this.invincible = true;
    this.lastUltimateTime = currentTime;

    return true;
  }

  /**
   * Check if ultimate ability is ready
   * @param currentTime Current game time in milliseconds
   * @returns true if ultimate is ready to use
   */
  isUltimateReady(currentTime: number): boolean {
    return currentTime - this.lastUltimateTime >= this.ultimateCooldown;
  }

  /**
   * Get ultimate cooldown remaining time
   * @param currentTime Current game time in milliseconds
   * @returns Remaining cooldown time in milliseconds, 0 if ready
   */
  getUltimateCooldown(currentTime: number): number {
    const remaining = this.ultimateCooldown - (currentTime - this.lastUltimateTime);
    return Math.max(0, remaining);
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

    // Draw player aircraft using SVG - rocket/spacecraft design
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="200" height="200"><path d="M453.12 948.032h131.264c6.4 0 12.48 0.576 18.688 1.344V157.952c0-51.072-38.656-92.416-86.336-92.416-47.744 0-86.464 41.344-86.464 92.416v792c7.552-1.216 15.104-1.92 22.848-1.92z" fill="#C4E4EF"/><path d="M603.072 313.6l324.8 346.176v78.592L603.072 570.624zM603.072 788.16l87.104 90.752v92.864l-87.104-25.984zM430.336 782.4l-87.04 90.752v92.736l87.04-25.92zM430.336 312.32l-324.8 346.048v78.72l324.8-167.808zM502.144 949.44h30.144c1.408 0 2.944 0.128 4.288 0.384v-189.376c0-12.16-8.896-22.08-19.84-22.08s-19.904 9.856-19.904 22.08v189.504a28.8 28.8 0 0 1 5.312-0.512z" fill="#6AA4CA"/></svg>`;
    
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
        // Draw the SVG image directly (already facing up)
        context.drawImage(
          PlayerAircraft.cachedSpriteImage,
          this.x,
          this.y,
          this.width,
          this.height
        );
        context.restore();
        return;
      }
    }
    
    // Fallback: draw a stylized rocket shape
    context.fillStyle = '#C4E4EF';
    context.beginPath();
    // Main body
    context.moveTo(this.x + this.width / 2, this.y); // Nose
    context.lineTo(this.x + this.width * 0.65, this.y + this.height * 0.15);
    context.lineTo(this.x + this.width * 0.65, this.y + this.height * 0.9);
    context.lineTo(this.x + this.width * 0.35, this.y + this.height * 0.9);
    context.lineTo(this.x + this.width * 0.35, this.y + this.height * 0.15);
    context.closePath();
    context.fill();

    // Wings
    context.fillStyle = '#6AA4CA';
    // Left wing
    context.beginPath();
    context.moveTo(this.x + this.width * 0.35, this.y + this.height * 0.3);
    context.lineTo(this.x, this.y + this.height * 0.7);
    context.lineTo(this.x, this.y + this.height * 0.8);
    context.lineTo(this.x + this.width * 0.35, this.y + this.height * 0.55);
    context.closePath();
    context.fill();
    // Right wing
    context.beginPath();
    context.moveTo(this.x + this.width * 0.65, this.y + this.height * 0.3);
    context.lineTo(this.x + this.width, this.y + this.height * 0.7);
    context.lineTo(this.x + this.width, this.y + this.height * 0.8);
    context.lineTo(this.x + this.width * 0.65, this.y + this.height * 0.55);
    context.closePath();
    context.fill();

    // Engine flame
    context.fillStyle = '#FF6600';
    context.beginPath();
    context.moveTo(this.x + this.width * 0.4, this.y + this.height * 0.9);
    context.lineTo(this.x + this.width * 0.5, this.y + this.height);
    context.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.9);
    context.closePath();
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
    this.ultimateActive = false;
    this.ultimateTime = 0;
    this.lastUltimateTime = -this.ultimateCooldown; // Allow immediate use
    this.autoFire = true; // Reset to auto-fire enabled
    this.active = true;
    this.collisionBox.x = this.x;
    this.collisionBox.y = this.y;
  }
}
