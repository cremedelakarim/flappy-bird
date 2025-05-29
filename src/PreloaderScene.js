import Phaser from 'phaser';

export class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        console.log("PreloaderScene: Preloading assets...");

        const { width, height } = this.cameras.main;
        const BAR_W = 300;
        const BAR_H = 30;
        const BORDER_PADDING = 10; // Padding around the bar

        // Background rectangle for the progress bar (the border)
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8); // Dark grey, slightly transparent
        progressBox.fillRect(
            (width - BAR_W) / 2 - BORDER_PADDING,
            (height - BAR_H) / 2 - BORDER_PADDING,
            BAR_W + (BORDER_PADDING * 2),
            BAR_H + (BORDER_PADDING * 2)
        );

        // The bar that grows (initially empty)
        const progressBar = this.add.graphics();

        // Optional percentage text
        const loadingText = this.add.text(
            width / 2,
            (height - BAR_H) / 2 - BORDER_PADDING - 20, // Positioned above the bar
            'Loading 0%',
            { fontFamily: 'Minecrafter, Arial', fontSize: '24px', fill: '#ffffff' } // Added Arial as fallback
        ).setOrigin(0.5);
        loadingText.setDepth(1); // Ensure text is on top

        // Update progress bar and text on 'progress' event
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1); // White, opaque
            progressBar.fillRect(
                (width - BAR_W) / 2,
                (height - BAR_H) / 2,
                BAR_W * value,
                BAR_H
            );
            loadingText.setText(`Loading ${Math.floor(value * 100)}%`);
        });

        // Clean-up and transition on 'complete' event
        this.load.on('complete', () => {
            console.log("PreloaderScene: Asset loading complete.");
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            this.scene.start('GameScene'); // Transition to the main game scene
        });

        // --- ASSET LOADING STARTS HERE ---
        // Moved from main.js's preload function

        // Background & ground
        this.load.image('background', 'assets/sprites/background-day.png');
        this.load.image('background_night', 'assets/sprites/background-night.png');
        this.load.image('ground_tile', 'assets/sprites/base.png');

        // Bird
        this.load.image('bird_sheet', 'assets/sprites/yellowbird-midflap.png');
        this.load.image('yellowbird-up', 'assets/sprites/yellowbird-upflap.png');
        this.load.image('yellowbird-mid', 'assets/sprites/yellowbird-midflap.png');
        this.load.image('yellowbird-down', 'assets/sprites/yellowbird-downflap.png');

        // Pipes
        this.load.image('pipe_green', 'assets/sprites/pipe-green.png');

        // Score Digits
        for (let i = 0; i <= 9; i++) {
            this.load.image(`digit_${i}`, `assets/sprites/${i}.png`);
        }

        // Audio
        this.load.audio('wing', 'assets/audio/wing.wav');
        this.load.audio('hit', 'assets/audio/hit.wav');
        this.load.audio('die', 'assets/audio/die.wav');
        this.load.audio('point', 'assets/audio/point.wav');
        this.load.audio('swoosh', 'assets/audio/swoosh.wav');
        this.load.audio('menu_music', 'assets/audio/menu_music.mp3');

        this.load.audio('game_start', 'assets/audio/game_start.mp3');
        this.load.audio('second_level', 'assets/audio/second_level.mp3');
        this.load.audio('third_level', 'assets/audio/third_level.mp3');
        this.load.audio('fourth_level', 'assets/audio/fourth_level.wav');
        this.load.audio('fifth_level', 'assets/audio/fifth_level.wav');
        this.load.audio('sixth_level', 'assets/audio/sixth_level.wav');

        // Load high score from local storage (can be done here or in GameScene's create)
        // For simplicity, keeping it here for now, though GameScene might be more logical
        // if it's only used there.
        // Note: This won't be available to GameScene directly unless passed or re-read.
        // It's better to handle this in GameScene.create()
        // highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
    }

    create() {
        console.log("PreloaderScene: Create method (not much to do here, transitions on load complete)");
        // Note: Font loading should ideally be handled before Phaser game boots,
        // or with a dedicated font loading strategy if fonts are numerous/large.
        // The current main.js logic handles "Minecrafter" globally.
    }
} 