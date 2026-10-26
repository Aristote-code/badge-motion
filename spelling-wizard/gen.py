"""Spelling Wizard badge: A-B-C letter tiles with a magic gold swoosh ring and a star. Writes spelling-wizard-badge.svg."""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['red']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
INK = '#5c0a26'          # dark maroon letters
OUT = '#3d0414'          # tile outline


# ------------------------------------------------------------------ geometry (before centring)
TILES = {  # name: (cx, cy, rot, size, kind, letter)
    'a': (262, 458, -13, 162, 'cream', 'A'),
    'b': (414, 424, -4, 162, 'cream', 'B'),
    'c': (580, 402, 8, 188, 'gold', 'C'),
}
SW = dict(cx=424, cy=440, rx=276, ry=150, rot=-9, th0=-52, th_split=-180, th1=-350, w=32)
STAR_TH = -287
BURST = (666, 312)       # centre the dashes radiate from (C tile's top-right corner)
BURST_A = [-112, -68, -24]


def rot(x, y, a):
    a = math.radians(a)
    return x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)


def sw_point(th, dx=0, dy=0):
    x, y = SW['rx'] * math.cos(math.radians(th)), SW['ry'] * math.sin(math.radians(th))
    x, y = rot(x, y, SW['rot'])
    return SW['cx'] + x + dx, SW['cy'] + y + dy


def sw_width(th):
    """Tapered tail at the start (top right), full width from the left side on."""
    u = (SW['th0'] - th) / (SW['th0'] - SW['th1'])
    k = min(1, u / 0.42)
    k = k * k * (3 - 2 * k)
    return 3 + (SW['w'] - 3) * k


def sw_outline(a, b, dx=0, dy=0, head=False, n=90):
    """Filled crescent between angles a → b (decreasing); width from sw_width."""
    pts_o, pts_i = [], []
    for i in range(n + 1):
        th = a + (b - a) * i / n
        x, y = sw_point(th, dx, dy)
        x2, y2 = sw_point(th - 0.2, dx, dy)
        tx, ty = x2 - x, y2 - y
        L = math.hypot(tx, ty)
        nx, ny = -ty / L, tx / L
        cx, cy = SW['cx'] + dx, SW['cy'] + dy
        if (x - cx) * nx + (y - cy) * ny < 0: nx, ny = -nx, -ny     # outward normal
        w = sw_width(th) / 2
        pts_o.append((x + nx * w, y + ny * w)); pts_i.append((x - nx * w, y - ny * w))
    d = 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts_o)
    if head:
        w = sw_width(b) / 2
        d += f' A {f(w)} {f(w)} 0 0 0 {f(pts_i[-1][0])} {f(pts_i[-1][1])}'
    d += ' L ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in reversed(pts_i)) + ' Z'
    return d, pts_o + pts_i


def sw_centre(a, b, n=90):
    pts = [sw_point(a + (b - a) * i / n) for i in range(n + 1)]
    return 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts)


def sw_highlight(a, b, n=60):
    """Thin bright line along the outer edge (only where the swoosh is wide)."""
    pts = []
    for i in range(n + 1):
        th = a + (b - a) * i / n
        x, y = sw_point(th)
        x2, y2 = sw_point(th - 0.2)
        tx, ty = x2 - x, y2 - y; L = math.hypot(tx, ty); nx, ny = -ty / L, tx / L
        if (x - SW['cx']) * nx + (y - SW['cy']) * ny < 0: nx, ny = -nx, -ny
        w = sw_width(th) / 2 - 7
        pts.append((x + nx * w, y + ny * w))
    return 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts)


# ------------------------------------------------------------------ letters (local tile space, size 1)
def letter_path(ch, S):
    s = lambda v: f(v * S)
    if ch == 'A':
        return (f'M {s(-0.235)} {s(0.27)} L {s(0)} {s(-0.27)} L {s(0.235)} {s(0.27)} '
                f'M {s(-0.13)} {s(0.075)} L {s(0.13)} {s(0.075)}')
    if ch == 'B':
        x0 = -0.2
        return (f'M {s(x0)} {s(-0.27)} L {s(0.03)} {s(-0.27)} C {s(0.2)} {s(-0.27)} {s(0.2)} {s(-0.015)} {s(0.03)} {s(-0.015)} '
                f'L {s(x0)} {s(-0.015)} M {s(0.04)} {s(-0.015)} C {s(0.245)} {s(-0.015)} {s(0.245)} {s(0.27)} {s(0.04)} {s(0.27)} '
                f'L {s(x0)} {s(0.27)} M {s(x0)} {s(-0.27)} L {s(x0)} {s(0.27)}')
    if ch == 'C':
        rx, ry, a = 0.235, 0.27, math.radians(48)
        ox = 0.045
        x1, y1 = ox + rx * math.cos(a), -ry * math.sin(a)
        return f'M {s(x1)} {s(y1)} A {s(rx)} {s(ry)} 0 1 0 {s(x1)} {s(-y1)}'


COL = {
    'cream': dict(face0='#fffaea', face1='#fbe2a8', side='#e0a456', side2='#c9873a', hi='#ffffff', shade='#f3cf88'),
    'gold': dict(face0='#fff27a', face1='#fcc513', side='#e88a06', side2='#c86a04', hi='#fffbd0', shade='#f5b10e'),
}
DEPTH = 0.085


def tile_body(S, kind, ch, gid=None, opacity=None):
    c = COL[kind]
    h, r, d = S / 2, S * 0.2, S * DEPTH
    g = f' id="{gid}"' if gid else ''
    o = f' opacity="{opacity}"' if opacity is not None else ''
    grad = 'tile-cream' if kind == 'cream' else 'tile-gold'
    hi = (f'M {f(-h + 14)} {f(h * 0.25)} L {f(-h + 14)} {f(-h + r)} '
          f'Q {f(-h + 14)} {f(-h + 14)} {f(-h + r)} {f(-h + 14)} L {f(h * 0.25)} {f(-h + 14)}')
    return f'''      <g{g}{o}>
        <rect x="{f(-h)}" y="{f(-h + d * 0.5)}" width="{f(S)}" height="{f(S + d * 0.5)}" rx="{f(r)}" fill="{c['side']}"/>
        <rect x="{f(-h)}" y="{f(-h + d * 0.9)}" width="{f(S)}" height="{f(S + d * 0.1)}" rx="{f(r)}" fill="{c['side2']}" opacity="0.55"/>
        <rect x="{f(-h)}" y="{f(-h)}" width="{f(S)}" height="{f(S)}" rx="{f(r)}" fill="url(#{grad})"/>
        <rect x="{f(-h + 8)}" y="{f(h - 22)}" width="{f(S - 16)}" height="14" rx="7" fill="{c['shade']}" opacity="0.7"/>
        <path d="{hi}" stroke="{c['hi']}" stroke-width="{f(S * 0.05)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
        <path d="{letter_path(ch, S)}" transform="translate(0 {f(S * 0.012 + 3)})" stroke="{c['side2']}" stroke-width="{f(S * 0.15)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
        <path d="{letter_path(ch, S)}" stroke="{INK}" stroke-width="{f(S * 0.15)}" stroke-linecap="round" stroke-linejoin="round"/>
      </g>'''


def tile(name, cx, cy, a, S, kind, ch, OX, OY):
    h, r, d = S / 2, S * 0.2, S * DEPTH
    back = f'      <rect x="{f(-h - 6)}" y="{f(-h - 6)}" width="{f(S + 12)}" height="{f(S + d + 12)}" rx="{f(r + 6)}" fill="{OUT}"/>'
    if name == 'c':  # front (gold) face + the cream back it flips from
        body = tile_body(S, 'gold', ch, 'tile-c-gold') + '\n' + tile_body(S, 'cream', ch, 'tile-c-cream', 0)
    else:
        body = tile_body(S, kind, ch)
    return f'''    <g id="tile-{name}" transform="translate({f(cx + OX)} {f(cy + OY)}) rotate({a})">
{back}
{body}
    </g>'''


def tile_corners(cx, cy, a, S):
    h, d = S / 2 + 6, S * DEPTH
    return [(cx + x, cy + y) for x, y in (rot(px, py, a) for px, py in ((-h, -h), (h, -h), (h, h + d), (-h, h + d)))]


def build(OX, OY):
    SW['cx'] += OX; SW['cy'] += OY
    th0, ths, th1 = SW['th0'], SW['th_split'], SW['th1']
    back_d, back_pts = sw_outline(th0, ths - 1.5)
    back_dd, _ = sw_outline(th0, ths - 1.5, 3, 7)
    front_d, front_pts = sw_outline(ths + 1.5, th1, head=True)
    front_dd, _ = sw_outline(ths + 1.5, th1, 3, 7, head=True)
    sx, sy = sw_point(STAR_TH)
    bx, by = BURST[0] + OX, BURST[1] + OY
    swoosh_back = f'''  <g id="swoosh-back">
    <path d="{back_dd}" fill="#b85a04"/>
    <path d="{back_d}" fill="url(#swoosh-fill)"/>
    <path d="{sw_highlight(-112, ths - 1.5)}" stroke="#fff6b0" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <path id="swoosh-back-path" d="{sw_centre(th0, ths - 1.5)}" fill="none" stroke="none"/>
  </g>'''
    swoosh_front = f'''  <g id="swoosh-front">
    <path d="{front_dd}" fill="#b85a04"/>
    <path d="{front_d}" fill="url(#swoosh-fill)"/>
    <path d="{sw_highlight(ths + 1.5, th1 + 4)}" stroke="#fff6b0" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <path id="swoosh-front-path" d="{sw_centre(ths + 1.5, th1)}" fill="none" stroke="none"/>
  </g>'''
    tiles = {n: tile(n, *v[:4], v[4], v[5], OX, OY) for n, v in TILES.items()}
    burst = '\n'.join('    ' + dash(bx, by, a, 46, 84, 20, 8, f'dash-{i}') for i, a in enumerate(BURST_A, 1))
    pts = back_pts + front_pts
    for n, v in TILES.items(): pts += tile_corners(v[0] + OX, v[1] + OY, v[2], v[3])
    pts += [(bx + math.cos(math.radians(a)) * 92, by + math.sin(math.radians(a)) * 92) for a in BURST_A]
    pts += [(sx - 46, sy - 46), (sx + 46, sy + 46)]
    SW['cx'] -= OX; SW['cy'] -= OY
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    bbox = (min(xs), min(ys), max(xs), max(ys))
    body = f'''<g id="sparkles">
{star(214, 262, 26, 'star-1')}
{star(640, 598, 22, 'star-2')}
</g>
<g id="spelling">
{swoosh_back}
  <g id="tiles">
{tiles['a']}
{tiles['b']}
{tiles['c']}
  </g>
{swoosh_front}
{star(f(sx), f(sy), 46, 'magic-star')}
  <g id="burst">
{burst}
  </g>
</g>'''
    return body, bbox


_, bb = build(0, 0)
OX, OY = round(420 - (bb[0] + bb[2]) / 2, 1), round(412 - (bb[1] + bb[3]) / 2, 1)
body, bb2 = build(OX, OY)
print('bbox', [round(v) for v in bb2], 'offset', OX, OY, 'centre', round((bb2[0] + bb2[2]) / 2), round((bb2[1] + bb2[3]) / 2))
# B sits furthest back: draw order B, A, C (drop order is taken left → right by the animation)
ta, tb = body.index('    <g id="tile-a"'), body.index('    <g id="tile-b"')
tc = body.index('    <g id="tile-c"')
body = body[:ta] + body[tb:tc] + body[ta:tb] + body[tc:]

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Spelling Wizard badge, source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    tiles (tile-a, tile-b, tile-c drop in left → right), tile-c-cream / tile-c-gold (C flips cream → gold),
    swoosh-back (behind the tiles) + swoosh-front (in front), each drawn on along its centre line
    swoosh-back-path / swoosh-front-path (invisible guides), magic-star (rides the swoosh), burst (dash-1..3)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <linearGradient id="tile-cream" x1="0" y1="0" x2="0.3" y2="1"><stop stop-color="{COL['cream']['face0']}"/><stop offset="1" stop-color="{COL['cream']['face1']}"/></linearGradient>
  <linearGradient id="tile-gold" x1="0" y1="0" x2="0.3" y2="1"><stop stop-color="{COL['gold']['face0']}"/><stop offset="1" stop-color="{COL['gold']['face1']}"/></linearGradient>
  <linearGradient id="swoosh-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff07a"/><stop offset="0.55" stop-color="#fdd02a"/><stop offset="1" stop-color="#f7a90a"/></linearGradient>
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}{body}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/spelling-wizard/spelling-wizard-badge.svg', 'w').write(svg)
print(len(svg))
