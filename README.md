# Neon Striker - Game Mechanics Update

This repository contains the latest updates for **Neon Striker**, a high-octane neon-themed space shooter.

## Recent Changes & Features

### 🚀 Weapon & Power-up System
- **Dynamic Weapon Tiers**: Weapon upgrades (`W` item) now scale up to **9 stages (9-Way spread)**.
- **Infinite Power Scaling**: Beyond stage 9, collecting weapon items increases **bullet damage** infinitely rather than bullet count, ensuring high-tier progression remains meaningful without performance loss.
- **Homing Missiles (`H`)**:
  - Increased drop rate to **20%**.
  - Automatically targets the nearest enemy in front of the player.
  - **Status Reset**: Homing ability is lost if the player ship takes damage.
- **Enhanced Drop Rates**: Overall item drop rate increased to **30%** for faster progression.

### 🐍 Snake Formation (Trailing Clones)
- **Sequential Follow**: Clones now follow the player in a smooth, one-by-one "Snake" formation.
- **Dynamic Spacing**: The distance between clones automatically tightens as the number of clones increases, maintaining a compact and visually satisfying trail even with a large army.
- **Clone Durability**: Each clone now has **3 HP**, allowing it to withstand multiple hits before being destroyed.

### ⚖️ Balancing & Difficulty Scaling
- **Adaptive Health**: Blocker (Square) enemies and Bosses now have their health dynamically adjusted based on the player's current power and whether Homing is active, maintaining a consistent challenge.
- **Boss Progression**: Fixed level advancement logic to ensure all active bosses must be defeated before proceeding to the next level.

### ⚡ Performance Optimizations
- **Hit Effect Throttling**: Visual sparks on hit are now throttled during high-frequency fire to prevent performance lag.
- **Particle Optimization**: Optimized explosion particle counts for normal enemies to ensure smooth gameplay during intense combat.

## How to Play
- **Move**: Mouse or Arrow Keys / WASD
- **Shoot**: Hold Space or Left Mouse Button
- **Collect**: Pick up floating power-ups (`W`, `H`, `C`, `L`, `S`) to enhance your ship.
