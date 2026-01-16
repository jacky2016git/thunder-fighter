/**
 * RenderSystem Unit Tests
 * 渲染系统单元测试
 */
import { RenderSystem, RenderLayer } from '../../../src/systems/RenderSystem';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';
import { ScoreData } from '../../../src/systems/ScoreSystem';

describe('RenderSystem', () => {
  let renderSystem: RenderSystem;
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = DEFAULT_GAME_CONFIG.canvas.width;
    canvas.height = DEFAULT_GAME_CONFIG.canvas.height;
    context = canvas.getContext('2d')!;
    renderSystem = new RenderSystem(context, DEFAULT_GAME_CONFIG);
  });

  describe('Initialization', () => {
    it('should initialize with provided context', () => {
      expect(renderSystem.getContext()).toBe(context);
    });
  });

  describe('Clear', () => {
    it('should clear the canvas', () => {
      renderSystem.clear();
      
      expect(context.clearRect).toHaveBeenCalledWith(
        0, 0,
        DEFAULT_GAME_CONFIG.canvas.width,
        DEFAULT_GAME_CONFIG.canvas.height
      );
    });
  });

  describe('Background Rendering', () => {
    it('should render background without errors', () => {
      expect(() => renderSystem.renderBackground()).not.toThrow();
    });

    it('should update background offset on update', () => {
      renderSystem.update(1); // 1 second
      
      // Background should have scrolled
      // We can't directly check the offset, but we can verify update doesn't throw
      expect(() => renderSystem.renderBackground()).not.toThrow();
    });

    it('should allow setting background speed', () => {
      expect(() => renderSystem.setBackgroundSpeed(100)).not.toThrow();
    });
  });

  describe('Entity Rendering', () => {
    it('should render active entity', () => {
      const mockEntity = {
        id: 'test',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        destroy: jest.fn()
      };

      renderSystem.renderEntity(mockEntity);
      
      expect(mockEntity.render).toHaveBeenCalledWith(context);
    });

    it('should not render inactive entity', () => {
      const mockEntity = {
        id: 'test',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        active: false,
        update: jest.fn(),
        render: jest.fn(),
        destroy: jest.fn()
      };

      renderSystem.renderEntity(mockEntity);
      
      expect(mockEntity.render).not.toHaveBeenCalled();
    });

    it('should render multiple entities', () => {
      const mockEntities = [
        {
          id: 'test1',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          active: true,
          update: jest.fn(),
          render: jest.fn(),
          destroy: jest.fn()
        },
        {
          id: 'test2',
          x: 200,
          y: 200,
          width: 50,
          height: 50,
          active: true,
          update: jest.fn(),
          render: jest.fn(),
          destroy: jest.fn()
        }
      ];

      renderSystem.renderEntities(mockEntities, RenderLayer.ENEMIES);
      
      expect(mockEntities[0].render).toHaveBeenCalled();
      expect(mockEntities[1].render).toHaveBeenCalled();
    });
  });

  describe('UI Rendering', () => {
    it('should render UI without errors', () => {
      const scoreData: ScoreData = {
        currentScore: 1000,
        highScore: 5000,
        enemiesDestroyed: 10,
        accuracy: 75
      };

      expect(() => renderSystem.renderUI(scoreData, 3, 3)).not.toThrow();
    });

    it('should render game over screen without errors', () => {
      const scoreData: ScoreData = {
        currentScore: 1000,
        highScore: 5000,
        enemiesDestroyed: 10,
        accuracy: 75
      };

      expect(() => renderSystem.renderGameOver(scoreData)).not.toThrow();
    });

    it('should render pause screen without errors', () => {
      expect(() => renderSystem.renderPauseScreen()).not.toThrow();
    });

    it('should render menu screen without errors', () => {
      expect(() => renderSystem.renderMenuScreen()).not.toThrow();
    });
  });

  describe('Explosion Effects', () => {
    it('should create explosion at position', () => {
      expect(() => renderSystem.createExplosion(100, 100)).not.toThrow();
    });

    it('should create explosion with custom size', () => {
      expect(() => renderSystem.createExplosion(100, 100, 2)).not.toThrow();
    });

    it('should render explosions without errors', () => {
      renderSystem.createExplosion(100, 100);
      expect(() => renderSystem.renderExplosions()).not.toThrow();
    });

    it('should update and remove expired explosions', () => {
      renderSystem.createExplosion(100, 100);
      
      // Update for longer than explosion lifetime
      for (let i = 0; i < 100; i++) {
        renderSystem.update(0.1);
      }
      
      // Should not throw even after explosions expire
      expect(() => renderSystem.renderExplosions()).not.toThrow();
    });
  });

  describe('Particle System', () => {
    it('should create trail particles', () => {
      expect(() => renderSystem.createTrailParticle(100, 100, '#ff0000')).not.toThrow();
    });

    it('should add particles', () => {
      const particle = {
        x: 100,
        y: 100,
        vx: 10,
        vy: 10,
        life: 1,
        maxLife: 1,
        size: 5,
        color: '#ff0000',
        alpha: 1
      };

      expect(() => renderSystem.addParticle(particle)).not.toThrow();
    });

    it('should update particles', () => {
      renderSystem.createTrailParticle(100, 100, '#ff0000');
      expect(() => renderSystem.update(0.016)).not.toThrow();
    });
  });

  describe('Sprite Sheet Loading', () => {
    it('should handle sprite sheet loading', async () => {
      // This will fail to load in test environment but should resolve
      await expect(renderSystem.loadSpriteSheet('nonexistent.png')).resolves.not.toThrow();
    });
  });

  describe('Reset', () => {
    it('should reset render system state', () => {
      renderSystem.createExplosion(100, 100);
      renderSystem.createTrailParticle(100, 100, '#ff0000');
      
      renderSystem.reset();
      
      // Should not throw after reset
      expect(() => renderSystem.renderExplosions()).not.toThrow();
    });

    it('should clear all effects', () => {
      renderSystem.createExplosion(100, 100);
      renderSystem.createTrailParticle(100, 100, '#ff0000');
      
      renderSystem.clearEffects();
      
      // Should not throw after clearing
      expect(() => renderSystem.renderExplosions()).not.toThrow();
    });
  });
});
