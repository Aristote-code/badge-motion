"""Wordsmith badge (fountain pen writing a flourish on a sheet of paper), source artwork.

Corrections vs the AI reference:
  * the ink is ONE continuous calligraphic stroke lying ON the paper (it no longer floats off the sheet
    or loops behind it) and it ends exactly at the nib tip;
  * the nib is a real fountain-pen nib: tapered tines, a centre slit running from the tip to a round
    breather hole, little shoulders, two-tone gold; it sits in a tapered section, then a gold grip ring,
    then the barrel (in proportion, the barrel runs off under the medal rim);
  * the paper is a flat sheet with a curled-up corner (back of the sheet shows inside the curl).
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['red']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)
OUTLINE = '#3d0414'


# ---------------------------------------------------------------- helpers
def bez(p0, p1, p2, p3, n):
    out = []
    for i in range(n):
        u = i / n
        a, b, c, d = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def poly(pts):
    return 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'


def path_d(start, segs, dx=0, dy=0):
    d = f'M {f(start[0] + dx)} {f(start[1] + dy)}'
    for c1, c2, p in segs:
        d += f' C {f(c1[0] + dx)} {f(c1[1] + dy)} {f(c2[0] + dx)} {f(c2[1] + dy)} {f(p[0] + dx)} {f(p[1] + dy)}'
    return d


# ---------------------------------------------------------------- layout (before centring)
# paper corners (a slightly tilted sheet)
TL, TR, BR, BL = (150, 372), (646, 318), (684, 588), (178, 650)
# where the curl cuts the bottom-right corner
def mix(a, b, k): return (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k)
CA = mix(BL, BR, 0.80)        # on the bottom edge
CB = mix(TR, BR, 0.66)        # on the right edge

# the ink flourish: one calligraphic stroke (hook, thick down-swoop, sweep, thin rising finish) ending at the nib tip
INK0 = (262, 424)
INK = [
    ((236, 410), (196, 430), (194, 484)),
    ((192, 550), (232, 606), (310, 606)),
    ((380, 606), (430, 558), (470, 524)),
]
DOT = (530, 552)              # the full stop the pen taps after the flourish
STAR = (282, 262)

# centre: bbox of paper (+depth) + star + bursts
pts = [TL, TR, (BR[0] + 6, BR[1] + 14), (BL[0] + 6, BL[1] + 14), (STAR[0], STAR[1] - 60)]
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
DX, DY = round(MC[0] - (minx + maxx) / 2), round(MC[1] - (miny + maxy) / 2)
sh = lambda p: (p[0] + DX, p[1] + DY)
TL, TR, BR, BL, CA, CB, DOT, STAR, INK0 = map(sh, (TL, TR, BR, BL, CA, CB, DOT, STAR, INK0))
INK = [tuple(sh(p) for p in seg) for seg in INK]
TIP = INK[-1][2]


# ---------------------------------------------------------------- paper
def paper_outline(dx=0, dy=0):
    s = lambda p: f'{f(p[0] + dx)} {f(p[1] + dy)}'
    # gently wavy edges
    return (f'M {s(TL)} C {s(mix(TL, TR, .33))} {s((mix(TL, TR, .66)[0], mix(TL, TR, .66)[1] - 14))} {s(TR)} '
            f'C {s((mix(TR, CB, .4)[0] + 8, mix(TR, CB, .4)[1]))} {s(mix(TR, CB, .7))} {s(CB)} '
            f'L {s(CA)} '
            f'C {s(mix(CA, BL, .35))} {s((mix(CA, BL, .7)[0], mix(CA, BL, .7)[1] + 12))} {s(BL)} '
            f'C {s((mix(BL, TL, .4)[0] - 10, mix(BL, TL, .4)[1]))} {s(mix(BL, TL, .7))} {s(TL)} Z')


# the curl: the corner lifts and rolls back over the sheet (a dog-ear with a rounded roll), back side showing
def curl():
    ax, ay = CB[0] - CA[0], CB[1] - CA[1]
    l = math.hypot(ax, ay); ux, uy = ax / l, ay / l
    # reflect the corner across the fold line, pulled in a bit so it reads as a roll, not a flat fold
    vx, vy = BR[0] - CA[0], BR[1] - CA[1]
    d = vx * ux + vy * uy
    foot = (CA[0] + ux * d, CA[1] + uy * d)
    tip = (foot[0] + (foot[0] - BR[0]) * 0.78, foot[1] + (foot[1] - BR[1]) * 0.78)
    s = lambda p: f'{f(p[0])} {f(p[1])}'
    nx, ny = (tip[0] - foot[0]), (tip[1] - foot[1])
    bulge = lambda p, q, k: (mix(p, q, .5)[0] - ny * k, mix(p, q, .5)[1] + nx * k)
    flap = (f'M {s(CA)} Q {s(bulge(CA, tip, -0.18))} {s(tip)} Q {s(bulge(tip, CB, -0.18))} {s(CB)} '
            f'Q {s(mix(mix(CA, CB, .5), tip, .22))} {s(CA)} Z')
    shadow = (f'M {s(CA)} Q {s(bulge(CA, tip, -0.3))} {s((tip[0] - 4, tip[1] + 8))} Q {s(bulge(tip, CB, -0.3))} {s(CB)} Z')
    roll = f'M {s(mix(CA, CB, .16))} Q {s(mix(mix(CA, CB, .5), tip, .3))} {s(mix(CA, CB, .84))}'
    return f'''  <g id="paper-curl">
    <path d="{shadow}" transform="translate(-4 8)" fill="#b8763a" opacity="0.45"/>
    <path d="{flap}" fill="url(#curl-fill)" stroke="#d27a26" stroke-width="4" stroke-linejoin="round"/>
    <path d="{roll}" stroke="#fff0c8" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
  </g>''', tip


curl_svg, CURL_TIP = curl()
rules = []
for k in (0.32, 0.54, 0.76):
    a, b = mix(TL, BL, k), mix(TR, BR, k)
    a, b = mix(a, b, 0.08), mix(a, b, 0.8 if k < 0.7 else 0.62)
    rules.append(f'    <path d="M {f(a[0])} {f(a[1])} L {f(b[0])} {f(b[1])}" stroke="#efd9ad" stroke-width="5" stroke-linecap="round" opacity="0.85"/>')

paper = f'''<g id="paper">
  <path d="{paper_outline(6, 14)}" fill="#2a020d" opacity="0.45"/>
  <path d="{paper_outline(4, 9)}" fill="#d99a52"/>
  <path id="paper-sheet" d="{paper_outline()}" fill="url(#paper-fill)"/>
  <path d="M {f(TL[0] + 22)} {f(TL[1] + 6)} C {f(mix(TL, TR, .35)[0])} {f(mix(TL, TR, .35)[1] + 6)} {f(mix(TL, TR, .62)[0])} {f(mix(TL, TR, .62)[1] - 6)} {f(TR[0] - 40)} {f(TR[1] + 8)}" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.75"/>
  <g id="paper-lines">
{chr(10).join(rules)}
  </g>
{curl_svg}
</g>'''


# ---------------------------------------------------------------- ink (calligraphic ribbon around a centreline)
samples = []
p = INK0
for c1, c2, q in INK:
    samples += bez(p, c1, c2, q, 60)
    p = q
samples.append(TIP)
# arc length
L = [0]
for i in range(1, len(samples)):
    L.append(L[-1] + math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]))
TOT = L[-1]
NIB = math.radians(-35)        # broad-nib edge angle: down-strokes thick, up-strokes thin
WMIN, WMAX = 6, 36
left, right = [], []
for i, (x, y) in enumerate(samples):
    a, b = samples[max(0, i - 1)], samples[min(len(samples) - 1, i + 1)]
    th = math.atan2(b[1] - a[1], b[0] - a[0])
    w = WMIN + (WMAX - WMIN) * abs(math.sin(th - NIB))
    u = L[i] / TOT
    w *= 0.25 + 0.75 * min(1, u / 0.07) ** 0.7          # thin entry
    w *= 1 - 0.55 * max(0, (u - 0.9) / 0.1) ** 1.5     # tapers into the nib point
    nx, ny = -math.sin(th), math.cos(th)
    left.append((x + nx * w / 2, y + ny * w / 2))
    right.append((x - nx * w / 2, y - ny * w / 2))
ribbon = poly(left + right[::-1])
ink_d = path_d(INK0, INK)
ink = f'''<g id="ink">
  <g id="ink-body">
    <path d="{ribbon}" transform="translate(2 4)" fill="#2a0b5e" stroke="#2a0b5e" stroke-width="3" stroke-linejoin="round"/>
    <path id="ink-shape" d="{ribbon}" fill="url(#ink-fill)" stroke="url(#ink-fill)" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <path id="ink-path" d="{ink_d}" stroke="#c49cff" stroke-width="3.5" stroke-linecap="round" opacity="0.55" transform="translate(-1.5 -2)"/>
</g>
<g id="ink-dot" transform="translate({f(DOT[0])} {f(DOT[1])})">
  <ellipse cx="2" cy="4" rx="14" ry="11" fill="#2a0b5e"/>
  <ellipse rx="14" ry="11" fill="url(#ink-fill)"/>
  <ellipse cx="-5" cy="-4" rx="4.5" ry="3" fill="#d9bfff" opacity="0.9"/>
</g>'''


# ---------------------------------------------------------------- pen (local: tip at 0,0; pen points down, back end at -y)
S = 1.2
ANG = 38          # rotate clockwise: back end goes up-right
def P(d): return d  # local paths written directly
nib_out = ('M 0 0 C 9 -24 30 -62 37 -92 C 39 -100 46 -104 48 -114 L 48 -150 L -48 -150 L -48 -114 '
           'C -46 -104 -39 -100 -37 -92 C -30 -62 -9 -24 0 0 Z')
nib_right = 'M 0 0 C 9 -24 30 -62 37 -92 C 39 -100 46 -104 48 -114 L 48 -150 L 0 -150 Z'
sec = 'M -44 -146 L 44 -146 L 52 -208 L -52 -208 Z'
pen_sil = ('M 0 0 C 9 -24 30 -62 37 -92 C 39 -100 46 -104 48 -114 L 48 -146 L 52 -208 L 62 -208 L 62 -242 '
           'L 60 -242 L 60 -760 L -60 -760 L -60 -242 L -62 -242 L -62 -208 L -52 -208 L -48 -146 L -48 -114 '
           'C -46 -104 -39 -100 -37 -92 C -30 -62 -9 -24 0 0 Z')
pen = f'''<g id="pen-clip" clip-path="url(#clip-face)">
<g id="pen" transform="translate({f(TIP[0])} {f(TIP[1])}) rotate({ANG}) scale({S})">
  <path d="{pen_sil}" transform="translate(5 9)" fill="#2a020d" opacity="0.5"/>
  <path d="{pen_sil}" fill="{OUTLINE}" stroke="{OUTLINE}" stroke-width="12" stroke-linejoin="round"/>
  <g id="barrel">
    <rect x="-58" y="-760" width="116" height="524" rx="10" fill="url(#barrel-fill)"/>
    <rect x="24" y="-760" width="30" height="524" fill="#3b1484" opacity="0.5"/>
    <rect x="-42" y="-740" width="13" height="484" rx="6.5" fill="#e3c4ff" opacity="0.75"/>
  </g>
  <g id="section">
    <path d="{sec}" fill="url(#section-fill)"/>
    <path d="M -31 -156 L -36 -200" stroke="#9a6bf0" stroke-width="7" stroke-linecap="round" opacity="0.8"/>
  </g>
  <g id="grip-ring">
    <rect x="-62" y="-242" width="124" height="38" rx="9" fill="#c86a04"/>
    <rect x="-62" y="-244" width="124" height="34" rx="9" fill="url(#ring-gold)"/>
    <rect x="-62" y="-228" width="124" height="5" fill="#d07208" opacity="0.8"/>
    <rect x="-48" y="-240" width="36" height="7" rx="3.5" fill="#fff7c0" opacity="0.9"/>
  </g>
  <g id="nib">
    <path d="{nib_out}" transform="translate(3 4)" fill="#b4560a"/>
    <path d="{nib_out}" fill="url(#gold-fill)"/>
    <path d="{nib_right}" fill="#f59204" opacity="0.55"/>
    <path d="M -27 -96 C -22 -66 -12 -38 -4 -16" stroke="#fffbd8" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
    <path d="M -30 -122 Q 0 -140 30 -122" stroke="#c86a04" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    <path d="M 0 -3 L 0 -78" stroke="#7a2a04" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="0" cy="-86" r="9.5" fill="#7a2a04"/>
    <circle cx="0" cy="-86" r="6.5" fill="{OUTLINE}"/>
    <circle cx="-2.2" cy="-88.5" r="2" fill="#ffe9a8"/>
    <path d="M -4.5 -12 L 0 0 L 4.5 -12 Z" fill="#5a26b8"/>
  </g>
</g>
</g>'''

# ---------------------------------------------------------------- star + bursts
BURST = '#ff7468'
sx, sy = STAR
stars = f'''<g id="star-group">
{star(sx, sy, 46, 'star')}
<g id="burst">
  {dash(sx, sy, 215, 54, 88, 15, 8, 'burst-1', BURST)}
  {dash(sx, sy, 325, 54, 86, 15, 8, 'burst-2', BURST)}
</g>
</g>'''
sparkles = f'''<g id="sparkles">
{star(440 + DX, 214 + DY, 20, 'star-2')}
{star(182 + DX, 318 + DY, 15, 'star-3')}
</g>'''

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Wordsmith badge (fountain pen writing a flourish), source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal (centre + shine mask), ribbon-left, ribbon-right,
    paper (unrolls in from its left edge), paper-curl (the curled corner rolls up),
    ink (ink-body = calligraphic stroke, revealed along ink-path; ink-path = its centreline, keep it a stroke
         and keep it ending at the nib tip), ink-dot (the full stop, plops in),
    pen-clip (static clip to the medal face), pen (swoops in, writes along ink-path, taps the dot, hovers),
    star (pops) + burst (each child is a dash), sparkles (star-2, star-3: finale twinkles)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <linearGradient id="ring-gold" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#fee05a"/><stop offset="0.6" stop-color="#fcc513"/><stop offset="1" stop-color="#f59204"/></linearGradient>
  <linearGradient id="paper-fill" x1="0.1" y1="0" x2="0.6" y2="1"><stop stop-color="#fffaf0"/><stop offset="0.6" stop-color="#fdf0d2"/><stop offset="1" stop-color="#f8e2b4"/></linearGradient>
  <linearGradient id="curl-fill" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#f7b24a"/><stop offset="0.55" stop-color="#ffd68a"/><stop offset="1" stop-color="#e98a2c"/></linearGradient>
  <linearGradient id="ink-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9a5cf5"/><stop offset="1" stop-color="#5a24c0"/></linearGradient>
  <linearGradient id="barrel-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b57bff"/><stop offset="0.45" stop-color="#8b46ea"/><stop offset="1" stop-color="#5a24c0"/></linearGradient>
  <linearGradient id="section-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#5b2bb0"/><stop offset="1" stop-color="#2c0f6e"/></linearGradient>
  <clipPath id="clip-face"><circle cx="420" cy="412" r="314"/></clipPath>
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}{sparkles}
{stars}
{paper}
{ink}
{pen}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/wordsmith/wordsmith-badge.svg', 'w').write(svg)
print('shift', DX, DY, 'tip', TIP, 'ink length', round(TOT), 'dot', DOT)
