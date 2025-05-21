# Project Brief

## Overview
We are building a lightweight, browser-based 2D arcade game inspired by the classic “Flappy Bird”. The player controls a bird that must navigate through an endless series of vertically-gapped pipes by tapping/clicking to flap upward while gravity constantly pulls the bird downward.

## Core Requirements
1. Cross-platform web delivery – must run smoothly in modern desktop and mobile browsers without installation.
2. Single-button input (mouse click, screen tap, or space-bar) that causes the bird to flap.
3. Continuous side-scrolling environment with procedurally generated pipe obstacles.
4. Accurate physics simulation (gravity, upward thrust) that feels responsive and fair.
5. Robust collision detection between bird, pipes, ground, and top boundary to trigger game-over.
6. Real-time scoring that increments when the bird passes a pipe pair and persists best score for the session.
7. Distinct game states: "Pre-Start / Ready", "Running", and "Game Over", each with appropriate UI prompts.
8. Smooth 60 FPS animation and frame-rate-independent game loop.
9. All game assets (sprite sheets, sounds) loaded and managed efficiently to minimise latency.
10. Deployed publicly (e.g. GitHub Pages or itch.io) and easy to share via URL.

## Success Criteria
• The game starts instantly in the browser, achieves ≥60 FPS on typical hardware, and never crashes.
• Controls feel snappy; average input-to-action latency < 50 ms.
• No visual artefacts or logic glitches when pipe speed increases over time.
• Scores and high-scores are displayed clearly and reset correctly between sessions (sessionStorage is acceptable).
• Players report "it feels just like Flappy Bird" during testing. 