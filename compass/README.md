# Compass badge

`compass-badge.svg` is the artwork. `compass-badge.html` animates whatever is in it (same workflow as the rocket badge).

## Edit → see it animate

1. `node studio.mjs` and open http://localhost:5179 (the rocket studio uses 5178, so both can run).
2. Edit `compass-badge.svg` (Figma, Illustrator, text editor) and save over it — the animation reloads.
3. Click the badge to replay with sound. Drag any `.svg` onto the window to try it without saving.

From Figma: name the layers as below and tick **Include "id" attribute** when exporting SVG.

## Export

- `node render.mjs` → intro video (7.1 s) and seamless idle loop (4 s), both with sound, plus PNG, WAV, `.ahap` (iOS), Android Kotlin, haptics JSON
- `node render.mjs --extras` → only the sound + haptics files

## The choreography

| Time | What happens | Sound | Haptic |
|---|---|---|---|
| 0.0 | medal pops in | marimba boop | tap |
| 0.16 | ribbons drop and swing | soft double flap | light tap |
| 0.36 | compass case pops in | higher boop | tap |
| 0.5 | ticks appear clockwise, rose spins in, needle whirls | soft tick run + slowing whirr | fading buzz |
| 1.08 | needle settles on its heading | woody click | crisp tap |
| 1.18 → 1.71 | track draws from step 1; 1, 2, 3 and the arrow pop in as it reaches them | rising C–E–G–C bells | taps, getting stronger |
| 2.1 | loop complete: rings + confetti | "ta-da!" chord | strong hit + ticks |
| 2.3 | shine sweep | harp glissando | — |
| idle | a glowing dot travels the loop, each step bounces as it passes, needle sways | shine once per loop | — |

Timings live in `T` near the top of the script in `compass-badge.html`; sounds and haptics in `buildCues`.
Step times are measured from where the markers sit on the track, so moving a marker in the SVG moves its beat too.

## Layer names

| Layer | What it does |
|---|---|
| `badge` | everything; pops in, squashes on completion |
| `medal` | medal circle; sets the centre and masks the shine |
| `ribbon-left`, `ribbon-right` | drop down and swing |
| `track` | the loop; draws on from its path start (keep it a stroke, starting at step 1) |
| `marker-1`, `marker-2`, `marker-3`, `arrow` | pop in as the track reaches them |
| `compass` | case pops in |
| `face` | sets the compass centre (needle and rose pivot) |
| `ticks` | each child appears in turn |
| `rose` | spins in |
| `needle` | whirls and settles; sways while idle |
