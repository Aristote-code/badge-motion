"""Golden Mic badge: gold vintage capsule microphone in a U-yoke on a stem + round base, sound-wave fan.

Corrections vs the AI reference:
  * the yoke pivots on the mic's sides at exactly mid-height (knob centres = pivot points on the body sides)
  * the stem rises from the yoke's bottom centre (under the gem) straight down into the base
  * grille slots evenly spaced, mirror-symmetric about the centre spine, following the capsule outline
  * mic perfectly centred and upright; sound-wave dashes form a symmetric fan (3 per side) aimed out of the head
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['green']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)
OUT = '#0b3d12'          # deep outline (the reference has a dark sticker outline round the icon)
DEPTH = '#cf5f04'        # gold depth / shadow side
DEEP2 = '#a84404'

# ---------------- design space: x = 0 on the mic axis, y = 0 at the pivot (mic mid-height) ----------------
MW, MT, MB = 92, -150, 150          # mic half-width, top, bottom (capsule, rx = MW)
PX = MW + 22                        # yoke arm centreline / knob centre x
KR = 27                             # knob radius
YW = 30                             # yoke stroke width
UB = MB + 46                        # yoke U bottom (centreline)
UA = UB - PX                        # where the arms start curving (U is a semicircle of radius PX)
GEM = (0, UB + 2)
STEM_T, STEM_B = UB + 14, 282
BASE_T, BASE_B = 258, 340
HEAD = (0, -60)                     # sound-wave fan centre (middle of the grille)
FAN = dict(angles=(-30, 0, 30), r0=174, r1=202)

def capsule(dx=0, dy=0, inset=0):
    w = MW - inset
    return (f'M {f(-w + dx)} {f(MT + MW + dy)} A {f(w)} {f(w)} 0 0 1 {f(w + dx)} {f(MT + MW + dy)} '
            f'V {f(MB - MW + dy)} A {f(w)} {f(w)} 0 0 1 {f(-w + dx)} {f(MB - MW + dy)} Z')

def half_width(y):
    """capsule half-width at height y"""
    if y < MT + MW: return math.sqrt(max(0, MW ** 2 - (MT + MW - y) ** 2))
    if y > MB - MW: return math.sqrt(max(0, MW ** 2 - (y - (MB - MW)) ** 2))
    return MW

# grille: 4 evenly spaced rows, each a mirrored pair of slots either side of the centre spine
ROWS = [-108, -76, -44, -12]
SH = 19
slots = []
for y in ROWS:
    hw = min(half_width(y - SH / 2), half_width(y + SH / 2)) - 11
    for s in (-1, 1):
        x0, x1 = (12, hw) if s > 0 else (-hw, -12)
        slots.append(f'      <rect x="{f(x0)}" y="{f(y - SH / 2)}" width="{f(x1 - x0)}" height="{SH}" rx="{SH / 2}" fill="#8f3a06"/>')
        slots.append(f'      <rect x="{f(x0 + 4)}" y="{f(y - SH / 2 + 2)}" width="{f(x1 - x0 - 8)}" height="5" rx="2.5" fill="#6a2a04" opacity="0.8"/>')
        slots.append(f'      <path d="M {f(x0 + 6)} {f(y + SH / 2 + 4)} H {f(x1 - 6)}" stroke="#fff3a6" stroke-width="4" stroke-linecap="round" opacity="0.75"/>')

mic = f'''  <g id="mic">
    <path d="{capsule()}" stroke="{OUT}" stroke-width="16" stroke-linejoin="round"/>
    <path d="{capsule(5, 10)}" fill="{DEPTH}"/>
    <path id="mic-body" d="{capsule()}" fill="url(#mic-fill)"/>
    <path d="{capsule(inset=10)}" stroke="#fef7b0" stroke-width="5" opacity="0.35"/>
    <g id="mic-grille">
{chr(10).join(slots)}
    </g>
    <rect x="{-MW}" y="22" width="{2 * MW}" height="13" fill="{DEPTH}"/>
    <path d="M {-MW + 8} 40 H {MW - 8}" stroke="#fff3a6" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <path d="M -56 58 V 96" stroke="#fffbe0" stroke-width="11" stroke-linecap="round" opacity="0.55"/>
    <path d="M {MW - 18} 52 V 108" stroke="#e07a04" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
    <ellipse cx="-34" cy="{MT + 21}" rx="22" ry="9" fill="#fffbe0" opacity="0.9" transform="rotate(-24 -34 {MT + 21})"/>
    <circle cx="-62" cy="{MT + 40}" r="5" fill="#fffbe0" opacity="0.85"/>
  </g>'''

U = f'M {-PX} 0 V {UA} A {PX} {PX} 0 0 0 {PX} {UA} V 0'
yoke = f'''    <g id="yoke">
      <path d="{U}" stroke="{OUT}" stroke-width="{YW + 16}" stroke-linecap="round"/>
      <path d="{U}" transform="translate(4 9)" stroke="{DEEP2}" stroke-width="{YW}" stroke-linecap="round"/>
      <path d="{U}" stroke="url(#yoke-fill)" stroke-width="{YW}" stroke-linecap="round"/>
      <path d="M {-PX - 6} 16 V {UA} A {PX + 6} {PX + 6} 0 0 0 {-PX * 0.62} {UB - 4}" stroke="#fff3a6" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
    </g>'''

stem_pts = f'M -17 {STEM_T} L 17 {STEM_T} L 24 {STEM_B} L -24 {STEM_B} Z'
stem = f'''    <g id="stem">
      <path d="{stem_pts}" stroke="{OUT}" stroke-width="16" stroke-linejoin="round"/>
      <path d="{stem_pts}" transform="translate(4 6)" fill="{DEEP2}"/>
      <path d="{stem_pts}" fill="url(#stem-fill)"/>
      <path d="M -9 {STEM_T + 8} L -14 {STEM_B - 6}" stroke="#fff3a6" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    </g>'''

gx, gy = GEM
gem_d = f'M {gx} {gy - 22} L {gx + 19} {gy - 8} L {gx + 13} {gy + 16} L {gx - 13} {gy + 16} L {gx - 19} {gy - 8} Z'
gem = f'''    <g id="gem">
      <circle cx="{gx}" cy="{gy}" r="40" fill="{OUT}"/>
      <circle cx="{gx + 3}" cy="{gy + 6}" r="33" fill="{DEEP2}"/>
      <circle cx="{gx}" cy="{gy}" r="33" fill="url(#gold-deep)"/>
      <circle cx="{gx}" cy="{gy}" r="25" fill="#3a0a5e"/>
      <circle cx="{gx}" cy="{gy}" r="22" fill="url(#gem-fill)"/>
      <path d="{gem_d}" fill="#b56cff" opacity="0.55"/>
      <path d="M {gx - 13} {gy - 9} L {gx} {gy - 18} L {gx + 7} {gy - 12}" stroke="#f1dcff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <g id="gem-glint" transform="translate({gx + 9} {gy - 8})">
        <path d="M 0 -13 C 1.6 -1.6 1.6 -1.6 13 0 C 1.6 1.6 1.6 1.6 0 13 C -1.6 1.6 -1.6 1.6 -13 0 C -1.6 -1.6 -1.6 -1.6 0 -13 Z" fill="#ffffff"/>
      </g>
    </g>'''

def knob(sx, name):
    x = sx * PX
    return f'''    <g id="{name}">
      <circle cx="{x}" cy="0" r="{KR + 7}" fill="{OUT}"/>
      <circle cx="{x + 3}" cy="6" r="{KR}" fill="{DEEP2}"/>
      <circle cx="{x}" cy="0" r="{KR}" fill="url(#knob-fill)"/>
      <circle cx="{x}" cy="0" r="10" fill="{DEPTH}"/>
      <circle cx="{x - 1}" cy="-1" r="6" fill="#fde56a"/>
      <circle cx="{x - 11}" cy="-12" r="5" fill="#fffbe0" opacity="0.9"/>
    </g>'''

TR, BR = 96, 140                     # top / bottom radii of the round base
TRY, BRY = 16, 22
base_d = (f'M {-TR} {BASE_T + TRY} A {TR} {TRY} 0 0 1 {TR} {BASE_T + TRY} L {BR} {BASE_B - BRY} '
          f'A {BR} {BRY} 0 0 1 {-BR} {BASE_B - BRY} Z')
base = f'''  <g id="base">
    <path d="{base_d}" stroke="{OUT}" stroke-width="16" stroke-linejoin="round"/>
    <path d="{base_d}" transform="translate(5 10)" fill="{DEEP2}"/>
    <path d="{base_d}" fill="url(#base-fill)"/>
    <ellipse cx="0" cy="{BASE_T + TRY}" rx="{TR}" ry="{TRY}" fill="url(#base-top)"/>
    <ellipse cx="0" cy="{BASE_T + TRY}" rx="{TR - 4}" ry="{TRY - 3}" stroke="#fffbe0" stroke-width="4" opacity="0.45"/>
    <ellipse cx="0" cy="{BASE_T + TRY + 1}" rx="38" ry="9" fill="{DEPTH}"/>
    <path d="M -30 {BASE_T + TRY - 14} A 30 7 0 0 0 30 {BASE_T + TRY - 14} V {BASE_T + TRY} A 30 7 0 0 1 -30 {BASE_T + TRY} Z" fill="url(#stem-fill)" stroke="{DEPTH}" stroke-width="3"/>
    <path d="M -22 {BASE_T + TRY - 6} V {BASE_T + TRY + 1}" stroke="#fff3a6" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <path d="M -104 {BASE_T + 44} L -122 {BASE_B - 30}" stroke="#fff3a6" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
  </g>'''

def waves(side, name, prefix):
    out = []
    for i, a in enumerate(FAN['angles'], 1):
        ang = a if side > 0 else 180 - a
        out.append('      ' + dash(HEAD[0], HEAD[1], ang, FAN['r0'], FAN['r1'], w0=30, w1=12, name=f'{prefix}{i}', color='#ffd23a'))
    return f'    <g id="{name}">\n' + '\n'.join(out) + '\n    </g>'

# ---------------- centre the whole icon (incl. depth offsets + outlines) on the medal ----------------
S = 1.0
pts = [(-MW - 8, MT - 8), (MW + 13, MB + 18), (-PX - 23, UB + 23), (PX + 27, UB + 32), (-150, BASE_B + 18), (150, BASE_B + 18)]
for a in FAN['angles']:
    for r in (FAN['r0'], FAN['r1']):
        for s in (-1, 1):
            q = math.radians(a)
            pts.append((HEAD[0] + s * (r * math.cos(q) + 20), HEAD[1] + r * math.sin(q) + (20 if a > 0 else -20 if a < 0 else 0)))
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
TX = MC[0] - S * (minx + maxx) / 2
TY = MC[1] - S * (miny + maxy) / 2
far = max(math.hypot(S * x + TX - MC[0], S * y + TY - MC[1]) for x, y in pts)

extra = '''
  <linearGradient id="mic-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fde047"/><stop offset="0.3" stop-color="#fff38a"/><stop offset="0.55" stop-color="#fde047"/><stop offset="0.85" stop-color="#fcc513"/><stop offset="1" stop-color="#f59a06"/></linearGradient>
  <linearGradient id="yoke-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fef058"/><stop offset="0.6" stop-color="#fcc513"/><stop offset="1" stop-color="#f59204"/></linearGradient>
  <linearGradient id="stem-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fef058"/><stop offset="0.6" stop-color="#fcc513"/><stop offset="1" stop-color="#f08a04"/></linearGradient>
  <linearGradient id="base-fill" x1="0" y1="0" x2="1" y2="0.4"><stop stop-color="#fef27a"/><stop offset="0.5" stop-color="#fdd52a"/><stop offset="1" stop-color="#f59a06"/></linearGradient>
  <linearGradient id="base-top" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff59a"/><stop offset="0.6" stop-color="#fde047"/><stop offset="1" stop-color="#fbbf14"/></linearGradient>
  <radialGradient id="knob-fill" cx="0.35" cy="0.3" r="0.8"><stop stop-color="#fff38a"/><stop offset="0.5" stop-color="#fcc513"/><stop offset="1" stop-color="#e88004"/></radialGradient>
  <radialGradient id="gem-fill" cx="0.35" cy="0.3" r="0.85"><stop stop-color="#d9a0ff"/><stop offset="0.45" stop-color="#9b3df0"/><stop offset="1" stop-color="#5a12a8"/></radialGradient>'''

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Golden Mic badge (gold capsule microphone on a yoke stand), source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    base (pops in), stand (stem + yoke + gem, rises from the base), stem, yoke, gem (+ gem-glint sparkles),
    mic (drops into the yoke and tilts on its pivots; pivot = centre of the knobs), mic-grille,
    knobs (knob-left, knob-right: the pivots, drawn over the mic, move with the stand),
    waves-left (wave-l1..3), waves-right (wave-r1..3): sound-wave dashes that pulse outward with each note
  The icon is centred on the medal (420, 412).
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}{extra}
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}<g id="sparkles">
{star(212, 540, 32, 'star-1')}
{star(624, 584, 25, 'star-2')}
</g>
<g id="icon" transform="translate({f(TX)} {f(TY)}) scale({S})">
{waves(-1, 'waves-left', 'wave-l')}
{waves(1, 'waves-right', 'wave-r')}
  <g id="stand">
{stem}
{yoke}
{gem}
  </g>
{base}
{mic}
  <g id="knobs">
{knob(-1, 'knob-left')}
{knob(1, 'knob-right')}
  </g>
</g>
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/golden-mic/golden-mic-badge.svg', 'w').write(svg)
def dash_corners():
    out = []
    for a0 in FAN['angles']:
        for side in (-1, 1):
            ang = math.radians(a0 if side > 0 else 180 - a0)
            ux, uy, nx, ny = math.cos(ang), math.sin(ang), -math.sin(ang), math.cos(ang)
            for r, w in ((FAN['r0'], 12), (FAN['r1'], 30)):
                for sg in (-1, 1):
                    out.append((HEAD[0] + ux * (r + 3) + sg * nx * (w / 2 + 3), HEAD[1] + uy * (r + 3) + sg * ny * (w / 2 + 3)))
    return out
body = [(-MW - 8, MT - 8), (MW - 30, MT - 8), (0, MT - 8), (-BR - 8, BASE_B - BRY), (BR + 13, BASE_B - BRY + 10), (-BR * 0.7, BASE_B + 12), (BR * 0.7, BASE_B + 18)]
dist = lambda q: math.hypot(S * q[0] + TX - MC[0], S * q[1] + TY - MC[1])
print('dash max r', round(max(map(dist, dash_corners()))), ' body max r', round(max(map(dist, body))))
print(f'icon translate ({TX:.1f}, {TY:.1f}) scale {S}; pivot at stage ({TX:.1f}, {TY:.1f}); farthest point from medal centre {far:.0f} (face r 306)')
