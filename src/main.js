import Phaser from 'phaser';
import { StateMachine, States } from './StateMachine.js';
import { Bird } from './Bird.js';
import { PipeGroup } from './PipeGroup.js';

// Game Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container', // ID of the div to inject the canvas into
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT, // Fit the game within the parent, maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game horizontally and vertically
    },
    backgroundColor: '#87CEEB', // Light blue for sky
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    stateMachine: null // Placeholder for state machine instance
};

// Create a new Phaser game instance
const game = new Phaser.Game(config);

let fpsText;
let ground; // Variable for the ground
let bird; // Variable for the bird instance
let pipeGroup; // Variable for the pipe group instance
let score = 0;
let scoreText;
let highScore = 0;
let highScoreText;
let pauseOverlay; // For the transparent overlay
let pauseText; // For the "Paused" message

const SCORE_TEXT_STYLE = { fontSize: '32px', fill: '#fff', fontStyle: 'bold' };
const FINAL_SCORE_STYLE = { fontSize: '48px', fill: '#fff', fontStyle: 'bold' };
const FINAL_BEST_SCORE_STYLE = { fontSize: '38px', fill: '#ccc', fontStyle: 'bold' }; // Slightly subdued

function preload() {
    // Preload assets here
    console.log("Preloading assets...");

    // Placeholder for game assets - replace with actual paths and uncomment
    // this.load.image('background', 'assets/background_day.png');
    // this.load.image('ground_tile', 'assets/ground_base.png'); // Assuming a tileable ground
    // this.load.spritesheet('bird_sheet', 'assets/bird.png', { frameWidth: 34, frameHeight: 24 });
    // this.load.image('pipe_green', 'assets/pipe_green.png');

    // Load high score from local storage
    highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
}

function create() {
    // Set up game objects and logic here
    console.log("Game created!");
    // this.add.text(config.width / 2, config.height / 2, 'Hello Phaser!', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5); // Remove placeholder text

    // FPS counter
    fpsText = this.add.text(10, 10, 'FPS: --', { fontSize: '16px', fill: '#0f0' });
    fpsText.setScrollFactor(0); // Keep FPS counter fixed on screen

    // Score Display
    scoreText = this.add.text(this.cameras.main.centerX, 50, 'Score: 0', SCORE_TEXT_STYLE).setOrigin(0.5);
    scoreText.setScrollFactor(0);
    scoreText.setVisible(false);

    // High Score Display
    highScoreText = this.add.text(this.cameras.main.centerX, 100, 'Best: ' + highScore, SCORE_TEXT_STYLE).setOrigin(0.5);
    highScoreText.setScrollFactor(0);
    highScoreText.setVisible(false);

    // Initialize PipeGroup
    pipeGroup = new PipeGroup(this);

    // Initialize State Machine
    this.game.stateMachine = new StateMachine(States.PRESTART, this);
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Pause/Resume handling
    const handleVisibilityChange = () => {
        if (document.hidden && this.game.stateMachine.getCurrentState() === States.RUNNING) {
            this.game.stateMachine.setState(States.PAUSED);
        }
    };

    const handleBlur = () => {
        if (this.game.stateMachine.getCurrentState() === States.RUNNING) {
            this.game.stateMachine.setState(States.PAUSED);
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    // Ensure to clean up these global listeners if the game is ever destroyed
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
    });

    this.game.stateMachine.addState(States.PRESTART, {
        onEnter: (scene) => {
            console.log("Entered PRESTART state");
            score = 0; // Reset score
            scoreText.setText('Score: ' + score).setVisible(false);
            highScoreText.setText('Best: ' + highScore).setVisible(true);

            if (ground) ground.setVisible(false);
            if (bird) bird.setVisible(false);
            if (pipeGroup) pipeGroup.stopSpawningAndClear();

            let startText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'Tap or Press Space to Start', { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            
            const startListener = () => {
                startText.destroy();
                scene.game.stateMachine.setState(States.RUNNING);
                spaceKey.off('down', startListener); // Clean up space listener
                scene.input.off('pointerdown', startListener); // Clean up pointer listener
            };

            scene.input.once('pointerdown', startListener);
            spaceKey.once('down', startListener);
        },
        onExit: (scene) => {
            console.log("Exited PRESTART state");
            highScoreText.setVisible(false);
            if (pauseOverlay) pauseOverlay.setVisible(false);
            if (pauseText) pauseText.setVisible(false);
        }
    });

    this.game.stateMachine.addState(States.RUNNING, {
        onEnter: (scene) => {
            console.log("Entered RUNNING state");
            scoreText.setVisible(true);
            // Create/show ground
            if (!ground) {
                ground = scene.add.rectangle(0, config.height - 50, config.width, 100, 0x8B4513).setOrigin(0,0);
                scene.physics.add.existing(ground, true);
            } else {
                ground.setVisible(true);
            }

            // Create/show bird
            if (!bird) {
                bird = new Bird(scene, config.width / 2 - 100, config.height / 2);
            } else {
                bird.setPosition(config.width / 2 - 100, config.height / 2);
                bird.setVelocity(0,0);
                bird.setAngle(0);
                bird.body.setAllowGravity(true);
                bird.setVisible(true);
                bird.setActive(true);
            }

            // Start spawning pipes
            pipeGroup.startSpawning();

            // Add collision between bird and ground
            scene.physics.add.collider(bird, ground, () => {
                if (scene.game.stateMachine.getCurrentState() === States.RUNNING) {
                    console.log("Collision with ground detected!");
                    scene.game.stateMachine.setState(States.GAMEOVER);
                }
            });

            // Add collision between bird and pipes
            scene.physics.add.collider(bird, pipeGroup, (collidedBird, collidedPipe) => {
                 if (scene.game.stateMachine.getCurrentState() === States.RUNNING) {
                    console.log("Collision with pipe detected!");
                    scene.game.stateMachine.setState(States.GAMEOVER);
                }
            });

        },
        onUpdate: (scene, time, delta) => {
            if (bird) {
                bird.update(time, delta);
            }
            if (pipeGroup) {
                pipeGroup.update(time, delta);
                // Scoring logic
                pipeGroup.getChildren().forEach(pipe => {
                    if (pipe.active && pipe.isScoreTarget && !pipe.passed && bird && pipe.getBounds().right < bird.getBounds().left) {
                        score++;
                        scoreText.setText('Score: ' + score);
                        console.log("Score: ", score, "Pipe Pair ID: ", pipe.pairId);
                        
                        // Update difficulty based on the new score
                        pipeGroup.updateDifficulty(score);

                        // Mark this pipe and its pair as passed
                        pipe.passed = true;
                        pipeGroup.getChildren().forEach(otherPipe => {
                            if (otherPipe.pairId === pipe.pairId && otherPipe !== pipe) {
                                otherPipe.passed = true;
                            }
                        });
                    }
                });
            }
            if (bird && bird.y < 0 && scene.game.stateMachine.getCurrentState() === States.RUNNING) {
                console.log("Collision with top boundary detected!");
                scene.game.stateMachine.setState(States.GAMEOVER);
            }
        },
        onExit: (scene) => {
            console.log("Exited RUNNING state");
            if (bird) bird.setActive(false).setVisible(false);
            if (pipeGroup) pipeGroup.stopSpawningAndClear();
            scoreText.setVisible(false);
        }
    });

    this.game.stateMachine.addState(States.GAMEOVER, {
        onEnter: (scene) => {
            console.log("Entered GAMEOVER state");
            if(bird) {
                bird.body.setAllowGravity(false);
                bird.setVelocity(0,0);
            }
            if (pipeGroup) pipeGroup.spawnTimer.paused = true;

            let finalScoreVal = score; // Capture score before any async ops
            if (finalScoreVal > highScore) {
                highScore = finalScoreVal;
                localStorage.setItem('flappyHighScore', highScore);
            }

            // Hide in-game score, show game over elements
            scoreText.setVisible(false); 

            // Game Over Title
            let gameOverTitle = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.height * 0.3, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
            // Final Score Display
            let finalScoreText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.height * 0.5, 'Score: ' + finalScoreVal, FINAL_SCORE_STYLE).setOrigin(0.5);
            // Best Score Display
            let finalBestScoreText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.height * 0.6, 'Best: ' + highScore, FINAL_BEST_SCORE_STYLE).setOrigin(0.5);
            // Restart Prompt
            let restartPromptText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.height * 0.75, 'Tap or Press Space to Restart', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
            
            // Group game over elements for easy management if needed
            let gameOverElements = scene.add.group([gameOverTitle, finalScoreText, finalBestScoreText, restartPromptText]);

            // Delay before enabling restart listeners
            scene.time.delayedCall(500, () => { // 500ms delay
                const restartListener = () => {
                    gameOverElements.destroy(true); // Destroy all elements in the group
                    scene.game.stateMachine.setState(States.PRESTART);
                    spaceKey.off('down', restartListener);
                    scene.input.off('pointerdown', restartListener);
                };
                scene.input.once('pointerdown', restartListener);
                spaceKey.once('down', restartListener);
            });
        },
         onExit: (scene) => {
            console.log("Exited GAMEOVER state");
            // Elements are destroyed in restartListener, no need to hide highScoreText here
            // as PRESTART will manage its visibility.
        }
    });

    this.game.stateMachine.addState(States.PAUSED, {
        onEnter: (scene) => {
            console.log("Entered PAUSED state");
            if (!pauseOverlay) {
                pauseOverlay = scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.5).setOrigin(0,0);
                pauseOverlay.setScrollFactor(0);
            } else {
                pauseOverlay.setVisible(true);
            }
            if (!pauseText) {
                pauseText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'Paused - Tap or Press Space to Resume', { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
                pauseText.setScrollFactor(0);
            } else {
                pauseText.setVisible(true);
            }

            // Pause game elements
            if (bird) {
                bird.body.setAllowGravity(false);
                bird.setVelocity(0, 0);
                // We could also pause animations if bird.anims.pause() exists and is playing
            }
            if (pipeGroup) {
                pipeGroup.spawnTimer.paused = true;
                pipeGroup.getChildren().forEach(pipe => {
                    if (pipe.body) {
                        pipe.body.setVelocityX(0); // Stop existing pipes
                    }
                });
            }

            const resumeListener = () => {
                scene.game.stateMachine.setState(States.RUNNING);
                spaceKey.off('down', resumeListener);
                scene.input.off('pointerdown', resumeListener);
            };
            scene.input.once('pointerdown', resumeListener);
            spaceKey.once('down', resumeListener);
        },
        onExit: (scene) => {
            console.log("Exited PAUSED state");
            if (pauseOverlay) pauseOverlay.setVisible(false);
            if (pauseText) pauseText.setVisible(false);

            // Resume game elements
            if (bird) {
                bird.body.setAllowGravity(true); // Re-enable gravity
                // Potentially bird.anims.resume() if animations were paused
            }
            if (pipeGroup) {
                pipeGroup.spawnTimer.paused = false;
                pipeGroup.getChildren().forEach(pipe => {
                    if (pipe.body) {
                         // Restore original velocity - needs to be stored or use PipeGroup's currentPipeVelocityX
                        pipe.body.setVelocityX(pipeGroup.currentPipeVelocityX);
                    }
                });
            }
        }
    });

    // Initialize the first state
    if (this.game.stateMachine.states[this.game.stateMachine.getCurrentState()].onEnter) {
        this.game.stateMachine.states[this.game.stateMachine.getCurrentState()].onEnter(this);
    }
}

function update(time, delta) {
    if (fpsText) {
        fpsText.setText('FPS: ' + Math.floor(this.game.loop.actualFps));
    }
    // The state machine's update now handles bird and pipe group updates if they are in the RUNNING state's onUpdate
    if (this.game.stateMachine) {
        this.game.stateMachine.update(time, delta);
    }
} 