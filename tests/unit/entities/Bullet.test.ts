/**
 * Bullet Unit Tests
 * 子弹单元测试
 */
import { Bullet } from '../../../src/entities/Bullet';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';
import { CollisionType, BulletOwner } from '../../../src/types/enums';
import { Collidable } from '../../../src/interfaces/Collidable';

describe('Bullet', () => {
  const config = DEFAULT_GAME_CONFIG;

  describe('initialization', () => {
    it('should initialize player bullet with correct properties', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      
      expect(bullet.x).toBe(100);
      expect(bullet.y).toBe(200);
      expect(bullet.owner).toBe(BulletOwner.PLAYER);
      expect(bullet.velocityY).toBe(-500);
      expect(bullet.width).toBe(config.bullet.player.width);
      expect(bullet.height).toBe(config.bullet.player.height);
      expect(bullet.damage).toBe(config.bullet.player.damage);
      expect(bullet.collisionType).toBe(CollisionType.PLAYER_BULLET);
    });

    it('should initialize enemy bullet with correct properties', () => {
      const bullet = new Bullet(100, 200, BulletOwner.ENEMY, 300, config);
      
      expect(bullet.owner).toBe(BulletOwner.ENEMY);
      expect(bullet.velocityY).toBe(300);
      expect(bullet.width).toBe(config.bullet.enemy.width);
      expect(bullet.height).toBe(config.bullet.enemy.height);
      expect(bullet.damage).toBe(config.bullet.enemy.damage);
      expect(bullet.collisionType).toBe(CollisionType.ENEMY_BULLET);
    });

    it('should initialize as active', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      expect(bullet.active).toBe(true);
    });

    it('should have unique id', () => {
      const b1 = new Bullet(0, 0, BulletOwner.PLAYER, -500, config);
      const b2 = new Bullet(0, 0, BulletOwner.PLAYER, -500, config);
      expect(b1.id).not.toBe(b2.id);
    });

    it('should initialize with zero X velocity', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      expect(bullet.velocityX).toBe(0);
    });
  });

  describe('movement', () => {
    it('should move based on velocity', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      
      bullet.move(0.1); // 100ms
      
      expect(bullet.x).toBe(100); // No X movement
      expect(bullet.y).toBe(150); // 200 + (-500 * 0.1)
    });

    it('should update collision box after move', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      
      bullet.update(0.1);
      
      expect(bullet.collisionBox.x).toBe(bullet.x);
      expect(bullet.collisionBox.y).toBe(bullet.y);
    });

    it('should support horizontal velocity', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      bullet.setVelocity(100, -500);
      
      bullet.move(0.1);
      
      expect(bullet.x).toBe(110); // 100 + (100 * 0.1)
      expect(bullet.y).toBe(150);
    });
  });

  describe('boundary checking', () => {
    it('should deactivate when above screen', () => {
      const bullet = new Bullet(100, 10, BulletOwner.PLAYER, -500, config);
      
      // Move bullet above screen
      bullet.update(0.1); // y = 10 + (-500 * 0.1) = -40
      
      expect(bullet.active).toBe(false);
    });

    it('should deactivate when below screen', () => {
      const bullet = new Bullet(100, config.canvas.height - 10, BulletOwner.ENEMY, 300, config);
      
      // Move bullet below screen
      bullet.update(0.1); // y = 790 + (300 * 0.1) = 820 > 800
      
      expect(bullet.active).toBe(false);
    });

    it('should deactivate when left of screen', () => {
      const bullet = new Bullet(-5, 200, BulletOwner.PLAYER, 0, config);
      bullet.setVelocity(-100, 0);
      
      bullet.update(0.1); // x = -5 + (-100 * 0.1) = -15, completely off screen
      
      expect(bullet.active).toBe(false);
    });

    it('should deactivate when right of screen', () => {
      const bullet = new Bullet(config.canvas.width - 5, 200, BulletOwner.PLAYER, 0, config);
      bullet.setVelocity(100, 0);
      
      bullet.update(0.1); // x = 475 + (100 * 0.1) = 485 > 480
      
      expect(bullet.active).toBe(false);
    });

    it('should remain active when within bounds', () => {
      const bullet = new Bullet(200, 400, BulletOwner.PLAYER, -100, config);
      
      bullet.update(0.1);
      
      expect(bullet.active).toBe(true);
    });
  });

  describe('collision handling', () => {
    it('should deactivate player bullet on collision with enemy', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      const enemy: Collidable = {
        id: 'enemy',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      bullet.onCollision(enemy);
      
      expect(bullet.active).toBe(false);
    });

    it('should deactivate enemy bullet on collision with player', () => {
      const bullet = new Bullet(100, 200, BulletOwner.ENEMY, 300, config);
      const player: Collidable = {
        id: 'player',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.PLAYER,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      bullet.onCollision(player);
      
      expect(bullet.active).toBe(false);
    });

    it('should not deactivate player bullet on collision with player', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      const player: Collidable = {
        id: 'player',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.PLAYER,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      bullet.onCollision(player);
      
      expect(bullet.active).toBe(true);
    });

    it('should not deactivate enemy bullet on collision with enemy', () => {
      const bullet = new Bullet(100, 200, BulletOwner.ENEMY, 300, config);
      const enemy: Collidable = {
        id: 'enemy',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      bullet.onCollision(enemy);
      
      expect(bullet.active).toBe(true);
    });
  });

  describe('collision detection', () => {
    it('should detect collision with overlapping object', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      const other: Collidable = {
        id: 'test',
        x: 100, y: 200, width: 20, height: 20, active: true,
        collisionBox: { x: 100, y: 200, width: 20, height: 20 },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      expect(bullet.checkCollision(other)).toBe(true);
    });

    it('should not detect collision with non-overlapping object', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      const other: Collidable = {
        id: 'test',
        x: 300, y: 400, width: 20, height: 20, active: true,
        collisionBox: { x: 300, y: 400, width: 20, height: 20 },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      expect(bullet.checkCollision(other)).toBe(false);
    });
  });

  describe('bullet speed difference', () => {
    it('should have player bullets faster than enemy bullets', () => {
      expect(config.bullet.player.speed).toBeGreaterThan(config.bullet.enemy.speed);
    });
  });

  describe('render', () => {
    it('should not render when inactive', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      bullet.active = false;
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      bullet.render(mockContext);
      
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should render player bullet', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        roundRect: jest.fn(),
        fill: jest.fn(),
        shadowColor: '',
        shadowBlur: 0
      } as unknown as CanvasRenderingContext2D;
      
      bullet.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render enemy bullet', () => {
      const bullet = new Bullet(100, 200, BulletOwner.ENEMY, 300, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        ellipse: jest.fn(),
        fill: jest.fn(),
        shadowColor: '',
        shadowBlur: 0
      } as unknown as CanvasRenderingContext2D;
      
      bullet.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should mark bullet as inactive', () => {
      const bullet = new Bullet(100, 200, BulletOwner.PLAYER, -500, config);
      
      bullet.destroy();
      
      expect(bullet.active).toBe(false);
    });
  });
});
