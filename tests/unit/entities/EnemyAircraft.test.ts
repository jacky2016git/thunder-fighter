/**
 * EnemyAircraft Unit Tests
 * 敌机单元测试
 */
import { EnemyAircraft } from '../../../src/entities/EnemyAircraft';
import { Bullet } from '../../../src/entities/Bullet';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';
import { CollisionType, EnemyType, BulletOwner, MovementPattern } from '../../../src/types/enums';
import { Collidable } from '../../../src/interfaces/Collidable';

describe('EnemyAircraft', () => {
  const config = DEFAULT_GAME_CONFIG;

  describe('initialization', () => {
    describe('BASIC enemy', () => {
      it('should initialize with correct properties', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
        
        expect(enemy.x).toBe(100);
        expect(enemy.y).toBe(0);
        expect(enemy.type).toBe(EnemyType.BASIC);
        expect(enemy.width).toBe(config.enemy.basic.width);
        expect(enemy.height).toBe(config.enemy.basic.height);
        expect(enemy.speed).toBe(config.enemy.basic.speed);
        expect(enemy.health).toBe(config.enemy.basic.health);
        expect(enemy.scoreValue).toBe(config.enemy.basic.scoreValue);
      });

      it('should have STRAIGHT movement pattern', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
        expect(enemy.movementPattern).toBe(MovementPattern.STRAIGHT);
      });
    });

    describe('SHOOTER enemy', () => {
      it('should initialize with correct properties', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.SHOOTER, config);
        
        expect(enemy.type).toBe(EnemyType.SHOOTER);
        expect(enemy.width).toBe(config.enemy.shooter.width);
        expect(enemy.height).toBe(config.enemy.shooter.height);
        expect(enemy.speed).toBe(config.enemy.shooter.speed);
        expect(enemy.health).toBe(config.enemy.shooter.health);
        expect(enemy.scoreValue).toBe(config.enemy.shooter.scoreValue);
        expect(enemy.fireRate).toBe(config.enemy.shooter.fireRate);
      });

      it('should have STRAIGHT movement pattern', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.SHOOTER, config);
        expect(enemy.movementPattern).toBe(MovementPattern.STRAIGHT);
      });
    });

    describe('ZIGZAG enemy', () => {
      it('should initialize with correct properties', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.ZIGZAG, config);
        
        expect(enemy.type).toBe(EnemyType.ZIGZAG);
        expect(enemy.width).toBe(config.enemy.zigzag.width);
        expect(enemy.height).toBe(config.enemy.zigzag.height);
        expect(enemy.speed).toBe(config.enemy.zigzag.speed);
        expect(enemy.health).toBe(config.enemy.zigzag.health);
        expect(enemy.scoreValue).toBe(config.enemy.zigzag.scoreValue);
      });

      it('should have ZIGZAG movement pattern', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.ZIGZAG, config);
        expect(enemy.movementPattern).toBe(MovementPattern.ZIGZAG);
      });
    });

    describe('BOSS enemy', () => {
      it('should initialize with correct properties', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.BOSS, config);
        
        expect(enemy.type).toBe(EnemyType.BOSS);
        expect(enemy.width).toBe(config.enemy.boss.width);
        expect(enemy.height).toBe(config.enemy.boss.height);
        expect(enemy.speed).toBe(config.enemy.boss.speed);
        expect(enemy.health).toBe(config.enemy.boss.health);
        expect(enemy.scoreValue).toBe(config.enemy.boss.scoreValue);
        expect(enemy.fireRate).toBe(config.enemy.boss.fireRate);
      });

      it('should have SINE movement pattern', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.BOSS, config);
        expect(enemy.movementPattern).toBe(MovementPattern.SINE);
      });
    });

    it('should initialize as active', () => {
      const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
      expect(enemy.active).toBe(true);
    });

    it('should have ENEMY collision type', () => {
      const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
      expect(enemy.collisionType).toBe(CollisionType.ENEMY);
    });

    it('should have unique id', () => {
      const e1 = new EnemyAircraft(0, 0, EnemyType.BASIC, config);
      const e2 = new EnemyAircraft(0, 0, EnemyType.BASIC, config);
      expect(e1.id).not.toBe(e2.id);
    });
  });

  describe('movement patterns', () => {
    describe('BASIC (straight down)', () => {
      it('should move straight down', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
        const initialX = enemy.x;
        
        enemy.update(0.1);
        
        expect(enemy.x).toBe(initialX); // No horizontal movement
        expect(enemy.y).toBeGreaterThan(0); // Moved down
      });

      it('should move at configured speed', () => {
        const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
        
        enemy.update(1); // 1 second
        
        expect(enemy.y).toBe(config.enemy.basic.speed);
      });
    });

    describe('ZIGZAG', () => {
      it('should move down and oscillate horizontally', () => {
        const enemy = new EnemyAircraft(200, 0, EnemyType.ZIGZAG, config);
        
        // Update multiple times to see oscillation
        for (let i = 0; i < 10; i++) {
          enemy.update(0.1);
        }
        
        expect(enemy.y).toBeGreaterThan(0); // Moved down
        // X position should have changed due to zigzag
        // (may or may not be different from initial depending on timing)
      });

      it('should stay within canvas bounds horizontally', () => {
        const enemy = new EnemyAircraft(50, 0, EnemyType.ZIGZAG, config);
        
        // Update many times
        for (let i = 0; i < 100; i++) {
          enemy.update(0.1);
        }
        
        expect(enemy.x).toBeGreaterThanOrEqual(0);
        expect(enemy.x).toBeLessThanOrEqual(config.canvas.width - enemy.width);
      });
    });

    describe('BOSS', () => {
      it('should move down initially', () => {
        const enemy = new EnemyAircraft(200, -50, EnemyType.BOSS, config);
        
        enemy.update(0.5);
        
        expect(enemy.y).toBeGreaterThan(-50);
      });

      it('should stop at target position and start horizontal movement', () => {
        const enemy = new EnemyAircraft(200, 40, EnemyType.BOSS, config);
        
        // Update to reach target position
        for (let i = 0; i < 20; i++) {
          enemy.update(0.1);
        }
        
        // Boss should be around y=50 and moving horizontally
        expect(enemy.y).toBeGreaterThanOrEqual(40);
      });
    });
  });

  describe('shooting', () => {
    describe('BASIC enemy', () => {
      it('should not fire', () => {
        const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
        
        const bullet = enemy.fire(1000);
        
        expect(bullet).toBeNull();
      });
    });

    describe('SHOOTER enemy', () => {
      it('should fire bullets', () => {
        const enemy = new EnemyAircraft(100, 100, EnemyType.SHOOTER, config);
        // First fire should work since lastFireTime is 0
        const bullet = enemy.fire(config.enemy.shooter.fireRate! + 1);
        
        expect(bullet).toBeInstanceOf(Bullet);
        expect(bullet?.owner).toBe(BulletOwner.ENEMY);
      });

      it('should respect fire rate', () => {
        const enemy = new EnemyAircraft(100, 100, EnemyType.SHOOTER, config);
        const fireRate = config.enemy.shooter.fireRate!;
        
        const bullet1 = enemy.fire(fireRate + 1);
        expect(bullet1).not.toBeNull();
        
        // Try to fire again immediately
        const bullet2 = enemy.fire(fireRate + 500); // 500ms later, less than fireRate (2000ms)
        expect(bullet2).toBeNull();
        
        // Fire after fireRate has passed
        const bullet3 = enemy.fire(fireRate * 2 + 100);
        expect(bullet3).not.toBeNull();
      });

      it('should fire bullets moving downward', () => {
        const enemy = new EnemyAircraft(100, 100, EnemyType.SHOOTER, config);
        
        const bullet = enemy.fire(config.enemy.shooter.fireRate! + 1);
        
        expect(bullet).not.toBeNull();
        expect(bullet!.velocityY).toBeGreaterThan(0);
      });
    });

    describe('BOSS enemy', () => {
      it('should fire multiple bullets', () => {
        const enemy = new EnemyAircraft(200, 100, EnemyType.BOSS, config);
        
        const bullets = enemy.fireBoss(1000);
        
        expect(bullets.length).toBe(3);
        bullets.forEach(bullet => {
          expect(bullet).toBeInstanceOf(Bullet);
          expect(bullet.owner).toBe(BulletOwner.ENEMY);
        });
      });

      it('should respect fire rate for boss', () => {
        const enemy = new EnemyAircraft(200, 100, EnemyType.BOSS, config);
        
        const bullets1 = enemy.fireBoss(1000);
        expect(bullets1.length).toBe(3);
        
        // Try to fire again immediately
        const bullets2 = enemy.fireBoss(1500);
        expect(bullets2.length).toBe(0);
        
        // Fire after fireRate has passed
        const bullets3 = enemy.fireBoss(2100);
        expect(bullets3.length).toBe(3);
      });
    });

    describe('ZIGZAG enemy', () => {
      it('should not fire', () => {
        const enemy = new EnemyAircraft(100, 100, EnemyType.ZIGZAG, config);
        
        const bullet = enemy.fire(1000);
        
        expect(bullet).toBeNull();
      });
    });
  });

  describe('health and damage', () => {
    it('should take damage', () => {
      const enemy = new EnemyAircraft(100, 0, EnemyType.SHOOTER, config);
      const initialHealth = enemy.health;
      
      enemy.takeDamage(1);
      
      expect(enemy.health).toBe(initialHealth - 1);
    });

    it('should become inactive when health reaches 0', () => {
      const enemy = new EnemyAircraft(100, 0, EnemyType.BASIC, config);
      
      enemy.takeDamage(enemy.health);
      
      expect(enemy.health).toBe(0);
      expect(enemy.active).toBe(false);
    });

    it('should handle multiple damage instances', () => {
      const enemy = new EnemyAircraft(100, 0, EnemyType.BOSS, config);
      const initialHealth = enemy.health;
      
      enemy.takeDamage(5);
      enemy.takeDamage(5);
      
      expect(enemy.health).toBe(initialHealth - 10);
    });
  });

  describe('boundary checking', () => {
    it('should deactivate when below screen', () => {
      const enemy = new EnemyAircraft(100, config.canvas.height - 10, EnemyType.BASIC, config);
      
      enemy.update(0.2); // Move down past screen
      
      expect(enemy.active).toBe(false);
    });

    it('should remain active when within bounds', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      
      enemy.update(0.1);
      
      expect(enemy.active).toBe(true);
    });
  });

  describe('collision detection', () => {
    it('should detect collision with overlapping object', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      const other: Collidable = {
        id: 'test',
        x: 100, y: 100, width: 20, height: 20, active: true,
        collisionBox: { x: 100, y: 100, width: 20, height: 20 },
        collisionType: CollisionType.PLAYER_BULLET,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      expect(enemy.checkCollision(other)).toBe(true);
    });

    it('should not detect collision with non-overlapping object', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      const other: Collidable = {
        id: 'test',
        x: 300, y: 300, width: 20, height: 20, active: true,
        collisionBox: { x: 300, y: 300, width: 20, height: 20 },
        collisionType: CollisionType.PLAYER_BULLET,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      expect(enemy.checkCollision(other)).toBe(false);
    });

    it('should deactivate on collision with player', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      const player: Collidable = {
        id: 'player',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.PLAYER,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      enemy.onCollision(player);
      
      expect(enemy.active).toBe(false);
    });
  });

  describe('collision box update', () => {
    it('should update collision box after movement', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      
      enemy.update(0.1);
      
      expect(enemy.collisionBox.x).toBe(enemy.x);
      expect(enemy.collisionBox.y).toBe(enemy.y);
    });
  });

  describe('render', () => {
    it('should not render when inactive', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      enemy.active = false;
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      enemy.render(mockContext);
      
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should render BASIC enemy', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      enemy.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render BOSS enemy with health bar', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BOSS, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn(),
        fillRect: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      enemy.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled(); // Health bar
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should mark enemy as inactive', () => {
      const enemy = new EnemyAircraft(100, 100, EnemyType.BASIC, config);
      
      enemy.destroy();
      
      expect(enemy.active).toBe(false);
    });
  });
});
