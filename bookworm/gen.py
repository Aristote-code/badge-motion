"""Bookworm badge (open book + star) — source artwork generator.

Writes bookworm-badge.svg. Follows the user's reference SVG (Desktop/Bookworm.svg): open book seen from a little
below, gold spine cylinder in front of the gutter with the pages fanning out of its open top, covers tipped back in a
shallow V, three long curling pages + a curled gutter page per side, wide gold bookmark over the right cover.
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['red']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
OUT = '/Users/ariga/Documents/badges/bookworm/bookworm-badge.svg'

# ---------------- open book, measured off the reference (canvas coords; left half mirrors the right about CX) ----------------
# What the reference shows, and why it works: the open book faces us, seen from a little below, so the rounded back
# of the spine is the gold cylinder standing in front of the gutter, with the pages fanning up out of its open top.
# Each cover is a board tipped back in a shallow V (top edges rising to the outer corners), with an embossed panel.
# Three long pages per side sweep up and out with their tips curling up (back page highest), a narrow curled page
# stands at the gutter, and a wide gold ribbon bookmark hangs over the front of the right cover with a forked tail.
CX = 420
DY = 0
GT, GB = 480, 664            # where the covers meet the spine (top / bottom)
OUT_TOP = (722, 405)         # outer top corner of the right cover
OUT_BOT = (697, 590)         # outer bottom corner
G = (424, 470)               # where the right pages leave the spine's open top
SX, SY, SS = 420, 238, 64    # star (big and full, like the reference)
CDY = 40                     # vertical offset of the (hidden) closed book used at the start of the intro

def mx(p):
    return (2 * CX - p[0], p[1])

def P(pts):
    return ' '.join(f'{f(x)} {f(y + DY)}' for x, y in pts)

# pages back → front. Each: top edge (two cubics, gutter → tip), bottom edge (two cubics, tip → gutter), fill, and
# which edges get the dark outline (only where the page sits over something light).
PAGES = [
    dict(top=[((425, 400), (436, 352), (470, 330)), ((524, 296), (588, 262), (632, 264))],
         bot=[((616, 304), (586, 340), (540, 368)), ((486, 396), (440, 440), (426, 470))],
         fill='url(#page-back)', outline='all'),
    dict(top=[((430, 410), (456, 368), (502, 352)), ((566, 330), (636, 312), (678, 320))],
         bot=[((664, 352), (640, 384), (600, 396)), ((530, 414), (452, 446), (426, 470))],
         fill='url(#page-mid)', outline=None),
    dict(top=[((444, 424), (488, 392), (560, 376)), ((620, 364), (676, 366), (702, 380))],
         bot=[((704, 396), (686, 410), (650, 420)), ((566, 440), (482, 458), (426, 474))],
         fill='url(#page-front)', outline='bottom'),
    dict(top=[((422, 404), (426, 346), (452, 324)), ((468, 312), (490, 320), (486, 338))],          # curled gutter page
         bot=[((478, 372), (456, 414), (446, 440)), ((438, 458), (430, 468), (426, 472))],
         fill='url(#page-curl)', outline=None),
]

def page_d(pg, side):
    m = (lambda p: p) if side > 0 else mx
    (a1, a2, a3), (b1, b2, b3) = pg['top']
    (c1, c2, c3), (d1, d2, d3) = pg['bot']
    g = m(G)
    return f'M {P([g])} C {P([m(a1), m(a2), m(a3)])} C {P([m(b1), m(b2), m(b3)])} C {P([m(c1), m(c2), m(c3)])} C {P([m(d1), m(d2), m(d3)])} Z'

def page_top_d(pg, side):
    """top-edge highlight: the gutter→tip curve, stopping ~12% short of the tip"""
    m = (lambda p: p) if side > 0 else mx
    (a1, a2, a3), (b1, b2, b3) = pg['top']
    T = 0.86
    lerp = lambda a, b, u: (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u)
    p01, p12, p23 = lerp(a3, b1, T), lerp(b1, b2, T), lerp(b2, b3, T)        # de Casteljau split at T
    q0, q1 = lerp(p01, p12, T), lerp(p12, p23, T)
    end = lerp(q0, q1, T)
    return f'M {P([m(a3)])} C {P([m(p01), m(q0), m(end)])}'

def page_bot_d(pg, side, full=True):
    m = (lambda p: p) if side > 0 else mx
    (c1, c2, c3), (d1, d2, d3) = pg['bot']
    b3 = pg['top'][1][2]
    if not full:                     # shading only: skip the tip so it doesn't poke out past the page end
        return f'M {P([m(c3)])} C {P([m(d1), m(d2), m(d3)])}'
    return f'M {P([m(b3)])} C {P([m(c1), m(c2), m(c3)])} C {P([m(d1), m(d2), m(d3)])}'

def page_layer(i, pg, side, name):
    d = page_d(pg, side)
    ol = t['outline']
    under = ''
    if pg['outline'] == 'all':
        under = f'\n        <path d="{d}" fill="{ol}" stroke="{ol}" stroke-width="12" stroke-linejoin="round"/>'
    elif pg['outline'] == 'bottom':
        under = f'\n        <path d="{page_bot_d(pg, side)}" stroke="{ol}" stroke-width="12" stroke-linecap="round"/>'
    return f'''      <g id="{name}">{under}
        <path d="{d}" fill="{pg['fill']}"/>
        <path d="{page_bot_d(pg, side, False)}" stroke="#f2b45e" stroke-width="10" stroke-linecap="round" opacity="0.5" transform="translate({-side * 4} -7)"/>
        <path d="{page_top_d(pg, side)}" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.9" transform="translate(0 5)"/>
      </g>'''

def leaf(i):
    """A turnable leaf = exactly the front page of the left stack (so it can flip from the right stack onto the left one)."""
    pg = PAGES[2]
    d = page_d(pg, -1)
    return f'''      <g id="leaf-{i}">
        <path d="{page_bot_d(pg, -1)}" stroke="{t['outline']}" stroke-width="12" stroke-linecap="round"/>
        <path d="{d}" fill="{pg['fill']}"/>
        <path d="{page_bot_d(pg, -1, False)}" stroke="#f2b45e" stroke-width="10" stroke-linecap="round" opacity="0.5" transform="translate(4 -7)"/>
        <path d="{page_top_d(pg, -1)}" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.9" transform="translate(0 5)"/>
      </g>'''

def rounded_quad(q, r):
    """closed path through the 4 corners with rounded corners of radius ~r"""
    out = []
    n = len(q)
    for i in range(n):
        p0, p1, p2 = q[i - 1], q[i], q[(i + 1) % n]
        u = lambda a, b: ((b[0] - a[0]) / math.hypot(b[0] - a[0], b[1] - a[1]), (b[1] - a[1]) / math.hypot(b[0] - a[0], b[1] - a[1]))
        ua, ub = u(p1, p0), u(p1, p2)
        out.append(((p1[0] + ua[0] * r, p1[1] + ua[1] * r), p1, (p1[0] + ub[0] * r, p1[1] + ub[1] * r)))
    d = f'M {P([out[0][2]])}'
    for k in range(1, n + 1):
        a, c, b = out[k % n]
        d += f' L {P([a])} Q {P([c, b])}'
    return d + ' Z'

def cover(side, name):
    q = [(CX, GT), OUT_TOP, OUT_BOT, (CX, GB)]
    if side < 0:
        q = [mx(p) for p in q]
    quad = rounded_quad(q, 16)
    cxq = sum(p[0] for p in q) / 4; cyq = sum(p[1] for p in q) / 4
    ins = [(cxq + (p[0] - cxq) * .74, cyq + (p[1] - cyq) * .66 + 4) for p in q]
    ins[0] = (ins[0][0] + side * 30, ins[0][1]); ins[3] = (ins[3][0] + side * 30, ins[3][1])    # clear of the spine
    inset = rounded_quad(ins, 12)
    o1, o2 = q[1], q[2]
    rim = f'M {P([(CX + side * 30, GT + 2), (o1[0] - side * 16, o1[1] + 6)])}'
    gl = f'M {P([(o1[0] - side * 22, o1[1] + 36), (o2[0] - side * 16, o2[1] - 40)])}'
    ol = t['outline']
    return f'''    <g id="{name}">
      <path d="{quad}" fill="{ol}" stroke="{ol}" stroke-width="22" stroke-linejoin="round" transform="translate(0 10)"/>
      <path d="{quad}" fill="{ol}" stroke="{ol}" stroke-width="22" stroke-linejoin="round"/>
      <path d="{quad}" fill="url(#cover-{'r' if side > 0 else 'l'})"/>
      <path d="{inset}" fill="#4a1899" stroke="#6b2ccf" stroke-width="7" stroke-linejoin="round" opacity="{0.85 if side > 0 else 0.7}"/>
      <path d="{rim}" stroke="#b675fb" stroke-width="13" stroke-linecap="round"/>
      <path d="{gl}" stroke="#c39bff" stroke-width="11" stroke-linecap="round" opacity="{0.35 if side > 0 else 0.7}"/>
    </g>'''

# gold spine: the rounded back of the binding, standing in front of the gutter; the pages come out of its open top
SW, ST, SB = 54, 480, 684
spine = f'''    <g id="spine">
      <path d="M {f(CX - SW)} {f(ST)} V {f(SB - 10)} Q {f(CX - SW)} {f(SB + 12)} {f(CX)} {f(SB + 12)} Q {f(CX + SW)} {f(SB + 12)} {f(CX + SW)} {f(SB - 10)} V {f(ST)} Z" fill="{t['outline']}" stroke="{t['outline']}" stroke-width="20" stroke-linejoin="round"/>
      <path d="M {f(CX - SW)} {f(ST)} V {f(SB - 10)} Q {f(CX - SW)} {f(SB + 12)} {f(CX)} {f(SB + 12)} Q {f(CX + SW)} {f(SB + 12)} {f(CX + SW)} {f(SB - 10)} V {f(ST)} Z" fill="url(#spine-fill)"/>
      <path d="M {f(CX - SW)} {f(ST + 40)} Q {f(CX)} {f(ST + 54)} {f(CX + SW)} {f(ST + 40)} V {f(ST + 58)} Q {f(CX)} {f(ST + 72)} {f(CX - SW)} {f(ST + 58)} Z" fill="#bd4e00" opacity="0.85"/>
      <path d="M {f(CX - SW)} {f(SB - 60)} Q {f(CX)} {f(SB - 46)} {f(CX + SW)} {f(SB - 60)} V {f(SB - 42)} Q {f(CX)} {f(SB - 28)} {f(CX - SW)} {f(SB - 42)} Z" fill="#bd4e00" opacity="0.85"/>
      <path d="M {f(CX - 30)} {f(ST + 14)} V {f(SB - 14)}" stroke="#fff3a6" stroke-width="9" stroke-linecap="round" opacity="0.9"/>
      <path d="M {f(CX + 32)} {f(ST + 16)} V {f(SB - 16)}" stroke="#e8800a" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
      <ellipse cx="{f(CX)}" cy="{f(ST)}" rx="{f(SW)}" ry="13" fill="{t['outline']}"/>
      <ellipse cx="{f(CX)}" cy="{f(ST + 1)}" rx="{f(SW - 12)}" ry="6" fill="#f6c983"/>
      <path d="M {f(CX - SW)} {f(ST + 2)} Q {f(CX)} {f(ST + 22)} {f(CX + SW)} {f(ST + 2)}" stroke="#ffe27a" stroke-width="6" stroke-linecap="round"/>
    </g>'''

# bookmark: wide gold ribbon over the front of the right cover, forked tail
BX0, BX1, BT, BB, BN = 543, 616, 448, 594, 556
bm = f'M {f(BX0)} {f(BT + 14)} L {f(BX1)} {f(BT - 6)} L {f(BX1)} {f(BB)} L {f((BX0 + BX1) / 2)} {f(BN)} L {f(BX0)} {f(BB)} Z'
bookmark = f'''    <g id="bookmark">
      <path d="{bm}" fill="{t['outline']}" stroke="{t['outline']}" stroke-width="16" stroke-linejoin="round"/>
      <path d="{bm}" fill="url(#gold-deep)"/>
      <path d="M {f(BX0)} {f(BT + 14)} L {f(BX1)} {f(BT - 6)} L {f(BX1)} {f(BT + 14)} L {f(BX0)} {f(BT + 34)} Z" fill="#f59204" opacity="0.6"/>
      <path d="M {f(BX0 + 12)} {f(BT + 34)} V {f(BB - 18)}" stroke="#fdf49e" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
      <path d="M {f(BX1 - 9)} {f(BT + 20)} V {f(BB - 10)}" stroke="#e07a04" stroke-width="7" stroke-linecap="round" opacity="0.6"/>
    </g>'''

def STAR():
    s, k = SS, 0.3
    d = (f"M 0 {-s} C {s*k} {-s*k} {s*k} {-s*k} {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} "
         f"C {-s*k} {s*k} {-s*k} {s*k} {-s} 0 C {-s*k} {-s*k} {-s*k} {-s*k} 0 {-s} Z")
    facet = f"M 0 0 L {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} Z"
    return f'''  <g id="star" transform="translate({SX} {SY})">
    <path d="{d}" fill="#f59204" opacity="0.45" filter="url(#star-glow)"/>
    <path d="{d}" fill="url(#gold-fill)" stroke="#f47902" stroke-width="6" stroke-linejoin="round"/>
    <path d="{facet}" fill="#f9960b" opacity="0.85"/>
    <path d="M 0 {f(-s*0.7)} C {f(s*0.06)} {f(-s*0.4)} {f(-s*0.02)} {f(-s*0.2)} {f(-s*0.2)} {f(-s*0.08)}" stroke="#fffbe0" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
  </g>'''
def capsule(cx, cy, ang, r0, r1, name, w=19, color='#fc4b4c'):
    a = math.radians(ang)
    return (f'<path id="{name}" d="M {f(cx + math.cos(a) * r0)} {f(cy + math.sin(a) * r0)} L {f(cx + math.cos(a) * r1)} {f(cy + math.sin(a) * r1)}" '
            f'stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>')

burst = f'''  <g id="burst">
    {capsule(CX, 372, -129.5, 124, 194, 'burst-left')}
    {capsule(CX, 372, -50.5, 124, 194, 'burst-right')}
  </g>'''


# ---------------- closed book (hidden in the static file; the intro starts with it) ----------------
# Front view of the shut book: front cover facing us, spine on the left (its hinge sits on the gutter
# line x = CX), page block + back cover edge showing along the right and bottom, bookmark tail peeking out.
def book_closed():
    x0, x1, y0, y1 = CX + 4, CX + 254, 326, 604            # front cover
    R = lambda x, y, w, h, rx, fill, extra='': f'<rect x="{f(x)}" y="{f(y + CDY)}" width="{f(w)}" height="{f(h)}" rx="{rx}" fill="{fill}" {extra}/>'
    ol = t['outline']
    lines = '\n'.join(f'        <path d="M {f(x1 + 4)} {f(y0 + 24 + i * 46 + CDY)} H {f(x1 + 14)}" stroke="#eab06a" stroke-width="3" stroke-linecap="round"/>' for i in range(6))
    blines = '\n'.join(f'        <path d="M {f(x0 + 30 + i * 40)} {f(y1 + 6 + CDY)} V {f(y1 + 13 + CDY)}" stroke="#eab06a" stroke-width="3" stroke-linecap="round"/>' for i in range(6))
    tx = x0 + 186; ty = y1 + 22
    tail = f'M {f(tx - 18)} {f(y1 - 10 + CDY)} H {f(tx + 18)} V {f(ty + 26 + CDY)} L {f(tx)} {f(ty + 12 + CDY)} L {f(tx - 18)} {f(ty + 26 + CDY)} Z'
    inset = f'M {f(x0 + 34)} {f(y0 + 38 + CDY)} H {f(x1 - 30)} V {f(y1 - 38 + CDY)} H {f(x0 + 34)} Z'
    cap = lambda cx, cy, sx, sy: f'<path d="M {f(cx)} {f(cy + CDY)} h {f(-sx * 46)} q {f(sx * 30)} 0 {f(sx * 46)} {f(sy * 46)} Z" fill="url(#gold-deep)" stroke="#e07a04" stroke-width="3" stroke-linejoin="round"/>'
    return f"""    <g id="book-closed">
      <g id="closed-back">
        {R(x0 - 4, y0 + 8, x1 - x0 + 30, y1 - y0 + 34, 22, ol, f'stroke="{ol}" stroke-width="22"')}
        {R(x0, y0 + 14, x1 - x0 + 24, y1 - y0 + 22, 18, '#3b1490')}
        {R(x0, y0 + 8, x1 - x0 + 16, y1 - y0 + 14, 14, 'url(#page-mid)', 'stroke="#eab06a" stroke-width="3"')}
{lines}
{blines}
        <path d="{tail}" fill="{ol}" stroke="{ol}" stroke-width="12" stroke-linejoin="round"/>
        <path d="{tail}" fill="url(#gold-deep)"/>
        <path d="M {f(tx - 9)} {f(y1 + 14 + CDY)} V {f(ty + 14 + CDY)}" stroke="#fff3a6" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
      </g>
      <g id="closed-front">
        {R(x0, y0, x1 - x0, y1 - y0, 18, ol, f'stroke="{ol}" stroke-width="22"')}
        {R(x0, y0 + 8, x1 - x0, y1 - y0, 18, '#3b1490')}
        {R(x0, y0, x1 - x0, y1 - y0, 18, 'url(#cover-r)')}
        <path d="{inset}" fill="#4c1aa8" stroke="#9a6bff" stroke-width="7" stroke-linejoin="round"/>
        <path d="M {f(x0 + 70)} {f(y0 + 120 + CDY)} H {f(x1 - 64)} M {f(x0 + 86)} {f(y0 + 152 + CDY)} H {f(x1 - 80)}" stroke="#9a6bff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
        {cap(x1, y0, 1, 1)}
        {cap(x1, y1, 1, -1)}
        <path d="M {f(x0 + 30)} {f(y0 + 14 + CDY)} H {f(x1 - 56)}" stroke="#c9a2ff" stroke-width="8" stroke-linecap="round"/>
        <path d="M {f(x1 - 14)} {f(y0 + 64 + CDY)} V {f(y1 - 64 + CDY)}" stroke="#d7bbff" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
      </g>
      <g id="closed-spine">
        <path d="M {f(x0 + 14)} {f(y0 - 4 + CDY)} H {f(x0 - 12)} Q {f(x0 - 30)} {f(y0 - 4 + CDY)} {f(x0 - 30)} {f(y0 + 18 + CDY)} V {f(y1 + 16 + CDY)} Q {f(x0 - 30)} {f(y1 + 36 + CDY)} {f(x0 - 12)} {f(y1 + 36 + CDY)} H {f(x0 + 14)} Z" fill="{ol}" stroke="{ol}" stroke-width="18" stroke-linejoin="round"/>
        <path d="M {f(x0 + 12)} {f(y0 + CDY)} H {f(x0 - 10)} Q {f(x0 - 24)} {f(y0 + CDY)} {f(x0 - 24)} {f(y0 + 18 + CDY)} V {f(y1 + 14 + CDY)} Q {f(x0 - 24)} {f(y1 + 30 + CDY)} {f(x0 - 10)} {f(y1 + 30 + CDY)} H {f(x0 + 12)} Z" fill="url(#spine-fill)"/>
        <path d="M {f(x0 - 22)} {f(y0 + 50 + CDY)} H {f(x0 + 10)} M {f(x0 - 22)} {f(y1 - 30 + CDY)} H {f(x0 + 10)}" stroke="#bd4e00" stroke-width="12" opacity="0.85"/>
        <path d="M {f(x0 - 14)} {f(y0 + 76 + CDY)} V {f(y1 - 56 + CDY)}" stroke="#fff3a6" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
      </g>
    </g>"""

grads = '''
  <linearGradient id="cover-r" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7a3cf0"/><stop offset="1" stop-color="#5a22c8"/></linearGradient>
  <linearGradient id="cover-l" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#7a3cf0"/><stop offset="1" stop-color="#8f52ff"/></linearGradient>
  <linearGradient id="page-back" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fde6bd"/><stop offset="1" stop-color="#f6c98a"/></linearGradient>
  <linearGradient id="page-mid" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff0d2"/><stop offset="1" stop-color="#fad7a0"/></linearGradient>
  <linearGradient id="page-front" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#fde6bb"/></linearGradient>
  <linearGradient id="page-curl" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff6de"/><stop offset="1" stop-color="#fcc56e"/></linearGradient>
  <linearGradient id="spine-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fede6a"/><stop offset="0.45" stop-color="#fcbd2e"/><stop offset="1" stop-color="#f08a08"/></linearGradient>'''

def build():
    pl = '\n'.join(page_layer(i, l, -1, f'page-left-{i + 1}') for i, l in enumerate(PAGES))
    pr = '\n'.join(page_layer(i, l, 1, f'page-right-{i + 1}') for i, l in enumerate(PAGES))
    lv = '\n'.join(leaf(i) for i in range(1, 5))
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Bookworm badge (open book + star), source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    book (drops in, breathes), spine (gold cylinder in front of the gutter),
    cover-left / cover-right (swing open around the bottom of the gutter),
    pages-left / pages-right (each child is a page layer; they fan up out of the gutter, back to front),
    book-closed (hidden: closed-back, closed-front = front cover that swings open through 0 about the spine, closed-spine),
    leaves (leaf-1..4: identical loose leaves drawn resting on the left stack; they flip over from the right),
    bookmark (drops / unfurls from its top), star (rises out of the book), burst (burst-left, burst-right)
  Follows the reference: the gold spine cylinder stands in front of the gutter.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}{grads}
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}<g id="sparkles"></g>
  <g id="book">
{cover(-1, 'cover-left')}
{cover(1, 'cover-right')}
{bookmark}
    <g id="pages-left">
{pl}
    </g>
    <g id="pages-right">
{pr}
    </g>
    <g id="leaves">
{lv}
    </g>
{spine}
{book_closed()}
  </g>
{burst}
{STAR()}
</g>
</svg>
'''

svg = build()
if '--closed' not in sys.argv:   # static file = the open book; the closed book is shown only by the animation
    svg = svg.replace('<g id="book-closed">', '<g id="book-closed" opacity="0">')
else:
    OUT = sys.argv[sys.argv.index('--closed') + 1]
open(OUT, 'w').write(svg)
print('written', OUT)
