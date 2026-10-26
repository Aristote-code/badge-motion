# Insight badge (chart + magnifier)

`insight-badge.svg` is the artwork. `insight-badge.html` animates whatever is in it (same workflow as the other badges).

## Edit → see it animate

1. `node studio.mjs` and open http://localhost:5183.
2. Edit `insight-badge.svg` and save over it; the animation reloads. Click the badge to replay with sound.
3. From Figma, tick **Include "id" attribute** when exporting SVG, or just say "I updated it in Figma" and it can be pulled from the frame.

## Export

- `node render.mjs` → intro video (8.7 s) + seamless idle loop (4 s), both with sound, plus PNG, WAV, `.ahap`, Android Kotlin, haptics JSON
- `node render.mjs --extras` → only the sound + haptics files

## The choreography

| Time | What happens | Sound | Haptic |
|---|---|---|---|
| 0.0 | medal pops in | marimba boop | tap |
| 0.16 | ribbons drop and swing | soft double flap | light tap |
| 0.36 → 0.62 | baseline draws left → right | soft pluck sweep | — |
| 0.56 / 0.74 / 0.92 | bars grow up from the baseline one by one, overshoot and settle | rising "bloop" landing on C, E, G | building buzz + landing tap, stronger each bar |
| 1.18 → 2.03 | trend line draws node to node; each node pops as the line reaches it | climbing plucks | light ticks |
| 2.03 | peak node pops with a ring pulse | "ping!" bell | crisp tap |
| 2.08 → 3.5 | magnifier zooms in, probes bar 1 → mid-line → peak, then rests; the lens magnifies live | rising glide, curious "blip-blip" at each stop, woody settle | taps |
| 3.62 | complete: rings, confetti, light rays | "ta-da!" chord | strong hit + ticks |
| 3.7 | sparkle stars burst in | tings | — |
| 3.84 | shine sweep | harp glissando | — |
| idle | magnifier hovers in a figure-8 (lens keeps magnifying), node ripple, peak ring pulses, rays turn | shine once per loop | — |

Timings live in `T` near the top of the script in `insight-badge.html`; sounds and haptics in `buildCues`; lens zoom in `ZOOM`.

## Layer names

| Layer | What it does |
|---|---|
| `badge`, `medal`, `ribbon-left`, `ribbon-right`, `sparkles` | as in the other badges |
| `graph` | everything the lens magnifies (a live copy is put inside the lens) |
| `baseline` | draws from its left end |
| `bars` | each child is a bar; grows up from its bottom edge, in order |
| `line-path` | the trend line (keep it a stroke); draws from its start |
| `nodes` | each child is a node; pops when the line reaches it (worked out from where it sits on the line) |
| `target` (+ `target-ring`) | the peak at the end of the line; pops and pulses |
| `loupe` | the magnifier; flies in, probes, hovers |
| `lens` | the glass circle; sets the centre of the magnified view |
| `lens-view` | placeholder inside the lens; replaced at runtime by the live magnified graph |
