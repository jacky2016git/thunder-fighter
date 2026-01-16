# Thunder Fighter - Gameplay Guide (游戏玩法指南)

## 🎮 Getting Started (开始游戏)

### Main Menu (主菜单)

When you start the game, you'll see the main menu with the following options:
- **开始游戏 / START GAME** - Begin a new game
- Use **↑↓** or **W/S** to navigate
- Press **ENTER** or **SPACE** to confirm

### Controls (控制方式)

#### Keyboard Controls (键盘控制)

| Key | Action |
|-----|--------|
| ↑ / W | Move Up (向上移动) |
| ↓ / S | Move Down (向下移动) |
| ← / A | Move Left (向左移动) |
| → / D | Move Right (向右移动) |
| SPACE | Fire (射击) |
| P | Pause Game (暂停游戏) |
| ESC | Pause / Return to Menu (暂停/返回菜单) |
| ENTER | Confirm Selection (确认选择) |

#### Mouse Controls (鼠标控制)

| Action | Effect |
|--------|--------|
| Left Click | Fire (射击) |
| Click on Menu | Select Option (选择选项) |

## 🛩️ Your Aircraft (你的战机)

### Stats (属性)

- **Health (生命值)**: 3 points - displayed as hearts in the top-right
- **Weapon Level (武器等级)**: 1-3 - displayed as dots below health bar
- **Speed (速度)**: 300 pixels/second

### Abilities (能力)

1. **Movement (移动)**: Full 8-directional movement within the game area
2. **Shooting (射击)**: Automatic fire when holding the fire button
3. **Invincibility (无敌)**: Brief invincibility after taking damage (2 seconds)

### Weapon Levels (武器等级)

| Level | Bullets | Pattern |
|-------|---------|---------|
| 1 | 1 | Single center shot |
| 2 | 2 | Dual side-by-side shots |
| 3 | 3 | Triple spread pattern |

## 👾 Enemies (敌机)

### Enemy Types (敌机类型)

#### Basic Enemy (基础敌机) 🔴
- **Health**: 1
- **Score**: 10 points
- **Behavior**: Moves straight down
- **Threat Level**: Low

#### Shooter Enemy (射击敌机) 🟠
- **Health**: 2
- **Score**: 20 points
- **Behavior**: Moves down and fires bullets
- **Fire Rate**: Every 2 seconds
- **Threat Level**: Medium

#### Zigzag Enemy (之字形敌机) 🟣
- **Health**: 2
- **Score**: 30 points
- **Behavior**: Moves in a zigzag pattern
- **Threat Level**: Medium

#### Boss Enemy (Boss敌机) 🔴⬛
- **Health**: 20
- **Score**: 200 points
- **Behavior**: Complex movement, fires multiple bullets
- **Appears**: Every 50 enemies destroyed
- **Threat Level**: High

## ⭐ Power-Ups (道具)

Power-ups drop randomly when enemies are destroyed (15% chance).

### Types (类型)

#### Weapon Upgrade (武器升级) ⭐
- **Color**: Gold/Yellow
- **Effect**: Increases weapon level by 1 (max level 3)
- **Duration**: Permanent until game over

#### Health (生命恢复) ➕
- **Color**: Green
- **Effect**: Restores 1 health point
- **Note**: Cannot exceed maximum health (3)

#### Shield (护盾) 🛡️
- **Color**: Blue
- **Effect**: Grants temporary invincibility
- **Duration**: 2 seconds

## 📊 Scoring System (得分系统)

### Base Points (基础分数)

| Enemy Type | Points |
|------------|--------|
| Basic | 10 |
| Shooter | 20 |
| Zigzag | 30 |
| Boss | 200 |

### Combo System (连击系统)

- Kill 3+ enemies within 2 seconds to activate combo
- **Combo Multiplier**: 1.5x points
- Combo resets if no kills for 2 seconds

### Accuracy Bonus (准确率奖励)

- Calculated at game over: (Hits / Shots) × 100%
- **Bonus**: If accuracy > 70%, final score × 1.2

### High Score (最高分)

- High scores are saved locally in your browser
- Displayed on the main menu and game over screen

## 🎯 Tips & Strategies (技巧与策略)

### Beginner Tips (新手技巧)

1. **Stay near the bottom** - More reaction time for bullets
2. **Keep moving** - A moving target is harder to hit
3. **Prioritize shooters** - They're the biggest threat
4. **Collect power-ups** - Weapon upgrades make a big difference

### Advanced Strategies (进阶策略)

1. **Combo hunting** - Group enemies together for combo kills
2. **Accuracy focus** - Aim carefully for the 20% bonus
3. **Boss patterns** - Learn the boss movement to dodge effectively
4. **Shield timing** - Save shields for dangerous situations

### Survival Tips (生存技巧)

1. **Watch for bullet patterns** - Enemy bullets are slower than yours
2. **Use invincibility wisely** - After damage, you have 2 seconds to reposition
3. **Don't chase power-ups** - If it's too dangerous, let it go
4. **Stay calm during boss fights** - Patience wins

## 🏆 Achievements (成就)

Try to accomplish these challenges:

- [ ] **First Blood** - Destroy your first enemy
- [ ] **Combo Master** - Get a 10+ kill combo
- [ ] **Sharpshooter** - Finish a game with 80%+ accuracy
- [ ] **Boss Slayer** - Defeat a boss enemy
- [ ] **Survivor** - Reach 1000 points without taking damage
- [ ] **High Scorer** - Reach 10,000 points
- [ ] **Legend** - Reach 50,000 points

## ⚙️ Game Settings (游戏设置)

### Display (显示)

- Canvas Size: 480 × 800 pixels
- Target FPS: 60 frames per second

### Audio (音频)

- Sound effects for shooting, explosions, and power-ups
- Background music during gameplay
- Audio can be muted (feature coming soon)

## 🐛 Troubleshooting (故障排除)

### Game Won't Start (游戏无法启动)

1. Make sure JavaScript is enabled
2. Try refreshing the page
3. Clear browser cache
4. Try a different browser

### Performance Issues (性能问题)

1. Close other browser tabs
2. Disable browser extensions
3. Update your browser
4. Check if hardware acceleration is enabled

### Controls Not Working (控制无响应)

1. Click on the game canvas to focus
2. Make sure no other element has focus
3. Check if keyboard shortcuts are conflicting

---

**Good luck, pilot! 祝你好运，飞行员！** 🚀
