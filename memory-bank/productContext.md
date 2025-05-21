# Product Context

## Why are we building this?
Classic endless-runner style games provide short, engaging play sessions and are perfect showcases for HTML5 game development. Re-implementing Flappy-Bird-style mechanics demonstrates mastery of canvas rendering, game loops, and asset pipelines while producing a fun, instantly recognisable game that can be shared easily.

## Problems it solves
1. Provides a learning reference for HTML5/JavaScript game architecture in a concise codebase.
2. Offers a quick diversion for users without the friction of installation or sign-up.
3. Serves as a foundation that can be extended with additional mechanics, themes, or monetisation.

## How it should work
• Opening the webpage automatically loads the "Ready" screen with a subtle animation inviting the first tap.
• Each tap during gameplay gives the bird an immediate upward velocity boost.
• Pipes scroll from right to left; their vertical position is random within bounds.
• Passing through a gap increments the score; hitting any obstacle ends the run and shows the final score with a "Tap to Try Again" prompt.
• A minimalist art style and upbeat sound effects reinforce replayability.

## User experience goals
1. Quick start: <2 s initial load on broadband.
2. One-touch interaction usable on both desktop and mobile.
3. Clear visual feedback for collisions and scoring.
4. Instant restart loop to encourage "one more try". 