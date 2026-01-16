/**
 * PlayerAircraft Unit Tests
 * 玩家飞机单元测试
 */
import { PlayerAircraft } from '../../../src/entities/PlayerAircraft';
import { Bullet } from '../../../src/entities/Bullet';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';
import { CollisionType, BulletOwner } from '../../../src/types/enums';
import { Collidable } from '../../../src/interfaces/Collidable';

describe('PlayerAircraft', () => {
  let player: PlayerAircraft;
  const config = DEFAULT_GAME_CONFIG;

  beforeEach(() => {
    // Create player at center bottom of canvas
    const startX = config.canvas.width / 2 - config.player.width / 2;
    const startY = config.canvas.height - config.player.height - 50;
    player = new PlayerAircraft(startX, startY, config);
  });

  describe('initialization', () => {
    it('should initialize with correct position', () => {
      const x = 100;
      const y = 200;
      const p = new PlayerAircraft(x, y, config);
      
      expect(p.x).toBe(x);
      expect(p.y).toBe(y);
    });

    it('should initialize with default config values', () => {
      expect(player.width).toBe(config.player.width);
      expect(player.height).toBe(config.player.height);
      expect(player.speed).toBe(config.player.speed);
      expect(player.maxHealth).toBe(config.player.maxHealth);
      expect(player.health).toBe(config.player.maxHealth);
      expect(player.fireRate).toBe(config.player.fireRate);
    });

    it('should initialize with weapon level 1', () => {
      expect(player.weaponLevel).toBe(1);
    });

    it('should initialize as active', () => {
      expect(player.active).toBe(true);
    });

    it('should initialize with zero velocity', () => {
      expect(player.velocityX).toBe(0);
      expect(player.velocityY).toBe(0);
    });

    it('should initialize not invincible', () => {
      expect(player.invincible).toBe(false);
      expect(player.invincibleTime).toBe(0);
    });

    it('should have correct collision type', () => {
      expect(player.collisionType).toBe(CollisionType.PLAYER);
    });

    it('should have unique id', () => {
      const p2 = new PlayerAircraft(0, 0, config);
      expect(player.id).not.toBe(p2.id);
    });
  });

  describe('movement', () => {
    it('should move based on velocity', () => {
      const initialX = player.x;
      const initialY = player.y;
      
      player.setVelocity(100, 50);
      player.move(0.1); // 100ms
      
      expect(player.x).toBe(initialX + 10); // 100 * 0.1
      expect(player.y).toBe(initialY + 5);  // 50 * 0.1
    });

    it('should constrain to left boundary', () => {
      player.x = 10;
      player.setVelocity(-200, 0);
      player.move(0.1);
      
      expect(player.x).toBe(0);
    });

    it('should constrain to right boundary', () => {
      player.x = config.canvas.width - player.width - 10;
      player.setVelocity(200, 0);
      player.move(0.1);
      
      expect(player.x).toBe(config.canvas.width - player.width);
    });

    it('should constrain to top boundary', () => {
      player.y = 10;
      player.setVelocity(0, -200);
      player.move(0.1);
      
      expect(player.y).toBe(0);
    });

    it('should constrain to bottom boundary', () => {
      player.y = config.canvas.height - player.height - 10;
      player.setVelocity(0, 200);
      player.move(0.1);
      
      expect(player.y).toBe(config.canvas.height - player.height);
    });

    it('should update collision box after move', () => {
      player.setVelocity(100, 100);
      player.update(0.1);
      
      expect(player.collisionBox.x).toBe(player.x);
      expect(player.collisionBox.y).toBe(player.y);
    });
  });

  describe('shooting', () => {
    it('should fire single bullet at weapon level 1', () => {
      player.weaponLevel = 1;
      const bullets = player.fire(1000);
      
      expect(bullets.length).toBe(1);
      expect(bullets[0]).toBeInstanceOf(Bullet);
    });

    it('should fire two bullets at weapon level 2', () => {
      player.weaponLevel = 2;
      const bullets = player.fire(1000);
      
      expect(bullets.length).toBe(2);
    });

    it('should fire three bullets at weapon level 3', () => {
      player.weaponLevel = 3;
      const bullets = player.fire(1000);
      
      expect(bullets.length).toBe(3);
    });

    it('should respect fire rate limit', () => {
      const bullets1 = player.fire(1000);
      expect(bullets1.length).toBe(1);
      
      // Try to fire again immediately
      const bullets2 = player.fire(1050); // 50ms later, less than fireRate (200ms)
      expect(bullets2.length).toBe(0);
      
      // Fire after fireRate has passed
      const bullets3 = player.fire(1250); // 250ms later
      expect(bullets3.length).toBe(1);
    });

    it('should create player bullets', () => {
      const bullets = player.fire(1000);
      
      expect(bullets[0].owner).toBe(BulletOwner.PLAYER);
      expect(bullets[0].collisionType).toBe(CollisionType.PLAYER_BULLET);
    });

    it('should fire bullets moving upward', () => {
      const bullets = player.fire(1000);
      
      expect(bullets[0].velocityY).toBeLessThan(0);
    });
  });

  describe('weapon upgrade', () => {
    it('should upgrade weapon level', () => {
      expect(player.weaponLevel).toBe(1);
      
      player.upgradeWeapon();
      expect(player.weaponLevel).toBe(2);
      
      player.upgradeWeapon();
      expect(player.weaponLevel).toBe(3);
    });

    it('should not exceed max weapon level 3', () => {
      player.weaponLevel = 3;
      player.upgradeWeapon();
      
      expect(player.weaponLevel).toBe(3);
    });
  });

  describe('health management', () => {
    it('should take damage', () => {
      const initialHealth = player.health;
      player.takeDamage(1);
      
      expect(player.health).toBe(initialHealth - 1);
    });

    it('should become invincible after taking damage', () => {
      player.takeDamage(1);
      
      expect(player.invincible).toBe(true);
      expect(player.invincibleTime).toBe(config.player.invincibleDuration);
    });

    it('should not take damage while invincible', () => {
      player.invincible = true;
      const initialHealth = player.health;
      
      player.takeDamage(1);
      
      expect(player.health).toBe(initialHealth);
    });

    it('should become inactive when health reaches 0', () => {
      player.health = 1;
      player.takeDamage(1);
      
      expect(player.health).toBe(0);
      expect(player.active).toBe(false);
    });

    it('should heal', () => {
      player.health = 1;
      player.heal(1);
      
      expect(player.health).toBe(2);
    });

    it('should not heal beyond max health', () => {
      player.health = player.maxHealth;
      player.heal(1);
      
      expect(player.health).toBe(player.maxHealth);
    });
  });

  describe('invincibility', () => {
    it('should activate shield', () => {
      player.activateShield(3000);
      
      expect(player.invincible).toBe(true);
      expect(player.invincibleTime).toBe(3000);
    });

    it('should expire invincibility over time', () => {
      player.invincible = true;
      player.invincibleTime = 1000;
      
      // Update for 0.5 seconds (500ms)
      player.update(0.5);
      expect(player.invincible).toBe(true);
      expect(player.invincibleTime).toBe(500);
      
      // Update for another 0.6 seconds (600ms)
      player.update(0.6);
      expect(player.invincible).toBe(false);
      expect(player.invincibleTime).toBe(0);
    });
  });

  describe('collision detection', () => {
    it('should detect collision with overlapping object', () => {
      const other: Collidable = {
        id: 'test',
        x: player.x + 10,
        y: player.y + 10,
        width: 20,
        height: 20,
        active: true,
        collisionBox: {
          x: player.x + 10,
          y: player.y + 10,
          width: 20,
          height: 20
        },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(),
        render: jest.fn(),
        destroy: jest.fn(),
        onCollision: jest.fn(),
        checkCollision: jest.fn()
      };
      
      expect(player.checkCollision(other)).toBe(true);
    });

    it('should not detect collision with non-overlapping object', () => {
      const other: Collidable = {
        id: 'test',
        x: player.x + player.width + 100,
        y: player.y,
        width: 20,
        height: 20,
        active: true,
        collisionBox: {
          x: player.x + player.width + 100,
          y: player.y,
          width: 20,
          height: 20
        },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(),
        render: jest.fn(),
        destroy: jest.fn(),
        onCollision: jest.fn(),
        checkCollision: jest.fn()
      };
      
      expect(player.checkCollision(other)).toBe(false);
    });

    it('should take damage on collision with enemy', () => {
      const initialHealth = player.health;
      const enemy: Collidable = {
        id: 'enemy',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      player.onCollision(enemy);
      
      expect(player.health).toBe(initialHealth - 1);
    });

    it('should take damage on collision with enemy bullet', () => {
      const initialHealth = player.health;
      const bullet: Collidable = {
        id: 'bullet',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.ENEMY_BULLET,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      player.onCollision(bullet);
      
      expect(player.health).toBe(initialHealth - 1);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Modify player state
      player.health = 1;
      player.weaponLevel = 3;
      player.invincible = true;
      player.invincibleTime = 1000;
      player.velocityX = 100;
      player.velocityY = 100;
      player.active = false;
      
      // Reset
      player.reset(100, 200);
      
      expect(player.x).toBe(100);
      expect(player.y).toBe(200);
      expect(player.health).toBe(player.maxHealth);
      expect(player.weaponLevel).toBe(1);
      expect(player.invincible).toBe(false);
      expect(player.invincibleTime).toBe(0);
      expect(player.velocityX).toBe(0);
      expect(player.velocityY).toBe(0);
      expect(player.active).toBe(true);
    });
  });

  describe('render', () => {
    it('should not render when inactive', () => {
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      player.active = false;
      player.render(mockContext);
      
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should render when active', () => {
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      player.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should mark player as inactive', () => {
      player.destroy();
      
      expect(player.active).toBe(false);
    });
  });
});
