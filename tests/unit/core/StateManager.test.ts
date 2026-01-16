/**
 * StateManager Unit Tests
 * 状态管理器单元测试
 */
import { StateManager } from '../../../src/core/StateManager';
import { GameState } from '../../../src/core/GameState';
import { InputState, createDefaultInputState } from '../../../src/core/InputState';
import { GameStateType } from '../../../src/types/enums';

// Mock GameState implementation for testing
class MockGameState implements GameState {
  readonly type: GameStateType;
  enterCalled = false;
  exitCalled = false;
  updateCalled = false;
  renderCalled = false;
  handleInputCalled = false;
  lastDeltaTime = 0;
  
  constructor(type: GameStateType) {
    this.type = type;
  }
  
  enter(): void {
    this.enterCalled = true;
  }
  
  exit(): void {
    this.exitCalled = true;
  }
  
  update(deltaTime: number): void {
    this.updateCalled = true;
    this.lastDeltaTime = deltaTime;
  }
  
  render(_context: CanvasRenderingContext2D): void {
    this.renderCalled = true;
  }
  
  handleInput(_input: InputState): void {
    this.handleInputCalled = true;
  }
  
  reset(): void {
    this.enterCalled = false;
    this.exitCalled = false;
    this.updateCalled = false;
    this.renderCalled = false;
    this.handleInputCalled = false;
    this.lastDeltaTime = 0;
  }
}

describe('StateManager', () => {
  let stateManager: StateManager;
  let menuState: MockGameState;
  let playingState: MockGameState;
  let pausedState: MockGameState;
  let gameOverState: MockGameState;
  
  beforeEach(() => {
    stateManager = new StateManager();
    menuState = new MockGameState(GameStateType.MENU);
    playingState = new MockGameState(GameStateType.PLAYING);
    pausedState = new MockGameState(GameStateType.PAUSED);
    gameOverState = new MockGameState(GameStateType.GAME_OVER);
  });
  
  describe('registerState', () => {
    it('should register a state', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      expect(stateManager.hasState(GameStateType.MENU)).toBe(true);
    });
    
    it('should register multiple states', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.registerState(GameStateType.PLAYING, playingState);
      
      expect(stateManager.hasState(GameStateType.MENU)).toBe(true);
      expect(stateManager.hasState(GameStateType.PLAYING)).toBe(true);
    });
    
    it('should return all registered state types', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.registerState(GameStateType.PLAYING, playingState);
      
      const registeredStates = stateManager.getRegisteredStates();
      expect(registeredStates).toContain(GameStateType.MENU);
      expect(registeredStates).toContain(GameStateType.PLAYING);
    });
  });
  
  describe('changeState', () => {
    beforeEach(() => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.registerState(GameStateType.PLAYING, playingState);
      stateManager.registerState(GameStateType.PAUSED, pausedState);
      stateManager.registerState(GameStateType.GAME_OVER, gameOverState);
    });
    
    it('should change to a registered state', () => {
      const result = stateManager.changeState(GameStateType.MENU);
      
      expect(result).toBe(true);
      expect(stateManager.getCurrentState()).toBe(menuState);
      expect(stateManager.getCurrentStateType()).toBe(GameStateType.MENU);
    });
    
    it('should call enter on the new state', () => {
      stateManager.changeState(GameStateType.MENU);
      expect(menuState.enterCalled).toBe(true);
    });
    
    it('should call exit on the previous state', () => {
      stateManager.changeState(GameStateType.MENU);
      menuState.reset();
      
      stateManager.changeState(GameStateType.PLAYING);
      
      expect(menuState.exitCalled).toBe(true);
      expect(playingState.enterCalled).toBe(true);
    });
    
    it('should return false for unregistered state', () => {
      const newManager = new StateManager();
      const result = newManager.changeState(GameStateType.MENU);
      
      expect(result).toBe(false);
    });
    
    it('should allow valid state transitions', () => {
      // MENU -> PLAYING
      stateManager.changeState(GameStateType.MENU);
      expect(stateManager.changeState(GameStateType.PLAYING)).toBe(true);
      
      // PLAYING -> PAUSED
      expect(stateManager.changeState(GameStateType.PAUSED)).toBe(true);
      
      // PAUSED -> PLAYING
      expect(stateManager.changeState(GameStateType.PLAYING)).toBe(true);
      
      // PLAYING -> GAME_OVER
      expect(stateManager.changeState(GameStateType.GAME_OVER)).toBe(true);
      
      // GAME_OVER -> MENU
      expect(stateManager.changeState(GameStateType.MENU)).toBe(true);
    });
    
    it('should reject invalid state transitions', () => {
      // MENU -> PAUSED (invalid)
      stateManager.changeState(GameStateType.MENU);
      expect(stateManager.changeState(GameStateType.PAUSED)).toBe(false);
      
      // MENU -> GAME_OVER (invalid)
      expect(stateManager.changeState(GameStateType.GAME_OVER)).toBe(false);
    });
  });
  
  describe('canTransitionTo', () => {
    beforeEach(() => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.registerState(GameStateType.PLAYING, playingState);
      stateManager.registerState(GameStateType.PAUSED, pausedState);
      stateManager.registerState(GameStateType.GAME_OVER, gameOverState);
    });
    
    it('should return true for valid transitions from MENU', () => {
      stateManager.changeState(GameStateType.MENU);
      expect(stateManager.canTransitionTo(GameStateType.PLAYING)).toBe(true);
    });
    
    it('should return false for invalid transitions from MENU', () => {
      stateManager.changeState(GameStateType.MENU);
      expect(stateManager.canTransitionTo(GameStateType.PAUSED)).toBe(false);
      expect(stateManager.canTransitionTo(GameStateType.GAME_OVER)).toBe(false);
    });
    
    it('should return true for valid transitions from PLAYING', () => {
      stateManager.changeState(GameStateType.MENU);
      stateManager.changeState(GameStateType.PLAYING);
      
      expect(stateManager.canTransitionTo(GameStateType.PAUSED)).toBe(true);
      expect(stateManager.canTransitionTo(GameStateType.GAME_OVER)).toBe(true);
    });
    
    it('should return true when no current state', () => {
      expect(stateManager.canTransitionTo(GameStateType.MENU)).toBe(true);
      expect(stateManager.canTransitionTo(GameStateType.PLAYING)).toBe(true);
    });
  });
  
  describe('getCurrentState', () => {
    it('should return null when no state is set', () => {
      expect(stateManager.getCurrentState()).toBeNull();
      expect(stateManager.getCurrentStateType()).toBeNull();
    });
    
    it('should return the current state after change', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.changeState(GameStateType.MENU);
      
      expect(stateManager.getCurrentState()).toBe(menuState);
      expect(stateManager.getCurrentStateType()).toBe(GameStateType.MENU);
    });
  });
  
  describe('update', () => {
    it('should call update on current state', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.changeState(GameStateType.MENU);
      
      stateManager.update(0.016);
      
      expect(menuState.updateCalled).toBe(true);
      expect(menuState.lastDeltaTime).toBe(0.016);
    });
    
    it('should not throw when no current state', () => {
      expect(() => stateManager.update(0.016)).not.toThrow();
    });
  });
  
  describe('render', () => {
    let mockContext: CanvasRenderingContext2D;
    
    beforeEach(() => {
      const canvas = document.createElement('canvas');
      mockContext = canvas.getContext('2d')!;
    });
    
    it('should call render on current state', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.changeState(GameStateType.MENU);
      
      stateManager.render(mockContext);
      
      expect(menuState.renderCalled).toBe(true);
    });
    
    it('should not throw when no current state', () => {
      expect(() => stateManager.render(mockContext)).not.toThrow();
    });
  });
  
  describe('handleInput', () => {
    it('should call handleInput on current state', () => {
      stateManager.registerState(GameStateType.MENU, menuState);
      stateManager.changeState(GameStateType.MENU);
      
      const inputState = createDefaultInputState();
      stateManager.handleInput(inputState);
      
      expect(menuState.handleInputCalled).toBe(true);
    });
    
    it('should not throw when no current state', () => {
      const inputState = createDefaultInputState();
      expect(() => stateManager.handleInput(inputState)).not.toThrow();
    });
  });
});
