/**
 * Core Module Index
 * 核心模块导出索引
 */

// Core classes
export { GameEngine } from './GameEngine';
export { StateManager } from './StateManager';
export { InputManager } from './InputManager';
export { EntityManager } from './EntityManager';

// Object pooling
export { ObjectPool, BulletPool, EnemyPool } from './ObjectPool';
export type { Poolable, PoolFactory, PoolReset } from './ObjectPool';

// Error handling
export { 
  ErrorHandler, 
  getErrorHandler, 
  safeExecute, 
  safeExecuteAsync, 
  retryWithBackoff,
  ErrorSeverity,
  ErrorCategory
} from './ErrorHandler';
export type { ErrorLogEntry, RecoveryStrategy, ErrorCallback } from './ErrorHandler';

// Interfaces and types
export type { GameState } from './GameState';
export type { InputState } from './InputState';
export { createDefaultInputState } from './InputState';

// Game states
export { MenuState, PlayingState, PausedState, GameOverState } from './states';
