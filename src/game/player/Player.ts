import { Scene, Events } from "phaser";

export enum Direction {
  UP = 1,
  RIGHT = 2,
  DOWN = 3,
  LEFT = 4
}

// Define the types of movement events you want to emit.
export enum PlayerEvents {
    MOVE = 'move',
    STOP = 'stop',
    ACTIVATE = 'activate'
}

// Define the payload for the 'move' event.
export interface MoveEventData {
    direction: Direction;
    speed: number;
}

const DRAG_THRESHOLD: number = 10; // Minimum distance to start movement
const TAP_THRESHOLD: number = 200; // milliseconds to distinguish between tap and drag
const ACTIVATION_DISTANCE: number = 4; // Distance in front of player to activate

/**
 * Player class that handles character movement, animation, and interaction in the game.
 *
 * ### Movement
 *
 * The class manages sprite animations for all movement directions and emits
 * events when the player starts and stops moving.
 *
 * ### Movement controls
 *
 * The player can be moved via keyboard (arrow keys) or drag motions.  Drag
 * works by clicking / tapping anywhere in the scene and dragging in the
 * direction you want the player to move.
 *
 * TODO: support asdw and dpad controls.
 * TODO: add a visual indicator for drag motions.
 *
 * ### Activation input
 *
 * The player can "activate" the object in front of them.  They do this by
 * clicking / tapping or pressing the space bar.  This results in an
 * "activation" event with the a point directly in front of the player.
 * Clients of this class must listen to those events and identify which object,
 * if any is at that point.
 *
 */
export class Player extends Events.EventEmitter {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private speed: number = 175;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private facingDirection: Direction = Direction.UP;
  private pointerDownTime: number = 0;
  private activeKeys: Set<string> = new Set();
  private cleanupCallbacks: Array<() => void> = [];

  static createAnimations(anims: Phaser.Animations.AnimationManager) {
    anims.create({
      key: "misa-left-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-left-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-right-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-right-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-front-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-front-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: "misa-back-walk",
      frames: anims.generateFrameNames("atlas", {
        prefix: "misa-back-walk.",
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }


  constructor(scene: Scene, position: Phaser.Math.Vector2, facingDirection: Direction = Direction.UP) {
    super();

    this.sprite = scene.physics.add
      .sprite(position.x, position.y, "atlas", "misa-back")
      .setSize(26, 40)
      .setOffset(4, 24);
    if (!this.sprite.body) {
      throw new Error("Sprite must have a physics body");
    }

    this.facingDirection = facingDirection;
    this.setTextureForDirection(facingDirection);

    const input = scene.input;
    input.on('pointerdown', this.handlePointerDown, this);
    input.on('pointermove', this.handlePointerMove, this);
    input.on('pointerup', this.handlePointerUp, this);

    // Register cleanup for pointer handlers
    this.registerCleanupCallback(() => {
      input.off('pointerdown', this.handlePointerDown, this);
      input.off('pointermove', this.handlePointerMove, this);
      input.off('pointerup', this.handlePointerUp, this);
    });

    // Register event listeners
    this.on(PlayerEvents.MOVE, this.handleMove);
    this.on(PlayerEvents.STOP, this.handleStop);

    const keyboard = input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input not available");
    }
    this.setupKeyboardInput(keyboard);
  }

  private setupKeyboardInput(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    keyboard.on('keydown', (event: KeyboardEvent) => {
      // Add the key to active keys
      this.activeKeys.add(event.code);

      if (event.code === 'Space') {
        this.handleActivation();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        const lastDirection = this.getLastPressedDirection();
        if (lastDirection !== null) {
          this.emit(PlayerEvents.MOVE, { direction: lastDirection, speed: this.speed });
        }
      }
    });

    keyboard.on('keyup', (event: KeyboardEvent) => {
      // Remove the key from active keys
      this.activeKeys.delete(event.code);

      // Only handle movement keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        // If there are still direction keys pressed, move in that direction
        const remainingDirection = this.getLastPressedDirection();
        if (remainingDirection) {
          this.emit(PlayerEvents.MOVE, { direction: remainingDirection, speed: this.speed });
        } else {
          this.emit(PlayerEvents.STOP);
        }
      }
    });

    // Register cleanup for keyboard handlers
    this.registerCleanupCallback(() => {
      keyboard.off('keydown');
      keyboard.off('keyup');
    });
  }

  private getLastPressedDirection(): Direction | null {
    // Check keys in reverse order of priority (right, left, down, up)
    if (this.activeKeys.has('ArrowRight')) return Direction.RIGHT;
    if (this.activeKeys.has('ArrowLeft')) return Direction.LEFT;
    if (this.activeKeys.has('ArrowDown')) return Direction.DOWN;
    if (this.activeKeys.has('ArrowUp')) return Direction.UP;
    return null;
  }

  private getActivationPoint(): Phaser.Math.Vector2 {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const centerX = body.center.x;
    const centerY = body.center.y;
    const halfWidth = body.width / 2;
    const halfHeight = body.height / 2;

    switch (this.facingDirection) {
      case Direction.UP:
        return new Phaser.Math.Vector2(centerX, centerY - halfHeight - ACTIVATION_DISTANCE);
      case Direction.RIGHT:
        return new Phaser.Math.Vector2(centerX + halfWidth + ACTIVATION_DISTANCE, centerY);
      case Direction.DOWN:
        return new Phaser.Math.Vector2(centerX, centerY + halfHeight + ACTIVATION_DISTANCE);
      case Direction.LEFT:
        return new Phaser.Math.Vector2(centerX - halfWidth - ACTIVATION_DISTANCE, centerY);
    }
  }

  private handleActivation() {
    if (this.isMoving()) {
      return;
    }

    const activationPoint = this.getActivationPoint();
    this.emit('activate', activationPoint);
  }

  private isMoving(): boolean {
    const velocity = this.sprite.body!.velocity;
    return Math.abs(velocity.x) > 0 || Math.abs(velocity.y) > 0;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.pointerDownTime = Date.now();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return;

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > DRAG_THRESHOLD) {
      // Calculate normalized direction vector
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Determine primary direction based on the larger component
      let direction: Direction;
      if (Math.abs(dirX) > Math.abs(dirY)) {
        direction = dirX > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        direction = dirY > 0 ? Direction.DOWN : Direction.UP;
      }

      // Emit move event with the determined direction
      this.emit(PlayerEvents.MOVE, { direction, speed: this.speed });
    }
  }

  private handlePointerUp() {
    const pointerUpTime = Date.now();
    const pressDuration = pointerUpTime - this.pointerDownTime;

    // If it was a quick tap (not a drag), handle activation
    if (pressDuration < TAP_THRESHOLD && !this.isMoving()) {
      this.handleActivation();
    }

    this.isDragging = false;
    this.emit(PlayerEvents.STOP);
  }

  private handleMove(data: MoveEventData) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);

      switch (data.direction) {
          case Direction.UP:
              body.setVelocityY(-data.speed);
              this.sprite.anims.play("misa-back-walk", true);
              this.facingDirection = Direction.UP;
              break;
          case Direction.DOWN:
              body.setVelocityY(data.speed);
              this.sprite.anims.play("misa-front-walk", true);
              this.facingDirection = Direction.DOWN;
              break;
          case Direction.LEFT:
              body.setVelocityX(-data.speed);
              this.sprite.anims.play("misa-left-walk", true);
              this.facingDirection = Direction.LEFT;
              break;
          case Direction.RIGHT:
              body.setVelocityX(data.speed);
              this.sprite.anims.play("misa-right-walk", true);
              this.facingDirection = Direction.RIGHT;
              break;
      }
  }

  private handleStop() {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);
      this.sprite.anims.stop();
      this.setTextureForDirection(this.facingDirection);
  }

  private setTextureForDirection(direction: Direction) {
    switch (direction) {
      case Direction.LEFT:
        this.sprite.setTexture("atlas", "misa-left");
        break;
      case Direction.RIGHT:
        this.sprite.setTexture("atlas", "misa-right");
        break;
      case Direction.UP:
        this.sprite.setTexture("atlas", "misa-back");
        break;
      case Direction.DOWN:
        this.sprite.setTexture("atlas", "misa-front");
        break;
    }
  }

  private registerCleanupCallback(callback: () => void) {
    this.cleanupCallbacks.push(callback);
  }

  shutdown() {
    // Execute all registered cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      callback();
    }
    this.cleanupCallbacks = [];

    // Stop all movement and animations
    if (this.sprite?.body) {
      this.sprite.body.velocity.set(0, 0);
      this.sprite.anims.stop();
    }

    // Destroy the sprite
    this.sprite?.destroy();

    // Reset state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.activeKeys.clear();
  }

  // Getters for collision and camera setup
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  getSpeed(): number {
    return this.speed;
  }
}
