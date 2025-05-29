import Phaser from 'phaser';
import { StateMachine, States } from './StateMachine.js';
import { Bird } from './Bird.js';
import { PipeGroup } from './PipeGroup.js';
import { Scoreboard } from './Scoreboard.js';

// GameScene: Handles the main game logic, separated from asset loading.
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Initialize properties that were previously global
        this.fpsText = null;
        this.ground = null;
        this.bird = null;
        this.pipeGroup = null;
        this.score = 0;
        this.scoreboard = null;
        this.highScore = 0;
        this.highScoreBoard = null;
        this.bestScoreLabel = null;
        this.pauseOverlay = null;
        this.pauseText = null;
        this.background = null;
        this.backgroundIsDay = true;
        this.menuMusic = null;
        this.gameStartMusic = null;
        this.secondLevelMusic = null;
        this.thirdLevelMusic = null;
        this.fourthLevelMusic = null;
        this.fifthLevelMusic = null;
        this.sixthLevelMusic = null;
        this.currentMusicLevel = 0;

        // Constants (can be part of the class or defined outside if preferred)
        this.MUSIC_FADE_DURATION = 1000;
        // Styles are better defined here or passed in, rather than global
        this.SCORE_TEXT_STYLE = { fontSize: '32px', fill: '#fff', fontStyle: 'bold' };
        this.FINAL_SCORE_STYLE = { fontSize: '48px', fill: '#fff', fontStyle: 'bold' };
        this.FINAL_BEST_SCORE_STYLE = { fontSize: '38px', fill: '#ccc', fontStyle: 'bold' };
    }

    // Helper function for cross-fading music (now a method of GameScene)
    crossFade(fromSound, toSound, nextLevel) {
        if (!toSound) return;

        if (!toSound.isPlaying) {
            toSound.play();
            toSound.setVolume(0);
        }

        this.tweens.add({
            targets: toSound,
            volume: 0.5,
            duration: this.MUSIC_FADE_DURATION
        });

        if (fromSound && fromSound.isPlaying) {
            this.tweens.add({
                targets: fromSound,
                volume: 0,
                duration: this.MUSIC_FADE_DURATION,
                onComplete: () => fromSound.stop()
            });
        }
        this.currentMusicLevel = nextLevel;
    }

    preload() {
        // Assets are preloaded in PreloaderScene. This scene might do minimal, game-specific preloading if ever needed.
        console.log("GameScene: Preload method (assets should be loaded by PreloaderScene).");
        // Load high score from local storage - this is the right place for it
        this.highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
    }

    create() {
        console.log("GameScene: Create method - setting up game objects and logic.");
        const config = this.game.config; // Access game config through this.game

        // Initialize game objects and logic here, adapting from the original global create function
        this.menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
        this.gameStartMusic = this.sound.add('game_start', { loop: true, volume: 0.5 });
        this.secondLevelMusic = this.sound.add('second_level', { loop: true, volume: 0.5 });
        this.thirdLevelMusic = this.sound.add('third_level', { loop: true, volume: 0.5 });
        this.fourthLevelMusic = this.sound.add('fourth_level', { loop: true, volume: 0.5 });
        this.fifthLevelMusic = this.sound.add('fifth_level', { loop: true, volume: 0.5 });
        this.sixthLevelMusic = this.sound.add('sixth_level', { loop: true, volume: 0.5 });

        this.sound.pauseOnBlur = false;

        const bgTexDay = this.textures.get('background').getSourceImage();
        const bgScale = config.height / bgTexDay.height;
        this.background = this.add.tileSprite(
            0, 0, config.width / bgScale, config.height / bgScale, 'background', this
        ).setOrigin(0, 0).setScale(bgScale).setScrollFactor(0);
        this.background.setDepth(-10);

        this.fpsText = this.add.text(10, 10, 'FPS: --', {
            fontFamily: 'Minecrafter',
            fontSize: '16px',
            fill: '#0f0'
        });
        this.fpsText.setScrollFactor(0);

        this.scoreboard = new Scoreboard(this, this.cameras.main.centerX, 50, 1.8);
        this.scoreboard.hide();

        this.highScoreBoard = new Scoreboard(this, this.cameras.main.centerX, 100, 1.3, 0xcccccc);
        this.highScoreBoard.hide();

        this.bestScoreLabel = this.add.text(
            this.cameras.main.centerX,
            this.highScoreBoard.y + 40,
            'BEST SCORE',
            {
                fontFamily: 'Minecrafter',
                fontSize: '24px',
                fill: '#cccccc',
                align: 'center'
            }
        ).setOrigin(0.5).setVisible(false);

        this.anims.create({
            key: 'flap_anim',
            frames: [
                { key: 'yellowbird-up' },
                { key: 'yellowbird-mid' },
                { key: 'yellowbird-down' }
            ],
            frameRate: 10,
            repeat: -1
        });

        this.pipeGroup = new PipeGroup(this);
        this.game.stateMachine = new StateMachine(States.PRESTART, this); // Initialize state machine for this scene
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
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            // Stop all sounds when scene shuts down to prevent leaks if game is destroyed/restarted
            if (this.menuMusic && this.menuMusic.isPlaying) this.menuMusic.stop();
            if (this.gameStartMusic && this.gameStartMusic.isPlaying) this.gameStartMusic.stop();
            if (this.secondLevelMusic && this.secondLevelMusic.isPlaying) this.secondLevelMusic.stop();
            if (this.thirdLevelMusic && this.thirdLevelMusic.isPlaying) this.thirdLevelMusic.stop();
            if (this.fourthLevelMusic && this.fourthLevelMusic.isPlaying) this.fourthLevelMusic.stop();
            if (this.fifthLevelMusic && this.fifthLevelMusic.isPlaying) this.fifthLevelMusic.stop();
            if (this.sixthLevelMusic && this.sixthLevelMusic.isPlaying) this.sixthLevelMusic.stop();
        });

        // Define States (PRESTART, RUNNING, GAMEOVER, PAUSED)
        // Adapted to use 'this' for scene context and class properties

        this.game.stateMachine.addState(States.PRESTART, {
            onEnter: () => { // scene parameter becomes 'this'
                console.log("Entered PRESTART state");
                if (this.menuMusic) {
                    this.menuMusic.play();
                }
                this.score = 0;
                if (this.scoreboard) this.scoreboard.updateValue(this.score);
                if (this.scoreboard) this.scoreboard.hide();
                if (this.highScoreBoard) this.highScoreBoard.updateValue(this.highScore);
                if (this.highScoreBoard) this.highScoreBoard.show();

                if (this.bestScoreLabel) {
                    const bounds = this.highScoreBoard.getBounds();
                    this.bestScoreLabel.setY(bounds.bottom + 20);
                    this.bestScoreLabel.setVisible(true);
                }

                if (this.background) {
                    this.backgroundIsDay = true;
                    const bgTex = this.textures.get('background').getSourceImage();
                    const bgScale = config.height / bgTex.height;
                    this.background.setTexture('background');
                    this.background.width = config.width / bgScale;
                    this.background.height = config.height / bgScale;
                    this.background.setScale(bgScale);
                }

                if (this.ground) this.ground.setVisible(false);
                if (this.bird) this.bird.setVisible(false);
                if (this.pipeGroup) this.pipeGroup.stopSpawningAndClear();

                let startText = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    'TAP OR PRESS SPACE TO START',
                    { fontFamily: 'Minecrafter', fontSize: '28px', fill: '#fff', fontStyle: 'bold' }
                ).setOrigin(0.5);

                const startListener = () => {
                    startText.destroy();
                    this.time.delayedCall(100, () => {
                        if (this.game.stateMachine.getCurrentState() === States.PRESTART) {
                            this.game.stateMachine.setState(States.RUNNING);
                        }
                    });
                    spaceKey.off('down', startListener);
                    this.input.off('pointerdown', startListener);
                };

                this.input.once('pointerdown', startListener);
                spaceKey.once('down', startListener);
            },
            onExit: () => {
                console.log("Exited PRESTART state");
                if (this.highScoreBoard) this.highScoreBoard.hide();
                if (this.bestScoreLabel) this.bestScoreLabel.setVisible(false);
                if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
                if (this.pauseText) this.pauseText.setVisible(false);
            }
        });

        this.game.stateMachine.addState(States.RUNNING, {
            onEnter: () => {
                console.log("Entered RUNNING state");
                if (this.menuMusic && this.menuMusic.isPlaying) {
                    this.menuMusic.stop();
                }
                this.sound.play('swoosh');

                if (this.gameStartMusic) {
                    this.gameStartMusic.play({ seek: 4, volume: 0 });
                    this.tweens.add({
                        targets: this.gameStartMusic,
                        volume: 0.5,
                        duration: this.MUSIC_FADE_DURATION
                    });
                }
                if (this.secondLevelMusic && this.secondLevelMusic.isPlaying) this.secondLevelMusic.stop();
                if (this.thirdLevelMusic && this.thirdLevelMusic.isPlaying) this.thirdLevelMusic.stop();
                if (this.fourthLevelMusic && this.fourthLevelMusic.isPlaying) this.fourthLevelMusic.stop();
                if (this.fifthLevelMusic && this.fifthLevelMusic.isPlaying) this.fifthLevelMusic.stop();
                if (this.sixthLevelMusic && this.sixthLevelMusic.isPlaying) this.sixthLevelMusic.stop();
                this.currentMusicLevel = 1;

                if (this.scoreboard) this.scoreboard.updateValue(this.score);
                if (this.scoreboard) this.scoreboard.show();
                if (this.highScoreBoard) this.highScoreBoard.hide();

                if (!this.ground) {
                    this.ground = this.add.tileSprite(0, config.height - 50, config.width, 100, 'ground_tile').setOrigin(0, 0);
                    this.physics.add.existing(this.ground, true);
                } else {
                    this.ground.setVisible(true);
                    if (!(this.ground instanceof Phaser.GameObjects.TileSprite)) {
                        this.ground.destroy();
                        this.ground = this.add.tileSprite(0, config.height - 50, config.width, 100, 'ground_tile').setOrigin(0, 0);
                        this.physics.add.existing(this.ground, true);
                    } else {
                        this.ground.setTexture('ground_tile');
                        this.ground.width = config.width;
                        this.ground.height = 100;
                    }
                }
                this.ground.setDepth(10);

                if (!this.bird) {
                    this.bird = new Bird(this, config.width / 2 - 100, config.height / 2);
                } else {
                    this.bird.setPosition(config.width / 2 - 100, config.height / 2);
                    this.bird.setVelocity(0, 0);
                    this.bird.setAngle(0);
                    this.bird.body.setAllowGravity(true);
                    this.bird.setVisible(true);
                    this.bird.setActive(true);
                }

                this.pipeGroup.startSpawning();

                this.physics.add.collider(this.bird, this.ground, () => {
                    if (this.game.stateMachine.getCurrentState() === States.RUNNING) {
                        console.log("Collision with ground detected!");
                        this.sound.play('hit');
                        this.time.delayedCall(200, () => this.sound.play('die'));
                        this.game.stateMachine.setState(States.GAMEOVER);
                    }
                });

                this.physics.add.collider(this.bird, this.pipeGroup, () => { // Removed unused params
                    if (this.game.stateMachine.getCurrentState() === States.RUNNING) {
                        console.log("Collision with pipe detected!");
                        this.sound.play('hit');
                        this.time.delayedCall(200, () => this.sound.play('die'));
                        this.game.stateMachine.setState(States.GAMEOVER);
                    }
                });
            },
            onUpdate: (time, delta) => { // scene parameter is 'this'
                if (this.bird) {
                    this.bird.update(time, delta);
                }
                if (this.pipeGroup) {
                    this.pipeGroup.update(time, delta);
                    this.pipeGroup.getChildren().forEach(pipe => {
                        if (pipe.active && pipe.isScoreTarget && !pipe.passed && this.bird && pipe.getBounds().right < this.bird.getBounds().left) {
                            this.score++;
                            if (this.scoreboard) this.scoreboard.updateValue(this.score);
                            this.sound.play('point');
                            console.log("Score: ", this.score, "Pipe Pair ID: ", pipe.pairId);

                            if (this.score >= 100 && this.currentMusicLevel < 6) {
                                this.crossFade(
                                    this.currentMusicLevel === 5 ? this.fifthLevelMusic : this.fourthLevelMusic,
                                    this.sixthLevelMusic,
                                    6);
                            } else if (this.score >= 80 && this.currentMusicLevel < 5) {
                                this.crossFade(
                                    this.currentMusicLevel === 4 ? this.fourthLevelMusic : this.thirdLevelMusic,
                                    this.fifthLevelMusic,
                                    5);
                            } else if (this.score >= 60 && this.currentMusicLevel < 4) {
                                this.crossFade(
                                    this.currentMusicLevel === 3 ? this.thirdLevelMusic : this.secondLevelMusic,
                                    this.fourthLevelMusic,
                                    4);
                            } else if (this.score >= 40 && this.currentMusicLevel < 3) {
                                this.crossFade(
                                    this.currentMusicLevel === 2 ? this.secondLevelMusic : this.gameStartMusic,
                                    this.thirdLevelMusic,
                                    3);
                            } else if (this.score >= 20 && this.currentMusicLevel < 2) {
                                this.crossFade(this.gameStartMusic, this.secondLevelMusic, 2);
                            }

                            if (this.score > 0 && this.score % 10 === 0) {
                                if (this.scoreboard) this.scoreboard.celebrate();
                                if (this.background) {
                                    this.backgroundIsDay = !this.backgroundIsDay;
                                    const newTextureKey = this.backgroundIsDay ? 'background' : 'background_night';
                                    const bgTex = this.textures.get(newTextureKey).getSourceImage();
                                    const bgScale = config.height / bgTex.height;
                                    this.background.setTexture(newTextureKey);
                                    this.background.width = config.width / bgScale;
                                    this.background.height = config.height / bgScale;
                                    this.background.setScale(bgScale);
                                }
                            }
                            this.pipeGroup.updateDifficulty(this.score);
                            pipe.passed = true;
                            this.pipeGroup.getChildren().forEach(otherPipe => {
                                if (otherPipe.pairId === pipe.pairId && otherPipe !== pipe) {
                                    otherPipe.passed = true;
                                }
                            });
                        }
                    });
                }
                if (this.bird && this.bird.y < 0 && this.game.stateMachine.getCurrentState() === States.RUNNING) {
                    console.log("Collision with top boundary detected!");
                    this.sound.play('hit');
                    this.game.stateMachine.setState(States.GAMEOVER);
                }
            },
            onExit: () => {
                console.log("Exited RUNNING state");
                if (this.bird) this.bird.setActive(false).setVisible(false);
                if (this.pipeGroup) this.pipeGroup.stopSpawningAndClear();
                if (this.scoreboard) this.scoreboard.hide();

                if (this.gameStartMusic && this.gameStartMusic.isPlaying) this.gameStartMusic.stop();
                if (this.secondLevelMusic && this.secondLevelMusic.isPlaying) this.secondLevelMusic.stop();
                if (this.thirdLevelMusic && this.thirdLevelMusic.isPlaying) this.thirdLevelMusic.stop();
                if (this.fourthLevelMusic && this.fourthLevelMusic.isPlaying) this.fourthLevelMusic.stop();
                if (this.fifthLevelMusic && this.fifthLevelMusic.isPlaying) this.fifthLevelMusic.stop();
                if (this.sixthLevelMusic && this.sixthLevelMusic.isPlaying) this.sixthLevelMusic.stop();
                this.currentMusicLevel = 0;
            }
        });

        this.game.stateMachine.addState(States.GAMEOVER, {
            onEnter: () => {
                console.log("Entered GAMEOVER state");
                if (this.gameStartMusic && this.gameStartMusic.isPlaying) this.gameStartMusic.stop();
                if (this.secondLevelMusic && this.secondLevelMusic.isPlaying) this.secondLevelMusic.stop();
                if (this.thirdLevelMusic && this.thirdLevelMusic.isPlaying) this.thirdLevelMusic.stop();
                if (this.fourthLevelMusic && this.fourthLevelMusic.isPlaying) this.fourthLevelMusic.stop();
                if (this.fifthLevelMusic && this.fifthLevelMusic.isPlaying) this.fifthLevelMusic.stop();
                if (this.sixthLevelMusic && this.sixthLevelMusic.isPlaying) this.sixthLevelMusic.stop();
                this.currentMusicLevel = 0;

                if (this.menuMusic && !this.menuMusic.isPlaying) {
                    this.menuMusic.play();
                }
                if (this.bird) {
                    this.bird.body.setAllowGravity(false);
                    this.bird.setVelocity(0, 0);
                }
                if (this.pipeGroup && this.pipeGroup.spawnTimer) this.pipeGroup.spawnTimer.paused = true;

                let finalScoreVal = this.score;
                if (finalScoreVal > this.highScore) {
                    this.highScore = finalScoreVal;
                    localStorage.setItem('flappyHighScore', this.highScore);
                }
                if (this.scoreboard) this.scoreboard.hide();

                let gameOverTitle = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.height * 0.3,
                    'GAME OVER',
                    { fontFamily: 'Minecrafter', fontSize: '64px', fill: '#ff0000', fontStyle: 'bold' }
                ).setOrigin(0.5);

                let finalScoreDisplay = new Scoreboard(this, this.cameras.main.centerX, this.cameras.main.height * 0.5, 2.0, 0xffffff);
                finalScoreDisplay.updateValue(finalScoreVal);
                finalScoreDisplay.show();

                let finalBestScoreDisplay = new Scoreboard(this, this.cameras.main.centerX, this.cameras.main.height * 0.6, 1.5, 0xcccccc);
                finalBestScoreDisplay.updateValue(this.highScore);
                finalBestScoreDisplay.show();

                let restartPromptText = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.height * 0.75,
                    'TAP OR PRESS SPACE TO RESTART',
                    { fontFamily: 'Minecrafter', fontSize: '24px', fill: '#fff' }
                ).setOrigin(0.5);

                let gameOverElements = this.add.group([gameOverTitle, restartPromptText]);

                this.time.delayedCall(500, () => {
                    const restartListener = () => {
                        gameOverElements.destroy(true);
                        finalScoreDisplay.destroy();
                        finalBestScoreDisplay.destroy();
                        this.game.stateMachine.setState(States.PRESTART);
                        spaceKey.off('down', restartListener);
                        this.input.off('pointerdown', restartListener);
                    };
                    this.input.once('pointerdown', restartListener);
                    spaceKey.once('down', restartListener);
                });
            },
            onExit: () => {
                console.log("Exited GAMEOVER state");
            }
        });

        this.game.stateMachine.addState(States.PAUSED, {
            onEnter: () => {
                console.log("Entered PAUSED state");
                if (!this.pauseOverlay) {
                    this.pauseOverlay = this.add.rectangle(0, 0, config.width, config.height, 0x000000, 0.5).setOrigin(0, 0);
                    this.pauseOverlay.setScrollFactor(0);
                    this.pauseOverlay.setDepth(25);
                } else {
                    this.pauseOverlay.setVisible(true);
                }
                if (!this.pauseText) {
                    this.pauseText = this.add.text(
                        this.cameras.main.centerX,
                        this.cameras.main.centerY,
                        'PAUSED - TAP OR PRESS SPACE TO RESUME',
                        { fontFamily: 'Minecrafter', fontSize: '28px', fill: '#fff', fontStyle: 'bold' }
                    ).setOrigin(0.5);
                    this.pauseText.setScrollFactor(0);
                    this.pauseText.setDepth(26); // Ensure text is above overlay
                } else {
                    this.pauseText.setVisible(true);
                }

                if (this.bird && this.bird.body) {
                    this.bird.body.setAllowGravity(false);
                    this.bird.setVelocity(0, 0);
                }
                if (this.pipeGroup && this.pipeGroup.spawnTimer) {
                    this.pipeGroup.spawnTimer.paused = true;
                    this.pipeGroup.getChildren().forEach(pipe => {
                        if (pipe.body) {
                            pipe.body.setVelocityX(0);
                        }
                    });
                }

                const resumeListener = () => {
                    this.game.stateMachine.setState(States.RUNNING);
                    spaceKey.off('down', resumeListener);
                    this.input.off('pointerdown', resumeListener);
                };
                this.input.once('pointerdown', resumeListener);
                spaceKey.once('down', resumeListener);
            },
            onExit: () => {
                console.log("Exited PAUSED state");
                if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
                if (this.pauseText) this.pauseText.setVisible(false);

                if (this.bird && this.bird.body) {
                    this.bird.body.setAllowGravity(true);
                }
                if (this.pipeGroup && this.pipeGroup.spawnTimer) {
                    this.pipeGroup.spawnTimer.paused = false;
                    this.pipeGroup.getChildren().forEach(pipe => {
                        if (pipe.body) {
                            pipe.body.setVelocityX(this.pipeGroup.currentPipeVelocityX);
                        }
                    });
                }
            }
        });

        // Initialize the first state for GameScene
        if (this.game.stateMachine.states[this.game.stateMachine.getCurrentState()].onEnter) {
            this.game.stateMachine.states[this.game.stateMachine.getCurrentState()].onEnter(this);
        }
    }

    update(time, delta) {
        if (this.fpsText) {
            this.fpsText.setText('FPS: ' + Math.floor(this.game.loop.actualFps));
        }
        if (this.game.stateMachine) {
            this.game.stateMachine.update(time, delta);
        }
    }
} 