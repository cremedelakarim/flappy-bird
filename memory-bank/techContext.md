# Technical Context

## Technologies
• JavaScript (ES2020+)
• HTML5 Canvas API
• Game framework: Phaser 3
• Node + npm for tooling (Vite for dev server and bundling).
• Git for version control.

## Development Setup
1. git init in project root with .gitignore.
2. npm init -y to manage dependencies.
3. Install chosen framework (`npm install phaser`) and dev tools (`npm install vite`).
4. Start dev server with npm script (`npm run dev`) to serve index.html.
5. Use VS Code + ESLint + Prettier for consistent code style.

## Technical Constraints
• Must remain a pure frontend build; backend services not permitted.
• Bundle size goal: <2 MB uncompressed.
• Support latest two major versions of Chrome, Firefox, Safari, and Edge.
• Mobile touch events must map to the same input handler as desktop clicks.
• Only open-source dependencies to simplify licensing.

## Dependencies
• phaser@^3.x
• vite@latest
• eslint, prettier 