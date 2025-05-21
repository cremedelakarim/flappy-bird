import Phaser from 'phaser';

const BIRD_KEY = 'bird_sheet';
const BIRD_PLACEHOLDER_KEY = 'bird_placeholder';

export class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        let textureKey = BIRD_KEY;
        if (!scene.textures.exists(BIRD_KEY)) {
            console.warn(`Texture '${BIRD_KEY}' not found. Using placeholder.`);
            textureKey = BIRD_PLACEHOLDER_KEY;
            if (!scene.textures.exists(BIRD_PLACEHOLDER_KEY)) {
                let graphics = scene.make.graphics({ x: 0, y: 0, add: false });
                graphics.fillStyle(0xffff00); // Yellow color for the bird
                graphics.fillRect(0, 0, 34, 24); // Dimensions similar to common Flappy Bird sprites
                graphics.generateTexture(BIRD_PLACEHOLDER_KEY, 34, 24);
                graphics.destroy();
            }
        }
        
        super(scene, x, y, textureKey);

        // If using a spritesheet, you might want to play an animation
        // if (textureKey === BIRD_KEY && scene.anims.exists('flap_anim')) { 
        //    this.play('flap_anim'); 
        // } else if (textureKey === BIRD_KEY) {
        //    // Create animation if it doesn't exist (example)
        //    scene.anims.create({
        //        key: 'flap_anim',
        //        frames: scene.anims.generateFrameNumbers(BIRD_KEY, { start: 0, end: 2 }), // Assuming 3 frames
        //        frameRate: 10,
        //        repeat: -1
        //    });
        //    this.play('flap_anim');
        // }

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setGravityY(1000); // Initial gravity for the bird

        // Flap action
        scene.input.on('pointerdown', this.flap, this);
        // Also listen for spacebar key for flapping
        this.flapKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.flapVelocity = -350; // The upward velocity applied on flap
    }

    flap() {
        if (this.scene.game.stateMachine && this.scene.game.stateMachine.getCurrentState() === 'running') {
            this.body.velocity.y = this.flapVelocity;
        }
    }

    update(time, delta) {
        // Handle keyboard input for flapping
        if (Phaser.Input.Keyboard.JustDown(this.flapKey)) {
            this.flap();
        }

        // Angle the bird downwards as it falls, upwards as it flaps (simple visual)
        if (this.body.velocity.y < 0) {
            this.angle = -15; // Pointing slightly up
        } else if (this.body.velocity.y > 0) {
            this.angle = 15;  // Pointing slightly down
        }

        // Prevent falling through the ground (simple check, ideally use collision)
        if (this.y + this.displayHeight / 2 > this.scene.game.config.height - 50) { // 50 is ground height
            // this.y = this.scene.game.config.height - 50 - this.displayHeight / 2;
            // this.body.velocity.y = 0;
            // this.body.setAllowGravity(false); // Stop gravity if on ground
            // Potentially trigger game over here if not already
        }
    }
} 