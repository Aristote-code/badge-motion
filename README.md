# Badge Motion

Animated achievement badges: clean layered SVG artwork plus an animation engine with sound and haptics.
Live showcase: https://badge-motion-twist.netlify.app

- `<slug>/`: one folder per badge. Each holds:
  - artwork: `gen.py` → `<slug>-badge.svg`
  - engine: `<slug>-badge.html`, built from `middle.js` + `sounds.js`
  - exports: intro and idle-loop MP4, PNG, WAV, AHAP, Android Kotlin
  - a README with the choreography
- `_kit/`: the shared medal parts, engine assembler, checks and workflow guide (`GUIDE.md`)
- `showcase/` + `build-site.mjs`: the showcase site (builds into `site/`, deployed to Netlify)

## Setup

Each badge folder needs a `node_modules` symlink to a folder with `playwright-core` installed:

```bash
npm i playwright-core
```
