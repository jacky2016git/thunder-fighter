/**
 * GameEngine Unit Tests
 * 游戏引擎单元测试
 */
import { GameEngine } from '../../../src/core/GameEngine';
import { StateManager } from '../../../src/core/StateManager';
import { InputManager } from '../../../src/core/InputManager';
import { EntityManager } from '../../../src/core/EntityManager';
import { DEFAULT_GAME_CONFIG } from '../../../src/types/GameConfig';
import { GameStateType } from '../../../src/types/enums';
import { GameState } from '../../../src/core/GameState';
import { InputState } from '../../../src/core/InputState';

// Mock GameState for testing
class MockGameState implements GameState {
  readonly type: GameStateType;
  enterCalled = false;
  exitCalled = false;
  updateCount = 0;
  renderCount = 0;
  
  constructor(type: GameStateType) {
    this.type = type;
  }
  
  enter(): void { this.enterCalled = true; }
  exit(): void { this.exitCalled = true; }
  update(_deltaTime: number): void { this.updateCount++; }
  render(_context: CanvasRenderingContext2D): void { this.renderCount++; }
  handleInput(_input: InputState): void {}
}

describe('GameEngine', () => {
  let canvas: HTMLCanvasElement;
  let gameEngine: GameEngine;
  
  beforeEach(() => {
    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
    
    gameEngine = new GameEngine('gameCanvas');
  });
  
  afterEach(() => {
    gameEngine.stop();
    document.body.removeChild(canvas);
  });
  
  describe('constructor', () => {
    it('should create a GameEngine with default config', () => {
      expect(gameEngine).toBeDefined();
      expect(gameEngine.getConfig()).toEqual(DEFAULT_GAME_CONFIG);
    });
    
    it('should set canvas dimensions from config', () => {
      expect(canvas.width).toBe(DEFAULT_GAME_CONFIG.canvas.width);
      expect(canvas.height).toBe(DEFAULT_GAME_CONFIG.canvas.height);
    });
    
    it('should throw error for non-existent canvas', () => {
      expect(() => new GameEngine('nonexistent')).toThrow();
    });
    
    it('should initialize managers', () => {
      expect(gameEngine.getStateManager()).toBeInstanceOf(StateManager);
      expect(gameEngine.getInputManager()).toBeInstanceOf(InputManager);
      expect(gameEngine.getEntityManager()).toBeInstanceOf(EntityManager);
    });
  });
  
  describe('start', () => {
    it('should start the game engine', () => {
      gameEngine.start();
      expect(gameEngine.getIsRunning()).toBe(true);
    });
    
    it('should not start twice', () => {
      gameEngine.start();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      gameEngine.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('Game engine is already running');
      consoleSpy.mockRestore();
    });
  });
  
  describe('stop', () => {
    it('should stop the game engine', () => {
      gameEngine.start();
      gameEngine.stop();
      
      expect(gameEngine.getIsRunning()).toBe(false);
    });
    
    it('should reset paused state', () => {
      gameEngine.start();
      gameEngine.pause();
      gameEngine.stop();
      
      expect(gameEngine.getIsPaused()).toBe(false);
    });
  });
  
  describe('pause', () => {
    it('should pause the game', () => {
      gameEngine.start();
      gameEngine.pause();
      
      expect(gameEngine.getIsPaused()).toBe(true);
    });
    
    it('should warn when pausing non-running game', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      gameEngine.pause();
      
      expect(consoleSpy).toHaveBeenCalledWith('Cannot pause: game is not running');
      consoleSpy.mockRestore();
    });
  });
  
  describe('resume', () => {
    it('should resume the game', () => {
      gameEngine.start();
      gameEngine.pause();
      gameEngine.resume();
      
      expect(gameEngine.getIsPaused()).toBe(false);
    });
    
    it('should warn when resuming non-running game', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      gameEngine.resume();
      
      expect(consoleSpy).toHaveBeenCalledWith('Cannot resume: game is not running');
      consoleSpy.mockRestore();
    });
    
    it('should warn when resuming non-paused game', () => {
      gameEngine.start();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      gameEngine.resume();
      
      expect(consoleSpy).toHaveBeenCalledWith('Game is not paused');
      consoleSpy.mockRestore();
    });
  });
  
  describe('game loop', () => {
    it('should update state manager when running', async () => {
      const mockState = new MockGameState(GameStateType.MENU);
      gameEngine.getStateManager().registerState(GameStateType.MENU, mockState);
      gameEngine.getStateManager().changeState(GameStateType.MENU);
      
      gameEngine.start();
      
      // Wait for a few frames
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockState.updateCount).toBeGreaterThan(0);
      expect(mockState.renderCount).toBeGreaterThan(0);
    });
    
    it('should not update when paused', async () => {
      const mockState = new MockGameState(GameStateType.MENU);
      gameEngine.getStateManager().registerState(GameStateType.MENU, mockState);
      gameEngine.getStateManager().changeState(GameStateType.MENU);
      
      gameEngine.start();
      gameEngine.pause();
      
      const updateCountAtPause = mockState.updateCount;
      
      // Wait for a few frames
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update count should not increase while paused
      expect(mockState.updateCount).toBe(updateCountAtPause);
      // But render should still be called
      expect(mockState.renderCount).toBeGreaterThan(0);
    });
  });
  
  describe('getters', () => {
    it('should return canvas', () => {
      expect(gameEngine.getCanvas()).toBe(canvas);
    });
    
    it('should return context', () => {
      expect(gameEngine.getContext()).toBeDefined();
    });
    
    it('should return config', () => {
      expect(gameEngine.getConfig()).toEqual(DEFAULT_GAME_CONFIG);
    });
    
    it('should return FPS (initially 0)', () => {
      expect(gameEngine.getCurrentFps()).toBe(0);
    });
  });
  
  describe('custom config', () => {
    it('should accept custom config', () => {
      const customConfig = {
        ...DEFAULT_GAME_CONFIG,
        canvas: {
          width: 800,
          height: 600
        }
      };
      
      const customCanvas = document.createElement('canvas');
      customCanvas.id = 'customCanvas';
      document.body.appendChild(customCanvas);
      
      const customEngine = new GameEngine('customCanvas', customConfig);
      
      expect(customCanvas.width).toBe(800);
      expect(customCanvas.height).toBe(600);
      expect(customEngine.getConfig().canvas.width).toBe(800);
      
      customEngine.stop();
      document.body.removeChild(customCanvas);
    });
  });
});
