# Downstairs Dash: Game Specification

A high-performance HTML5 canvas game where a player controls a "little kid" (color block) walking vertically downstairs.

## 1. Game Concept
The game involves a player navigating a series of platforms (stairs) that scroll upwards. The goal is to descend as far as possible without hitting the top of the screen or falling into pits at the bottom.

## 2. Visual Style & Aesthetics
- **Premium Design**: Modern, flat UI with a dark background and vibrant color blocks.
- **Player Character**: A 40x40px blue color block (`#3b82f6`) with a slight glow and smooth movement animations.
- **Platforms**: Color-coded blocks (slate grey `#475569`) with occasional "special" platforms (e.g., bouncy or slippery).
- **Background**: Deep charcoal gradient (`#0f172a` to `#1e293b`) to make the colors pop.
- **Typography**: Clean sans-serif (Inter or system UI).

## 3. Core Mechanics
- **Vertical Movement**: Gravity constantly pulls the player down. Landing on a platform stops the fall.
- **Scrolling**: The screen/platforms move UP at an increasing speed.
- **Walking**: Left/Right movement via Arrow keys or A/D.
- **Jump**: A small jump capability to navigate gaps.
- **Vertical "Walking" Loop**: The character must find gaps or trapdoor-like stairs to go lower.

## 4. UI Elements
- **Score**: Displayed at the top right (distance descended).
- **HUD**: Subtle progress bar or level indicator.
- **Game Over Screen**: Minimalist popup with "New Game" button and final score.

## 5. Technical Stack
- **Engine**: Custom Vanilla Javascript with HTML5 Canvas.
- **Styling**: Vanilla CSS for layout and menus.
- **States**: `MENU`, `PLAYING`, `GAMEOVER`.

---

## Proposed Implementation Steps

### Phase 1: Foundation
- [ ] Create `index.html` with Canvas and UI overlay.
- [ ] Create `style.css` for aesthetic styling.

### Phase 2: Game Logic
- [ ] Implement `Player` class with physics.
- [ ] Implement `Platform` generator and scrolling mechanism.
- [ ] Implement Collision Detection.

### Phase 3: Polish
- [ ] Add score tracking.
- [ ] Add smooth transitions and "juice" (particles/animations).
- [ ] Implement "Game Over" logic.
