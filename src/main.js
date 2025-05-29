import Phaser from 'phaser';
// Import the new scenes
import { PreloaderScene } from './PreloaderScene.js';
import { GameScene } from './GameScene.js';

// Game Configuration - Updated to use the new scenes
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
            gravity: { y: 300 }, // Default gravity, GameObjects can override it
            debug: false
        }
    },
    scene: [PreloaderScene, GameScene], // Use an array of scenes: Preloader first, then GameScene
    // No need for global stateMachine in config; GameScene will manage its own instance.
};

// Make sure the custom "Minecrafter" font is fully loaded BEFORE we boot Phaser.
let game; // Phaser game instance
const bootGame = () => {
  if (!game) game = new Phaser.Game(config);
};

if (document.fonts && document.fonts.load) {
  // Modern browsers: Trigger the fetch for the font, then boot Phaser when done.
  document.fonts.load('16px "Minecrafter"') // Request specific size for caching
    .then(bootGame)
    .catch((err) => {
        console.error("Font loading error:", err);
        bootGame(); // Fallback: boot game anyway if font fails
    });
} else {
  // Fallback for older browsers or environments without document.fonts
  window.addEventListener('load', bootGame);
}

// All global game-specific variables and functions (preload, create, update)
// have been moved into PreloaderScene.js and GameScene.js.
// Their logic is now encapsulated within those Scene classes.