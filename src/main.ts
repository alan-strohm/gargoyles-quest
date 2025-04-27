import { Application } from 'pixi.js';
import { Game } from './game/Game';

// Initialize PIXI Application
const app = new Application({
    view: document.getElementById('game-canvas') as HTMLCanvasElement,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    backgroundColor: 0x7cae68, // Nature-themed background color
    width: window.innerWidth - 300, // Account for side panel
    height: window.innerHeight,
});

// Handle window resize
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth - 300, window.innerHeight);
});

// Initialize game
const game = new Game(app);
game.start(); 