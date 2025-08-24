# Brotato Clone

A simple Brotato game clone built with React and Phaser.js. This is a top-down survival shooter where you control a character and must survive waves of enemies.

## Features

- **Player Movement**: Use WASD or Arrow keys to move your character
- **Shooting**: Press Spacebar to shoot bullets (aim with mouse)
- **Enemy Waves**: Enemies spawn from all sides and move toward you
- **Health System**: Take damage from enemy contact and bullets
- **Scoring**: Earn points by destroying enemies
- **Game Over**: Restart the game by pressing R when you die

## Gameplay

- **Green Circle**: Your player character
- **Red Circles**: Enemy enemies that chase you
- **Yellow Bullets**: Your projectiles
- **Purple Bullets**: Enemy projectiles

## Controls

- **Movement**: WASD or Arrow Keys
- **Shoot**: Spacebar
- **Aim**: Mouse cursor
- **Restart**: R (when game over)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Build

To build for production:
```bash
npm run build
```

## Technologies Used

- **React 18**: UI framework
- **Phaser 3**: Game engine
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

## Game Mechanics

- Enemies spawn from the edges of the screen
- They move toward your position
- Enemies occasionally shoot bullets at you
- You can shoot bullets to destroy enemies
- Each enemy destroyed gives you 10 points
- Taking damage reduces your health
- Game ends when health reaches 0

## Development

The game is structured with:
- `GameScene`: Main gameplay logic, physics, and entities
- `UIScene`: User interface elements and game state display
- React components for game initialization and management

This is a simplified version of Brotato focusing on the core survival mechanics. The game uses simple geometric shapes for graphics and basic physics for movement and collisions.





https://github.com/user-attachments/assets/c7834c06-bb0a-436f-963d-34c2e9ed4e46



