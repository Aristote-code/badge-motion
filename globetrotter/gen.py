"""Globetrotter badge artwork generator → globetrotter-badge.svg

Globe with scrolling continents, two map pins joined by a dashed route, an orbit ring that the route
joins at pin 2 (the flight path), and a plane resting on that orbit at the top right.
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star

t = THEMES['green']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)
INK = '#2a1036'                     # dark plum outline for pins + plane (as in the reference)

# ---------------- geometry (relative to the globe centre, then shifted) ----------------
GS, OS = 1.22, 1.04                   # icon scale-up (v2): globe + continents, orbit
R = round(196 * GS)                  # globe radius
RX, RY, TILT = 292 * OS, 90 * OS, -28          # orbit ellipse (tilted so its right end rises)
TH_P2, TH_REST = 102, 46              # orbit angle (deg) of pin 2 and of the plane at rest
PIN1 = (-118 * GS, -58 * GS)                   # pin 1 tip (on the globe, upper left)
PIN_H = 100                           # pin height (tip → top of head)

cph, sph = math.cos(math.radians(TILT)), math.sin(math.radians(TILT))
def orb(th):                         # orbit point at angle th (front half = 0..180, lower)
    a = math.radians(th); x, y = RX * math.cos(a), RY * math.sin(a)
    return (x * cph - y * sph, x * sph + y * cph)
def orb_dir(th):                     # unit travel direction (th decreasing = the plane's direction)
    a = math.radians(th); x, y = RX * math.sin(a), -RY * math.cos(a)
    vx, vy = x * cph - y * sph, x * sph + y * cph; n = math.hypot(vx, vy)
    return (vx / n, vy / n)

P2 = orb(TH_P2)
REST = orb(TH_REST)
rest_dir = orb_dir(TH_REST)
REST_ANG = math.degrees(math.atan2(rest_dir[1], rest_dir[0]))
PLANE_S = 1.12

# ---------------- centre the whole icon on the medal ----------------
pts = []
for i in range(360):
    a = math.radians(i)
    pts.append((R * math.cos(a), R * math.sin(a))); pts.append((R * math.cos(a) + 5, R * math.sin(a) + 12))
    ox, oy = orb(i); pts += [(ox, oy - 11), (ox, oy + 15)]
for px, py in (PIN1, P2):
    pts += [(px - 36, py - PIN_H - 4), (px + 36, py + 4)]
for lx, ly in [(-80, -90), (86, -20), (86, 20), (-80, 90)]:     # plane extent
    a = math.radians(REST_ANG); x, y = lx * PLANE_S, ly * PLANE_S
    pts.append((REST[0] + x * math.cos(a) - y * math.sin(a), REST[1] + x * math.sin(a) + y * math.cos(a)))
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
GX, GY = MC[0] - (minx + maxx) / 2, MC[1] - (miny + maxy) / 2
A = lambda p: (GX + p[0], GY + p[1])

# ---------------- continents (a strip of width W that wraps seamlessly) ----------------
W = round(520 * GS)
def smooth(points, k=0.5):
    """Closed Catmull-Rom spline through points → cubic Bezier path."""
    n = len(points); d = f"M {f(points[0][0])} {f(points[0][1])}"
    for i in range(n):
        p0, p1, p2, p3 = points[i - 1], points[i], points[(i + 1) % n], points[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3)
        d += f" C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d + ' Z'
# (u across the strip 0..W, v from the globe centre); the visible face at rest is u 0..2R
LANDS = [
    [(38, -112), (78, -150), (128, -164), (178, -150), (206, -118), (188, -86), (156, -70), (140, -40), (116, -22), (92, -42), (70, -78), (44, -82)],   # north
    [(134, 4), (180, -4), (214, 22), (212, 66), (184, 112), (164, 166), (146, 126), (132, 74), (118, 32)],                                              # south
    [(214, -184), (250, -192), (262, -168), (236, -156), (216, -164)],                                                                                  # ice island
    [(272, -146), (318, -170), (356, -150), (344, -118), (362, -86), (396, -62), (404, -12), (384, 44), (350, 100), (318, 124), (300, 82), (288, 30), (262, 2), (254, -42), (270, -92)],  # middle
    [(398, -158), (452, -176), (502, -150), (508, -110), (480, -80), (440, -88), (412, -110)],                                                         # east
    [(436, 58), (484, 44), (510, 82), (488, 118), (448, 112)],                                                                                         # south-east
    [(70, 120), (98, 108), (106, 132), (82, 144)],                                                                                                    # small isle
]
def land_set(dx):
    out = []
    for pts_ in LANDS:
        pp = [(GX - R + u * GS + dx, GY + v * GS) for u, v in pts_]
        cx = sum(p[0] for p in pp) / len(pp); cy = sum(p[1] for p in pp) / len(pp)
        d = smooth(pp)
        inner = smooth([(cx + (x - cx) * 0.55 + 10, cy + (y - cy) * 0.55 + 12) for x, y in pp])
        out.append(f'''        <g>
          <path d="{d}" transform="translate(4 7)" fill="#1f8a3a"/>
          <path d="{d}" fill="url(#land-fill)"/>
          <path d="{inner}" fill="#3fae3a" opacity="0.55"/>
        </g>''')
    return '\n'.join(out)
continents = '\n'.join(f'      <g transform="translate({dx} 0)">\n{land_set(0)}\n      </g>' for dx in (-W, 0, W))

gx, gy = GX, GY
crescent = f"M {f(gx - R)} {f(gy)} A {R} {R} 0 1 0 {f(gx + R)} {f(gy)} A {R} {R} 0 1 0 {f(gx - R)} {f(gy)} Z " \
           f"M {f(gx - 34 - R - 10)} {f(gy - 30)} A {R + 10} {R + 10} 0 1 1 {f(gx - 34 + R + 10)} {f(gy - 30)} A {R + 10} {R + 10} 0 1 1 {f(gx - 34 - R - 10)} {f(gy - 30)} Z"
def arc(r, a0, a1, cx=gx, cy=gy):
    p0 = (cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0)))
    p1 = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
    return f"M {f(p0[0])} {f(p0[1])} A {r} {r} 0 0 1 {f(p1[0])} {f(p1[1])}"
globe = f'''  <g id="globe">
    <circle cx="{f(gx + 5)}" cy="{f(gy + 12)}" r="{R}" fill="#0a2f86"/>
    <circle id="globe-body" cx="{f(gx)}" cy="{f(gy)}" r="{R}" fill="url(#ocean-fill)"/>
    <g clip-path="url(#clip-globe)">
    <g id="continents">
{continents}
    </g>
    </g>
    <g id="globe-shade">
      <path d="{crescent}" fill="#0b2f9a" fill-rule="evenodd" opacity="0.42" clip-path="url(#clip-globe)"/>
      <path d="{arc(R - 14, 192, 262)}" stroke="#bdf3ff" stroke-width="10" stroke-linecap="round" opacity="0.75"/>
      <path d="{arc(R - 14, 272, 290)}" stroke="#bdf3ff" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
      <ellipse cx="{f(gx - 90)}" cy="{f(gy - 144)}" rx="56" ry="24" transform="rotate(-32 {f(gx - 90)} {f(gy - 144)})" fill="#ffffff" opacity="0.5"/>
      <ellipse cx="{f(gx - 156)}" cy="{f(gy - 76)}" rx="9" ry="7" fill="#ffffff" opacity="0.45"/>
    </g>
  </g>'''

# ---------------- orbit ring: back half (behind the globe) + front half ----------------
def orbit_d(a0, a1, n=72):
    ps = [A(orb(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    return 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in ps)
# both halves run in the plane's direction (angle decreasing): front = left end → bottom → right end
front_d = orbit_d(180, 0)
back_d = orbit_d(0, -180)
def ring(name, d, dim):
    op = ' opacity="0.62"' if dim else ''
    return f'''  <g id="{name}"{op}>
    <path d="{d}" transform="translate(0 6)" stroke="#c4560a" stroke-width="20" stroke-linecap="round"/>
    <path class="ring-stroke" d="{d}" stroke="{'#f0a830' if dim else 'url(#orbit-fill)'}" stroke-width="16" stroke-linecap="round"/>
    <path d="{d}" transform="translate(0 -3)" stroke="#fff3a8" stroke-width="4" stroke-linecap="round" opacity="{0.35 if dim else 0.8}"/>
  </g>'''
# fine flight guide (invisible): pin 2 → once round the globe → rest
flight_d = orbit_d(TH_P2, TH_REST - 360, 240)

# ---------------- route: dashes from pin 1, sagging arc, joining the orbit at pin 2 ----------------
d2 = orb_dir(TH_P2)
B0, B3 = PIN1, P2
B1 = (PIN1[0] - 30 * GS, PIN1[1] + 100 * GS)
B2 = (P2[0] - d2[0] * 150 * GS, P2[1] - d2[1] * 150 * GS)
def bez(q):
    m = 1 - q
    return tuple(m**3 * B0[i] + 3 * m * m * q * B1[i] + 3 * m * q * q * B2[i] + q**3 * B3[i] for i in range(2))
samp = [bez(i / 400) for i in range(401)]
cum = [0]
for i in range(1, 401): cum.append(cum[-1] + math.dist(samp[i], samp[i - 1]))
def at_len(s):
    for i in range(1, 401):
        if cum[i] >= s:
            q = (s - cum[i - 1]) / (cum[i] - cum[i - 1] + 1e-9)
            return (samp[i - 1][0] + (samp[i][0] - samp[i - 1][0]) * q, samp[i - 1][1] + (samp[i][1] - samp[i - 1][1]) * q)
    return samp[-1]
total = cum[-1]
DASH, GAP, S0, S1 = 26, 15, 22, 16
n_d = int((total - S0 - S1 + GAP) // (DASH + GAP))
spare = (total - S0 - S1) - (n_d * DASH + (n_d - 1) * GAP)
dashes = []
for i in range(n_d):
    s = S0 + spare / 2 + i * (DASH + GAP)
    ps = [A(at_len(s + DASH * j / 6)) for j in range(7)]
    d = 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in ps)
    dashes.append(f'''    <g>
      <path d="{d}" transform="translate(0 5)" stroke="#c4560a" stroke-width="12" stroke-linecap="round"/>
      <path d="{d}" stroke="#ffd23f" stroke-width="11" stroke-linecap="round"/>
    </g>''')
route = '  <g id="route">\n' + '\n'.join(dashes) + '\n  </g>'

# ---------------- pins (tip at the given point) ----------------
def pin(name, p):
    x, y = A(p); hr = 34; hc = y - PIN_H + hr
    d = (f"M {f(x)} {f(y)} C {f(x - 10)} {f(y - 16)} {f(x - hr)} {f(hc + 26)} {f(x - hr)} {f(hc)} "
         f"A {hr} {hr} 0 1 1 {f(x + hr)} {f(hc)} C {f(x + hr)} {f(hc + 26)} {f(x + 10)} {f(y - 16)} {f(x)} {f(y)} Z")
    return f'''  <g id="{name}">
    <path d="{d}" fill="url(#pin-fill)" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M {f(x - 21)} {f(hc - 6)} A 22 22 0 0 1 {f(x - 6)} {f(hc - 21)}" stroke="#ffb3a8" stroke-width="6" stroke-linecap="round"/>
    <circle cx="{f(x)}" cy="{f(hc)}" r="12.5" fill="#fbe6c8" stroke="#c42033" stroke-width="3"/>
  </g>'''

# ---------------- plane (top view, nose along +x, centred on the path point) ----------------
wing = "M 14 -14 L -18 -80 C -22 -89 -36 -89 -38 -80 L -30 -14 Z"
tail = "M -50 -12 L -66 -40 C -68 -46 -77 -46 -78 -40 L -72 -11 Z"
def flip(d):
    out, toks, n = [], d.split(), 0
    for tok in toks:
        try:
            v = float(tok); out.append(f(-v) if n % 2 == 1 else tok); n += 1
        except ValueError:
            out.append(tok)
    return ' '.join(out)
body = "M -66 -15 L 36 -19 C 64 -19 82 -10 82 0 C 82 10 64 19 36 19 L -66 15 C -80 14 -80 -14 -66 -15 Z"
belly = "M -66 5 L 36 7 C 58 7 76 5 81 2 C 79 11 62 19 36 19 L -66 15 C -75 14 -77 9 -75 5 Z"
plane = f'''  <g id="plane" transform="translate({f(A(REST)[0])} {f(A(REST)[1])}) rotate({f(REST_ANG)}) scale({PLANE_S})">
    <g stroke="{INK}" stroke-width="7" stroke-linejoin="round">
      <path d="{wing}" fill="url(#wing-fill)"/>
      <path d="{flip(wing)}" fill="url(#wing-fill)"/>
      <path d="{tail}" fill="url(#wing-fill)"/>
      <path d="{flip(tail)}" fill="url(#wing-fill)"/>
      <path d="{body}" fill="#fbecd4"/>
    </g>
    <path d="{belly}" fill="#ecc9a0"/>
    <path d="M -60 -7 L 32 -10" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
    <path d="M 52 -12 C 66 -12 75 -5 75 0 C 75 5 66 12 52 12 C 46 7 46 -7 52 -12 Z" fill="#8a4ce0" stroke="{INK}" stroke-width="4"/>
    <path d="M 56 -7 C 63 -7 67 -4 69 -1" stroke="#d9c2ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M -24 -66 L -16 -40" stroke="#d9c2ff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    <path d="M -26 66 L -18 40" stroke="#d9c2ff" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
  </g>'''

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Globetrotter badge (globe + pins + route + orbiting plane), source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    globe (pops in), continents (the land strip: three copies one period W={W} apart, scrolls sideways inside the globe clip),
    ring-back (orbit half behind the globe), ring-front (orbit half in front), both drawn in the plane's direction,
    route (each child is a dash, drawn from pin 1 to pin 2), pin-1, pin-2 (drop onto their tips),
    flight-path (invisible guide: pin 2 → once round the orbit → plane rest), plane (rests at the end of flight-path, nose along it)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <radialGradient id="ocean-fill" cx="0.36" cy="0.3" r="0.8"><stop stop-color="#5fd0ff"/><stop offset="0.45" stop-color="#1f8cf5"/><stop offset="1" stop-color="#0b48c8"/></radialGradient>
  <linearGradient id="land-fill" x1="0" y1="0" x2="0.3" y2="1"><stop stop-color="#c6f25a"/><stop offset="1" stop-color="#5ccb3a"/></linearGradient>
  <linearGradient id="orbit-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ffd84a"/><stop offset="0.5" stop-color="#ffb62a"/><stop offset="1" stop-color="#ffd84a"/></linearGradient>
  <linearGradient id="pin-fill" x1="0.2" y1="0" x2="0.7" y2="1"><stop stop-color="#ff7468"/><stop offset="1" stop-color="#e5283a"/></linearGradient>
  <linearGradient id="wing-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c08cff"/><stop offset="1" stop-color="#8248e0"/></linearGradient>
  <clipPath id="clip-globe"><circle cx="{f(gx)}" cy="{f(gy)}" r="{R}"/></clipPath>
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}<g id="sparkles">
{star(178, 238, 28, 'star-1')}
{star(640, 610, 30, 'star-2')}
</g>
{ring('ring-back', back_d, True)}
{globe}
{route}
{ring('ring-front', front_d, False)}
  <path id="flight-path" d="{flight_d}" stroke="none"/>
  <g id="pin-shadows">
{''.join(f'    <ellipse cx="{f(A(p)[0])}" cy="{f(A(p)[1] + 2)}" rx="17" ry="6" fill="#06204f" opacity="0.45"/>' + chr(10) for p in (PIN1, P2))}  </g>
{pin('pin-1', PIN1)}
{pin('pin-2', P2)}
{plane}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/globetrotter/globetrotter-badge.svg', 'w').write(svg)
def fdist(p): return math.hypot(GX + p[0] - MC[0], GY + p[1] - MC[1])
pl = []
for lx, ly in [(-80, -90), (86, -20), (86, 20), (-80, 90), (82, 0)]:
    a = math.radians(REST_ANG); x, y = lx * PLANE_S, ly * PLANE_S
    pl.append(fdist((REST[0] + x * math.cos(a) - y * math.sin(a), REST[1] + x * math.sin(a) + y * math.cos(a))))
print('plane max dist from medal centre', round(max(pl)), 'pins', [round(fdist((p[0] + s_, p[1] - PIN_H))) for p in (PIN1, P2) for s_ in (-34, 34)], 'orbit ends', round(fdist(orb(0))), round(fdist(orb(180))))
print('globe centre', round(GX, 1), round(GY, 1), 'dashes', n_d, 'rest angle', round(REST_ANG, 1))
