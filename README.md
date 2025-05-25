# Gargoyle's Quest - A 2D Adventure Game

A browser-based 2D adventure game where you play as a mystical gargoyle exploring a vast world filled with mysteries, monsters, and magical gems.

## Game Features

- **Rich 2D World**: Explore a detailed top-down pixel-art world featuring forests, lakes, and winding paths
- **Dynamically generated**: Explore a wide variety of dynamically generated houses
- **Responsive Design**: Enjoy the game on both desktop and mobile devices

## Technical Stack

- Built on the phaser game engine.
- TypeScript for type-safe game logic
- Vite for fast builds and development
- Built on a 32px square grid.

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
  - `assets/` - Raw game assets (sprites, sounds, etc.)
  - `public/` - Files directly published.
  - `components/` - UI components
  - `utils/` - Utility functions
  - `types/` - TypeScript type definitions

## License

MIT
