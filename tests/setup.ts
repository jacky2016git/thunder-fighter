// Jest setup file for Thunder Fighter game tests
// This file runs before each test file

// Mock canvas context for jsdom environment
HTMLCanvasElement.prototype.getContext = jest.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      strokeRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Array(4).fill(0)
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      clip: jest.fn(),
      rect: jest.fn(),
      quadraticCurveTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      isPointInPath: jest.fn(),
      isPointInStroke: jest.fn(),
      ellipse: jest.fn(),
      roundRect: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      canvas: {
        width: 480,
        height: 800
      },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as jest.Mock;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
});

global.cancelAnimationFrame = jest.fn((id: number) => {
  clearTimeout(id);
});

// Mock Audio for sound tests
class MockAudio {
  src: string = '';
  volume: number = 1;
  loop: boolean = false;
  paused: boolean = true;
  currentTime: number = 0;
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }
  
  pause(): void {
    this.paused = true;
  }
  
  load(): void {
    // Simulate successful load by triggering canplaythrough event
    setTimeout(() => {
      this.triggerEvent('canplaythrough');
    }, 0);
  }
  
  addEventListener(event: string, callback: Function, options?: { once?: boolean }): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    
    // If once option, wrap callback to remove after first call
    if (options?.once) {
      const originalCallback = callback;
      const wrappedCallback = (...args: any[]) => {
        this.eventListeners.get(event)?.delete(wrappedCallback);
        originalCallback(...args);
      };
      this.eventListeners.get(event)!.delete(callback);
      this.eventListeners.get(event)!.add(wrappedCallback);
    }
  }
  
  removeEventListener(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }
  
  private triggerEvent(event: string): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }
  
  cloneNode(): MockAudio {
    const clone = new MockAudio();
    clone.src = this.src;
    clone.volume = this.volume;
    return clone;
  }
  
  remove(): void {}
}

(global as any).Audio = MockAudio;

// Mock AudioContext
class MockAudioContext {
  state: string = 'running';
  
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

(global as any).AudioContext = MockAudioContext;
(window as any).AudioContext = MockAudioContext;

// Mock Image for sprite loading
const originalImage = global.Image;
class MockImage {
  src: string = '';
  onload: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  width: number = 100;
  height: number = 100;
  
  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.src && this.onload) {
        this.onload();
      }
    }, 0);
  }
}

(global as any).Image = MockImage;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});
