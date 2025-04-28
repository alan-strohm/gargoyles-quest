import { Container, Sprite } from 'pixi.js';
import { World, Bodies, Body } from 'matter-js';

export interface Power {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export class Player {
    private container: Container;
    private sprite: Sprite;
    private physicsBody: Body;
    
    public health: number = 100;
    public coins: number = 0;
    public powers: Power[] = [];
    
    private speed: number = 5;

    constructor(gameContainer: Container, world: World) {
        this.container = new Container();
        gameContainer.addChild(this.container);

        // Create temporary sprite (replace with actual gargoyle sprite)
        this.sprite = Sprite.from('placeholder-gargoyle.png');
        this.sprite.anchor.set(0.5);
        this.container.addChild(this.sprite);

        // Create physics body
        this.physicsBody = Bodies.rectangle(0, 0, 32, 32, {
            inertia: Infinity,
            friction: 0.1,
            frictionAir: 0.05
        });
        World.add(world, this.physicsBody);

        // Set up keyboard controls
        this.setupControls();
    }

    public spawn(x: number, y: number): void {
        Body.setPosition(this.physicsBody, { x, y });
        this.container.position.set(x, y);
    }

    public update(): void {
        // Update sprite position to match physics body
        const pos = this.physicsBody.position;
        this.container.position.set(pos.x, pos.y);

        // Update sprite rotation to match physics body
        this.container.rotation = this.physicsBody.angle;
    }

    private setupControls(): void {
        const keys: { [key: string]: boolean } = {};
        
        window.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            this.handleMovement(keys);
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
            this.handleMovement(keys);
        });
    }

    private handleMovement(keys: { [key: string]: boolean }): void {
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w']) dy -= this.speed;
        if (keys['ArrowDown'] || keys['s']) dy += this.speed;
        if (keys['ArrowLeft'] || keys['a']) dx -= this.speed;
        if (keys['ArrowRight'] || keys['d']) dx += this.speed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        Body.setVelocity(this.physicsBody, { x: dx, y: dy });
    }

    public addPower(power: Power): void {
        this.powers.push(power);
    }

    public collectCoin(): void {
        this.coins++;
    }

    public takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
    }
} 