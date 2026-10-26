import re, math
comp = open('/Users/ariga/Documents/badges/compass/compass-badge.svg').read()
def group(name):
    return re.search(r'<g id="%s">.*?\n</g>\n' % re.escape(name), comp, re.S).group(0)
ribbons = group('ribbon-left') + group('ribbon-right')
medal = group('medal').replace('fill="url(#paint0_linear_3208_771)"', 'fill="url(#ring-fill)"')
medal = medal.replace('fill="#170A66"/>\n</g>', 'fill="url(#inner-fill)"/>\n</g>')
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
CC, R = (428, 422), 236          # cycle centre + arrow radius

def rounded_poly(pts, r):
    """Closed path through pts with rounded corners of radius r."""
    n = len(pts); d = ''
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        v1 = (p0[0] - p1[0], p0[1] - p1[1]); v2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1, l2 = math.hypot(*v1), math.hypot(*v2)
        a = (p1[0] + v1[0] / l1 * r, p1[1] + v1[1] / l1 * r)
        b = (p1[0] + v2[0] / l2 * r, p1[1] + v2[1] / l2 * r)
        d += ('M' if i == 0 else 'L') + f' {f(a[0])} {f(a[1])} Q {f(p1[0])} {f(p1[1])} {f(b[0])} {f(b[1])} '
    return d + 'Z'

# triangle
tri = [(331, 178), (226, 414), (491, 369)]
tri_d = rounded_poly(tri, 34)
tri_depth = rounded_poly([(x + 4, y + 14) for x, y in tri], 34)
# square: centre, side, rotation
sq_c, sq_s, sq_a = (386, 552), 226, 15
def rot(p, a, c):
    a = math.radians(a); x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))
h = sq_s / 2
sq = [rot((sq_c[0] + dx, sq_c[1] + dy), sq_a, sq_c) for dx, dy in [(-h, -h), (h, -h), (h, h), (-h, h)]]
sq_d = rounded_poly(sq, 30)
sq_depth = rounded_poly([(x + 6, y + 16) for x, y in sq], 30)
sq_inner = rounded_poly([rot((sq_c[0] + dx, sq_c[1] + dy), sq_a, sq_c) for dx, dy in [(-h + 22, -h + 22), (h - 22, -h + 22), (h - 22, h - 22), (-h + 22, h - 22)]], 18)
# circle
ci_c, ci_r = (552, 410), 126

def arc_pts(a0, a1, r=R):
    p = lambda a: (CC[0] + r * math.cos(math.radians(a)), CC[1] + r * math.sin(math.radians(a)))
    return p(a0), p(a1)
def arrow(name, a0, a1):
    (x0, y0), (x1, y1) = arc_pts(a0, a1)
    arc = f"M {f(x0)} {f(y0)} A {R} {R} 0 0 1 {f(x1)} {f(y1)}"
    # head: at the end, pointing clockwise along the tangent
    t = math.radians(a1); tx, ty = -math.sin(t), math.cos(t)
    nx, ny = math.cos(t), math.sin(t)
    tip = (x1 + tx * 46, y1 + ty * 46)
    b1 = (x1 + nx * 38 - tx * 12, y1 + ny * 38 - ty * 12)
    b2 = (x1 - nx * 38 - tx * 12, y1 - ny * 38 - ty * 12)
    head = f"M {f(tip[0])} {f(tip[1])} L {f(b1[0])} {f(b1[1])} L {f(b2[0])} {f(b2[1])} Z"
    return f'''  <g id="{name}">
    <path id="{name}-glow" d="{arc}" stroke="#ffc21f" stroke-width="30" stroke-linecap="round" opacity="0.35" filter="url(#glow)"/>
    <path id="{name}-arc" d="{arc}" stroke="#ffe14a" stroke-width="17" stroke-linecap="round"/>
    <path id="{name}-head" d="{head}" fill="#ffe14a" stroke="#ffe14a" stroke-width="12" stroke-linejoin="round"/>
  </g>'''

def star(x, y, s, name):
    k = 0.18
    d = f"M 0 {-s} C {s*k} {-s*k} {s*k} {-s*k} {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} C {-s*k} {s*k} {-s*k} {s*k} {-s} 0 C {-s*k} {-s*k} {-s*k} {-s*k} 0 {-s} Z"
    return f'    <path id="{name}" transform="translate({x} {y})" d="{d}" fill="#ffc83a"/>'

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Shapes badge, source artwork. Same workflow as the rocket, compass and abacus badges.
  Layer names the animation uses:
    badge, medal (centre + shine mask), ribbon-left, ribbon-right,
    triangle, circle, square (pop in, hop around the cycle, idle moves),
    arrow-top, arrow-left (stroke paths draw on clockwise, filled head pops at the end),
    sparkles (star-1, star-2 burst and twinkle)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>
  <linearGradient id="ring-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1b7ff7"/><stop offset="1" stop-color="#1e9bff"/></linearGradient>
  <radialGradient id="inner-fill" cx="0.5" cy="0.42" r="0.6"><stop stop-color="#241383"/><stop offset="1" stop-color="#170a66"/></radialGradient>
  <linearGradient id="tri-fill" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#ffe14a"/><stop offset="1" stop-color="#ffb81a"/></linearGradient>
  <linearGradient id="sq-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#16c8ff"/><stop offset="1" stop-color="#1b7ff7"/></linearGradient>
  <radialGradient id="ci-fill" cx="0.38" cy="0.32" r="0.75"><stop stop-color="#ff6a4d"/><stop offset="1" stop-color="#e8261f"/></radialGradient>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>
<g id="badge">
{ribbons}{medal}<g id="sparkles">
{star(227, 266, 29, 'star-1')}
{star(555, 588, 34, 'star-2')}
</g>
<g id="arrows">
{arrow('arrow-top', -97, -40)}
{arrow('arrow-left', 146, 198)}
</g>
<g id="shapes">
  <g id="circle">
    <circle cx="{ci_c[0] + 5}" cy="{ci_c[1] + 10}" r="{ci_r}" fill="#c71b24"/>
    <circle cx="{ci_c[0]}" cy="{ci_c[1]}" r="{ci_r}" fill="url(#ci-fill)"/>
    <path d="M {ci_c[0] - 20} {ci_c[1] - 102} A 104 104 0 0 1 {ci_c[0] + 74} {ci_c[1] - 56}" stroke="#ffb3a3" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
    <ellipse cx="{ci_c[0] + 92}" cy="{ci_c[1] - 4}" rx="7" ry="18" fill="#ffb3a3" opacity="0.8"/>
  </g>
  <g id="triangle">
    <path d="{tri_depth}" fill="#e87e00"/>
    <path d="{tri_d}" fill="url(#tri-fill)"/>
    <path d="M 322 232 L 278 330" stroke="#fff3a6" stroke-width="11" stroke-linecap="round"/>
    <ellipse cx="333" cy="212" rx="7" ry="11" fill="#fff8c8" transform="rotate(24 333 212)"/>
  </g>
  <g id="square">
    <path d="{sq_depth}" fill="#1d4fd8"/>
    <path d="{sq_d}" fill="url(#sq-fill)"/>
    <path d="{sq_inner}" fill="#ffffff" opacity="0.08"/>
    <path d="M {f(sq[0][0] + 30)} {f(sq[0][1] + 26)} L {f(sq[1][0] - 40)} {f(sq[1][1] + 18)}" stroke="#a6f0ff" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="{f(sq[0][0] + 26)}" cy="{f(sq[0][1] + 44)}" rx="9" ry="7" fill="#d6f8ff"/>
  </g>
</g>
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/shapes/shapes-badge.svg', 'w').write(svg)
print(len(svg))
