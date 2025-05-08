# Gargoyle's Quest - A 2D Adventure Game

A browser-based 2D adventure game where you play as a mystical gargoyle exploring a vast world filled with mysteries, monsters, and magical gems.

## Game Features

- **Rich 2D World**: Explore a detailed top-down pixel-art world featuring forests, lakes, and winding paths
- **Power Gems**: Discover magical gems that grant unique abilities to your gargoyle
- **Combat System**: Battle various monsters using your gargoyle's abilities
- **Economy**: Collect coins throughout the world to purchase upgrades and items in the store
- **Responsive Design**: Enjoy the game on both desktop and mobile devices

## Technical Stack

- HTML5 Canvas for rendering
- TypeScript for type-safe game logic
- Vite for fast builds and development
- PixiJS for 2D rendering
- Matter.js for physics (collisions and movements)

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to Cloudflare Pages or similar static hosting services.

## Project Structure

- `src/` - Source code
  - `game/` - Game logic and systems
  - `assets/` - Game assets (sprites, sounds, etc.)
  - `components/` - UI components
  - `utils/` - Utility functions
  - `types/` - TypeScript type definitions

## License

MIT
