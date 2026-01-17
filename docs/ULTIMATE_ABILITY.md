# Ultimate Ability Feature (大招功能)

## Overview
The ultimate ability is a powerful special attack that can be activated by pressing the **B** key. When activated, it destroys all enemies on screen and grants the player 30 seconds of invincibility.

## How to Use
- **Activation Key**: Press **B** to activate the ultimate ability
- **Cooldown**: 60 seconds between uses
- **Duration**: 30 seconds of invincibility and screen-clearing power

## Effects

### When Activated:
1. **Destroys All Enemies**: All enemies currently on screen are instantly destroyed
2. **Clears Enemy Bullets**: All enemy bullets on screen are removed (with spark effects)
3. **Score Bonus**: You receive points for all destroyed enemies
4. **Invincibility**: Player becomes invincible for 30 seconds
5. **Visual Effects**:
   - Massive particle burst from player position
   - Multiple expanding shockwave rings
   - Screen flash (cyan color)
   - Screen shake effect
   - Explosions at each enemy position
   - Sparks at each destroyed bullet position

### UI Indicator
Located in the bottom-right corner of the screen, the ultimate ability indicator shows:

#### Ready State (Gold/Yellow):
- Glowing golden circle with pulsing animation
- Lightning bolt icon
- "READY" text below
- Indicates the ability is ready to use

#### Active State (Cyan):
- Bright cyan glowing circle with fast pulse
- Rotating star burst icon
- Countdown timer showing remaining seconds
- Indicates the ability is currently active

#### Cooldown State (Gray):
- Dimmed gray circle
- Faded lightning bolt icon
- Countdown timer showing seconds until ready
- Progress arc showing cooldown progress

## Technical Details

### Player Properties:
- `ultimateActive`: Boolean indicating if ultimate is currently active
- `ultimateTime`: Remaining time in milliseconds for active ultimate
- `ultimateDuration`: 30000ms (30 seconds)
- `ultimateCooldown`: 60000ms (60 seconds)
- `lastUltimateTime`: Timestamp of last activation

### Key Methods:
- `activateUltimate(currentTime)`: Activates the ultimate ability
- `isUltimateReady(currentTime)`: Checks if ultimate is ready to use
- `getUltimateCooldown(currentTime)`: Returns remaining cooldown time

### Visual Effects:
- `createUltimateActivationEffect()`: Creates the dramatic activation effect
- Multiple particle systems with different colors and speeds
- Delayed shockwave rings for dramatic impact
- Screen flash and shake for emphasis

## Strategy Tips
1. **Save for Boss Fights**: The ultimate is perfect for clearing the screen when overwhelmed
2. **Emergency Use**: Use when health is low to gain 30 seconds of safety
3. **Score Maximization**: Activate when many enemies are on screen for maximum points
4. **Cooldown Management**: Remember the 60-second cooldown - use wisely!

## Controls Summary
- **Movement**: WASD or Arrow Keys
- **Fire**: Space or Mouse Click
- **Ultimate**: B Key
- **Pause**: P Key
- **Menu**: Escape Key
