# Measure badge (ruler + protractor)

`measure-badge.svg` is the artwork. `measure-badge.html` animates whatever is in it (same workflow as the other badges).

## Edit → see it animate

1. `node studio.mjs` and open http://localhost:5182 (rocket 5178, compass 5179, abacus 5180, shapes 5181).
2. Edit `measure-badge.svg` and save over it; the animation reloads. Click the badge to replay with sound.
3. From Figma, tick **Include "id" attribute** when exporting SVG, or the layer names are lost.

## Export

- `node render.mjs` → intro video (7.5 s) + seamless idle loop (4 s), both with sound, plus PNG, WAV, `.ahap`, Android Kotlin, haptics JSON
- `node render.mjs --extras` → only the sound + haptics files

## The choreography

| Time | What happens | Sound | Haptic |
|---|---|---|---|
| 0.0 | medal pops in | marimba boop | tap |
| 0.16 | ribbons drop and swing | soft double flap | light tap |
| 0.36 | protractor swings in | low-to-high woody swing | tap |
| 0.62 → 1.08 | angle ticks sweep on around the arc, then along the straight edge | soft clockwork run | — |
| 0.95 → 1.35 | ruler slides in along its length, hole end first, and settles | rising glide landing on a note | tap on landing |
| 1.4 → 1.98 | ruler ticks count up from the hole to the tip | measuring-tape "zip" of rising clicks, a note on every long tick | light buzz, building |
| 2.04 → 2.4 | a glint runs along the ruler | bright "measured!" ting | crisp tap |
| 2.5 | complete: rings, confetti, light rays | "ta-da!" chord | strong hit + ticks |
| 2.58 | sparkle stars burst in | tings | — |
| 2.72 | shine sweep | harp glissando | — |
| idle | glint runs along the ruler, tick ripples, protractor and ruler rock gently, rays turn and shimmer | shine once per loop | — |

Timings live in `T` near the top of the script in `measure-badge.html`; sounds and haptics in `buildCues`.

## Layer names

| Layer | What it does |
|---|---|
| `badge` | everything; pops in, squashes on completion |
| `medal` | medal circle; sets the centre and masks the shine |
| `ribbon-left`, `ribbon-right` | drop down and swing |
| `protractor` (+ `protractor-body`) | swings in about the body's centre; rocks while idle |
| `protractor-ticks`, `protractor-edge-ticks` | each child ticks on in document order |
| `ruler` (+ `ruler-body`) | slides in along its length; the glint is masked to `ruler-body` |
| `ruler-ticks` | each child counts up in order; the ruler's direction is read from the first → last tick, so re-angling it just works |
| `sparkles` | each child is a star; they burst in and twinkle |
