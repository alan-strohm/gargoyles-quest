import { Container, Graphics } from 'pixi.js';
import { World, Bodies, Body } from 'matter-js';

export interface Power {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export class Player {
    private container: Container;
    private graphics: Graphics;
    private physicsBody: Body;
    
    public health: number = 100;
    public coins: number = 0;
    public powers: Power[] = [];
    
    private speed: number = 5;

    constructor(gameContainer: Container, world: World) {
        this.container = new Container();
        gameContainer.addChild(this.container);

        // Create a playful pink gargoyle
        this.graphics = new Graphics();
        
        // Main body (pink)
        this.graphics.beginFill(0xFFB6C1); // Light pink
        this.graphics.drawRect(-16, -8, 32, 24); // Body
        this.graphics.endFill();
        
        // Head
        this.graphics.beginFill(0xFFB6C1);
        this.graphics.drawCircle(0, -16, 12); // Head
        this.graphics.endFill();
        
        // Horns
        this.graphics.beginFill(0xFF69B4); // Hot pink for horns
        this.graphics.moveTo(-8, -24);
        this.graphics.lineTo(-4, -28);
        this.graphics.lineTo(0, -24);
        this.graphics.endFill();
        
        this.graphics.beginFill(0xFF69B4);
        this.graphics.moveTo(8, -24);
        this.graphics.lineTo(4, -28);
        this.graphics.lineTo(0, -24);
        this.graphics.endFill();
        
        // Eyes
        this.graphics.beginFill(0x000000);
        this.graphics.drawCircle(-4, -18, 2); // Left eye
        this.graphics.drawCircle(4, -18, 2);  // Right eye
        this.graphics.endFill();
        
        // Wings
        this.graphics.beginFill(0xFFB6C1);
        this.graphics.drawEllipse(-20, 0, 8, 12); // Left wing
        this.graphics.drawEllipse(20, 0, 8, 12);  // Right wing
        this.graphics.endFill();
        
        this.container.addChild(this.graphics);

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