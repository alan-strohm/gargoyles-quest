import { Container, Sprite, Texture } from 'pixi.js';

interface Tile {
    type: 'grass' | 'water' | 'path' | 'forest';
    sprite: Sprite;
    walkable: boolean;
}

export class WorldMap {
    private container: Container;
    private tiles: Tile[][] = [];
    private readonly TILE_SIZE = 64;
    private readonly MAP_WIDTH = 100;
    private readonly MAP_HEIGHT = 100;

    constructor(gameContainer: Container) {
        this.container = new Container();
        gameContainer.addChild(this.container);
    }

    public generate(): void {
        // Create a simple noise-based terrain
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const noise = this.simpleNoise(x, y);
                const tile = this.createTile(x, y, this.getTileTypeFromNoise(noise));
                this.tiles[y][x] = tile;
            }
        }

        // Generate paths
        this.generatePaths();
        
        // Add some forests
        this.generateForests();
        
        // Add some lakes
        this.generateLakes();
    }

    private createTile(x: number, y: number, type: Tile['type']): Tile {
        // Temporary colored rectangles for different tile types
        // Replace with actual sprite textures
        const sprite = new Sprite(Texture.WHITE);
        sprite.width = this.TILE_SIZE;
        sprite.height = this.TILE_SIZE;
        sprite.position.set(x * this.TILE_SIZE, y * this.TILE_SIZE);

        switch (type) {
            case 'grass':
                sprite.tint = 0x7cae68;
                break;
            case 'water':
                sprite.tint = 0x4a90e2;
                break;
            case 'path':
                sprite.tint = 0xc4a484;
                break;
            case 'forest':
                sprite.tint = 0x2d5a27;
                break;
        }

        this.container.addChild(sprite);

        return {
            type,
            sprite,
            walkable: type !== 'water' && type !== 'forest'
        };
    }

    private simpleNoise(x: number, y: number): number {
        // Simple implementation - replace with better noise function
        return Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
    }

    private getTileTypeFromNoise(noise: number): Tile['type'] {
        if (noise < 0.3) return 'water';
        return 'grass';
    }

    private generatePaths(): void {
        // Simple path generation - can be improved with pathfinding algorithms
        const pathY = Math.floor(this.MAP_HEIGHT / 2);
        for (let x = 0; x < this.MAP_WIDTH; x++) {
            if (this.tiles[pathY][x].type !== 'water') {
                this.tiles[pathY][x] = this.createTile(x, pathY, 'path');
            }
        }
    }

    private generateForests(): void {
        // Simple forest generation - can be improved with clustering algorithms
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                if (this.tiles[y][x].type === 'grass' && Math.random() < 0.2) {
                    this.tiles[y][x] = this.createTile(x, y, 'forest');
                }
            }
        }
    }

    private generateLakes(): void {
        // Simple lake generation - can be improved with cellular automata
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                if (this.tiles[y][x].type === 'grass' && Math.random() < 0.1) {
                    this.tiles[y][x] = this.createTile(x, y, 'water');
                }
            }
        }
    }

    public update(delta: number): void {
        // Update any animated tiles or effects
    }

    public getTileAt(x: number, y: number): Tile | null {
        if (x >= 0 && x < this.MAP_WIDTH && y >= 0 && y < this.MAP_HEIGHT) {
            return this.tiles[y][x];
        }
        return null;
    }
} 