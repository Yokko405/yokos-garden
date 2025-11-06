# YOKO's Garden 🐯

Tiger-themed habit tracker that runs 100% in the browser. Cute, fast, and private.

Live (GitHub Pages)
- https://yokko405.github.io/yokos-garden/

## Features
- Cute tiger mascot with animations and messages
- Habit list with: add, complete, delete
- Gamified progression: EXP, level, coins, badges, shop items
- Daily progress and streak indicator
- Background music toggle and completion chime (Web Audio)
- Data saved locally via localStorage (no server)
- Import/Export JSON backup

## Usage
1. Open the live link above
2. Add a habit with name/emoji/points/frequency
3. Tap 達成！ to complete and earn EXP/coins
4. Toggle music from the header (♪ 音楽ON/OFF)
5. Export/Import from the UI to back up or migrate

## Development
This is a single-file app (`index.html`) built with React UMD + Babel Standalone for simplicity.

Run locally:

```bash
open index.html   # macOS (or just double-click)
```

Structure:
- `index.html`: UI + styles + logic
- `.nojekyll`: disable Jekyll on GitHub Pages
- `.gitignore`: common ignores

## Deploy (GitHub Pages)
Settings → Pages → Build and deployment:
- Source: Deploy from a branch
- Branch: main / root

After saving, wait ~30–120 seconds for the site to publish.

## License
MIT