import re, math
comp = open('/Users/ariga/Documents/badges/compass/compass-badge.svg').read()
def group(name):
    return re.search(r'<g id="%s">.*?\n</g>\n' % re.escape(name), comp, re.S).group(0)
ribbons = group('ribbon-left') + group('ribbon-right')
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)
NAVY = '#231277'

# ---------- medal: glossy ring, darker inner rim, deep navy face with a soft sheen ----------
medal = f'''<g id="medal">
<circle id="medal-outline" cx="420" cy="412" r="392" fill="#14074f"/>
<circle cx="420" cy="412" r="362" fill="url(#ring-fill)"/>
<circle cx="420" cy="422" r="350" stroke="#0721b5" stroke-width="12" opacity="0.35"/>
<path d="M 98 330 A 330 330 0 0 1 380 84" stroke="#67f8fd" stroke-width="16" stroke-linecap="round"/>
<path d="M 446 82 A 330 330 0 0 1 572 112" stroke="#96f7fc" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
<path d="M 128 520 A 300 300 0 0 0 176 600" stroke="#67f8fd" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
<circle cx="420" cy="412" r="314" fill="#0721b5"/>
<circle cx="420" cy="412" r="306" fill="url(#inner-fill)"/>
<ellipse cx="300" cy="250" rx="150" ry="70" fill="#2a1a8f" opacity="0.45" transform="rotate(-30 300 250)"/>
<ellipse cx="560" cy="620" rx="120" ry="40" fill="#2a1a8f" opacity="0.25" transform="rotate(-30 560 620)"/>
</g>
'''

def rot(p, a):
    a = math.radians(a); return (p[0] * math.cos(a) - p[1] * math.sin(a), p[0] * math.sin(a) + p[1] * math.cos(a))

# ---------- ruler (local: centre 0,0; long axis x; tick edge on top) ----------
RL, RW, RA = 560, 118, -41.5
# ---------- protractor (local: middle of straight edge; arc above) ----------
R, r, h, PA = 236, 104, 78, 8.5
# relative arrangement (ruler crossing over the protractor's left end)
ruler_pos, pro_pos = (0, 0), (92, 226)

# centre the pair as one group on the medal (bounding box incl. the 3D depth)
pts = []
for x in (-RL / 2, RL / 2):
    for y in (-RW / 2, RW / 2 + 18):
        q = rot((x, y), RA); pts.append((q[0] + ruler_pos[0], q[1] + ruler_pos[1]))
for i in range(0, 181, 5):
    a = math.radians(180 + i); q = rot((R * math.cos(a), R * math.sin(a)), PA); pts.append((q[0] + pro_pos[0], q[1] + pro_pos[1]))
for x in (-R, R):
    q = rot((x, 20), PA); pts.append((q[0] + pro_pos[0], q[1] + pro_pos[1]))
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
dx, dy = MC[0] - (minx + maxx) / 2, MC[1] - (miny + maxy) / 2
RX, RY = ruler_pos[0] + dx, ruler_pos[1] + dy
PX, PY = pro_pos[0] + dx, pro_pos[1] + dy

ticks = []
n = 27
for i in range(n):
    x = -RL / 2 + 72 + i * 17
    kind = 'L' if i % 4 == 0 else ('M' if i % 2 == 0 else 'S')
    ln = {'L': 42, 'M': 30, 'S': 19}[kind]
    ticks.append(f'      <path d="M {f(x)} {f(-RW/2 + 16)} V {f(-RW/2 + 16 + ln)}" stroke="{NAVY}" stroke-width="{7.5 if kind == "L" else 6.5}" stroke-linecap="round"/>')
ruler = f'''<g id="ruler" transform="translate({f(RX)} {f(RY)}) rotate({RA})">
    <rect x="{-RL/2 + 5}" y="{-RW/2 + 16}" width="{RL}" height="{RW}" rx="26" fill="#ce3b03"/>
    <rect x="{-RL/2 + 2}" y="{-RW/2 + 8}" width="{RL}" height="{RW}" rx="26" fill="#e26204"/>
    <rect id="ruler-body" x="{-RL/2}" y="{-RW/2}" width="{RL}" height="{RW}" rx="26" fill="url(#ruler-fill)"/>
    <rect x="{-RL/2 + 10}" y="{RW/2 - 20}" width="{RL - 20}" height="12" rx="6" fill="#f59204" opacity="0.55"/>
    <path d="M {-RL/2 + 30} {-RW/2 + 9} H {RL/2 - 96}" stroke="#fefaa5" stroke-width="7" stroke-linecap="round"/>
    <path d="M {RL/2 - 62} {-RW/2 + 12} H {RL/2 - 30}" stroke="#fefef5" stroke-width="12" stroke-linecap="round"/>
    <g id="ruler-ticks">
{chr(10).join(ticks)}
    </g>
    <g id="hole">
      <circle cx="{-RL/2 + 40}" cy="{RW/2 - 34}" r="22" fill="#e26204"/>
      <circle cx="{-RL/2 + 40}" cy="{RW/2 - 34}" r="15" fill="#14074f"/>
      <path d="M {-RL/2 + 28} {RW/2 - 44} A 15 15 0 0 1 {-RL/2 + 44} {RW/2 - 49}" stroke="#fefaa5" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    </g>
  </g>'''

outer = f"M {-R} 0 A {R} {R} 0 0 1 {R} 0 Z"
inner = f"M {-r} {-h} A {r} {r} 0 0 1 {r} {-h} Z"
arc_ticks = []
for i in range(19):
    a = math.radians(180 + i * 10)
    long = i % 3 == 0
    r1, r2 = R - 18, R - 18 - (36 if long else 20)
    arc_ticks.append(f'      <path d="M {f(r1*math.cos(a))} {f(r1*math.sin(a))} L {f(r2*math.cos(a))} {f(r2*math.sin(a))}" stroke="{NAVY}" stroke-width="{7.5 if long else 6.5}" stroke-linecap="round"/>')
edge_ticks = []
for i, x in enumerate(range(-176, 197, 21)):
    long = i % 4 == 0
    edge_ticks.append(f'      <path d="M {x} -16 V {-16 - (32 if long else 18)}" stroke="{NAVY}" stroke-width="{7 if long else 6}" stroke-linecap="round"/>')
gloss = []
for a0, a1 in [(196, 214), (222, 252), (262, 272)]:
    rr = r + 26
    p0 = (rr * math.cos(math.radians(a0)), -h + rr * math.sin(math.radians(a0)))
    p1 = (rr * math.cos(math.radians(a1)), -h + rr * math.sin(math.radians(a1)))
    gloss.append(f'    <path d="M {f(p0[0])} {f(p0[1])} A {rr} {rr} 0 0 1 {f(p1[0])} {f(p1[1])}" stroke="#96f7fc" stroke-width="9" stroke-linecap="round" opacity="0.85"/>')
protractor = f'''<g id="protractor" transform="translate({f(PX)} {f(PY)}) rotate({PA})">
    <path d="{outer} {inner}" transform="translate(5 20)" fill="#0721b5" fill-rule="evenodd" stroke="#0721b5" stroke-width="10" stroke-linejoin="round"/>
    <path d="{outer} {inner}" transform="translate(2 10)" fill="#014eee" fill-rule="evenodd" stroke="#014eee" stroke-width="10" stroke-linejoin="round"/>
    <path id="protractor-body" d="{outer} {inner}" fill="url(#pro-fill)" fill-rule="evenodd" stroke="url(#pro-fill)" stroke-width="10" stroke-linejoin="round"/>
    <path d="{inner}" fill="none" stroke="#25f0fb" stroke-width="6" stroke-linejoin="round" opacity="0.9"/>
    <path d="M {-R + 24} -5 H {R - 24}" stroke="#96f7fc" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
{chr(10).join(gloss)}
    <g id="protractor-ticks">
{chr(10).join(arc_ticks)}
    </g>
    <g id="protractor-edge-ticks">
{chr(10).join(edge_ticks)}
    </g>
  </g>'''

def star(x, y, s, name):
    k = 0.2
    d = f"M 0 {-s} C {s*k} {-s*k} {s*k} {-s*k} {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} C {-s*k} {s*k} {-s*k} {s*k} {-s} 0 C {-s*k} {-s*k} {-s*k} {-s*k} 0 {-s} Z"
    return f'''    <g id="{name}" transform="translate({x} {y})">
      <path d="{d}" fill="#f59204" opacity="0.5" filter="url(#star-glow)"/>
      <path d="{d}" fill="url(#star-fill)" stroke="#f59204" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="{-s*0.12}" cy="{-s*0.3}" rx="{s*0.07}" ry="{s*0.16}" fill="#fefde4" opacity="0.9"/>
    </g>'''

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Measure badge (ruler + protractor), source artwork v2. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal (centre + shine mask), ribbon-left, ribbon-right,
    protractor (swings in), protractor-ticks + protractor-edge-ticks (each child ticks on in order),
    ruler (slides in along its length), ruler-body (glint mask), ruler-ticks (each child counts up in order),
    sparkles (star-1, star-2)
  The ruler + protractor pair is centred on the medal (420, 412).
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>
  <linearGradient id="ring-fill" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#1d8bfe"/><stop offset="0.5" stop-color="#006bfd"/><stop offset="1" stop-color="#1d8bfe"/></linearGradient>
  <radialGradient id="inner-fill" cx="0.4" cy="0.3" r="0.8"><stop stop-color="#231277"/><stop offset="1" stop-color="#14074f"/></radialGradient>
  <linearGradient id="ruler-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef058"/><stop offset="0.55" stop-color="#fde83f"/><stop offset="1" stop-color="#fccb12"/></linearGradient>
  <linearGradient id="pro-fill" x1="0.2" y1="0" x2="0.5" y2="1"><stop stop-color="#25f0fb"/><stop offset="0.5" stop-color="#0fc7fb"/><stop offset="1" stop-color="#1d8bfe"/></linearGradient>
  <linearGradient id="star-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef058"/><stop offset="1" stop-color="#fccb12"/></linearGradient>
  <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<g id="badge">
{ribbons}{medal}<g id="sparkles">
{star(236, 252, 42, 'star-1')}
{star(640, 330, 34, 'star-2')}
</g>
{protractor}
{ruler}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/measure/measure-badge.svg', 'w').write(svg)
print('pair bbox centre moved by', round(dx, 1), round(dy, 1), '→ ruler', round(RX), round(RY), 'protractor', round(PX), round(PY))
