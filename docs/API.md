# Thunder Fighter - API Documentation

## Table of Contents

1. [Core Systems](#core-systems)
2. [Entities](#entities)
3. [Game Systems](#game-systems)
4. [Interfaces](#interfaces)
5. [Types & Enums](#types--enums)

---

## Core Systems

### GameEngine

The main game controller that manages the game loop and coordinates all systems.

```typescript
class GameEngine {
  constructor(canvasId: string, config?: GameConfig);
  
  // Lifecycle methods
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  
  // Getters
  getStateManager(): StateManager;
  getInputManager(): InputManager;
  getEntityManager(): EntityManager;
  getConfig(): GameConfig;
  getCanvas(): HTMLCanvasElement;
  getContext(): CanvasRenderingContext2D;
  getIsRunning(): boolean;
  getIsPaused(): boolean;
  getCurrentFps(): number;
}
```

#### Usage Example

```typescript
const engine = new GameEngine('gameCanvas');
engine.start();

// Later...
engine.pause();
engine.resume();
engine.stop();
```

---

### StateManager

Manages game states and transitions between them.

```typescript
class StateManager {
  registerState(type: GameStateType, state: GameState): void;
  changeState(type: GameStateType): boolean;
  getCurrentState(): GameState | null;
  getCurrentStateType(): GameStateType | null;
  canTransitionTo(targetType: GameStateType): boolean;
  hasState(type: GameStateType): boolean;
  getRegisteredStates(): GameStateType[];
  
  // Called by game loop
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  handleInput(input: InputState): void;
}
```

#### Valid State Transitions

```
MENU → PLAYING
PLAYING → PAUSED, GAME_OVER
PAUSED → PLAYING, MENU
GAME_OVER → MENU, PLAYING
```

---

### InputManager

Handles keyboard and mouse input.

```typescript
class InputManager {
  constructor(canvas?: HTMLCanvasElement);
  
  attachToCanvas(canvas: HTMLCanvasElement): void;
  detach(): void;
  
  getInputState(): InputState;
  isActionActive(action: string): boolean;
  isKeyPressed(keyCode: string): boolean;
  getMousePosition(): { x: number; y: number };
  isMouseDown(): boolean;
  
  setKeyBinding(keyCode: string, action: string): void;
  getKeyBinding(keyCode: string): string | undefined;
  getAllKeyBindings(): Map<string, string>;
  resetKeyBindings(): void;
  clearInputState(): void;
}
```

#### Default Key Bindings

| Key Code | Action |
|----------|--------|
| ArrowUp, KeyW | moveUp |
| ArrowDown, KeyS | moveDown |
| ArrowLeft, KeyA | moveLeft |
| ArrowRight, KeyD | moveRight |
| Space | fire |
| KeyP | pause |
| Escape | menu |
| Enter | confirm |

---

### EntityManager

Manages all game entities and their lifecycle.

```typescript
class EntityManager {
  addEntity(entity: GameObject): void;
  removeEntity(id: string): void;
  getEntity(id: string): GameObject | undefined;
  getEntitiesByType<T extends GameObject>(type: new (...args: any[]) => T): T[];
  getAllEntities(): GameObject[];
  getActiveEntities(): GameObject[];
  getEntityCount(): number;
  hasEntity(id: string): boolean;
  clear(): void;
  
  // Called by game loop
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
}
```

---

## Entities

### PlayerAircraft

The player-controlled aircraft.

```typescript
class PlayerAircraft implements Collidable, Movable {
  // Properties
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  health: number;
  maxHealth: number;
  weaponLevel: number;
  invincible: boolean;
  
  constructor(x: number, y: number, config?: GameConfig);
  
  // Movement
  setVelocity(vx: number, vy: number): void;
  move(deltaTime: number): void;
  
  // Combat
  fire(currentTime: number): Bullet[];
  takeDamage(damage: number): void;
  heal(amount: number): void;
  upgradeWeapon(): void;
  activateShield(duration: number): void;
  
  // Lifecycle
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  destroy(): void;
  reset(x: number, y: number): void;
  
  // Collision
  onCollision(other: Collidable): void;
  checkCollision(other: Collidable): boolean;
}
```

---

### EnemyAircraft

Enemy aircraft with different types and behaviors.

```typescript
class EnemyAircraft implements Collidable, Movable {
  // Properties
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  health: number;
  scoreValue: number;
  movementPattern: MovementPattern;
  
  constructor(x: number, y: number, type: EnemyType, config?: GameConfig);
  
  // Combat
  fire(currentTime: number): Bullet | null;
  fireBoss(currentTime: number): Bullet[];  // For BOSS type only
  takeDamage(damage: number): void;
  
  // Lifecycle
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  destroy(): void;
}
```

#### Enemy Types

| Type | Health | Score | Fire Rate | Movement |
|------|--------|-------|-----------|----------|
| BASIC | 1 | 10 | - | Straight |
| SHOOTER | 2 | 20 | 2000ms | Straight |
| ZIGZAG | 2 | 30 | - | Zigzag |
| BOSS | 20 | 200 | 1000ms | Sine wave |

---

### Bullet

Projectiles fired by player or enemies.

```typescript
class Bullet implements Collidable, Movable {
  id: string;
  owner: BulletOwner;
  damage: number;
  
  constructor(
    x: number,
    y: number,
    owner: BulletOwner,
    velocityY: number,
    config?: GameConfig
  );
  
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  destroy(): void;
}
```

---

### PowerUp

Collectible items that enhance player abilities.

```typescript
class PowerUp implements Collidable, Movable {
  id: string;
  type: PowerUpType;
  
  constructor(x: number, y: number, type: PowerUpType, config?: GameConfig);
  
  apply(player: PlayerAircraft): void;
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  destroy(): void;
  
  static getRandomType(): PowerUpType;
}
```

---

## Game Systems

### CollisionSystem

Handles collision detection and response.

```typescript
class CollisionSystem {
  // Basic collision check
  checkCollision(a: Rectangle, b: Rectangle): boolean;
  
  // Specific collision checks
  checkPlayerBulletCollisions(bullets: Bullet[], enemies: EnemyAircraft[]): CollisionEvent[];
  checkEnemyBulletCollisions(bullets: Bullet[], player: PlayerAircraft): CollisionEvent[];
  checkPlayerEnemyCollisions(player: PlayerAircraft, enemies: EnemyAircraft[]): CollisionEvent[];
  checkPlayerPowerUpCollisions(player: PlayerAircraft, powerUps: PowerUp[]): CollisionEvent[];
  checkAllCollisions(player, enemies, bullets, powerUps): CollisionEvent[];
  
  // Event handling
  onCollision(type: CollisionEventType, callback: CollisionCallback): void;
  offCollision(type: CollisionEventType, callback: CollisionCallback): void;
  processCollisions(events: CollisionEvent[]): void;
  clearCallbacks(): void;
  
  // Main update
  update(player, enemies, bullets, powerUps): void;
}
```

#### Collision Event Types

```typescript
enum CollisionEventType {
  PLAYER_BULLET_ENEMY = 'playerBulletEnemy',
  ENEMY_BULLET_PLAYER = 'enemyBulletPlayer',
  PLAYER_ENEMY = 'playerEnemy',
  PLAYER_POWERUP = 'playerPowerUp'
}
```

---

### SpawnSystem

Controls enemy and power-up spawning.

```typescript
class SpawnSystem {
  constructor(config?: Partial<SpawnConfig>, gameConfig?: GameConfig);
  
  update(deltaTime: number, entityManager: EntityManager, currentTime: number): void;
  spawnEnemy(entityManager: EntityManager): void;
  spawnPowerUp(x: number, y: number, entityManager: EntityManager): void;
  trySpawnPowerUp(x: number, y: number, entityManager: EntityManager): boolean;
  spawnBoss(entityManager: EntityManager): void;
  
  selectEnemyType(): EnemyType;
  selectPowerUpType(): PowerUpType;
  calculateSpawnRate(): number;
  
  recordEnemyDestroyed(entityManager: EntityManager): void;
  onBossDefeated(): void;
  isBossActive(): boolean;
  
  getCurrentDifficulty(): number;
  getEnemiesDestroyed(): number;
  getGameTime(): number;
  
  reset(): void;
  setConfig(config: Partial<SpawnConfig>): void;
  getConfig(): SpawnConfig;
}
```

---

### ScoreSystem

Manages scoring and high scores.

```typescript
class ScoreSystem {
  constructor();
  
  addScore(points: number, currentTime?: number): number;
  recordEnemyDestroyed(): void;
  recordShot(): void;
  recordShots(count: number): void;
  recordHit(): void;
  
  getScoreData(): ScoreData;
  getCurrentScore(): number;
  getHighScore(): number;
  getEnemiesDestroyed(): number;
  getComboCount(): number;
  isComboActive(currentTime: number): boolean;
  calculateAccuracy(): number;
  getTotalShots(): number;
  getTotalHits(): number;
  
  saveHighScore(): void;
  loadHighScore(): void;
  reset(): void;
  resetAll(): void;
  
  calculateFinalScore(): number;
  applyFinalBonus(): void;
}
```

---

### AudioManager

Manages sound effects and music.

```typescript
class AudioManager {
  constructor();
  
  initialize(): Promise<void>;
  
  loadSound(effect: SoundEffect, path: string): Promise<void>;
  loadMusic(path: string): Promise<void>;
  
  playSound(effect: SoundEffect): void;
  playMusic(): void;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  
  setSoundVolume(volume: number): void;
  getSoundVolume(): number;
  setMusicVolume(volume: number): void;
  getMusicVolume(): number;
  toggleMute(): boolean;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  
  getConfig(): AudioConfig;
  setConfig(config: Partial<AudioConfig>): void;
  
  isSoundLoaded(effect: SoundEffect): boolean;
  isMusicLoaded(): boolean;
  preloadSounds(basePath?: string): Promise<void>;
  dispose(): void;
}
```

---

### VisualEffects

Manages visual effects like explosions and particles.

```typescript
class VisualEffects {
  constructor(config?: GameConfig);
  
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  
  createExplosion(x: number, y: number, size?: number, colorPalette?: string): void;
  createEngineTrail(x: number, y: number, isPlayer?: boolean): void;
  createImpactSparks(x: number, y: number, count?: number): void;
  createPowerUpEffect(x: number, y: number, color: string): void;
  createDamageEffect(): void;
  
  addScreenShake(duration: number, intensity: number): void;
  addScreenFlash(duration: number, color: string): void;
  
  clear(): void;
  getParticleCount(): number;
  hasActiveScreenEffects(): boolean;
}
```

---

## Interfaces

### GameObject

Base interface for all game objects.

```typescript
interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  destroy(): void;
}
```

### Collidable

Interface for objects that can collide.

```typescript
interface Collidable extends GameObject {
  collisionBox: Rectangle;
  collisionType: CollisionType;
  
  onCollision(other: Collidable): void;
  checkCollision(other: Collidable): boolean;
}
```

### Movable

Interface for objects that can move.

```typescript
interface Movable extends GameObject {
  velocityX: number;
  velocityY: number;
  speed: number;
  
  move(deltaTime: number): void;
  setVelocity(vx: number, vy: number): void;
}
```

### GameState

Interface for game states.

```typescript
interface GameState {
  type: GameStateType;
  
  enter(): void;
  exit(): void;
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
  handleInput(input: InputState): void;
}
```

---

## Types & Enums

### GameStateType

```typescript
enum GameStateType {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}
```

### EnemyType

```typescript
enum EnemyType {
  BASIC = 'basic',
  SHOOTER = 'shooter',
  ZIGZAG = 'zigzag',
  BOSS = 'boss'
}
```

### BulletOwner

```typescript
enum BulletOwner {
  PLAYER = 'player',
  ENEMY = 'enemy'
}
```

### PowerUpType

```typescript
enum PowerUpType {
  WEAPON_UPGRADE = 'weaponUpgrade',
  HEALTH = 'health',
  SHIELD = 'shield'
}
```

### CollisionType

```typescript
enum CollisionType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  PLAYER_BULLET = 'playerBullet',
  ENEMY_BULLET = 'enemyBullet',
  POWER_UP = 'powerUp'
}
```

### SoundEffect

```typescript
enum SoundEffect {
  PLAYER_SHOOT = 'playerShoot',
  ENEMY_SHOOT = 'enemyShoot',
  EXPLOSION = 'explosion',
  POWER_UP = 'powerUp',
  HIT = 'hit'
}
```

### Rectangle

```typescript
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### InputState

```typescript
interface InputState {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
}
```

### ScoreData

```typescript
interface ScoreData {
  currentScore: number;
  highScore: number;
  enemiesDestroyed: number;
  accuracy: number;
}
```

### GameConfig

```typescript
interface GameConfig {
  canvas: { width: number; height: number };
  player: {
    width: number;
    height: number;
    speed: number;
    maxHealth: number;
    fireRate: number;
    invincibleDuration: number;
  };
  enemy: {
    basic: EnemyConfig;
    shooter: EnemyConfig;
    zigzag: EnemyConfig;
    boss: EnemyConfig;
  };
  bullet: {
    player: BulletConfig;
    enemy: BulletConfig;
  };
  powerUp: {
    dropChance: number;
    fallSpeed: number;
  };
  spawn: {
    initialRate: number;
    minRate: number;
    difficultyIncrease: number;
  };
}
```

---

## Error Handling

The game implements graceful error handling:

1. **Resource Loading**: Audio/image failures don't crash the game
2. **Invalid State Transitions**: Logged and ignored
3. **Runtime Errors**: Caught and logged, game continues
4. **LocalStorage**: Falls back to session storage if unavailable

---

## Performance Considerations

1. **Object Pooling**: Bullets and enemies are pooled for reuse
2. **Spatial Partitioning**: Available for collision optimization
3. **Delta Time**: Frame-rate independent updates
4. **Canvas Optimization**: Minimal draw calls, layer-based rendering

---

*For more information, see the source code documentation.*
