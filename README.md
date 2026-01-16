# Thunder Fighter (雷霆战机)

A classic vertical scrolling shooter game built with TypeScript and HTML5 Canvas.

![Thunder Fighter](assets/images/screenshot.png)

## 🎮 Game Overview

Thunder Fighter is a retro-style arcade shooter where you pilot a fighter jet through waves of enemy aircraft. Destroy enemies, collect power-ups, and achieve the highest score!

### Features

- **Smooth Controls**: Responsive keyboard and mouse controls
- **Multiple Enemy Types**: Basic, Shooter, Zigzag, and Boss enemies
- **Power-Up System**: Weapon upgrades, health restoration, and shields
- **Visual Effects**: Explosions, particle effects, and screen shake
- **Score System**: Combo multipliers and high score persistence
- **Procedural Graphics**: All sprites generated programmatically

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/thunder-fighter.git
cd thunder-fighter

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 How to Play

### Controls

| Action | Keyboard | Mouse |
|--------|----------|-------|
| Move Up | ↑ / W | - |
| Move Down | ↓ / S | - |
| Move Left | ← / A | - |
| Move Right | → / D | - |
| Fire | Space | Left Click |
| Pause | P / Escape | - |
| Confirm | Enter / Space | Click |

### Gameplay

1. **Start**: Press ENTER or SPACE on the main menu
2. **Move**: Use arrow keys or WASD to navigate your aircraft
3. **Shoot**: Hold SPACE or left mouse button to fire
4. **Survive**: Avoid enemy bullets and collisions
5. **Collect**: Grab power-ups dropped by destroyed enemies
6. **Score**: Destroy enemies to earn points

### Power-Ups

| Power-Up | Effect | Color |
|----------|--------|-------|
| ⭐ Weapon Upgrade | Increases bullet count (max 3) | Gold |
| ➕ Health | Restores 1 health point | Green |
| 🛡️ Shield | Temporary invincibility | Blue |

### Enemy Types

| Enemy | Health | Score | Behavior |
|-------|--------|-------|----------|
| Basic | 1 | 10 | Moves straight down |
| Shooter | 2 | 20 | Fires bullets at player |
| Zigzag | 2 | 30 | Moves in zigzag pattern |
| Boss | 20 | 200 | Complex movement, multiple bullets |

### Scoring

- Base points for destroying enemies
- **Combo Bonus**: 1.5x multiplier for 3+ consecutive kills within 2 seconds
- **Accuracy Bonus**: 1.2x final score if accuracy > 70%

## 🏗️ Project Structure

```
thunder-fighter/
├── src/
│   ├── main.ts              # Game entry point and integration
│   ├── core/                # Core game systems
│   │   ├── GameEngine.ts    # Main game loop
│   │   ├── StateManager.ts  # Game state management
│   │   ├── InputManager.ts  # Input handling
│   │   ├── EntityManager.ts # Entity lifecycle
│   │   ├── ObjectPool.ts    # Object pooling
│   │   ├── ErrorHandler.ts  # Error handling
│   │   └── states/          # Game states
│   │       ├── MenuState.ts
│   │       ├── PlayingState.ts
│   │       ├── PausedState.ts
│   │       └── GameOverState.ts
│   ├── entities/            # Game entities
│   │   ├── PlayerAircraft.ts
│   │   ├── EnemyAircraft.ts
│   │   ├── Bullet.ts
│   │   └── PowerUp.ts
│   ├── systems/             # Game systems
│   │   ├── CollisionSystem.ts
│   │   ├── SpawnSystem.ts
│   │   ├── ScoreSystem.ts
│   │   ├── RenderSystem.ts
│   │   ├── AudioManager.ts
│   │   ├── SpriteManager.ts
│   │   ├── BackgroundRenderer.ts
│   │   ├── UIRenderer.ts
│   │   └── VisualEffects.ts
│   ├── interfaces/          # TypeScript interfaces
│   ├── types/               # Type definitions
│   └── config/              # Configuration files
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── properties/         # Property-based tests
│   └── integration/        # Integration tests
├── assets/                  # Game assets
│   ├── images/
│   ├── sounds/
│   └── music/
├── dist/                    # Production build output
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## 🧪 Testing

The project uses Jest for testing with both unit tests and property-based tests (using fast-check).

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **Unit Tests**: Core functionality of all classes
- **Property-Based Tests**: Invariants and edge cases
- **Integration Tests**: System interactions

## 🔧 Configuration

Game settings can be modified in `src/types/GameConfig.ts`:

```typescript
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvas: {
    width: 480,
    height: 800
  },
  player: {
    speed: 300,
    maxHealth: 3,
    fireRate: 200,
    // ...
  },
  // ...
};
```

## 🎨 Architecture

### Design Patterns

- **Entity-Component Pattern**: Game objects share common interfaces
- **State Machine**: Game state management (Menu, Playing, Paused, GameOver)
- **Object Pool**: Efficient bullet and enemy recycling
- **Observer Pattern**: Event-driven collision handling

### Core Systems

1. **GameEngine**: Main loop using `requestAnimationFrame`
2. **StateManager**: Handles state transitions
3. **EntityManager**: Manages entity lifecycle
4. **CollisionSystem**: AABB collision detection
5. **SpawnSystem**: Enemy and power-up generation
6. **ScoreSystem**: Score tracking and persistence

## 📝 API Documentation

### GameEngine

```typescript
class GameEngine {
  constructor(canvasId: string, config?: GameConfig);
  start(): void;      // Start the game loop
  stop(): void;       // Stop the game loop
  pause(): void;      // Pause the game
  resume(): void;     // Resume from pause
}
```

### PlayerAircraft

```typescript
class PlayerAircraft {
  fire(currentTime: number): Bullet[];  // Fire bullets
  takeDamage(damage: number): void;     // Apply damage
  heal(amount: number): void;           // Restore health
  upgradeWeapon(): void;                // Upgrade weapon level
  activateShield(duration: number): void; // Activate shield
}
```

### CollisionSystem

```typescript
class CollisionSystem {
  checkCollision(a: Rectangle, b: Rectangle): boolean;
  onCollision(type: CollisionEventType, callback: CollisionCallback): void;
  update(player, enemies, bullets, powerUps): void;
}
```

### ScoreSystem

```typescript
class ScoreSystem {
  addScore(points: number, currentTime?: number): number;
  getScoreData(): ScoreData;
  saveHighScore(): void;
  loadHighScore(): void;
  reset(): void;
}
```

## 🌐 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |

## 📦 Dependencies

### Production
- None (vanilla TypeScript)

### Development
- TypeScript 5.x
- Vite 6.x
- Jest 29.x
- fast-check (property-based testing)

## 🚀 Deployment

### GitHub Pages

```bash
# Build the project
npm run build

# Deploy dist folder to GitHub Pages
# Or use GitHub Actions for automatic deployment
```

### Static Hosting

The `dist/` folder contains all files needed for deployment:
- `index.html` - Entry point
- `js/` - Bundled JavaScript
- `assets/` - Game assets (if any)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic arcade shooters
- Built with modern web technologies
- Procedural graphics for lightweight deployment

---

**Enjoy the game! 🎮**

*Press SPACE to start...*
