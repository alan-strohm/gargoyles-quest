import { Application, Container } from 'pixi.js';
import { World, Engine } from 'matter-js';
import { Player } from './entities/Player';
import { WorldMap } from './world/WorldMap';
import { UIManager } from './ui/UIManager';

export class Game {
    private app: Application;
    private gameContainer: Container;
    private physicsEngine: Engine;
    private world: World;
    private player: Player;
    private worldMap: WorldMap;
    private uiManager: UIManager;

    constructor(app: Application) {
        this.app = app;
        this.gameContainer = new Container();
        this.app.stage.addChild(this.gameContainer);
        
        // Initialize physics
        this.physicsEngine = Engine.create({
            gravity: { x: 0, y: 0 } // Top-down game has no gravity
        });
        this.world = this.physicsEngine.world;

        // Initialize game systems
        this.worldMap = new WorldMap(this.gameContainer);
        this.player = new Player(this.gameContainer, this.world);
        this.uiManager = new UIManager();

        // Set up game loop
        this.app.ticker.add(this.update.bind(this));
    }

    public start(): void {
        this.worldMap.generate();
        this.player.spawn(window.innerWidth / 2, window.innerHeight / 2);
        this.uiManager.initialize();
    }

    private update(delta: number): void {
        // Update physics
        Engine.update(this.physicsEngine, delta * 16.67); // Convert to approximate milliseconds

        // Update game entities
        this.player.update(delta);
        this.worldMap.update(delta);

        // Update UI
        this.uiManager.update({
            playerHealth: this.player.health,
            playerCoins: this.player.coins,
            activePowers: this.player.powers
        });
    }
} 