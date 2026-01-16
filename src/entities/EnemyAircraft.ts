/**
 * EnemyAircraft Class
 * 敌机类
 * 
 * Enemy aircraft with different types and movement patterns.
 * 具有不同类型和移动模式的敌机。
 */
import { Collidable } from '../interfaces/Collidable';
import { Movable } from '../interfaces/Movable';
import { Rectangle } from '../types/Rectangle';
import { CollisionType, EnemyType, BulletOwner, MovementPattern } from '../types/enums';
import { DEFAULT_GAME_CONFIG, GameConfig, EnemyConfig } from '../types/GameConfig';
import { Bullet } from './Bullet';

export class EnemyAircraft implements Collidable, Movable {
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

  // Enemy-specific properties
  type: EnemyType;
  health: number;
  maxHealth: number;
  scoreValue: number;
  fireRate: number;
  lastFireTime: number;
  movementPattern: MovementPattern;

  // Movement pattern state
  private initialX: number;
  private zigzagAmplitude: number = 50;
  private zigzagFrequency: number = 2;
  private elapsedTime: number = 0;
  private bossPhase: number = 0;
  private bossPhaseTime: number = 0;

  // Canvas bounds
  private canvasWidth: number;
  private canvasHeight: number;
  private config: GameConfig;

  /**
   * Create a new enemy aircraft
   * @param x Initial X position
   * @param y Initial Y position
   * @param type Enemy type
   * @param config Game configuration
   */
  constructor(
    x: number,
    y: number,
    type: EnemyType,
    config: GameConfig = DEFAULT_GAME_CONFIG
  ) {
    this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.active = true;
    this.config = config;

    // Get enemy config based on type
    const enemyConfig = this.getEnemyConfig(type, config);

    this.width = enemyConfig.width;
    this.height = enemyConfig.height;
    this.speed = enemyConfig.speed;
    this.health = enemyConfig.health;
    this.maxHealth = enemyConfig.health;
    this.scoreValue = enemyConfig.scoreValue;
    this.fireRate = enemyConfig.fireRate || 0;
    this.lastFireTime = 0;

    // Set movement pattern based on type
    this.movementPattern = this.getMovementPattern(type);

    // Movable initialization
    this.velocityX = 0;
    this.velocityY = this.speed;

    // Collidable initialization
    this.collisionBox = { x: this.x, y: this.y, width: this.width, height: this.height };
    this.collisionType = CollisionType.ENEMY;

    // Canvas bounds
    this.canvasWidth = config.canvas.width;
    this.canvasHeight = config.canvas.height;
  }

  /**
   * Get enemy configuration based on type
   */
  private getEnemyConfig(type: EnemyType, config: GameConfig): EnemyConfig {
    switch (type) {
      case EnemyType.BASIC:
        return config.enemy.basic;
      case EnemyType.SHOOTER:
        return config.enemy.shooter;
      case EnemyType.ZIGZAG:
        return config.enemy.zigzag;
      case EnemyType.BOSS:
        return config.enemy.boss;
      default:
        return config.enemy.basic;
    }
  }

  /**
   * Get movement pattern based on enemy type
   */
  private getMovementPattern(type: EnemyType): MovementPattern {
    switch (type) {
      case EnemyType.BASIC:
      case EnemyType.SHOOTER:
        return MovementPattern.STRAIGHT;
      case EnemyType.ZIGZAG:
        return MovementPattern.ZIGZAG;
      case EnemyType.BOSS:
        return MovementPattern.SINE;
      default:
        return MovementPattern.STRAIGHT;
    }
  }

  /**
   * Update the enemy aircraft state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    this.elapsedTime += deltaTime;

    // Move based on movement pattern
    this.move(deltaTime);

    // Check if enemy is out of bounds (below screen)
    if (this.y > this.canvasHeight) {
      this.active = false;
    }

    // Update collision box position
    this.collisionBox.x = this.x;
    this.collisionBox.y = this.y;
  }

  /**
   * Move the enemy based on movement pattern
   * @param deltaTime Time elapsed since last frame in seconds
   */
  move(deltaTime: number): void {
    switch (this.movementPattern) {
      case MovementPattern.STRAIGHT:
        this.moveStraight(deltaTime);
        break;
      case MovementPattern.ZIGZAG:
        this.moveZigzag(deltaTime);
        break;
      case MovementPattern.SINE:
        this.moveBoss(deltaTime);
        break;
      default:
        this.moveStraight(deltaTime);
    }
  }

  /**
   * Straight down movement (BASIC and SHOOTER enemies)
   */
  private moveStraight(deltaTime: number): void {
    this.y += this.speed * deltaTime;
  }

  /**
   * Zigzag movement pattern (ZIGZAG enemies)
   */
  private moveZigzag(deltaTime: number): void {
    // Move down
    this.y += this.speed * deltaTime;

    // Calculate horizontal oscillation
    const newX = this.initialX + Math.sin(this.elapsedTime * this.zigzagFrequency * Math.PI) * this.zigzagAmplitude;
    
    // Clamp to canvas bounds
    this.x = Math.max(0, Math.min(newX, this.canvasWidth - this.width));
  }

  /**
   * Boss movement pattern (complex sine wave with phases)
   */
  private moveBoss(deltaTime: number): void {
    this.bossPhaseTime += deltaTime;

    switch (this.bossPhase) {
      case 0:
        // Phase 0: Move down to position
        if (this.y < 50) {
          this.y += this.speed * deltaTime;
        } else {
          this.bossPhase = 1;
          this.bossPhaseTime = 0;
        }
        break;

      case 1:
        // Phase 1: Horizontal sine wave movement
        this.x = this.canvasWidth / 2 - this.width / 2 + 
                 Math.sin(this.bossPhaseTime * 0.5 * Math.PI) * (this.canvasWidth / 3);
        
        // Clamp to canvas bounds
        this.x = Math.max(0, Math.min(this.x, this.canvasWidth - this.width));

        // Switch phase periodically
        if (this.bossPhaseTime > 8) {
          this.bossPhase = 2;
          this.bossPhaseTime = 0;
        }
        break;

      case 2:
        // Phase 2: Move down slightly then back up
        const verticalOffset = Math.sin(this.bossPhaseTime * Math.PI) * 30;
        this.y = 50 + verticalOffset;

        // Continue horizontal movement
        this.x = this.canvasWidth / 2 - this.width / 2 + 
                 Math.sin(this.bossPhaseTime * Math.PI) * (this.canvasWidth / 4);
        
        this.x = Math.max(0, Math.min(this.x, this.canvasWidth - this.width));

        if (this.bossPhaseTime > 4) {
          this.bossPhase = 1;
          this.bossPhaseTime = 0;
        }
        break;
    }
  }

  /**
   * Set the velocity of the enemy
   * @param vx Velocity in X direction
   * @param vy Velocity in Y direction
   */
  setVelocity(vx: number, vy: number): void {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  /**
   * Fire a bullet (for SHOOTER and BOSS enemies)
   * @param currentTime Current game time in milliseconds
   * @returns Bullet if fired, null otherwise
   */
  fire(currentTime: number): Bullet | null {
    // Only SHOOTER and BOSS enemies can fire
    if (this.type !== EnemyType.SHOOTER && this.type !== EnemyType.BOSS) {
      return null;
    }

    // Check fire rate limit
    if (this.fireRate <= 0 || currentTime - this.lastFireTime < this.fireRate) {
      return null;
    }

    this.lastFireTime = currentTime;

    // Create bullet at bottom center of enemy
    const bulletConfig = this.config.bullet.enemy;
    const bulletX = this.x + this.width / 2 - bulletConfig.width / 2;
    const bulletY = this.y + this.height;

    return new Bullet(
      bulletX,
      bulletY,
      BulletOwner.ENEMY,
      bulletConfig.speed, // Positive Y velocity (moving down)
      this.config
    );
  }

  /**
   * Fire multiple bullets (for BOSS enemy)
   * @param currentTime Current game time in milliseconds
   * @returns Array of bullets fired
   */
  fireBoss(currentTime: number): Bullet[] {
    if (this.type !== EnemyType.BOSS) {
      return [];
    }

    // Check fire rate limit
    if (this.fireRate <= 0 || currentTime - this.lastFireTime < this.fireRate) {
      return [];
    }

    this.lastFireTime = currentTime;
    const bullets: Bullet[] = [];
    const bulletConfig = this.config.bullet.enemy;

    // Fire 3 bullets in a spread pattern
    const centerX = this.x + this.width / 2;
    const bulletY = this.y + this.height;
    const spread = 30;

    for (let i = -1; i <= 1; i++) {
      const bullet = new Bullet(
        centerX - bulletConfig.width / 2 + i * spread,
        bulletY,
        BulletOwner.ENEMY,
        bulletConfig.speed,
        this.config
      );
      bullets.push(bullet);
    }

    return bullets;
  }

  /**
   * Apply damage to the enemy
   * @param damage Amount of damage to apply
   */
  takeDamage(damage: number): void {
    this.health -= damage;

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
    }
  }

  /**
   * Handle collision with another object
   * @param other The other collidable object
   */
  onCollision(other: Collidable): void {
    switch (other.collisionType) {
      case CollisionType.PLAYER_BULLET:
        // Damage is handled by collision system
        break;
      case CollisionType.PLAYER:
        // Collision with player - enemy is destroyed
        this.active = false;
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
   * Render the enemy aircraft
   * @param context The 2D rendering context
   */
  render(context: CanvasRenderingContext2D): void {
    if (!this.active) return;

    context.save();

    // Different colors and shapes for different enemy types
    switch (this.type) {
      case EnemyType.BASIC:
        this.renderBasic(context);
        break;
      case EnemyType.SHOOTER:
        this.renderShooter(context);
        break;
      case EnemyType.ZIGZAG:
        this.renderZigzag(context);
        break;
      case EnemyType.BOSS:
        this.renderBoss(context);
        break;
    }

    context.restore();
  }

  /**
   * Render basic enemy - UFO style flying saucer
   */
  private renderBasic(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    
    // UFO dome (top)
    context.fillStyle = '#FF6B6B';
    context.beginPath();
    context.ellipse(cx, cy - this.height * 0.1, this.width * 0.25, this.height * 0.3, 0, Math.PI, 0);
    context.fill();
    
    // UFO body (saucer)
    const gradient = context.createLinearGradient(this.x, cy, this.x + this.width, cy);
    gradient.addColorStop(0, '#CC4444');
    gradient.addColorStop(0.5, '#FF6B6B');
    gradient.addColorStop(1, '#CC4444');
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(cx, cy + this.height * 0.1, this.width * 0.5, this.height * 0.2, 0, 0, Math.PI * 2);
    context.fill();
    
    // Lights on bottom
    context.fillStyle = '#FFFF00';
    for (let i = 0; i < 3; i++) {
      const lightX = cx + (i - 1) * this.width * 0.25;
      context.beginPath();
      context.arc(lightX, cy + this.height * 0.25, 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  /**
   * Render shooter enemy - aggressive fighter craft
   */
  private renderShooter(context: CanvasRenderingContext2D): void {
    // Main body - angular fighter shape
    const gradient = context.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    gradient.addColorStop(0, '#FF8C00');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#FF6600');
    
    context.fillStyle = gradient;
    context.beginPath();
    // Nose
    context.moveTo(this.x + this.width / 2, this.y);
    // Right side
    context.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.3);
    context.lineTo(this.x + this.width, this.y + this.height * 0.5);
    context.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.7);
    context.lineTo(this.x + this.width * 0.6, this.y + this.height);
    // Left side
    context.lineTo(this.x + this.width * 0.4, this.y + this.height);
    context.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.7);
    context.lineTo(this.x, this.y + this.height * 0.5);
    context.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.3);
    context.closePath();
    context.fill();

    // Cockpit window
    context.fillStyle = '#FFE4B5';
    context.beginPath();
    context.ellipse(this.x + this.width / 2, this.y + this.height * 0.35, this.width * 0.12, this.height * 0.15, 0, 0, Math.PI * 2);
    context.fill();

    // Cannon
    context.fillStyle = '#8B0000';
    context.fillRect(this.x + this.width / 2 - 3, this.y + this.height - 6, 6, 8);
    
    // Engine glow
    context.fillStyle = '#FF4500';
    context.beginPath();
    context.arc(this.x + this.width * 0.35, this.y + this.height * 0.85, 3, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(this.x + this.width * 0.65, this.y + this.height * 0.85, 3, 0, Math.PI * 2);
    context.fill();
  }

  /**
   * Render zigzag enemy - alien drone style
   */
  private renderZigzag(context: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    
    // Outer ring with gradient
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, this.width / 2);
    gradient.addColorStop(0, '#E74C3C');
    gradient.addColorStop(0.5, '#9B59B6');
    gradient.addColorStop(1, '#6C3483');
    
    context.fillStyle = gradient;
    context.beginPath();
    // Hexagonal shape
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) - Math.PI / 2;
      const px = cx + Math.cos(angle) * this.width * 0.45;
      const py = cy + Math.sin(angle) * this.height * 0.45;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.fill();
    
    // Inner core - glowing
    const coreGradient = context.createRadialGradient(cx, cy, 0, cx, cy, this.width * 0.2);
    coreGradient.addColorStop(0, '#FFFFFF');
    coreGradient.addColorStop(0.5, '#E74C3C');
    coreGradient.addColorStop(1, '#9B59B6');
    context.fillStyle = coreGradient;
    context.beginPath();
    context.arc(cx, cy, this.width * 0.2, 0, Math.PI * 2);
    context.fill();
    
    // Energy lines
    context.strokeStyle = '#E74C3C';
    context.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2 / 3) + this.elapsedTime * 2;
      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(cx + Math.cos(angle) * this.width * 0.4, cy + Math.sin(angle) * this.height * 0.4);
      context.stroke();
    }
  }

  /**
   * Render boss enemy - large battleship
   */
  private renderBoss(context: CanvasRenderingContext2D): void {
    // Main body gradient
    const bodyGradient = context.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    bodyGradient.addColorStop(0, '#4A0000');
    bodyGradient.addColorStop(0.3, '#8B0000');
    bodyGradient.addColorStop(0.7, '#CC0000');
    bodyGradient.addColorStop(1, '#4A0000');
    
    // Main hull
    context.fillStyle = bodyGradient;
    context.beginPath();
    context.moveTo(this.x + this.width * 0.5, this.y + this.height);
    context.lineTo(this.x + this.width * 0.1, this.y + this.height * 0.7);
    context.lineTo(this.x, this.y + this.height * 0.4);
    context.lineTo(this.x + this.width * 0.15, this.y + this.height * 0.15);
    context.lineTo(this.x + this.width * 0.3, this.y);
    context.lineTo(this.x + this.width * 0.7, this.y);
    context.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.15);
    context.lineTo(this.x + this.width, this.y + this.height * 0.4);
    context.lineTo(this.x + this.width * 0.9, this.y + this.height * 0.7);
    context.closePath();
    context.fill();
    
    // Wing details
    context.fillStyle = '#660000';
    // Left wing
    context.beginPath();
    context.moveTo(this.x, this.y + this.height * 0.4);
    context.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.5);
    context.lineTo(this.x + this.width * 0.15, this.y + this.height * 0.7);
    context.closePath();
    context.fill();
    // Right wing
    context.beginPath();
    context.moveTo(this.x + this.width, this.y + this.height * 0.4);
    context.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.5);
    context.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.7);
    context.closePath();
    context.fill();

    // Bridge/cockpit
    const cockpitGradient = context.createRadialGradient(
      this.x + this.width / 2, this.y + this.height * 0.35, 0,
      this.x + this.width / 2, this.y + this.height * 0.35, this.width * 0.15
    );
    cockpitGradient.addColorStop(0, '#FF6666');
    cockpitGradient.addColorStop(0.7, '#CC0000');
    cockpitGradient.addColorStop(1, '#990000');
    context.fillStyle = cockpitGradient;
    context.beginPath();
    context.ellipse(this.x + this.width / 2, this.y + this.height * 0.35, this.width * 0.15, this.height * 0.12, 0, 0, Math.PI * 2);
    context.fill();

    // Cannons
    context.fillStyle = '#333333';
    const cannonPositions = [0.25, 0.5, 0.75];
    for (const pos of cannonPositions) {
      context.fillRect(this.x + this.width * pos - 4, this.y + this.height - 8, 8, 12);
      // Cannon glow
      context.fillStyle = '#FF4500';
      context.beginPath();
      context.arc(this.x + this.width * pos, this.y + this.height + 2, 3, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#333333';
    }
    
    // Engine exhausts
    context.fillStyle = '#FF6600';
    context.beginPath();
    context.ellipse(this.x + this.width * 0.35, this.y + this.height * 0.85, 6, 4, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(this.x + this.width * 0.65, this.y + this.height * 0.85, 6, 4, 0, 0, Math.PI * 2);
    context.fill();

    // Health bar
    const healthBarWidth = this.width * 0.8;
    const healthBarHeight = 8;
    const healthBarX = this.x + (this.width - healthBarWidth) / 2;
    const healthBarY = this.y - 18;

    // Background
    context.fillStyle = '#333';
    context.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthGradient = context.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth, healthBarY);
    if (healthPercent > 0.3) {
      healthGradient.addColorStop(0, '#00FF00');
      healthGradient.addColorStop(1, '#00CC00');
    } else {
      healthGradient.addColorStop(0, '#FF0000');
      healthGradient.addColorStop(1, '#CC0000');
    }
    context.fillStyle = healthGradient;
    context.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    
    // Border
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1;
    context.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  }

  /**
   * Clean up and mark the enemy for removal
   */
  destroy(): void {
    this.active = false;
  }
}
