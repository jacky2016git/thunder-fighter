/**
 * Systems Module Index
 * 系统模块索引
 * 
 * Exports all game systems for easy importing.
 * 导出所有游戏系统以便于导入。
 */

// Core systems
export { RenderSystem, RenderLayer } from './RenderSystem';
export { CollisionSystem } from './CollisionSystem';
export { SpawnSystem } from './SpawnSystem';
export { ScoreSystem } from './ScoreSystem';
export type { ScoreData } from './ScoreSystem';
export { AudioManager } from './AudioManager';
export type { AudioConfig } from './AudioManager';

// Visual systems
export { SpriteManager, SpriteType } from './SpriteManager';
export type { SpriteDefinition } from './SpriteManager';
export { BackgroundRenderer } from './BackgroundRenderer';
export { UIRenderer } from './UIRenderer';
export type { ButtonState } from './UIRenderer';
export { VisualEffects, ParticleType } from './VisualEffects';
export type { Particle, Explosion, ScreenEffect } from './VisualEffects';
