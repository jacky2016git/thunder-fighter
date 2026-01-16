/**
 * InputManager Unit Tests
 * 输入管理器单元测试
 */
import { InputManager } from '../../../src/core/InputManager';

describe('InputManager', () => {
  let inputManager: InputManager;
  let canvas: HTMLCanvasElement;
  
  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 800;
    document.body.appendChild(canvas);
    
    inputManager = new InputManager(canvas);
  });
  
  afterEach(() => {
    inputManager.detach();
    document.body.removeChild(canvas);
  });
  
  describe('constructor', () => {
    it('should create an InputManager without canvas', () => {
      const manager = new InputManager();
      expect(manager).toBeDefined();
      expect(manager.getInputState()).toBeDefined();
    });
    
    it('should create an InputManager with canvas', () => {
      expect(inputManager).toBeDefined();
      expect(inputManager.getInputState()).toBeDefined();
    });
  });
  
  describe('getInputState', () => {
    it('should return default input state', () => {
      const state = inputManager.getInputState();
      
      expect(state.keys).toBeInstanceOf(Set);
      expect(state.keys.size).toBe(0);
      expect(state.mouseX).toBe(0);
      expect(state.mouseY).toBe(0);
      expect(state.mouseDown).toBe(false);
    });
  });
  
  describe('keyboard events', () => {
    it('should track key down events', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
    });
    
    it('should track key up events', () => {
      // Press key
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      
      // Release key
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
      expect(inputManager.isKeyPressed('KeyW')).toBe(false);
    });
    
    it('should track multiple keys', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      expect(inputManager.isKeyPressed('Space')).toBe(true);
    });
  });
  
  describe('mouse events', () => {
    it('should track mouse position', () => {
      // Mock getBoundingClientRect
      jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 480,
        height: 800,
        right: 480,
        bottom: 800,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      
      const event = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200
      });
      canvas.dispatchEvent(event);
      
      const pos = inputManager.getMousePosition();
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
    });
    
    it('should track mouse down', () => {
      const event = new MouseEvent('mousedown', { button: 0 });
      canvas.dispatchEvent(event);
      
      expect(inputManager.isMouseDown()).toBe(true);
    });
    
    it('should track mouse up', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(inputManager.isMouseDown()).toBe(true);
      
      canvas.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
      expect(inputManager.isMouseDown()).toBe(false);
    });
    
    it('should only track left mouse button', () => {
      // Right click should not set mouseDown
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
      expect(inputManager.isMouseDown()).toBe(false);
    });
  });
  
  describe('isActionActive', () => {
    it('should return true for active movement actions', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      expect(inputManager.isActionActive('moveUp')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(inputManager.isActionActive('moveUp')).toBe(true);
    });
    
    it('should return true for fire action with keyboard', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(inputManager.isActionActive('fire')).toBe(true);
    });
    
    it('should return true for fire action with mouse', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(inputManager.isActionActive('fire')).toBe(true);
    });
    
    it('should return false for inactive actions', () => {
      expect(inputManager.isActionActive('moveUp')).toBe(false);
      expect(inputManager.isActionActive('fire')).toBe(false);
    });
  });
  
  describe('key bindings', () => {
    it('should get default key bindings', () => {
      const bindings = inputManager.getAllKeyBindings();
      
      expect(bindings.get('ArrowUp')).toBe('moveUp');
      expect(bindings.get('Space')).toBe('fire');
      expect(bindings.get('KeyP')).toBe('pause');
    });
    
    it('should set custom key binding', () => {
      inputManager.setKeyBinding('KeyX', 'fire');
      expect(inputManager.getKeyBinding('KeyX')).toBe('fire');
    });
    
    it('should reset key bindings to defaults', () => {
      inputManager.setKeyBinding('KeyX', 'fire');
      inputManager.resetKeyBindings();
      
      expect(inputManager.getKeyBinding('KeyX')).toBeUndefined();
      expect(inputManager.getKeyBinding('Space')).toBe('fire');
    });
  });
  
  describe('clearInputState', () => {
    it('should clear all input state', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      expect(inputManager.isMouseDown()).toBe(true);
      
      inputManager.clearInputState();
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(false);
      expect(inputManager.isMouseDown()).toBe(false);
    });
  });
  
  describe('detach', () => {
    it('should stop tracking events after detach', () => {
      inputManager.detach();
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(inputManager.isKeyPressed('KeyW')).toBe(false);
    });
  });
});
