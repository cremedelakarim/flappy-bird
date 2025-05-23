import Phaser from 'phaser';
import { StateMachine, States } from './StateMachine.js';
import { Bird } from './Bird.js';
import { PipeGroup } from './PipeGroup.js';
import { Scoreboard } from './Scoreboard.js';

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
let scoreboard; // Variable for the current score display
let highScore = 0;
let highScoreBoard; // Variable for the high score display
let pauseOverlay; // For the transparent overlay
let pauseText; // For the "Paused" message
let background; // Variable for the background TileSprite
let backgroundIsDay = true; // To track current background state
let menuMusic;             // <–– menu background-music instance

// NEW: gameplay music references + state tracker
let gameStartMusic;
let secondLevelMusic;
let thirdLevelMusic;
let currentMusicLevel = 0;   // 0 = none, 1 = start, 2 = 20 pts, 3 = 40 pts

const SCORE_TEXT_STYLE = { fontSize: '32px', fill: '#fff', fontStyle: 'bold' };
const FINAL_SCORE_STYLE = { fontSize: '48px', fill: '#fff', fontStyle: 'bold' };
const FINAL_BEST_SCORE_STYLE = { fontSize: '38px', fill: '#ccc', fontStyle: 'bold' }; // Slightly subdued

function preload() {
    // Preload assets here
    console.log("Preloading assets...");

    // Background & ground
    this.load.image('background',  'assets/sprites/background-day.png');
    this.load.image('background_night', 'assets/sprites/background-night.png'); // Added night background
    this.load.image('ground_tile', 'assets/sprites/base.png');

    // Bird
    this.load.image('bird_sheet',  'assets/sprites/yellowbird-midflap.png'); // Default bird sprite
    this.load.image('yellowbird-up',   'assets/sprites/yellowbird-upflap.png');
    this.load.image('yellowbird-mid',  'assets/sprites/yellowbird-midflap.png');
    this.load.image('yellowbird-down', 'assets/sprites/yellowbird-downflap.png');

    // Pipes
    this.load.image('pipe_green',  'assets/sprites/pipe-green.png');

    // Score Digits
    for (let i = 0; i <= 9; i++) {
        this.load.image(`digit_${i}`, `assets/sprites/${i}.png`);
    }

    // Audio
    this.load.audio('wing',  'assets/audio/wing.wav'); // .wav for broader compatibility initially
    this.load.audio('hit',   'assets/audio/hit.wav');
    this.load.audio('die',   'assets/audio/die.wav');
    this.load.audio('point', 'assets/audio/point.wav');
    this.load.audio('swoosh', 'assets/audio/swoosh.wav');
    this.load.audio('menu_music', 'assets/audio/menu_music.mp3'); // <–– new

    /* NEW gameplay music */
    this.load.audio('game_start',   'assets/audio/game_start.mp3');
    this.load.audio('second_level', 'assets/audio/second_level.mp3');
    this.load.audio('third_level',  'assets/audio/third_level.mp3');

    // Load high score from local storage
    highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
}

function create() {
    // Set up game objects and logic here
    console.log("Game created!");
    // this.add.text(config.width / 2, config.height / 2, 'Hello Phaser!', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5); // Remove placeholder text

    // Build the looping menu-music sound
    menuMusic = this.sound.add('menu_music', { loop : true, volume : 0.5 });

    /* NEW – instantiate the gameplay tracks (don't play yet) */
    gameStartMusic   = this.sound.add('game_start',   { loop: true, volume: 0.5 });
    secondLevelMusic = this.sound.add('second_level', { loop: true, volume: 0.5 });
    thirdLevelMusic  = this.sound.add('third_level',  { loop: true, volume: 0.5 });

    this.sound.pauseOnBlur = false; // Keep music playing if window loses focus (optional)

    // Background - Add the background image
    // STEP 1: work out the uniform scale factor needed for full-height coverage
    const bgTexDay      = this.textures.get('background').getSourceImage(); // Assuming 'background' is day
    const bgScale    = config.height / bgTexDay.height;  // proportional (same for X & Y)

    // STEP 2: create a TileSprite that spans the whole viewport
    //         – TileSprite will automatically repeat the (scaled) texture sideways
    background = this.add.tileSprite( // Assign to global 'background'
        0,                        // x
        0,                        // y
        config.width / bgScale,   // internal width before scaling
        config.height / bgScale,  // internal height before scaling
        'background',             // initial texture key (day)
        this.scene               // Pass the scene context
    )
    .setOrigin(0, 0)              // align to top-left
    .setScale(bgScale)            // scale uniformly – full vertical fit
    .setScrollFactor(0);          // keep it fixed to the camera

    // send it to the back (so pipes, bird, etc. draw on top)
    background.setDepth(-10);

    // FPS counter
    fpsText = this.add.text(10, 10, 'FPS: --', { fontSize: '16px', fill: '#0f0' });
    fpsText.setScrollFactor(0); // Keep FPS counter fixed on screen

    // Initialize Scoreboard for current score (initially hidden)
    scoreboard = new Scoreboard(this, this.cameras.main.centerX, 50, 1.8);
    scoreboard.hide();

    // Initialize Scoreboard for high score (initially hidden, used in PRESTART and GAMEOVER)
    // Centered, slightly lower than current score, smaller, and tinted
    highScoreBoard = new Scoreboard(this, this.cameras.main.centerX, 100, 1.3, 0xcccccc);
    highScoreBoard.hide();

    // Bird Animation
    this.anims.create({
        key: 'flap_anim',
        frames: [
            { key: 'yellowbird-up'   },
            { key: 'yellowbird-mid'  },
            { key: 'yellowbird-down' }
        ],
        frameRate: 10,
        repeat: -1
    });

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
            // Command menu music to play.
            // If audio context is locked (initial load), Phaser queues it.
            // If audio context is unlocked (e.g., restart from game over), it will play.
            if (menuMusic) {
                menuMusic.play();
            }
            
            score = 0; // Reset score
            if (scoreboard) scoreboard.updateValue(score); // Update just in case, then hide
            if (scoreboard) scoreboard.hide();
            
            if (highScoreBoard) highScoreBoard.updateValue(highScore);
            if (highScoreBoard) highScoreBoard.show();

            // Reset background to day
            if (background) {
                backgroundIsDay = true;
                const bgTex      = scene.textures.get('background').getSourceImage();
                const bgScale    = config.height / bgTex.height;
                background.setTexture('background');
                background.width = config.width / bgScale;
                background.height = config.height / bgScale;
                background.setScale(bgScale);
            }

            if (ground) ground.setVisible(false);
            if (bird) bird.setVisible(false);
            if (pipeGroup) pipeGroup.stopSpawningAndClear();

            let startText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'Tap or Press Space to Start', { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            
            const startListener = () => {
                startText.destroy();
                // Audio context is unlocked by this interaction.
                // menuMusic (commanded to play in onEnter) should start/continue now.
                // Delay transition to RUNNING slightly so music is audible for a moment.
                scene.time.delayedCall(100, () => { // 100ms delay, adjust if needed
                    // Ensure we only transition if the game is still in PRESTART.
                    // This prevents issues if the state changes rapidly for other reasons.
                    if (scene.game.stateMachine.getCurrentState() === States.PRESTART) {
                        scene.game.stateMachine.setState(States.RUNNING);
                    }
                });
                spaceKey.off('down', startListener); // Clean up space listener
                scene.input.off('pointerdown', startListener); // Clean up pointer listener
            };

            scene.input.once('pointerdown', startListener);
            spaceKey.once('down', startListener);
        },
        onExit: (scene) => {
            console.log("Exited PRESTART state");
            if (highScoreBoard) highScoreBoard.hide();
            if (pauseOverlay) pauseOverlay.setVisible(false);
            if (pauseText) pauseText.setVisible(false);
        }
    });

    this.game.stateMachine.addState(States.RUNNING, {
        onEnter: (scene) => {
            console.log("Entered RUNNING state");
            // Stop menu music when game actually starts.
            if (menuMusic && menuMusic.isPlaying) {
                menuMusic.stop();
            }
            scene.sound.play('swoosh'); // Play swoosh sound when game starts/restarts
            
            /* NEW – start level-1 music */
            if (gameStartMusic) gameStartMusic.play({ seek: 4 }); // Start playback 4 seconds into the audio file
            if (secondLevelMusic && secondLevelMusic.isPlaying) secondLevelMusic.stop();
            if (thirdLevelMusic  && thirdLevelMusic.isPlaying)  thirdLevelMusic.stop();
            currentMusicLevel = 1;
            
            if (scoreboard) scoreboard.updateValue(score); // Ensure score is current
            if (scoreboard) scoreboard.show();
            if (highScoreBoard) highScoreBoard.hide(); // Ensure high score is not visible during running

            // Create/show ground
            if (!ground) {
                ground = scene.add.tileSprite(0, config.height - 50, config.width, 100, 'ground_tile').setOrigin(0,0);
                scene.physics.add.existing(ground, true);
            } else {
                ground.setVisible(true);
                // Ensure ground is a tileSprite if it was re-created or of a different type
                if (!(ground instanceof Phaser.GameObjects.TileSprite)) {
                    ground.destroy(); // Remove old ground if it wasn't a tile sprite
                    ground = scene.add.tileSprite(0, config.height - 50, config.width, 100, 'ground_tile').setOrigin(0,0);
                    scene.physics.add.existing(ground, true);
                } else {
                    ground.setTexture('ground_tile'); // Ensure correct texture if reused
                    ground.width = config.width; // Ensure width is correct
                    ground.height = 100; // Ensure height is correct
                }
            }
            ground.setDepth(10); // Ensure ground is rendered above background but below bird/pipes

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
                    scene.sound.play('hit');
                    scene.time.delayedCall(200, () => scene.sound.play('die'));
                    scene.game.stateMachine.setState(States.GAMEOVER);
                }
            });

            // Add collision between bird and pipes
            scene.physics.add.collider(bird, pipeGroup, (collidedBird, collidedPipe) => {
                 if (scene.game.stateMachine.getCurrentState() === States.RUNNING) {
                    console.log("Collision with pipe detected!");
                    scene.sound.play('hit');
                    scene.time.delayedCall(200, () => scene.sound.play('die'));
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
                        if (scoreboard) scoreboard.updateValue(score);
                        scene.sound.play('point'); // Play point sound
                        console.log("Score: ", score, "Pipe Pair ID: ", pipe.pairId);
                        
                        /* NEW – switch tracks at 20 & 40 points */
                        if (score >= 40 && currentMusicLevel < 3) {
                            if (gameStartMusic && gameStartMusic.isPlaying) gameStartMusic.stop();
                            if (secondLevelMusic && secondLevelMusic.isPlaying) secondLevelMusic.stop();
                            if (thirdLevelMusic) thirdLevelMusic.play();
                            currentMusicLevel = 3;
                        } else if (score >= 20 && currentMusicLevel < 2) {
                            if (gameStartMusic && gameStartMusic.isPlaying) gameStartMusic.stop();
                            if (thirdLevelMusic  && thirdLevelMusic.isPlaying)  thirdLevelMusic.stop();
                            if (secondLevelMusic) secondLevelMusic.play();
                            currentMusicLevel = 2;
                        }

                        if (score > 0 && score % 10 === 0) {
                            if (scoreboard) scoreboard.celebrate();
                            // Toggle background
                            if (background) {
                                backgroundIsDay = !backgroundIsDay;
                                const newTextureKey = backgroundIsDay ? 'background' : 'background_night';
                                const bgTex = scene.textures.get(newTextureKey).getSourceImage();
                                const bgScale = config.height / bgTex.height;
                                background.setTexture(newTextureKey);
                                background.width = config.width / bgScale;
                                background.height = config.height / bgScale;
                                background.setScale(bgScale);
                            }
                        }

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
                scene.sound.play('hit'); // Play hit sound for top boundary collision as well
                scene.game.stateMachine.setState(States.GAMEOVER);
            }
        },
        onExit: (scene) => {
            console.log("Exited RUNNING state");
            if (bird) bird.setActive(false).setVisible(false);
            if (pipeGroup) pipeGroup.stopSpawningAndClear();
            if (scoreboard) scoreboard.hide();

            /* NEW – stop gameplay music */
            if (gameStartMusic  && gameStartMusic.isPlaying)  gameStartMusic.stop();
            if (secondLevelMusic && secondLevelMusic.isPlaying) secondLevelMusic.stop();
            if (thirdLevelMusic  && thirdLevelMusic.isPlaying)  thirdLevelMusic.stop();
            currentMusicLevel = 0;
        }
    });

    this.game.stateMachine.addState(States.GAMEOVER, {
        onEnter: (scene) => {
            console.log("Entered GAMEOVER state");

            /* NEW – ensure gameplay music is off before menu music */
            if (gameStartMusic  && gameStartMusic.isPlaying)  gameStartMusic.stop();
            if (secondLevelMusic && secondLevelMusic.isPlaying) secondLevelMusic.stop();
            if (thirdLevelMusic  && thirdLevelMusic.isPlaying)  thirdLevelMusic.stop();
            currentMusicLevel = 0;

            // Play menu music on game over screen.
            // Audio context should be unlocked by now.
            if (menuMusic && !menuMusic.isPlaying) {
                menuMusic.play();
            }
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
            if (scoreboard) scoreboard.hide();

            // Game Over Title
            let gameOverTitle = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.height * 0.3, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
            // Final Score Display - Using sprite scoreboard
            let finalScoreDisplay = new Scoreboard(scene, scene.cameras.main.centerX, scene.cameras.main.height * 0.5, 2.0, 0xffffff); // Larger scale for final score
            finalScoreDisplay.updateValue(finalScoreVal);
            finalScoreDisplay.show();
            
            // Best Score Display - Using sprite scoreboard
            let finalBestScoreDisplay = new Scoreboard(scene, scene.cameras.main.centerX, scene.cameras.main.height * 0.6, 1.5, 0xcccccc); // Slightly smaller for best
            finalBestScoreDisplay.updateValue(highScore);
            finalBestScoreDisplay.show();

            // Restart Prompt
            let restartPromptText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.height * 0.75, 'Tap or Press Space to Restart', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
            
            // Group game over elements for easy management if needed
            let gameOverElements = scene.add.group([gameOverTitle, restartPromptText]); // Scoreboards are managed separately

            // Delay before enabling restart listeners
            scene.time.delayedCall(500, () => { // 500ms delay
                const restartListener = () => {
                    gameOverElements.destroy(true); // Destroy text elements
                    finalScoreDisplay.destroy();    // Destroy final score sprite display
                    finalBestScoreDisplay.destroy(); // Destroy best score sprite display
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
            // Elements are destroyed in restartListener.
            // highScoreBoard will be managed by PRESTART's onEnter.
        }
    });

    this.game.stateMachine.addState(States.PAUSED, {
        onEnter: (scene) => {
            console.log("Entered PAUSED state");
            if (!pauseOverlay) {
                pauseOverlay = scene.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.5).setOrigin(0,0);
                pauseOverlay.setScrollFactor(0);
                pauseOverlay.setDepth(25); // Ensure pause overlay is behind scoreboard
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
                // Scoreboard visibility is handled by the RUNNING state's onEnter
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