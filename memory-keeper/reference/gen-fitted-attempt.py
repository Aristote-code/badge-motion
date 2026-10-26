"""Memory Keeper badge (v2): a baby elephant peeking over the bottom edge of a purple hexagon, trunk raised.

Writes memory-keeper-badge.svg from the user's traced artwork (reference/memory-keeper-reference.svg): the traced
shapes are kept exactly (they ARE the illustration) and sorted into named layers that can move on their own
(reference/groups.json lists which traced shape goes where). Placed at scale K so the hexagon centre lands on (420, 480).

What is added / cleaned so it can animate:
  - a clean inner face over the frame's background: the trace bakes the elephant's dark outline and the burst slots
    into the background, which would show as a dark elephant-shaped "ghost" before the elephant arrives;
  - the elephant's dark outline is drawn with each moving part instead (a stroked copy under each part);
  - the light-blue body base is masked out under the ears, so an ear can flap without uncovering a blue patch;
  - the four yellow burst wedges are redrawn cleanly (the traced ones were broken into fragments).
"""
import re, json, math

f = lambda v: f"{v:.2f}".rstrip('0').rstrip('.')
BASE = '/Users/ariga/Documents/badges/memory-keeper'
OUT = f'{BASE}/memory-keeper-badge.svg'
src = open(f'{BASE}/reference/memory-keeper-reference.svg').read()
P = re.findall(r'<path [^>]*/>', src)
G = json.load(open(f'{BASE}/reference/groups.json'))

K = 0.68
RC = (676.5, 645.5)                         # outer hexagon centre in the reference
TX, TY = 420 - RC[0] * K, 480 - RC[1] * K   # → badge centre (420, 480)
OL = '#140466'                              # the trace's outline colour

pieces = lambda ids: ''.join(P[i] for i in ids)
def outline(ids, w=18):
    """dark outline under a part: the same shapes, filled + stroked in the outline colour"""
    return ''.join(re.sub(r'fill="[^"]*"', f'fill="{OL}" stroke="{OL}" stroke-width="{w}" stroke-linejoin="round"', P[i]) for i in ids)

# ---------------- frame ----------------
INNER = [(676, 193), (1102, 393), (1102, 848), (676, 1082), (250, 848), (250, 393)]   # inner face (bevel's inner edge)
# the face cover reaches a little further out on the sides, where the traced background still has the ears' dark
# outline baked into the bevel; the bevel's inner ledge is then painted back along the edge
COVER = [(676, 172), (1132, 384), (1132, 857), (676, 1090), (220, 857), (220, 384)]
def rpoly(pts, r):
    d = ''
    for i in range(len(pts)):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % len(pts)]
        u = lambda a, b: ((b[0] - a[0]) / math.dist(a, b), (b[1] - a[1]) / math.dist(a, b))
        ua, ub = u(p1, p0), u(p1, p2)
        a = (p1[0] + ua[0] * r, p1[1] + ua[1] * r); b = (p1[0] + ub[0] * r, p1[1] + ub[1] * r)
        d += (f'M {f(a[0])} {f(a[1])}' if i == 0 else f' L {f(a[0])} {f(a[1])}') + f' Q {p1[0]} {p1[1]} {f(b[0])} {f(b[1])}'
    return d + ' Z'
inner = rpoly(INNER, 34)
cover = rpoly(COVER, 38)
outer_id = P[1].replace('<path ', '<path id="medal-outline" ', 1)        # outer dark hexagon
frame = (f'<g id="medal">{outer_id}{pieces([i for i in G["frame"] if i != 1])}'
         f'<path id="medal-face" d="{cover}" fill="url(#face-fill)"/>'
         f'<path d="{cover}" fill="none" stroke="#7a14d2" stroke-width="64" clip-path="url(#clip-cover)"/>'
         f'<path d="{cover}" fill="none" stroke="#51019f" stroke-width="28" clip-path="url(#clip-cover)" transform="translate(676 637) scale(0.955) translate(-676 -637)"/>'
         f'<path d="{inner}" fill="url(#face-glow)"/></g>')

# ---------------- bursts (clean wedges, where the traced ones were) ----------------
def wedge(a, b, w0, w1):
    """tapered dash from inner point a (width w0) to outer point b (width w1), rounded ends"""
    ux, uy = (b[0] - a[0]) / math.dist(a, b), (b[1] - a[1]) / math.dist(a, b); nx, ny = -uy, ux
    p = [(a[0] + nx * w0 / 2, a[1] + ny * w0 / 2), (b[0] + nx * w1 / 2, b[1] + ny * w1 / 2),
         (b[0] - nx * w1 / 2, b[1] - ny * w1 / 2), (a[0] - nx * w0 / 2, a[1] - ny * w0 / 2)]
    return 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in p) + ' Z', (nx, ny)
BURSTS = [((508, 392), (424, 328)), ((542, 368), (520, 262)), ((1040, 742), (1126, 718)), ((1012, 784), (1078, 856))]
bl = []
for j, (a, b) in enumerate(BURSTS, 1):
    d, (nx, ny) = wedge(a, b, 16, 50)
    hi, _ = wedge((a[0] + nx * 5, a[1] + ny * 5), (b[0] + nx * 12, b[1] + ny * 12), 6, 18)
    bl.append(f'<g id="burst-{j}"><path d="{d}" fill="{OL}" stroke="{OL}" stroke-width="22" stroke-linejoin="round"/>'
              f'<path d="{d}" fill="#e86323" stroke="#e86323" stroke-width="8" stroke-linejoin="round"/>'
              f'<path d="{d}" fill="#fecc3b" stroke="#fecc3b" stroke-width="2" stroke-linejoin="round" transform="translate({f(nx * 4)} {f(ny * 4)})"/>'
              f'<path d="{hi}" fill="#fefb78" stroke="#fefb78" stroke-width="4" stroke-linejoin="round"/></g>')
burst = '<g id="burst">' + ''.join(bl) + '</g>'

# ---------------- elephant (drawn from scratch, see elephant.py) ----------------
import sys; sys.path.insert(0, BASE)
from elephant2 import build
E = build()
PEEK = [(676, 110), (1170, 380), (1170, 858), (676, 1084), (182, 858), (182, 380)]   # the elephant rises up from behind the bottom edge
elephant = ('<g id="elephant"><g clip-path="url(#clip-peek)"><g id="rise">'
            + E['ear_l'] + E['ear_r'] + E['head'] + E['mouth'] + E['eyes'] + E['trunk'] + E['brows']
            + '</g></g>' + E['paw_l'] + E['paw_r'] + '</g>')

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Memory Keeper badge (v2: baby elephant peeking over a purple hexagon), source artwork (generated by gen.py).
  Layer names the animation uses:
    badge, medal (hexagon frame; medal-outline = outer hexagon, medal-face = inner face), burst (burst-1..4),
    elephant > rise (everything but the paws; rises up from behind the bottom edge inside clip-peek), ear-left / ear-right (flap about their roots), body (head base),
    head, trunk (raised; sways and toots), mouth, eyes (eye-left, eye-right: blink), brows (lift),
    paw-left / paw-right (land on the edge, tap), sparkles (empty)
  Traced artwork placed at scale {K}: hexagon centre → (420, 480).
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>
  <linearGradient id="gold-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef058"/><stop offset="1" stop-color="#fccb12"/></linearGradient>
  <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <linearGradient id="face-fill" gradientUnits="userSpaceOnUse" x1="676" y1="193" x2="676" y2="1082"><stop stop-color="#3a0592"/><stop offset="0.45" stop-color="#1d0570"/><stop offset="1" stop-color="#160465"/></linearGradient>
  <radialGradient id="face-glow" gradientUnits="userSpaceOnUse" cx="640" cy="330" r="420"><stop stop-color="#7a10d0" stop-opacity="0.55"/><stop offset="1" stop-color="#7a10d0" stop-opacity="0"/></radialGradient>
  <clipPath id="clip-inner"><path d="{inner}"/></clipPath>
  <clipPath id="clip-cover"><path d="{cover}"/></clipPath>
  <clipPath id="clip-peek"><path d="{rpoly(PEEK, 40)}"/></clipPath>
  {E['defs']}
</defs>
<g id="badge" transform="matrix({K} 0 0 {K} {f(TX)} {f(TY)})">
{frame}
<g id="sparkles"></g>
{burst}
{elephant}
</g>
</svg>
'''
open(OUT, 'w').write(svg)
# same artwork in reference coordinates (1254 x 1254), for side-by-side checks against the real image
REF_OUT = '/private/tmp/claude-501/-Users-ariga-Documents/31010e6e-1507-49c6-92f5-20d0932d08f4/scratchpad/fix/mine_ref.svg'
open(REF_OUT, 'w').write(svg.replace('width="840" height="960" viewBox="0 0 840 960"', 'width="1254" height="1254" viewBox="0 0 1254 1254"')
                         .replace(f'<g id="badge" transform="matrix({K} 0 0 {K} {f(TX)} {f(TY)})">', '<g id="badge">'))
print('written', OUT, len(svg) // 1024, 'KB')
