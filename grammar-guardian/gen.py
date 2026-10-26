"""Grammar Guardian badge: gold shield with a red "!", lavender angel wings, star + burst dashes (red theme).

Writes grammar-guardian-badge.svg. Everything is drawn around a local origin (shield centre) and then
shifted so the whole icon's bounding box is centred on the medal (420, 412).
"""
import math, sys
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['red']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)

OUTLINE = '#3d0716'      # deep outline (matches the red medal's outline family)
WING_LINE = '#3a0b2e'    # dark plum wing outline (same family as the shield outline)

# ---------------- wings: one silhouette per side, 3 tiers of long rounded "finger" feathers ----------------
# Right wing in shield-local coords (left is an exact mirror). Each feather: root (behind the shield) → tip
# (centre of its round end), width, curl. Tips step down outward-and-down; the front coverts include the big
# upper lobe that sweeps up from the shoulder to about the shield's top.
PIVOT = (118, 56)        # wing root: low on the shield's flank, hidden behind it; every feather grows from here
WING_LINE = '#360129'
# Read off the reference (right wing, shield-local coords; the left wing is its mirror). The wing is a fan of
# banana-shaped feathers that all grow from one root low beside the shield and nest inside each other: the front,
# lightest one hugs the shield and rises to a tip beside the star; each one further back is a little shorter and
# fans further out; the small dark ones at the bottom point out and down. Every tip curls upward (the belly is on
# the outer/lower side). (root, tip, width, curl) – curl < 0 bends the tip up (counter-clockwise).
ROWS = [  # name, fill, highlight, shade, feathers; rows are drawn back to front (primaries behind, coverts in front)
    ('primaries',   '#8d45ea', '#b884fb', '#5220b4',
     [((90, 104), (156, 166), 62, -0.36), ((104, 84), (214, 118), 74, -0.36), ((120, 62), (264, 66), 88, -0.38)]),
    ('secondaries', '#c08cfc', '#e6d2fe', '#8547e0',
     [((132, 44), (312, -68), 104, -0.38), ((128, 44), (282, -174), 106, -0.34)]),
    ('coverts',     '#e6d3fc', '#ffffff', '#b98af8',
     [((116, 70), (196, -236), 96, -0.18)]),
]


def _frame(L, droop, s):
    """centreline point + unit normal at s (0..1); droop < 0 curls the tip counter-clockwise (upward)."""
    x, y = L * s, droop * L * (0.35 * s * s + 0.65 * s ** 4)     # most of the curl is near the end: a hook
    dx, dy = L, droop * L * (0.7 * s + 2.6 * s ** 3)
    n = math.hypot(dx, dy)
    return x, y, -dy / n, dx / n


def _hw(H, L, s):
    """half-width: thin root (hidden), full by ~45%, then a rounded-but-pointed tip"""
    if s < 0.45:
        q = s / 0.45
        return H * (0.35 + 0.65 * (3 * q * q - 2 * q ** 3))
    q = (s - 0.45) / 0.55
    return H * (1 - q ** 2.2) ** 0.62


def feather_pts(L, W, droop, n=40):
    H = W / 2
    top, bot = [], []
    for i in range(n + 1):
        s = i / n
        x, y, nx, ny = _frame(L, droop, s)
        h = _hw(H, L, s)
        top.append((x - nx * h, y - ny * h))
        bot.append((x + nx * h, y + ny * h))
    return top, bot


def place(pts, root, ang, mirror, ox, oy):
    ca, sa = math.cos(ang), math.sin(ang)
    res = []
    for x, y in pts:
        X, Y = root[0] + x * ca - y * sa, root[1] + x * sa + y * ca
        res.append(((-X if mirror else X) + ox, Y + oy))
    return res


poly = lambda pts: 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'
line = lambda pts: 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts)


def wing(side, ox, oy, acc):
    mirror = side == 'left'
    rows = []
    for name, col, hi, shade, feathers in ROWS:
        fs = []
        for j, (root, tip, W, droop) in enumerate(feathers, 1):
            dist = math.hypot(tip[0] - root[0], tip[1] - root[1])
            L = dist / math.hypot(1, droop)                       # so the curled tip still lands on `tip`
            ang = math.atan2(tip[1] - root[1], tip[0] - root[0]) - math.atan(droop)
            top, bot = feather_pts(L, W, droop)                   # top = concave (inner/upper) edge, bot = belly
            body = place(top + bot[::-1][1:], root, ang, mirror, ox, oy)
            acc.extend(body)
            n = len(bot)
            belly = place([(x, y) for x, y in bot[int(n * .3):int(n * .9)]], root, ang, mirror, ox, oy)
            inner = place([(x, y) for x, y in top[int(n * .35):int(n * .92)]], root, ang, mirror, ox, oy)
            cx, cy = sum(p[0] for p in body) / len(body), sum(p[1] for p in body) / len(body)
            pull = lambda pts, d: [(x + (cx - x) * d / max(1, math.hypot(cx - x, cy - y)), y + (cy - y) * d / max(1, math.hypot(cx - x, cy - y))) for x, y in pts]
            depth = [(x + 3, y + 7) for x, y in body]
            fs.append(f'      <g id="feather-{side}-{name}-{j}">\n'
                      f'        <path d="{poly(depth)}" fill="{WING_LINE}" stroke="{WING_LINE}" stroke-width="12" stroke-linejoin="round"/>\n'
                      f'        <path d="{poly(body)}" fill="{col}" stroke="{WING_LINE}" stroke-width="8" stroke-linejoin="round"/>\n'
                      f'        <path d="{line(pull(belly, 10))}" stroke="{shade}" stroke-width="12" stroke-linecap="round" opacity="0.75"/>\n'
                      f'        <path d="{line(pull(inner, 9))}" stroke="{hi}" stroke-width="8" stroke-linecap="round" opacity="0.95"/>\n'
                      f'      </g>')
        rows.append(f'    <g id="wing-{side}-{name}">\n' + '\n'.join(fs) + '\n    </g>')
    px = (-PIVOT[0] if mirror else PIVOT[0]) + ox
    return (f'  <g id="wing-{side}">\n'
            f'    <circle id="wing-{side}-pivot" cx="{f(px)}" cy="{f(PIVOT[1] + oy)}" r="6" fill="{WING_LINE}"/>\n'
            + '\n'.join(rows) + '\n  </g>')


# ---------------- shield (symmetric, bevelled gold rim, cream face) ----------------
RIGHT = [  # right half, from the top centre peak down to the bottom point (cubic/quad/line segments)
    ('C', (38, -154), (92, -144), (133, -144)),
    ('Q', (148, -144), (148, -129)),
    ('L', (147, -34)),
    ('C', (145, 58), (94, 134), (0, 186)),
]
TOP = (0, -184)


def shield_d(sx=1.0, sy=1.0, dy=0.0, ox=0, oy=0, half=None):
    P = lambda p, m=1: f'{f(m * p[0] * sx + ox)} {f(p[1] * sy + dy + oy)}'
    d = f'M {P(TOP)}'
    for seg in RIGHT:
        d += f' {seg[0]} ' + ' '.join(P(p) for p in seg[1:])
    if half == 'right':
        return d + ' Z'
    # mirror back up the left side
    pts = [TOP] + [s[-1] for s in RIGHT]
    for i in range(len(RIGHT) - 1, -1, -1):
        seg, start = RIGHT[i], pts[i]
        ctrl = list(seg[1:-1])[::-1]
        d += f' {seg[0]} ' + ' '.join(P(p, -1) for p in ctrl + [start])
    return d + ' Z'


def shield(ox, oy):
    face = dict(sx=0.755, sy=0.74, dy=-4)
    lip = dict(sx=0.80, sy=0.79, dy=-3)
    return f'''  <g id="shield">
    <path d="{shield_d(ox=ox + 5, oy=oy + 12)}" fill="#b8540a" stroke="{OUTLINE}" stroke-width="12" stroke-linejoin="round"/>
    <path d="{shield_d(ox=ox, oy=oy)}" fill="url(#gold-fill)" stroke="{OUTLINE}" stroke-width="12" stroke-linejoin="round"/>
    <path d="{shield_d(ox=ox, oy=oy)}" fill="url(#gold-fill)"/>
    <path id="shield-bevel" d="{shield_d(ox=ox, oy=oy, half='right')}" fill="#f29a0c" opacity="0.75"/>
    <path d="{shield_d(**lip, ox=ox, oy=oy)}" fill="#c9650a"/>
    <path id="shield-face" d="{shield_d(**face, ox=ox, oy=oy)}" fill="url(#face-fill)"/>
    <path d="M {f(ox - 128)} {f(oy - 118)} L {f(ox - 127)} {f(oy - 40)}" stroke="#fff6b8" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
    <path d="M {f(ox - 112)} {f(oy - 136)} C {f(ox - 80)} {f(oy - 136)} {f(ox - 40)} {f(oy - 146)} {f(ox - 14)} {f(oy - 164)}" stroke="#fffbe0" stroke-width="8" stroke-linecap="round" opacity="0.95"/>
    <ellipse cx="{f(ox - 70)}" cy="{f(oy - 74)}" rx="11" ry="17" fill="#ffffff" opacity="0.85" transform="rotate(20 {f(ox - 70)} {f(oy - 74)})"/>
    <circle cx="{f(ox - 78)}" cy="{f(oy - 40)}" r="6" fill="#ffffff" opacity="0.8"/>
  </g>'''


# ---------------- exclamation mark (tapered bar + round dot) ----------------
def exclaim(ox, oy):
    """chunky tapered bar + round dot, sized like the reference (bar ~72 wide at the top, dot r ~31)"""
    K, KY, SH = 1.18, 0.9, 7.4          # wider than tall-scaled, top ~88 above the shield centre like the reference
    P = lambda x, y: f'{f(ox + x * K)} {f(oy + SH + y * KY)}'
    bar = lambda dx, dy: (f'M {P(dx-31, dy-90)} Q {P(dx-31, dy-106)} {P(dx-15, dy-106)} '
                          f'H {f(ox + (dx+15) * K)} Q {P(dx+31, dy-106)} {P(dx+31, dy-90)} '
                          f'L {P(dx+16, dy+14)} Q {P(dx+14, dy+27)} {P(dx, dy+27)} '
                          f'Q {P(dx-14, dy+27)} {P(dx-16, dy+14)} Z')
    DY = 69 / K                        # dot centre ~69 below the shield centre
    return f'''  <g id="exclaim">
    <g id="exclaim-bar">
      <path d="{bar(3, 6)}" fill="#4d0414"/>
      <path d="{bar(0, 0)}" fill="url(#mark-fill)"/>
      <path d="M {P(-17, -88)} L {P(-9, -8)}" stroke="#ff8aa0" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
    </g>
    <g id="exclaim-dot">
      <circle cx="{f(ox + 3 * K)}" cy="{f(oy + (DY + 6) * K)}" r="{f(26 * K)}" fill="#4d0414"/>
      <circle cx="{f(ox)}" cy="{f(oy + DY * K)}" r="{f(26 * K)}" fill="url(#mark-fill)"/>
      <ellipse cx="{f(ox - 10 * K)}" cy="{f(oy + (DY - 11) * K)}" rx="8" ry="6" fill="#ff9fb2" opacity="0.85" transform="rotate(-30 {f(ox - 10 * K)} {f(oy + (DY - 11) * K)})"/>
    </g>
  </g>'''


STAR = (0, -240, 50)
BURST_C = (0, -150)
BURST = [(-128, 112, 156), (-153, 118, 160), (-52, 112, 156), (-27, 118, 160)]


def build(ox, oy):
    acc = []
    wl, wr = wing('left', ox, oy, acc), wing('right', ox, oy, acc)
    acc += [(-148 + ox, -184 + oy), (153 + ox, 198 + oy)]                       # shield + depth
    acc += [(STAR[0] + ox, STAR[1] - STAR[2] + oy)]                              # star tip
    dashes = '\n'.join('    ' + dash(BURST_C[0] + ox, BURST_C[1] + oy, a, r0, r1, 16, 7, name=f'dash-{i}')
                       for i, (a, r0, r1) in enumerate(BURST, 1))
    for a, r0, r1 in BURST:
        acc.append((BURST_C[0] + ox + math.cos(math.radians(a)) * r1, BURST_C[1] + oy + math.sin(math.radians(a)) * r1))
    body = f'''{wl}
{wr}
  <g id="burst">
{dashes}
  </g>
  <g id="sparkles">
{star(STAR[0] + ox, STAR[1] + oy, STAR[2], 'star')}
  </g>
{shield(ox, oy)}
{exclaim(ox, oy - 4)}'''
    return body, acc


_, pts = build(0, 0)
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
OX, OY = 420, 451   # shield centre placed where the reference has it (ref (627, 600) at 0.72 scale)
icon, _ = build(OX, OY)

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Grammar Guardian badge, source artwork (generated by gen.py). Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal (centre + shine mask), ribbon-left, ribbon-right,
    shield (pops in), wing-left / wing-right (unfurl + flap about wing-*-pivot, the shoulder behind the shield),
    wing-*-coverts / -secondaries / -primaries (rows; each child feather fans out, row after row),
    exclaim-bar, exclaim-dot (drop in and squash on landing), burst (each child dash pops outward),
    sparkles (star pops and twinkles)
  Icon bounding box centred on the medal (420, 412); shift applied: {f(OX)}, {f(OY)}.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <linearGradient id="face-fill" x1="0.3" y1="0" x2="0.7" y2="1"><stop stop-color="#fffaea"/><stop offset="0.6" stop-color="#fdebc8"/><stop offset="1" stop-color="#f7d29a"/></linearGradient>
  <linearGradient id="mark-fill" x1="0" y1="0" x2="0.4" y2="1"><stop stop-color="#d4204a"/><stop offset="1" stop-color="#8e0a2e"/></linearGradient>
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}{icon}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/grammar-guardian/grammar-guardian-badge.svg', 'w').write(svg)
print('icon bbox', [round(v) for v in (minx, miny, maxx, maxy)], 'shift', round(OX, 1), round(OY, 1))
