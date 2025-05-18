import { Scene } from "phaser";

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 175;
  private pointer: Phaser.Input.Pointer;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragThreshold: number = 10; // Minimum distance to start movement

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

  constructor(scene: Scene, x: number, y: number) {
    // Create the player sprite
    this.sprite = scene.physics.add
      .sprite(x, y, "atlas", "misa-back")
      .setSize(30, 40)
      .setOffset(0, 24);

    // Get cursor keys
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input not available");
    }
    this.cursors = keyboard.createCursorKeys();

    // Set up pointer input
    this.pointer = scene.input.activePointer;
    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return;

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.dragThreshold) {
      // Calculate normalized direction vector
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Set velocity based on drag direction
      if (this.sprite.body) {
        this.sprite.body.velocity.x = dirX * this.speed;
        this.sprite.body.velocity.y = dirY * this.speed;

        // Update animation based on dominant direction
        if (Math.abs(dirX) > Math.abs(dirY)) {
          this.sprite.anims.play(dirX > 0 ? "misa-right-walk" : "misa-left-walk", true);
        } else {
          this.sprite.anims.play(dirY > 0 ? "misa-front-walk" : "misa-back-walk", true);
        }
      }
    }
  }

  private handlePointerUp() {
    this.isDragging = false;
    if (this.sprite.body) {
      this.sprite.body.velocity.set(0);
      this.sprite.anims.stop();
    }
  }

  update() {
    if (!this.sprite.body) {
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const prevVelocity = body.velocity.clone();

    // Only handle keyboard input if not dragging
    if (!this.isDragging) {
      // Stop any previous movement from the last frame
      body.setVelocity(0);

      // Horizontal movement
      if (this.cursors.left.isDown) {
        body.setVelocityX(-this.speed);
      } else if (this.cursors.right.isDown) {
        body.setVelocityX(this.speed);
      }

      // Vertical movement
      if (this.cursors.up.isDown) {
        body.setVelocityY(-this.speed);
      } else if (this.cursors.down.isDown) {
        body.setVelocityY(this.speed);
      }

      // Normalize and scale the velocity so that player can't move faster along a diagonal
      body.velocity.normalize().scale(this.speed);

      // Update the animation last and give left/right animations precedence over up/down animations
      if (this.cursors.left.isDown) {
        this.sprite.anims.play("misa-left-walk", true);
      } else if (this.cursors.right.isDown) {
        this.sprite.anims.play("misa-right-walk", true);
      } else if (this.cursors.up.isDown) {
        this.sprite.anims.play("misa-back-walk", true);
      } else if (this.cursors.down.isDown) {
        this.sprite.anims.play("misa-front-walk", true);
      } else {
        this.sprite.anims.stop();

        // If we were moving, pick and idle frame to use
        if (prevVelocity.x < 0) this.sprite.setTexture("atlas", "misa-left");
        else if (prevVelocity.x > 0) this.sprite.setTexture("atlas", "misa-right");
        else if (prevVelocity.y < 0) this.sprite.setTexture("atlas", "misa-back");
        else if (prevVelocity.y > 0) this.sprite.setTexture("atlas", "misa-front");
      }
    }
  }

  // Getters for collision and camera setup
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }
} 