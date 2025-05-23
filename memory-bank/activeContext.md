# Active Context

## Current Focus
We are at project inception. Immediate tasks:

1. ~~Set up project repository and base folder structure (assets/, src/, styles/).~~ (Completed)
2. ~~Evaluate Phaser vs PixiJS; create a simple proof-of-concept canvas with each to measure performance footprint and ease of use.~~ (Completed - Chose Phaser with Vite)
3. ~~Choose framework, install dependencies, commit baseline template (index.html + main.js).~~ (Completed)

## Recent Changes
– Roadmap drafted.
– Memory Bank initialised with foundational documents.
– Project repository initialized with Git.
– Base folder structure (assets, src, styles) created.
– Chose Phaser as the game framework and Vite for the dev server.
– Installed Phaser and Vite dependencies.
– Created basic index.html, src/main.js, and styles/main.css.
– Updated npm scripts for Vite.
– Implemented pipe rendering fixes: top pipes correctly inverted and glued to screen top, dynamic displayHeight used to ensure pipes visually reach screen edges without gaps, and pipe pair spacing logic adjusted to prevent overlaps.
– Added wing sound effect on every bird flap.
– Implemented menu background music that plays during PRESTART and GAMEOVER states, and stops during RUNNING state. Addressed initial browser audio autoplay restrictions.
– Implemented gameplay music: "game_start.mp3" (starting 4 seconds in) plays when the game starts, "second_level.mp3" plays at 20 points, and "third_level.mp3" plays at 40 points. Music stops on game over or when returning to menu.

## Next Steps
1. ~~Complete framework evaluation (Phaser vs PixiJS) and record decision in techContext.md.~~ (Completed)
2. ~~Implement baseline Game Loop with blank background and FPS counter (Partially done with basic Phaser setup).~~ (Completed)
3. ~~Integrate Asset Loader stub and generic State Machine skeleton.~~ (Completed)
4. Update progress.md with outcomes after each step.
5. ~~Design game assets (bird sprite, pipes, background) - (Corresponds to Roadmap Step 3)~~ (Placeholders added)
6. ~~Implement basic game canvas rendering (Corresponds to Roadmap Step 4) - Displaying a placeholder background and ground.~~ (Completed)
7. ~~Develop the Bird character (Corresponds to Roadmap Step 5) - Implement appearance and basic physics.~~ (Completed)
8. ~~Create and manage obstacles (Pipes) (Corresponds to Roadmap Step 6).~~ (Completed)
9. ~~Implement Scoring System (Corresponds to Roadmap Step 8).~~ (Completed)
10. ~~Refine input handling (Corresponds to Roadmap Step 11) - Ensure consistent tap/click/spacebar across states and disable during transitions if necessary.~~ (Completed)
11. ~~Implement actual game assets (Corresponds to Roadmap Step 3, revisiting with actual assets now that systems are in place).~~ (Completed - Sprites and audio files copied, preload function updated, bird animation and sounds integrated, menu music added)
12. ~~Implement Game Over screen enhancements (e.g., show final score clearly, better restart prompt) - (Refinement of Roadmap Step 9).~~ (Completed)
13. ~~Refine pipe rendering and spacing: ensure top pipes are inverted, all pipes connect to screen edges without visual gaps, and pipe pairs do not overlap.~~ (Completed)
14. Testing and Debugging (Corresponds to Roadmap Step 13) - Focus on playability, performance across different scenarios, and collision accuracy.
15. Implement sprite-based scoreboard for current score and high score (Corresponds to Roadmap Step 8 refinement).

## Active Decisions & Considerations
• Prioritise minimal build tooling (lean towards Vite).
• Keep code modular and framework-agnostic where practical in case of future engine swap. 