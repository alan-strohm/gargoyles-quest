import { Scene } from "phaser";

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 175;

  constructor(scene: Scene, x: number, y: number) {
    // Create the player sprite
    this.sprite = scene.physics.add
      .sprite(x, y, "atlas", "misa-back")
      .setSize(30, 40)
      .setOffset(0, 24);

    // Create the player's walking animations
    const anims = scene.anims;
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

    // Get cursor keys
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input not available");
    }
    this.cursors = keyboard.createCursorKeys();
  }

  update() {
    if (!this.sprite.body) {
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const prevVelocity = body.velocity.clone();

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

  // Getters for collision and camera setup
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }
} 