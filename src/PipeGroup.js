import Phaser from 'phaser';

const PIPE_KEY = 'pipe_green';
const PIPE_PLACEHOLDER_KEY = 'pipe_placeholder';

// Difficulty Constants
const INITIAL_PIPE_VELOCITY_X = -150;
const PIPE_VELOCITY_X_INCREMENT_PER_SCORE = -2; // Increase speed (more negative)
const MAX_PIPE_VELOCITY_X = -300;
const INITIAL_SPAWN_DELAY = 2000; // ms
const SPAWN_DELAY_DECREMENT_PER_SCORE = 20; // ms
const MIN_SPAWN_DELAY = 1000; // ms

export class PipeGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);

        this.scene = scene;
        this.pipeSpacing = 250; // Horizontal space between pipe pairs
        this.pipeGap = 150;     // Vertical gap between upper and lower pipe
        this.pipeWidth = 80;    // Width of the pipe
        this.currentPipeVelocityX = INITIAL_PIPE_VELOCITY_X; // Use current, not fixed
        this.currentSpawnDelay = INITIAL_SPAWN_DELAY;
        this.pipeTextureKey = PIPE_KEY;

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

    updateDifficulty(currentScore) {
        // Update pipe speed
        this.currentPipeVelocityX = INITIAL_PIPE_VELOCITY_X + (currentScore * PIPE_VELOCITY_X_INCREMENT_PER_SCORE);
        if (Math.abs(this.currentPipeVelocityX) > Math.abs(MAX_PIPE_VELOCITY_X)) {
            this.currentPipeVelocityX = MAX_PIPE_VELOCITY_X;
        }

        // Update spawn delay
        this.currentSpawnDelay = INITIAL_SPAWN_DELAY - (currentScore * SPAWN_DELAY_DECREMENT_PER_SCORE);
        if (this.currentSpawnDelay < MIN_SPAWN_DELAY) {
            this.currentSpawnDelay = MIN_SPAWN_DELAY;
        }

        // Update the existing timer's delay
        if (this.spawnTimer) {
            this.spawnTimer.delay = this.currentSpawnDelay;
        }
    }

    spawnPipes() {
        if (this.scene.game.stateMachine.getCurrentState() !== 'running') {
            return; // Only spawn if game is running
        }

        const gameHeight = this.scene.game.config.height;
        const groundHeight = 50; // Assuming ground height is 50

        // Random Y position for the gap (ensuring gap is not too close to top/bottom)
        const gapY = Phaser.Math.Between(this.pipeGap / 2 + 50, gameHeight - groundHeight - this.pipeGap / 2 - 50);

        // Upper pipe
        const upperPipe = this.create(this.scene.game.config.width + this.pipeWidth / 2, gapY - this.pipeGap / 2, this.pipeTextureKey);
        upperPipe.setOrigin(0.5, 1); // Origin at bottom-center
        upperPipe.body.setAllowGravity(false);
        upperPipe.setVelocityX(this.currentPipeVelocityX); // Use current velocity
        upperPipe.isScoreTarget = true; // Mark this pipe for scoring
        upperPipe.pairId = Phaser.Math.RND.uuid(); // Unique ID for the pair
        
        // Lower pipe
        const lowerPipe = this.create(this.scene.game.config.width + this.pipeWidth / 2, gapY + this.pipeGap / 2, this.pipeTextureKey);
        lowerPipe.setOrigin(0.5, 0); // Origin at top-center
        lowerPipe.body.setAllowGravity(false);
        lowerPipe.setVelocityX(this.currentPipeVelocityX); // Use current velocity
        lowerPipe.isScoreTarget = false; // Don't score for this one directly
        lowerPipe.pairId = upperPipe.pairId; // Share the pair ID

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