# Code Cracker badge (combination padlock)

`code-cracker-badge.svg` is the artwork (made by `gen.py`). `code-cracker-badge.html` animates whatever is in it (same workflow as the other badges). The artwork shows the **final** state: dials on ● ★ ▲ and the shackle open.

## Edit → see it animate

1. `node studio.mjs` and open http://localhost:5184.
2. Edit `code-cracker-badge.svg` and save over it; the animation reloads. Click the badge to replay with sound.
3. From Figma, tick **Include "id" attribute** when exporting SVG, or just say "I updated it in Figma" and it can be pulled from the frame.

## Export

- `node render.mjs` → intro video (8 s) + seamless idle loop (4 s), both with sound, plus PNG, WAV, `.ahap`, Android Kotlin, haptics JSON
- `node render.mjs --extras` → only the sound + haptics files

## The choreography

| Time | What happens | Sound | Haptic |
|---|---|---|---|
| 0.0 | medal pops in | marimba boop | tap |
| 0.16 | ribbons drop and swing | soft double flap | light tap |
| 0.32 | padlock drops in, **closed**, dials showing random symbols | heavier woody boop | tap |
| 0.68 / 0.72 / 0.76 | the three dials start rolling like slot reels (symbols roll round the drum, motion-blurred) | woody ticks, one per symbol passing, rising in pitch | light continuous buzz |
| 1.34 | left dial lands on ● (clicks just past and back) | "thunk" on C5 | tap |
| 1.70 | right dial lands on ▲ | "thunk" on E5 | stronger tap |
| 2.06 | middle dial slows longest and lands last on ★, glow flashes behind the star | "thunk" on G5 + shimmer | strongest tap |
| 2.32 | latch clicks (shackle tugs down slightly) | tiny metallic click | crisp tick |
| 2.40 | "click-clack": shackle springs up, body recoils | wooden "ka-chunk" + bright bell | strong hit |
| 2.56 → 2.96 | shackle swings open about its long left leg; the short right leg comes clear of its hole | soft woody clack as it settles | light tap |
| 2.98 | complete: rings, confetti, light rays, burst dashes pop out | "ta-da!" chord | strong hit + ticks |
| 3.06 | sparkle stars burst in | tings | — |
| 3.20 | shine sweep | harp glissando | — |
| idle | dials nudge one after another, shackle wobbles gently, burst dashes pulse, star glow breathes, rays turn | shine once per loop | — |

Timings live in `T` near the top of the script in `code-cracker-badge.html` (`T.land` sets the landing order); the open pose of the shackle in `SHACKLE`; reel speed in `SPIN_SPEED`; sounds and haptics in `buildCues`.

## Layer names

| Layer | What it does |
|---|---|
| `badge`, `medal`, `ribbon-left`, `ribbon-right`, `sparkles` | as in the other badges |
| `padlock` | the whole lock; drops in, jolts on each landing, recoils on unlock |
| `lock-top` | top face of the body (behind the shackle) with `hole-left`, `hole-right` |
| `hole-left` | the shackle pivots here when it swings open (its long leg stays in this hole) |
| `shackle` | drawn in the open pose; the animation starts it locked (lowered + swung back) |
| `lock-body` | front of the body incl. `dial-window` |
| `dials` | each child (`dial-1`..`dial-3`, left → right) is one dial |
| `dial-N-drum` | the drum face; sets the drum's centre and radius |
| `dial-N-reel` | the symbols round the drum, **in order** round the cylinder; the one at the drum centre is the answer. Children with `opacity="0"` are on the hidden back of the drum |
| `dial-glow` | soft glow behind the star; flashes when the star lands |
| `bursts` | each child is a yellow dash; they pop outward at the finale and pulse in the idle loop |
