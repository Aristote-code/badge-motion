# Rocket badge

`rocket-badge.svg` is the artwork. `rocket-badge.html` animates whatever is in it.

## Edit → see it animate

1. Start the studio: `node studio.mjs` and open http://localhost:5178
2. Edit `rocket-badge.svg` (Figma, Illustrator, or a text editor) and save/export over it.
3. The animation reloads by itself. Click the badge to replay the intro.

You can also drag any `.svg` onto the studio window to try it without saving.

## Export videos

`node render.mjs` → `rocket-badge-intro.mp4` (6 s), `rocket-badge-idle-loop.mp4` (4 s, seamless), `rocket-badge.png`

## Sound & haptics

Both come from one cue sheet (`CUES` in `rocket-badge.html`), so they stay in sync with the animation.
Sounds are synthesised (no audio files): marimba boops, a rising C–E–G–C fly-in, a "ta-da" chord on impact,
twinkly confetti, a crystal ting and a harp glissando for the shine.

| File | Use it for |
|---|---|
| `rocket-badge-intro.mp4`, `-idle-loop.mp4` | video with sound |
| `rocket-badge-sound.wav` | the sound on its own (for an app) |
| `rocket-badge.ahap` | iOS Core Haptics — plays haptics **and** the WAV together (keep both files side by side) |
| `rocket-badge-haptics-android.kt` | Android `VibrationEffect` waveform |
| `rocket-badge-haptics.json` | the raw haptic timeline (for any other platform) |

In the studio, click the badge to play with sound (browsers need a click first). Haptics play in the browser only on
Android Chrome; iPhone browsers and desktops can't vibrate, so test the `.ahap` in an iOS app.

## Layer names the animation looks for

| Layer | What it does |
|---|---|
| `badge` | everything; pops in and squashes on impact |
| `shield` | shield shape; the shine sweep is masked to it |
| `inner` | scene inside the shield; fades in |
| `sky-stars` | small stars; twinkle |
| `inner-line` | cream outline; draws on (must stay a stroke) |
| `trails` | exhaust; moves with the rocket, grows out behind it |
| `speed-lines` | dashed strokes inside the trails; flow backwards |
| `rocket` | flies in, then bobs |
| `rocket-outline` | dark sticker outline behind the rocket; moves with it |
| `flame` | flickers |
| `spark` | sparkle on the window; pops and twinkles |

- Recolour, reshape, add details: anything inside a named layer just inherits its motion.
- If you move or resize the rocket, move `rocket-outline` and `trails` with it — they're separate layers.
- Missing layers are skipped; the status line at the bottom tells you which names were found.
- Figma: name the layers exactly as above and tick **Include "id" attribute** when exporting SVG.
- Changing the rocket's angle: set `rocketAngle` near the top of `rocket-badge.html` (degrees clockwise from straight up).
