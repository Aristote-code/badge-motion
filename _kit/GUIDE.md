# Badge workflow guide (how every badge in this set is made)

Read this fully before starting. The finished badges `abacus`, `shapes`, `measure`, `insight` in
`/Users/ariga/Documents/badges/` are the quality bar; their generator / middle / sounds files are in
`_kit/examples/` (`gen_*.py`, `*_middle.js`, `*_sounds.js`). **Copy their structure closely.**

## 0. Understand the subject first
The reference images are AI-generated and contain mistakes. Before drawing, think about how the real
object works and correct anything physically wrong (e.g. a padlock shackle must enter the top of the
body on both legs; an open book's spine is under the pages, not glued to the front; an envelope's flap
is on the back; a pen's ink trail starts at the nib tip). Look at `<slug>/reference/<slug>-reference.png`
(rendered from the user's traced SVG) and the brief you were given.

## 1. Illustrate (clean SVG with named layers)
- Write a Python generator `<slug>/gen.py` that writes `<slug>/<slug>-badge.svg`. Use the shared kit:
  `sys.path.insert(0, '/Users/ariga/Documents/badges/_kit'); from medal import THEMES, defs, ribbons, medal, star, dash`
- Canvas 840 x 960, `viewBox="0 0 840 960"`, medal centred at (420, 412). Structure:
  `<g id="badge">{ribbons(t)}{medal(t)} …icon layers… </g>` with `defs(t)` inside `<defs>`.
- **Centre the icon** on the medal (420, 412): compute the bounding box of the whole icon (including 3D
  depth offsets) and shift so its centre sits on (420, 412). Keep it mostly inside the inner face (r ≈ 306);
  small overlaps onto the ring are fine.
- Style (match the set): chunky shapes, a darker offset "depth" copy under each main shape (offset ~ +5, +12),
  gradient faces, a bright highlight stroke/ellipse, deep outlines only where the reference has them,
  gold = `url(#gold-fill)` / `url(#gold-deep)`, stars via `star()`, burst ticks via `dash()`.
- Every part that animates gets a clear kebab-case `id` (these become Figma layer names). Groups whose
  children animate one-by-one (dials, pages, tiles, dots…) must contain only those children.
- No `<use>`, no `<text>` (draw letters as stroked paths so they look identical everywhere). Masks/clipPaths OK.
- Render and LOOK at it: `node /Users/ariga/Documents/badges/_kit/check.mjs <slug> svg` → `<slug>/check/artwork.png`.
  Compare with the reference; fix proportions, centring, anything ugly. Iterate until it is clean.

## 2. Animate (engine)
- Write `<slug>/middle.js` (copy `_kit/examples/insight_middle.js` or the closest example and adapt) and
  `<slug>/sounds.js` (copy an example `*_sounds.js`, keep `pop`, `flap`, `tada`, `confetti`, `sparkle`, `shine`
  and add badge-specific sounds). The helpers `marimba`, `bell`, `pluck`, `voice`, `osc`, `env`, `filt`, `noise`,
  `swell`, `N()` and note names C4…E7 are available in sounds.js.
- middle.js must contain: key times `T` (with `T.impact` and `T.shine`), `buildRig` (measure everything in
  stage space with `centreOf`/`stageBox` **before** wrapping, then `wrapAt`), the shared shine/confetti/twinkle
  code, `buildRays(C, k)` call, `/*RAYS*/` placeholder line before the Timeline header, `render(t)` (calls
  `renderRays(t, T.impact)`), `buildCues`, `IDLE_CUES`, `cuesBetween`.
- The story: every badge tells a short story with its icon (see your brief), then the shared finale:
  ta-da + gold/white rings + confetti + light rays at `T.impact`, sparkle stars, shine sweep.
  Medal pops at 0, ribbons drop at 0.16 (copy that code).
- Idle loop (after `CONFIG.intro`, period `CONFIG.loop` = 4 s): gentle, **strictly periodic** motion
  (use `idleT * TAU / CONFIG.loop` or integer multiples). Fade idle motion in with `idleOn`.
- Sounds: Duolingo-style — woody marimba, bells, plucks, rising major notes; no harsh noise. Every key beat
  has a sound and (for important ones) a haptic in `buildCues`. Keep beats ≥ 80 ms apart.
- Assemble: `python3 /Users/ariga/Documents/badges/_kit/assemble.py <slug> <slug>/middle.js <slug>/sounds.js --title "<Title>" --intro <seconds> --layers <comma list> --port <port>`
  (`--intro` = time after the shine ends, ≈ T.shine[1] + 0.1).
- Check: `node /Users/ariga/Documents/badges/_kit/check.mjs <slug> frames 0.3,0.6,…` → look at
  `<slug>/check/sheet.png`; console must say `missing: []` and show no errors. Look at the frames and fix
  timing/pivots/ugliness. Then `node …/check.mjs <slug> loop` → PSNR must be > 55 dB (or inf).

## 3. Export + document
- `cd <slug> && node render.mjs` (takes ~2 min) → intro mp4, idle-loop mp4, png, wav, ahap, kt, json.
- Write `<slug>/README.md` in the same format as `/Users/ariga/Documents/badges/insight/README.md`
  (choreography table with time / what happens / sound / haptic, layer names table).

## Done means
Clean, centred, corrected artwork; all layers found; story reads clearly; loop seamless; exports present;
README written. Report back: the corrections you made vs the reference, the choreography beats with times,
the layer list, anything you were unsure about.
