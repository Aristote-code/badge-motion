# Shapes badge

`shapes-badge.svg` is the artwork. `shapes-badge.html` animates whatever is in it (same workflow as the rocket, compass and abacus).

## Edit → see it animate

1. `node studio.mjs` and open http://localhost:5181 (rocket 5178, compass 5179, abacus 5180).
2. Edit `shapes-badge.svg` and save over it; the animation reloads. Click the badge to replay with sound.
3. From Figma, tick **Include "id" attribute** when exporting SVG, or the layer names are lost.

## Export

- `node render.mjs` → intro video (7.6 s) + seamless idle loop (4 s), both with sound, plus PNG, WAV, `.ahap`, Android Kotlin, haptics JSON
- `node render.mjs --extras` → only the sound + haptics files

## The choreography

| Time | What happens | Sound | Haptic |
|---|---|---|---|
| 0.0 | medal pops in | marimba boop | tap |
| 0.16 | ribbons drop and swing | soft double flap | light tap |
| 0.42 / 0.6 / 0.78 | triangle, circle, square pop in | ting / round boop / woody tok (each shape has its own voice) | taps (sharp / soft / medium) |
| 1.0 → 1.46 | both arrows draw on clockwise, heads pop | quick rising harp runs | light taps |
| 1.62 → 2.5 | 3 hops: the shapes travel clockwise around the cycle, spinning as they go (triangle 120°, square 90° per hop), and land back home | slide-whistle "whee" landing on C, E, G | rising buzz + landing tap, getting stronger |
| 2.6 | cycle complete: rings + confetti (triangles, circles and squares) | "ta-da!" chord | strong hit + ticks |
| 2.68 | sparkle stars burst in | tings | — |
| 2.82 | shine sweep | harp glissando | — |
| idle | triangle wobbles, square does a quarter-turn, circle bounces; arrow glow pulses; stars twinkle | shine once per loop | — |

Timings live in `T` (and the idle moves in `IDLE`) near the top of the script in `shapes-badge.html`; sounds and haptics in `buildCues`.

## Layer names

| Layer | What it does |
|---|---|
| `badge` | everything; pops in, squashes on completion |
| `medal` | medal circle; sets the centre and masks the shine |
| `ribbon-left`, `ribbon-right` | drop down and swing |
| `triangle`, `circle`, `square` | pop in, hop around the cycle, idle moves. Hop slots are worked out from where the shapes sit, ordered clockwise around their middle, so moving a shape in the SVG moves its slot |
| `arrow-top`, `arrow-left` | unfilled stroke paths draw on (a path with "glow" in its name or a blur filter is the glow), filled paths are the head and pop at the end |
| `sparkles` | each child is a star; they burst in and twinkle |
