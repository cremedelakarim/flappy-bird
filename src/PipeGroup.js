import Phaser from 'phaser';

const PIPE_KEY = 'pipe_green';
const PIPE_PLACEHOLDER_KEY = 'pipe_placeholder';

// NEW: Helper constants for pipe head and body
const PIPE_HEAD_HEIGHT = 26; // px
const PIPE_HEAD_KEY = 'pipe_green_head';
const PIPE_BODY_KEY = 'pipe_green_body';

// Difficulty Constants
const INITIAL_PIPE_VELOCITY_X = -150;
const PIPE_VELOCITY_X_INCREMENT_PER_SCORE = -2; // Increase speed (more negative)
const MAX_PIPE_VELOCITY_X = -300;
const INITIAL_SPAWN_DELAY = 2000; // ms
const SPAWN_DELAY_DECREMENT_PER_SCORE = 20; // ms
const MIN_SPAWN_DELAY = 1000; // ms
const INITIAL_PIPE_GAP      = 150;
const MIN_PIPE_GAP          = 80;
const INITIAL_PIPE_SPACING  = 250;
const MIN_PIPE_SPACING      = 200;
const DIFFICULTY_STEP_SCORE = 2;   // every 2 pts

export class PipeGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);

        this.scene = scene;
        this.pipeSpacing = INITIAL_PIPE_SPACING; // Horizontal space between pipe pairs
        this.pipeGap = INITIAL_PIPE_GAP;     // Vertical gap between upper and lower pipe
        this.pipeWidth = 52;    // NEW: Use native sprite width
        this.currentPipeVelocityX = INITIAL_PIPE_VELOCITY_X; // Use current, not fixed
        this.currentSpawnDelay = INITIAL_SPAWN_DELAY;
        this.pipeTextureKey = PIPE_KEY; // Default to original, will be replaced by dynamic textures

        // NEW: Cache for generated pipe textures
        this.generatedPipeTextures = {};

        if (!scene.textures.exists(PIPE_KEY)) {
            console.warn(`Texture '${PIPE_KEY}' not found. Using placeholder.`);
            this.pipeTextureKey = PIPE_PLACEHOLDER_KEY;
            if (!scene.textures.exists(PIPE_PLACEHOLDER_KEY)) {
                let graphics = scene.make.graphics({ x: 0, y: 0, add: false });
                graphics.fillStyle(0x00ff00); // Green color for pipes
                graphics.fillRect(0, 0, this.pipeWidth, scene.game.config.height); // Tall enough to be cut
                graphics.generateTexture(PIPE_PLACEHOLDER_KEY, this.pipeWidth, scene.game.config.height);
                graphics.destroy();
            }
        } else {
            // NEW: Slice the original pipe texture into head and body parts
            // Ensure this runs only once, even if PipeGroup is instantiated multiple times (though unlikely in this game)
            if (!scene.textures.exists(PIPE_HEAD_KEY)) {
                const pipeImage = scene.textures.get(PIPE_KEY).getSourceImage();
                const canvas = scene.textures.createCanvas(PIPE_HEAD_KEY, pipeImage.width, PIPE_HEAD_HEIGHT).getSourceImage();
                const ctx = canvas.getContext('2d');
                ctx.drawImage(pipeImage, 0, 0, pipeImage.width, PIPE_HEAD_HEIGHT, 0, 0, pipeImage.width, PIPE_HEAD_HEIGHT);
                scene.textures.get(PIPE_HEAD_KEY).refresh();
            }
            if (!scene.textures.exists(PIPE_BODY_KEY)) {
                const pipeImage = scene.textures.get(PIPE_KEY).getSourceImage();
                const bodyHeight = pipeImage.height - PIPE_HEAD_HEIGHT;
                const canvas = scene.textures.createCanvas(PIPE_BODY_KEY, pipeImage.width, bodyHeight).getSourceImage();
                const ctx = canvas.getContext('2d');
                ctx.drawImage(pipeImage, 0, PIPE_HEAD_HEIGHT, pipeImage.width, bodyHeight, 0, 0, pipeImage.width, bodyHeight);
                scene.textures.get(PIPE_BODY_KEY).refresh();
            }
        }

        // Timer to spawn pipes
        this.spawnTimer = scene.time.addEvent({
            delay: this.currentSpawnDelay, // Use current spawn delay
            callback: this.spawnPipes,
            callbackScope: this,
            loop: true
        });
        this.spawnTimer.paused = true; // Start paused
    }

    // NEW: Utility method to get or create a pipe texture of a specific height
    getPipeTexture(height) {
        if (height <= 0) {
            // Should not happen, but handle gracefully
            console.warn("Requested pipe texture with invalid height:", height);
            // Return a placeholder or smallest valid texture if necessary
            // For now, let's assume it defaults to a small visible texture
            height = PIPE_HEAD_HEIGHT; // Minimum sensible height
        }

        const textureKey = `pipe_green_${Math.round(height)}`; // Round to avoid floating point issues in keys

        if (this.generatedPipeTextures[textureKey]) {
            return textureKey;
        }

        if (this.scene.textures.exists(textureKey)) {
            this.generatedPipeTextures[textureKey] = true; // Add to our cache
            return textureKey;
        }

        // Texture doesn't exist, create it
        const headTexture = this.scene.textures.get(PIPE_HEAD_KEY);
        const bodyTexture = this.scene.textures.get(PIPE_BODY_KEY);

        if (!headTexture || !bodyTexture || headTexture.key === '__MISSING' || bodyTexture.key === '__MISSING') {
            console.error("Pipe head or body base textures are missing. Cannot generate dynamic pipe texture.");
            return this.pipeTextureKey; // Fallback to original full pipe or placeholder
        }

        const headSource = headTexture.getSourceImage();
        const bodySource = bodyTexture.getSourceImage();

        const newTextureWidth = headSource.width;
        // Ensure body part is at least 1px to tile, head provides the rest
        const bodyCanvasHeight = Math.max(1, height - PIPE_HEAD_HEIGHT);

        const canvas = this.scene.textures.createCanvas(textureKey, newTextureWidth, height).getSourceImage();
        const ctx = canvas.getContext('2d');

        // Draw head
        ctx.drawImage(headSource, 0, 0);

        // Draw body (if height allows for it)
        if (height > PIPE_HEAD_HEIGHT) {
            const pattern = ctx.createPattern(bodySource, 'repeat-y');
            ctx.fillStyle = pattern;
            // Start drawing pattern just below the head
            ctx.fillRect(0, PIPE_HEAD_HEIGHT, newTextureWidth, bodyCanvasHeight);
        }
        
        this.scene.textures.get(textureKey).refresh();
        this.generatedPipeTextures[textureKey] = true;

        return textureKey;
    }

    updateDifficulty(currentScore) {
        // Update pipe speed
        this.currentPipeVelocityX = INITIAL_PIPE_VELOCITY_X + (currentScore * PIPE_VELOCITY_X_INCREMENT_PER_SCORE);
        if (Math.abs(this.currentPipeVelocityX) > Math.abs(MAX_PIPE_VELOCITY_X)) {
            this.currentPipeVelocityX = MAX_PIPE_VELOCITY_X;
        }

        // Update pipe gap
        this.pipeGap = Math.max(
            MIN_PIPE_GAP,
            INITIAL_PIPE_GAP - Math.floor(currentScore / DIFFICULTY_STEP_SCORE) * 2
        );

        // Update pipe spacing
        this.pipeSpacing = Math.max(
            MIN_PIPE_SPACING,
            INITIAL_PIPE_SPACING - Math.floor(currentScore / DIFFICULTY_STEP_SCORE) * 2
        );

        // Update spawn delay
        const minDelayFromSpacing = (this.pipeSpacing / Math.abs(this.currentPipeVelocityX)) * 1000;
        this.currentSpawnDelay = Math.max(
            MIN_SPAWN_DELAY,
            minDelayFromSpacing,
            INITIAL_SPAWN_DELAY - (currentScore * SPAWN_DELAY_DECREMENT_PER_SCORE)
        );

        // Update the existing timer's delay
        if (this.spawnTimer) {
            this.spawnTimer.delay = this.currentSpawnDelay;
        }
    }

    spawnPipes() {
        // Do not spawn if a previous pair is still within pipeSpacing of the right edge
        // Ensure first pipe always spawns by checking if there are any active pipes yet.
        if (this.countActive(true) > 0) { 
            const rightmostPipeX = this.getChildren().reduce(
                (max, p) => (p.active ? Math.max(max, p.x) : max),
                -Infinity
            );
            if (rightmostPipeX > this.scene.game.config.width - this.pipeSpacing) {
                return; // Too close – skip this spawn cycle
            }
        }

        if (this.scene.game.stateMachine.getCurrentState() !== 'running') {
            return; // Only spawn if game is running
        }

        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        const groundHeight = 50; // Assuming ground height is 50

        // Random Y position for the gap (ensuring gap is not too close to top/bottom)
        const gapY = Phaser.Math.Between(this.pipeGap / 2 + 50, gameHeight - groundHeight - this.pipeGap / 2 - 50);

        // Upper pipe
        const upperPipeX = gameWidth + this.pipeWidth / 2;
        const upperPipeOpeningY = gapY - this.pipeGap / 2;
        const upperPipeHeight = upperPipeOpeningY;
        const upperPipeTextureKey = this.getPipeTexture(upperPipeHeight);
        
        const upperPipe = this.create(upperPipeX, 0, upperPipeTextureKey);
        upperPipe.setOrigin(0.5, 0); 
        upperPipe.setFlipY(true); 
        
        upperPipe.body.setAllowGravity(false);
        upperPipe.setVelocityX(this.currentPipeVelocityX); 
        upperPipe.isScoreTarget = true; 
        upperPipe.pairId = Phaser.Math.RND.uuid(); 
        
        // Lower pipe
        const lowerPipeX = gameWidth + this.pipeWidth / 2;
        const lowerPipeY = gapY + this.pipeGap / 2;
        const groundY = gameHeight - groundHeight;
        const lowerPipeHeight = groundY - lowerPipeY;
        const lowerPipeTextureKey = this.getPipeTexture(lowerPipeHeight);

        const lowerPipe = this.create(lowerPipeX, lowerPipeY, lowerPipeTextureKey);
        lowerPipe.setOrigin(0.5, 0); 

        lowerPipe.body.setAllowGravity(false);
        lowerPipe.setVelocityX(this.currentPipeVelocityX); 
        lowerPipe.isScoreTarget = false; 
        lowerPipe.pairId = upperPipe.pairId; 

        // For scoring: mark that bird hasn't passed this pipe pair yet
        upperPipe.passed = false;
        lowerPipe.passed = false; 
    }

    update(time, delta) {
        this.getChildren().forEach(pipe => {
            if (pipe.x < -pipe.width) {
                this.killAndHide(pipe);
                pipe.destroy(); 
            }
        });
    }

    startSpawning() {
        this.spawnTimer.paused = false;
        // Reset velocity and spawn delay to initial when starting (e.g. after game over)
        this.currentPipeVelocityX = INITIAL_PIPE_VELOCITY_X;
        this.currentSpawnDelay = INITIAL_SPAWN_DELAY;
        this.spawnTimer.delay = this.currentSpawnDelay;
        this.pipeGap     = INITIAL_PIPE_GAP; // Reset pipe gap
        this.pipeSpacing = INITIAL_PIPE_SPACING; // Reset pipe spacing
        
        // Spawn one immediately if the group is empty to get things started
        if (this.countActive(true) === 0) {
            this.spawnPipes();
        }
    }

    stopSpawningAndClear() {
        this.spawnTimer.paused = true;
        this.getChildren().forEach(pipe => {
            // Deactivate and hide for potential reuse, or destroy
            pipe.setActive(false).setVisible(false);
            if (pipe.body) { // Check if body exists before trying to disable
                pipe.body.enable = false;
            }
            // If not reusing, uncomment next line
            // pipe.destroy(); 
        });
        // To truly remove all children and prepare for fresh start (e.g. on game over then prestart)
        this.clear(true, true); 
    }
} 