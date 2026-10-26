# Abacus badge

`abacus-badge.svg` is the artwork. `abacus-badge.html` animates whatever is in it (same workflow as the rocket and compass).

## Edit → see it animate

1. `node studio.mjs` and open http://localhost:5180 (rocket 5178, compass 5179).
2. Edit `abacus-badge.svg` and save over it; the animation reloads. Click the badge to replay with sound.
3. From Figma, tick **Include "id" attribute** when exporting SVG, or the layer names are lost.

## Export

- `node render.mjs` → intro video (7.3 s) + seamless idle loop (4 s), both with sound, plus PNG, WAV, `.ahap`, Android Kotlin, haptics JSON
- `node render.mjs --extras` → only the sound + haptics files

## The choreography

| Time | What happens | Sound | Haptic |
|---|---|---|---|
| 0.0 | medal pops in | marimba boop | tap |
| 0.16 | ribbons drop and swing | soft double flap | light tap |
| 0.34 | abacus frame pops in with a twist | higher boop | tap |
| 0.62 → 1.68 | the 9 beads slide in along their rods, one by one, row by row | a woody clack per bead, counting up the scale | 9 ticks, slowly stronger |
| 1.84 / 2.02 | + then − pop in | bell notes (+ high, − answers lower) | taps |
| 2.26 | sum complete: rings + confetti | "ta-da!" chord | strong hit + ticks |
| 2.34 | sparkle stars burst in | three quick tings | — |
| 2.48 | shine sweep | harp glissando | — |
| idle | beads flick along their rods in a counting wave, signs bob, stars twinkle, frame sways | shine once per loop | — |

Timings live in `T` near the top of the script in `abacus-badge.html`; sounds and haptics in `buildCues`.

## Layer names

| Layer | What it does |
|---|---|
| `badge` | everything; pops in, squashes on completion |
| `medal` | medal circle; sets the centre and masks the shine |
| `ribbon-left`, `ribbon-right` | drop down and swing |
| `abacus` | the whole abacus; pops in, sways while idle |
| `frame` | sets the abacus pivot (its centre) |
| `row-1`, `row-2`, `row-3` | each child is a bead; beads slide in left-to-right order. The rod direction is read from the first and last bead, so tilting the abacus just works |
| `plus`, `minus` | pop in, bob while idle |
| `sparkles` | each child is a star; they burst in and twinkle |
