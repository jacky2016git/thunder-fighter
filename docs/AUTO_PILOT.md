# Auto-Pilot Feature (自动驾驶功能)

## Overview
Thunder Fighter now features a fully automated AI pilot system that can play the game autonomously! The aircraft will automatically move to avoid enemies and bullets while continuously firing.

## Features

### 🤖 Intelligent Movement
- **Threat Detection**: Scans 150-pixel radius for enemies and bullets
- **Smart Evasion**: Automatically calculates safest movement direction
- **Boundary Awareness**: Avoids hitting screen edges
- **Dynamic Strategy**: Updates movement plan every second

### 🎯 AI Behavior

#### Threat Response
When enemies or bullets are detected nearby:
- Calculates distance to all threats
- Identifies nearest danger
- Moves in opposite direction to avoid collision
- Prioritizes immediate threats over distant ones

#### Safe Mode
When no immediate threats are present:
- Performs random movement patterns
- Maintains active positioning
- Explores different areas of the screen
- Stays away from boundaries

#### Boundary Protection
- Detects when within 30 pixels of screen edge
- Automatically moves away from boundaries
- Prevents getting trapped in corners
- Maintains safe operating zone

## How It Works

### AI Decision Making
```
Every 1 second OR when near boundary:
1. Scan for threats (enemies + bullets)
2. Calculate distances to all threats
3. Find nearest threat within danger zone (150px)
4. If threat found:
   - Move away from threat
5. If no threat:
   - Choose random movement pattern
6. Check boundaries and adjust direction
7. Apply movement velocity
```

### Movement Patterns
The AI uses 9 different movement patterns:
- Right (→)
- Left (←)
- Up (↑)
- Down (↓)
- Up-Right (↗)
- Up-Left (↖)
- Down-Right (↘)
- Down-Left (↙)
- Stay (⊙)

## Technical Details

### Properties
- `autoPilot`: Boolean flag to enable/disable auto-pilot
- `autoPilotDirection`: Current movement direction {x, y}
- `autoPilotChangeTime`: Last time direction was updated
- `autoPilotChangeInterval`: Time between direction updates (1000ms)

### Methods
- `updateAutoPilot(currentTime, enemies, bullets)`: Main AI update loop
- `calculateAutoPilotDirection(enemies, bullets)`: Threat analysis and direction calculation
- `isNearBoundary()`: Boundary detection

### Parameters
- **Danger Zone**: 150 pixels (threats within this range trigger evasion)
- **Boundary Margin**: 30 pixels (distance from edge to trigger avoidance)
- **Update Interval**: 1000ms (1 second between strategy updates)

## Combined with Auto-Fire
When both auto-pilot and auto-fire are enabled:
- ✅ Fully autonomous gameplay
- ✅ AI handles all movement
- ✅ Automatic continuous shooting
- ✅ Smart threat avoidance
- ✅ No player input required

## Manual Override
Players can still take manual control:
- Set `player.autoPilot = false` to disable auto-pilot
- Use WASD or Arrow keys for manual movement
- Auto-fire can remain enabled for easier gameplay

## Performance
- Lightweight AI calculations
- Efficient threat scanning
- Minimal performance impact
- Smooth 60 FPS gameplay maintained

## Future Enhancements
Potential improvements for the AI:
- Predictive bullet trajectory analysis
- Power-up collection priority
- Boss fight strategies
- Difficulty-based AI aggressiveness
- Learning from player patterns

## Watch It Play!
Simply start the game and watch the AI pilot navigate through waves of enemies, automatically dodging threats and destroying everything in its path! 🚀

---

**Note**: This is a demonstration of AI capabilities in game development. The auto-pilot can be toggled on/off for different gameplay experiences.
