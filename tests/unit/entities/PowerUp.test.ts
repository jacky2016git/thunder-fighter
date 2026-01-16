/**
 * PowerUp Unit Tests
 * 道具单元测试
 */
import { PowerUp } from '../../../src/entities/PowerUp';
import { PlayerAircraft } from '../../../src/entities/PlayerAircraft';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';
import { CollisionType, PowerUpType } from '../../../src/types/enums';
import { Collidable } from '../../../src/interfaces/Collidable';

describe('PowerUp', () => {
  const config = DEFAULT_GAME_CONFIG;

  describe('initialization', () => {
    it('should initialize with correct position', () => {
      const powerUp = new PowerUp(100, 200, PowerUpType.WEAPON_UPGRADE, config);
      
      expect(powerUp.x).toBe(100);
      expect(powerUp.y).toBe(200);
    });

    it('should initialize with correct type', () => {
      const weaponUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      const healthUp = new PowerUp(0, 0, PowerUpType.HEALTH, config);
      const shieldUp = new PowerUp(0, 0, PowerUpType.SHIELD, config);
      
      expect(weaponUp.type).toBe(PowerUpType.WEAPON_UPGRADE);
      expect(healthUp.type).toBe(PowerUpType.HEALTH);
      expect(shieldUp.type).toBe(PowerUpType.SHIELD);
    });

    it('should initialize with correct size', () => {
      const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      
      expect(powerUp.width).toBe(PowerUp.POWERUP_SIZE);
      expect(powerUp.height).toBe(PowerUp.POWERUP_SIZE);
    });

    it('should initialize with configured fall speed', () => {
      const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      
      expect(powerUp.speed).toBe(config.powerUp.fallSpeed);
      expect(powerUp.velocityY).toBe(config.powerUp.fallSpeed);
    });

    it('should initialize as active', () => {
      const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      expect(powerUp.active).toBe(true);
    });

    it('should have POWER_UP collision type', () => {
      const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      expect(powerUp.collisionType).toBe(CollisionType.POWER_UP);
    });

    it('should have unique id', () => {
      const p1 = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      const p2 = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      expect(p1.id).not.toBe(p2.id);
    });

    it('should initialize with zero X velocity', () => {
      const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
      expect(powerUp.velocityX).toBe(0);
    });
  });

  describe('movement', () => {
    it('should fall down at configured speed', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.update(1); // 1 second
      
      expect(powerUp.y).toBe(100 + config.powerUp.fallSpeed);
    });

    it('should not move horizontally', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.update(1);
      
      expect(powerUp.x).toBe(100);
    });

    it('should update collision box after movement', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.update(0.1);
      
      expect(powerUp.collisionBox.x).toBe(powerUp.x);
      expect(powerUp.collisionBox.y).toBe(powerUp.y);
    });
  });

  describe('boundary checking', () => {
    it('should deactivate when below screen', () => {
      const powerUp = new PowerUp(100, config.canvas.height - 5, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.update(0.1); // Move down past screen
      
      expect(powerUp.active).toBe(false);
    });

    it('should remain active when within bounds', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.update(0.1);
      
      expect(powerUp.active).toBe(true);
    });
  });

  describe('power-up effects', () => {
    let player: PlayerAircraft;

    beforeEach(() => {
      player = new PlayerAircraft(200, 600, config);
    });

    describe('WEAPON_UPGRADE', () => {
      it('should upgrade player weapon level', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
        const initialLevel = player.weaponLevel;
        
        powerUp.apply(player);
        
        expect(player.weaponLevel).toBe(initialLevel + 1);
      });

      it('should not exceed max weapon level', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
        player.weaponLevel = 3;
        
        powerUp.apply(player);
        
        expect(player.weaponLevel).toBe(3);
      });

      it('should deactivate after applying', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.WEAPON_UPGRADE, config);
        
        powerUp.apply(player);
        
        expect(powerUp.active).toBe(false);
      });
    });

    describe('HEALTH', () => {
      it('should heal player', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.HEALTH, config);
        player.health = 1;
        
        powerUp.apply(player);
        
        expect(player.health).toBe(2);
      });

      it('should not exceed max health', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.HEALTH, config);
        player.health = player.maxHealth;
        
        powerUp.apply(player);
        
        expect(player.health).toBe(player.maxHealth);
      });

      it('should deactivate after applying', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.HEALTH, config);
        
        powerUp.apply(player);
        
        expect(powerUp.active).toBe(false);
      });
    });

    describe('SHIELD', () => {
      it('should activate player invincibility', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.SHIELD, config);
        
        powerUp.apply(player);
        
        expect(player.invincible).toBe(true);
      });

      it('should set invincibility duration', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.SHIELD, config);
        
        powerUp.apply(player);
        
        expect(player.invincibleTime).toBe(config.player.invincibleDuration);
      });

      it('should deactivate after applying', () => {
        const powerUp = new PowerUp(0, 0, PowerUpType.SHIELD, config);
        
        powerUp.apply(player);
        
        expect(powerUp.active).toBe(false);
      });
    });
  });

  describe('collision handling', () => {
    it('should deactivate on collision with player', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      const player: Collidable = {
        id: 'player',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.PLAYER,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      powerUp.onCollision(player);
      
      expect(powerUp.active).toBe(false);
    });

    it('should not deactivate on collision with non-player', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      const enemy: Collidable = {
        id: 'enemy',
        x: 0, y: 0, width: 10, height: 10, active: true,
        collisionBox: { x: 0, y: 0, width: 10, height: 10 },
        collisionType: CollisionType.ENEMY,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      powerUp.onCollision(enemy);
      
      expect(powerUp.active).toBe(true);
    });
  });

  describe('collision detection', () => {
    it('should detect collision with overlapping object', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      const other: Collidable = {
        id: 'test',
        x: 100, y: 100, width: 20, height: 20, active: true,
        collisionBox: { x: 100, y: 100, width: 20, height: 20 },
        collisionType: CollisionType.PLAYER,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      expect(powerUp.checkCollision(other)).toBe(true);
    });

    it('should not detect collision with non-overlapping object', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      const other: Collidable = {
        id: 'test',
        x: 300, y: 300, width: 20, height: 20, active: true,
        collisionBox: { x: 300, y: 300, width: 20, height: 20 },
        collisionType: CollisionType.PLAYER,
        update: jest.fn(), render: jest.fn(), destroy: jest.fn(),
        onCollision: jest.fn(), checkCollision: jest.fn()
      };
      
      expect(powerUp.checkCollision(other)).toBe(false);
    });
  });

  describe('getRandomType', () => {
    it('should return a valid PowerUpType', () => {
      const validTypes = [PowerUpType.WEAPON_UPGRADE, PowerUpType.HEALTH, PowerUpType.SHIELD];
      
      // Run multiple times to test randomness
      for (let i = 0; i < 20; i++) {
        const type = PowerUp.getRandomType();
        expect(validTypes).toContain(type);
      }
    });
  });

  describe('render', () => {
    it('should not render when inactive', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      powerUp.active = false;
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn()
      } as unknown as CanvasRenderingContext2D;
      
      powerUp.render(mockContext);
      
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should render WEAPON_UPGRADE power-up', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        shadowColor: '',
        shadowBlur: 0
      } as unknown as CanvasRenderingContext2D;
      
      powerUp.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render HEALTH power-up', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.HEALTH, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        fillStyle: '',
        fillRect: jest.fn(),
        shadowColor: '',
        shadowBlur: 0
      } as unknown as CanvasRenderingContext2D;
      
      powerUp.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render SHIELD power-up', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.SHIELD, config);
      
      const mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        fillStyle: '',
        beginPath: jest.fn(),
        arc: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        shadowColor: '',
        shadowBlur: 0
      } as unknown as CanvasRenderingContext2D;
      
      powerUp.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should mark power-up as inactive', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.destroy();
      
      expect(powerUp.active).toBe(false);
    });
  });

  describe('setVelocity', () => {
    it('should set velocity', () => {
      const powerUp = new PowerUp(100, 100, PowerUpType.WEAPON_UPGRADE, config);
      
      powerUp.setVelocity(50, 150);
      
      expect(powerUp.velocityX).toBe(50);
      expect(powerUp.velocityY).toBe(150);
    });
  });
});
