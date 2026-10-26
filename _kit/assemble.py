#!/usr/bin/env python3
"""Assemble a badge engine from the shared base + a badge-specific middle (rig/render/cues) + sounds.

    python3 assemble.py <slug> <middle.js> <sounds.js> --title "Code Cracker" --intro 4.2 \
        --layers badge,medal,ribbon-left,ribbon-right,... --port 5184

Writes  /Users/ariga/Documents/badges/<slug>/<slug>-badge.html  and copies studio.mjs / render.mjs /
package.json (node_modules symlinked to ../rocket/node_modules).

middle.js  = everything from "// Rig: load the SVG" up to the sound engine: buildRig, render, buildCues,
             IDLE_CUES, cuesBetween. Put the token  /*RAYS*/  on its own line right before the
             "// Timeline: render(t)" header; it is replaced with the shared light-rays code.
             buildRig must call buildRays(C, k) and render must call renderRays(t, T.impact).
sounds.js  = "    const S = { ... };\n    return { out, play(...) {...} };\n  }"  (closes createSynth)
"""
import argparse, os, re, shutil

BADGES = '/Users/ariga/Documents/badges'
BASE = f'{BADGES}/insight/insight-badge.html'

ap = argparse.ArgumentParser()
ap.add_argument('slug'); ap.add_argument('middle'); ap.add_argument('sounds')
ap.add_argument('--title', required=True); ap.add_argument('--intro', type=float, required=True)
ap.add_argument('--layers', required=True); ap.add_argument('--port', type=int, required=True)
a = ap.parse_args()

lines = open(BASE).read().split('\n')
def idx(pat, start=0):
    for i in range(start, len(lines)):
        if pat in lines[i]: return i
    raise SystemExit('base engine is missing: ' + pat)
rays_start = idx('// Light rays around the badge') - 1
timeline = idx('// Timeline: render(t)') - 1
rig_start = idx('// Rig: load the SVG') - 1
synth_hdr = idx('// Sound: synthesised with Web Audio') - 1
s_start = idx('    const S = {', synth_hdr)
offline = idx('// Offline render for video export')

mid = open(a.middle).read()
assert '/*RAYS*/' in mid, 'middle.js needs the /*RAYS*/ placeholder'
mid = mid.replace('/*RAYS*/\n', '\n'.join(lines[rays_start:timeline]) + '\n')
html = ('\n'.join(lines[:rig_start]) + '\n' + mid + '\n'.join(lines[synth_hdr:s_start]) + '\n'
        + open(a.sounds).read() + '\n  ' + '\n'.join(lines[offline:]))
html = html.replace('<title>Insight Badge</title>', f'<title>{a.title}</title>')
html = html.replace("svg: params.get('svg') || 'insight-badge.svg',", f"svg: params.get('svg') || '{a.slug}-badge.svg',")
html = html.replace('the artwork from insight-badge.svg is placed here', f'the artwork from {a.slug}-badge.svg is placed here')
html = re.sub(r"    intro: [\d.]+, +// seconds of intro before the idle loop starts",
              f"    intro: {a.intro},        // seconds of intro before the idle loop starts", html)
layers = ', '.join(f"'{l.strip()}'" for l in a.layers.split(','))
html = re.sub(r"const LAYERS = \[[^\]]*\];", f"const LAYERS = [{layers}];", html)
assert html.count('function buildRays') == 1, 'rays code missing or duplicated'
assert 'insight-badge' not in html, 'leftover insight reference'

out = f'{BADGES}/{a.slug}'
os.makedirs(out, exist_ok=True)
open(f'{out}/{a.slug}-badge.html', 'w').write(html)
for fn in ('studio.mjs', 'render.mjs', 'package.json'):
    s = open(f'{BADGES}/insight/{fn}').read().replace('insight-badge', f'{a.slug}-badge')
    s = s.replace('process.env.PORT || 5183', f'process.env.PORT || {a.port}')
    open(f'{out}/{fn}', 'w').write(s)
if not os.path.exists(f'{out}/node_modules'):
    os.symlink('../rocket/node_modules', f'{out}/node_modules')
print(f'assembled {out}/{a.slug}-badge.html  (studio port {a.port})')
