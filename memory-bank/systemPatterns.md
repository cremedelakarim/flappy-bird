# System Patterns

## High-Level Architecture
Frontend-only web application built around the HTML5 Canvas. Core modules:

1. Asset Loader – preloads sprites and sounds before gameplay starts.
2. Game Loop – orchestrates update() and render() at ~60 FPS using requestAnimationFrame.
3. Physics System – applies gravity and handles the bird's velocity and position.
4. Entity Manager – maintains collections of pipes and other world objects.
5. Collision System – axis-aligned bounding box checks between bird and obstacles/ground/top.
6. State Machine – controls transitions between "prestart", "running", and "gameover" states.
7. UI Layer – renders score, high score, and prompts overlaying the canvas.

## Design Patterns Used
• Finite State Machine for game states.
• Object Pooling for pipes to reduce garbage collection.
• Observer/Event Emitter for inter-module communication (e.g., score update).
• Module pattern / ES Modules to encapsulate code.
• Dynamic Sprite Sizing: Using `displayHeight` (and `displayWidth`) in Phaser to visually scale sprites (e.g., pipes) to fit dynamic screen areas without altering their underlying physics body dimensions, ensuring consistent collision detection based on original texture size.

## Component Relationships
Game Loop calls Update on Physics, Entity Manager, Collision System, then delegates Render passes to Entity Manager and UI. Collision System triggers State Machine transition on hit events. Asset Loader resolves Promises before launching Pre-Start state. 