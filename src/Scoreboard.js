import Phaser from 'phaser';

export class Scoreboard extends Phaser.GameObjects.Container {
    constructor(scene, x, y, scale = 1, tint = 0xffffff) {
        super(scene, x, y);
        this.digitScale = scale;
        this.digitTint = tint;
        this.currentValue = -1; // To ensure the first updateValue call renders
        this.digitPadding = 2; // Small padding between digits

        scene.add.existing(this);
        this.setDepth(30); // Ensure scoreboard is on top
    }

    updateValue(value) {
        if (value === this.currentValue) {
            return; // No change, no need to re-render
        }
        this.currentValue = value;
        this.removeAll(true); // Clear previous digits

        const valueStr = String(value);
        let currentX = 0;
        let totalWidth = 0;

        // First pass to calculate total width for centering
        for (let i = 0; i < valueStr.length; i++) {
            const digitKey = 'digit_' + valueStr[i];
            // Assuming all digit textures are loaded and have the same width
            // For simplicity, we'll use a fixed width or get it from the first loaded digit
            // In a real scenario, you might want to ensure all digit textures are loaded and get their width.
            // For now, let's assume a texture width or retrieve it if possible.
            const tempDigitImage = this.scene.add.image(0, 0, digitKey);
            totalWidth += tempDigitImage.width * this.digitScale;
            if (i < valueStr.length - 1) {
                totalWidth += this.digitPadding;
            }
            tempDigitImage.destroy(); // Clean up temporary image
        }
        
        // Start position for the first digit to center the whole number
        currentX = -totalWidth / 2;

        for (let i = 0; i < valueStr.length; i++) {
            const digitKey = 'digit_' + valueStr[i];
            const digitImage = this.scene.add.image(currentX, 0, digitKey);
            digitImage.setScale(this.digitScale);
            digitImage.setTint(this.digitTint);
            digitImage.setOrigin(0, 0.5); // Align digits horizontally, centered vertically

            this.add(digitImage);
            currentX += digitImage.width * this.digitScale + this.digitPadding;
        }
    }

    show() {
        this.setVisible(true);
    }

    hide() {
        this.setVisible(false);
    }

    celebrate() {
        // Simple "pop" tween
        this.scene.tweens.add({
            targets: this,
            scaleX: this.digitScale * 1.3,
            scaleY: this.digitScale * 1.3,
            duration: 100, // Duration of pop out
            yoyo: true, // Go back to original scale
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                // Ensure scale is reset correctly if needed, though yoyo should handle it.
                this.setScale(1); // Reset container scale, individual digits have their scale.
            }
        });
    }
} 