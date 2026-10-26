"""Code Cracker badge: a gold combination padlock with three rolling symbol drums, cracked open.

Writes code-cracker-badge.svg. The artwork shows the FINAL (unlocked) state:
the shackle is lifted and swung so its short right leg is out of its hole.
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['blue']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)

# ------------------------------------------------------------------ padlock (local coords)
# front face of the body: x -200..200, y -110..140 (origin = body centre-ish)
BW, BT, BB, BR = 200, -110, 140, 52           # half width, top, bottom, corner radius
LEG = 118                                      # shackle legs at x = ±LEG (both enter the TOP of the body)
SR = LEG                                       # shackle arc radius (centreline)
SW = 50                                        # shackle thickness
YC = -136                                      # arc centre y (straight leg above the body = 26)
LIFT, SWING = 40, -13                          # unlocked pose: lifted, then swung about the left hole
HOLE_Y = -119
TILT, SCALE = 6, 1.10

def rot(p, a, c=(0, 0)):
    a = math.radians(a); x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))

def unlocked(p):                               # locked shackle point -> unlocked pose (padlock local)
    return rot((p[0], p[1] - LIFT), SWING, (-LEG, HOLE_Y))

# --- place the icon on the medal: fit body (incl. depth) + open shackle inside the inner face (r 306).
# A plain bbox centre pushes the wide body onto the ring, so search the offset that minimises the
# body's max radius (the narrow shackle top may come within ~10 px of the inner rim).
body_pts = [(cx + dx + BR * math.cos(math.radians(i)), cy + dy + BR * math.sin(math.radians(i)))
            for i in range(0, 361, 4) for cx, cy in [(-BW + BR, BT + BR), (BW - BR, BT + BR), (BW - BR, BB - BR), (-BW + BR, BB - BR)]
            for dx, dy in [(0, 0), (7, 15)]]
sh_pts = [unlocked(((SR + SW / 2 + 5) * math.cos(math.radians(180 + i)), YC + (SR + SW / 2 + 5) * math.sin(math.radians(180 + i)) + 5)) for i in range(0, 181, 3)]
def radii(ox, oy):
    st = lambda p: (rot((p[0] * SCALE, p[1] * SCALE), TILT)[0] + ox, rot((p[0] * SCALE, p[1] * SCALE), TILT)[1] + oy)
    return max(math.hypot(*st(p)) for p in body_pts), max(math.hypot(*st(p)) for p in sh_pts)
fit = min(((max(rb, rs - 10), ox, oy, rb, rs) for ox in range(-20, 21, 2) for oy in range(0, 121, 2) for rb, rs in [radii(ox, oy)]))
PX, PY = MC[0] + fit[1], MC[1] + fit[2]
print(f'fit: body r {fit[3]:.0f}, shackle r {fit[4]:.0f} (inner face 306)  padlock origin', PX, PY)
def to_stage(p):
    q = rot((p[0] * SCALE, p[1] * SCALE), TILT); return (q[0] + PX, q[1] + PY)

# ------------------------------------------------------------------ shackle
def shackle():
    yl, yr = -40, -96                          # leg ends (left = long leg, right = short leg, both hidden when locked)
    d = f"M {-LEG} {yl} V {YC} A {SR} {SR} 0 0 1 {LEG} {YC} V {yr}"
    hi = f"M {-LEG - 9} -128 V {YC} A {SR + 9} {SR + 9} 0 0 1 {f(-(SR + 9) * math.cos(math.radians(55)))} {f(YC - (SR + 9) * math.sin(math.radians(55)))}"
    glint = f"M {f(-(SR + 10) * math.cos(math.radians(70)))} {f(YC - (SR + 10) * math.sin(math.radians(70)))} A {SR + 10} {SR + 10} 0 0 1 {f((SR + 10) * math.cos(math.radians(80)))} {f(YC - (SR + 10) * math.sin(math.radians(80)))}"
    # pose: lift, then swing about the left hole (this is the unlocked final state)
    return f'''    <g id="shackle" transform="rotate({SWING} {-LEG} {HOLE_Y}) translate(0 {-LIFT})">
      <path d="{d}" stroke="#b84a04" stroke-width="{SW + 10}" transform="translate(5 9)"/>
      <path d="{d}" stroke="#e26204" stroke-width="{SW + 8}"/>
      <path d="{d}" stroke="#f59204" stroke-width="{SW}"/>
      <path d="{d}" stroke="#fccb12" stroke-width="{SW - 14}" transform="translate(-4 -3)"/>
      <path d="{hi}" stroke="#fef058" stroke-width="13" stroke-linecap="round"/>
      <path d="{glint}" stroke="#fffbe0" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
      <path d="M {LEG - SW / 2 + 4} -101 H {LEG + SW / 2 - 4}" stroke="#fde15e" stroke-width="5" stroke-linecap="round"/>
    </g>'''

# ------------------------------------------------------------------ body
def body_rect(dx=0, dy=0):
    x0, x1, y0, y1, r = -BW + dx, BW + dx, BT + dy, BB + dy, BR
    return (f"M {x0 + r} {y0} H {x1 - r} A {r} {r} 0 0 1 {x1} {y0 + r} V {y1 - r} A {r} {r} 0 0 1 {x1 - r} {y1} "
            f"H {x0 + r} A {r} {r} 0 0 1 {x0} {y1 - r} V {y0 + r} A {r} {r} 0 0 1 {x0 + r} {y0} Z")

lock_top = f'''    <g id="lock-top">
      <rect x="-172" y="-136" width="344" height="60" rx="20" fill="#e26204" transform="translate(5 6)"/>
      <rect x="-172" y="-136" width="344" height="60" rx="20" fill="url(#top-fill)"/>
      <path d="M -150 -131 H 150" stroke="#fffbe0" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
      <ellipse id="hole-left" cx="{-LEG}" cy="{HOLE_Y}" rx="{SW / 2 + 6}" ry="9" fill="#5a1c02"/>
      <ellipse id="hole-right" cx="{LEG}" cy="{HOLE_Y}" rx="{SW / 2 + 6}" ry="9" fill="#5a1c02"/>
      <path d="M {LEG - SW / 2 - 2} {HOLE_Y + 3} Q {LEG} {HOLE_Y + 11} {LEG + SW / 2 + 2} {HOLE_Y + 3}" stroke="#2a0c01" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    </g>'''

# ------------------------------------------------------------------ dials
DW, DH, DY = 100, 160, 13                       # drum width/height, centre y
DX = [-108, 0, 108]
R = DH / 2 * 1.06                              # drum radius used for the cylinder projection
STEP = 60                                      # one symbol slot every 60° around the drum
SYMS = ['circle', 'triangle', 'star', 'square', 'diamond', 'plus']

def sym_shape(kind, col, deep):
    if kind == 'circle':
        return f'<circle r="26" fill="{col}"/><circle cx="-9" cy="-10" r="6" fill="#ffffff" opacity="0.35"/>'
    if kind == 'triangle':
        return (f'<path d="M 0 -25 L 25 20 L -25 20 Z" fill="{col}" stroke="{col}" stroke-width="10" stroke-linejoin="round"/>'
                f'<path d="M -3 -14 L -13 4" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.35"/>')
    if kind == 'star':
        p = []
        for i in range(10):
            a = math.radians(-90 + i * 36); rr = 31 if i % 2 == 0 else 13.5
            p.append(f"{f(rr * math.cos(a))} {f(rr * math.sin(a) + 2)}")
        d = 'M ' + ' L '.join(p) + ' Z'
        return (f'<path d="{d}" fill="{deep}" stroke="{deep}" stroke-width="7" stroke-linejoin="round" transform="translate(1.5 2.5)"/>'
                f'<path d="{d}" fill="{col}" stroke="{col}" stroke-width="6" stroke-linejoin="round"/>'
                f'<path d="M -4 -16 L -8 -4" stroke="#fffbe0" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>')
    if kind == 'square':
        return f'<rect x="-22" y="-22" width="44" height="44" rx="9" fill="{col}"/><path d="M -12 -13 H 4" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.35"/>'
    if kind == 'diamond':
        return f'<path d="M 0 -28 L 26 0 L 0 28 L -26 0 Z" fill="{col}" stroke="{col}" stroke-width="6" stroke-linejoin="round"/>'
    if kind == 'plus':
        return f'<path d="M 0 -24 V 24 M -24 0 H 24" stroke="{col}" stroke-width="16" stroke-linecap="round"/>'

DIALS = [  # name, face symbol, drum palette (top/bottom edge, middle), symbol colour, symbol deep, tick colour
    dict(face='circle', edge='#0b4fd8', mid='#5ff0ff', mid2='#2fb8ff', sym='#0a2db0', deep='#061c80', tick='#0b3fb8', line='#0721b5'),
    dict(face='star', edge='#e6a84e', mid='#fffbea', mid2='#fbe9b8', sym='#fbb40e', deep='#d86a04', tick='#d88a2a', line='#c06a14'),
    dict(face='triangle', edge='#0b4fd8', mid='#5ff0ff', mid2='#2fb8ff', sym='#0a2db0', deep='#061c80', tick='#0b3fb8', line='#0721b5'),
]

def dial(i, d):
    cx, cy = DX[i], DY
    face = SYMS.index(d['face'])
    slots = []
    for j in range(6):
        th = ((j - face) * STEP + 180) % 360 - 180
        vis = abs(th) < 89
        y = R * math.sin(math.radians(th)) if vis else 0
        sy = math.cos(math.radians(th)) if vis else 1
        op = '' if vis else ' opacity="0"'
        body = f'<g transform="scale(1.22)">{sym_shape(SYMS[j], d["sym"], d["deep"])}</g>'
        slots.append(f'          <g id="d{i + 1}-{SYMS[j]}" transform="translate({cx} {f(cy + y)}) scale(1 {f(round(sy, 3))})"{op}>{body}</g>')
    x0, y0 = cx - DW / 2, cy - DH / 2
    glow = ''
    if d['face'] == 'star':
        glow = f'\n        <ellipse id="dial-glow" cx="{cx}" cy="{cy}" rx="46" ry="52" fill="url(#star-glow-fill)" opacity="0.85"/>'
    return f'''      <g id="dial-{i + 1}">
        <rect id="dial-{i + 1}-drum" x="{x0}" y="{y0}" width="{DW}" height="{DH}" rx="16" fill="url(#drum{i + 1}-fill)"/>{glow}
        <g clip-path="url(#clip-dial-{i + 1})">
        <g id="dial-{i + 1}-reel">
{chr(10).join(slots)}
        </g>
        </g>
        <rect x="{x0}" y="{y0}" width="{DW}" height="{DH}" rx="16" fill="url(#drum-shade)"/>
        <rect x="{x0}" y="{y0}" width="{DW}" height="{DH}" rx="16" stroke="{d['line']}" stroke-width="4" opacity="0.55"/>
      </g>'''

drum_grads = ''.join(
    f'<linearGradient id="drum{i + 1}-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{d["edge"]}"/><stop offset="0.3" stop-color="{d["mid2"]}"/>'
    f'<stop offset="0.5" stop-color="{d["mid"]}"/><stop offset="0.7" stop-color="{d["mid2"]}"/><stop offset="1" stop-color="{d["edge"]}"/></linearGradient>'
    for i, d in enumerate(DIALS))
clips = ''.join(f'<clipPath id="clip-dial-{i + 1}"><rect x="{DX[i] - DW / 2}" y="{DY - DH / 2}" width="{DW}" height="{DH}" rx="16"/></clipPath>' for i in range(3))

notches = '\n'.join(f'      <path d="M {x - 7} {y0} L {x + 7} {y0} L {x} {y0 + 9 * sgn} Z" fill="#c84f04" stroke="#c84f04" stroke-width="4" stroke-linejoin="round"/>'
                    for x in DX for y0, sgn in ((-90, 1), (116, -1)))
lock_body = f'''    <g id="lock-body">
      <path d="{body_rect(7, 15)}" fill="#c84f04"/>
      <path d="{body_rect(3, 7)}" fill="#e26204"/>
      <path d="{body_rect()}" fill="url(#body-fill)"/>
      <path d="M {-BW + 30} {BT + 14} Q {-BW + 8} {BT + 20} {-BW + 10} {BT + 60}" stroke="#fffbe0" stroke-width="9" stroke-linecap="round" opacity="0.9"/>
      <path d="M {-BW + 64} {BT + 9} H {BW - 70}" stroke="#fef7a0" stroke-width="7" stroke-linecap="round"/>
      <path d="M {BW - 46} {BT + 9} H {BW - 34}" stroke="#fffbe0" stroke-width="7" stroke-linecap="round"/>
      <path d="M {-BW + 40} {BB - 12} H {BW - 40}" stroke="#f59204" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
      <rect x="-176" y="-88" width="352" height="202" rx="34" fill="#f59204"/>
      <rect x="-170" y="-80" width="340" height="190" rx="30" fill="#fef058" opacity="0.9"/>
      <rect id="dial-window" x="-168" y="-82" width="336" height="190" rx="28" fill="#14074f"/>
      <rect x="-160" y="-76" width="320" height="14" rx="7" fill="#0b0430" opacity="0.8"/>
{notches}
    </g>'''

dials = f'''    <g id="dials">
{chr(10).join(dial(i, d) for i, d in enumerate(DIALS))}
    </g>'''

padlock = f'''<g id="padlock" transform="translate({f(PX)} {f(PY)}) rotate({TILT}) scale({SCALE})">
{lock_top}
{shackle()}
{lock_body}
{dials}
  </g>'''

# ------------------------------------------------------------------ burst dashes (in stage space, around the lock)
bc = to_stage((0, -10))
bursts = [dash(bc[0], bc[1], ang, r0, r0 + 44, 18, 8, f'burst-{i + 1}')
          for i, (ang, r0) in enumerate([(176, 248), (198, 252), (220, 262), (320, 262), (342, 252), (4, 248)])]

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Code Cracker badge (combination padlock), source artwork. Same workflow as the other badges.
  The artwork is the FINAL state: dials on circle / star / triangle, shackle lifted + swung open.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    padlock (pops in; recoils on unlock), lock-top (+ hole-left, hole-right: the shackle pivots in hole-left),
    shackle (starts locked = lowered + un-swung, springs up and swings open), lock-body, dial-window,
    dials (dial-1..3; each has dial-N-drum + dial-N-reel whose children are the drum slots in order
    around the cylinder: symbol, tick, symbol, tick... – the one at the drum centre is the answer),
    dial-glow (behind the star), bursts (burst-1.. pop out at the finale)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <linearGradient id="body-fill" x1="0.15" y1="0" x2="0.5" y2="1"><stop stop-color="#fef058"/><stop offset="0.55" stop-color="#fde03a"/><stop offset="1" stop-color="#fcb812"/></linearGradient>
  <linearGradient id="top-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef7a0"/><stop offset="0.5" stop-color="#fde15e"/><stop offset="1" stop-color="#fcc513"/></linearGradient>
  <linearGradient id="drum-shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#06033a" stop-opacity="0.6"/><stop offset="0.22" stop-color="#06033a" stop-opacity="0"/><stop offset="0.78" stop-color="#06033a" stop-opacity="0"/><stop offset="1" stop-color="#06033a" stop-opacity="0.6"/></linearGradient>
  <radialGradient id="star-glow-fill"><stop stop-color="#fffbe0" stop-opacity="1"/><stop offset="0.55" stop-color="#fef058" stop-opacity="0.55"/><stop offset="1" stop-color="#fef058" stop-opacity="0"/></radialGradient>
  {drum_grads}
  {clips}
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}<g id="bursts">
{chr(10).join('  ' + b for b in bursts)}
</g>
<g id="sparkles">
{star(614, 216, 30, 'star-1')}
{star(404, 252, 24, 'star-2')}
</g>
{padlock}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/code-cracker/code-cracker-badge.svg', 'w').write(svg)
print('written', len(svg))
