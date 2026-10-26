import re, math
comp = open('/Users/ariga/Documents/badges/compass/compass-badge.svg').read()
ribbons = ''.join(re.search(r'<g id="%s">.*?\n</g>\n' % n, comp, re.S).group(0) for n in ('ribbon-left', 'ribbon-right'))
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')

medal = '''<g id="medal">
<circle id="medal-outline" cx="420" cy="412" r="392" fill="#14074f"/>
<circle cx="420" cy="412" r="362" fill="url(#ring-fill)"/>
<circle cx="420" cy="422" r="350" stroke="#0721b5" stroke-width="12" opacity="0.35"/>
<path d="M 98 330 A 330 330 0 0 1 380 84" stroke="#67f8fd" stroke-width="16" stroke-linecap="round"/>
<path d="M 446 82 A 330 330 0 0 1 572 112" stroke="#96f7fc" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
<path d="M 128 520 A 300 300 0 0 0 176 600" stroke="#67f8fd" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
<circle cx="420" cy="412" r="314" fill="#0721b5"/>
<circle cx="420" cy="412" r="306" fill="url(#inner-fill)"/>
<ellipse cx="330" cy="200" rx="120" ry="34" fill="#2a1a8f" opacity="0.5" transform="rotate(-12 330 200)"/>
</g>
'''

# ---------------- chart ----------------
BASE_Y = 578
bars = [  # x, width, top, colours (face top, face bottom, side, cap)
    (200, 74, 488, '#36d4ff', '#1d8bfe', '#0b5fe0', '#8af2ff'),
    (296, 74, 380, '#ffc21f', '#ff7a12', '#e04a04', '#ffe680'),
    (392, 74, 300, '#4ff0a8', '#14c88a', '#0a9a6a', '#b6ffe0'),
]
def bar(i, x, w, top, c1, c2, side, cap, ids=True):
    gid = f' id="bar-{i}"' if ids else ''
    h = BASE_Y - top
    return f'''      <g{gid}>
        <rect x="{x + 8}" y="{top + 6}" width="{w}" height="{h - 6}" rx="12" fill="{side}"/>
        <rect x="{x}" y="{top}" width="{w}" height="{h}" rx="12" fill="url(#bar{i}-fill)"/>
        <rect x="{x + 8}" y="{top + 8}" width="{w - 16}" height="12" rx="6" fill="{cap}" opacity="0.9"/>
        <rect x="{x + 10}" y="{top + 28}" width="8" height="{max(10, h - 46)}" rx="4" fill="#ffffff" opacity="0.22"/>
      </g>'''

# rising trend line: starts low on the left, passes just above each bar top, ends at the target
nodes = [(166, 532), (237, 444), (333, 340), (429, 262), (526, 238), (612, 178)]
line_d = 'M ' + ' L '.join(f'{x} {y}' for x, y in nodes)
def node(i, x, y, ids=True):
    gid = f' id="node-{i}"' if ids else ''
    return f'      <g{gid} transform="translate({x} {y})"><circle r="15" fill="#0b5fe0"/><circle cx="-1.5" cy="-1.5" r="12" fill="#3ee4ff"/><circle cx="-5" cy="-5" r="4" fill="#d6fbff"/></g>'
tx, ty = nodes[-1]
def target(ids=True):
    i1 = ' id="target"' if ids else ''
    i2 = ' id="target-ring"' if ids else ''
    return f'''    <g{i1} transform="translate({tx} {ty})">
      <circle{i2} r="34" stroke="#ffc21f" stroke-width="9" fill="#ffc21f" fill-opacity="0.12"/>
      <circle r="18" fill="#e26204"/><circle cx="-2" cy="-2" r="15" fill="url(#gold-fill)"/><circle cx="-6" cy="-7" r="4.5" fill="#fff6c8"/>
    </g>'''

def graph(ids=True):
    I = lambda n: f' id="{n}"' if ids else ''
    return f'''  <g{I('graph')}>
    <g{I('chart')}>
      <rect{I('baseline')} x="164" y="{BASE_Y}" width="352" height="18" rx="9" fill="#1d8bfe"/>
      <g{I('bars')}>
{chr(10).join(bar(i, *b, ids=ids) for i, b in enumerate(bars, 1))}
      </g>
    </g>
    <g{I('line')}>
      <path{I('line-path')} d="{line_d}" stroke="#3ee4ff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <g{I('nodes')}>
{chr(10).join(node(i, x, y, ids) for i, (x, y) in enumerate(nodes[:-1], 1))}
      </g>
    </g>
{target(ids)}
  </g>'''

# ---------------- loupe (lens centre LC, handle down-right) ----------------
LC, RO, RI = (392, 372), 150, 118
Z = 1.32
ang = math.radians(45); ux, uy = math.cos(ang), math.sin(ang)
def along(d, off=0): return (LC[0] + ux * d - uy * off, LC[1] + uy * d + ux * off)
neck_a, neck_b = along(RO - 6), along(RO + 62)
grip_a, grip_b = along(RO + 98), along(RO + 196)
loupe = f'''  <g id="loupe">
    <path d="M {f(grip_a[0])} {f(grip_a[1])} L {f(grip_b[0])} {f(grip_b[1])}" stroke="#0721b5" stroke-width="80" stroke-linecap="round" transform="translate(4 9)"/>
    <path d="M {f(neck_a[0])} {f(neck_a[1])} L {f(neck_b[0])} {f(neck_b[1])}" stroke="#e26204" stroke-width="56" stroke-linecap="round"/>
    <path d="M {f(neck_a[0])} {f(neck_a[1])} L {f(neck_b[0])} {f(neck_b[1])}" stroke="url(#gold-fill)" stroke-width="44" stroke-linecap="round"/>
    <path d="M {f(along(RO + 50, -30)[0])} {f(along(RO + 50, -30)[1])} L {f(along(RO + 50, 30)[0])} {f(along(RO + 50, 30)[1])}" stroke="#e26204" stroke-width="10" stroke-linecap="round"/>
    <g id="handle">
      <path d="M {f(grip_a[0])} {f(grip_a[1])} L {f(grip_b[0])} {f(grip_b[1])}" stroke="#014eee" stroke-width="80" stroke-linecap="round"/>
      <path d="M {f(grip_a[0])} {f(grip_a[1])} L {f(grip_b[0])} {f(grip_b[1])}" stroke="url(#grip-fill)" stroke-width="66" stroke-linecap="round" transform="translate(-3 -4)"/>
      <path d="M {f(along(RO + 104, -18)[0])} {f(along(RO + 104, -18)[1])} L {f(along(RO + 176, -18)[0])} {f(along(RO + 176, -18)[1])}" stroke="#96f7fc" stroke-width="12" stroke-linecap="round" opacity="0.85"/>
    </g>
    <circle cx="{LC[0] + 5}" cy="{LC[1] + 10}" r="{RO}" fill="#c84f04"/>
    <circle id="lens" cx="{LC[0]}" cy="{LC[1]}" r="{RI}" fill="#14074f"/>
    <g id="lens-view" clip-path="url(#clip-lens)">
      <g transform="translate({LC[0]} {LC[1]}) scale({Z}) translate({-LC[0]} {-LC[1]})">
{graph(ids=False)}
      </g>
    </g>
    <g id="glass" clip-path="url(#clip-lens)">
      <circle cx="{LC[0]}" cy="{LC[1]}" r="{RI}" fill="#4a90f0" opacity="0.28"/>
      <circle cx="{LC[0]}" cy="{LC[1]}" r="{RI - 4}" stroke="#0721b5" stroke-width="10" opacity="0.6"/>
      <path d="M {LC[0] - 78} {LC[1] - 30} A 84 84 0 0 1 {LC[0] - 18} {LC[1] - 86}" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.75"/>
      <circle cx="{LC[0] - 84}" cy="{LC[1] - 4}" r="7" fill="#ffffff" opacity="0.7"/>
    </g>
    <circle cx="{LC[0]}" cy="{LC[1]}" r="{(RO + RI) / 2}" stroke="#e26204" stroke-width="{RO - RI + 4}"/>
    <circle cx="{LC[0]}" cy="{LC[1]}" r="{(RO + RI) / 2 - 2}" stroke="url(#ring-gold)" stroke-width="{RO - RI - 4}"/>
    <path d="M {LC[0] - 128} {LC[1] - 52} A 138 138 0 0 1 {LC[0] - 30} {LC[1] - 134}" stroke="#fff3a6" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
  </g>'''

def star(x, y, s, name):
    k = 0.2
    d = f"M 0 {-s} C {s*k} {-s*k} {s*k} {-s*k} {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} C {-s*k} {s*k} {-s*k} {s*k} {-s} 0 C {-s*k} {-s*k} {-s*k} {-s*k} 0 {-s} Z"
    return f'''    <g id="{name}" transform="translate({x} {y})">
      <path d="{d}" fill="#f59204" opacity="0.5" filter="url(#star-glow)"/>
      <path d="{d}" fill="url(#gold-fill)" stroke="#f59204" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="{-s*0.12}" cy="{-s*0.3}" rx="{s*0.07}" ry="{s*0.16}" fill="#fefde4" opacity="0.9"/>
    </g>'''

grads = ''.join(f'<linearGradient id="bar{i}-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{b[3]}"/><stop offset="1" stop-color="{b[4]}"/></linearGradient>' for i, b in enumerate(bars, 1))
svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Insight badge (chart + magnifier), source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    graph (everything the lens magnifies), baseline (draws left → right), bars (bar-1.. grow up from the baseline),
    line-path (draws node by node), nodes (node-1.. pop as the line reaches them), target (+ target-ring) at the end,
    loupe (flies in and probes), lens (the glass circle: centre + size of the magnified view), lens-view (replaced live)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>
  <linearGradient id="ring-fill" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#1d8bfe"/><stop offset="0.5" stop-color="#006bfd"/><stop offset="1" stop-color="#1d8bfe"/></linearGradient>
  <radialGradient id="inner-fill" cx="0.4" cy="0.3" r="0.8"><stop stop-color="#231277"/><stop offset="1" stop-color="#14074f"/></radialGradient>
  <linearGradient id="gold-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef058"/><stop offset="1" stop-color="#fccb12"/></linearGradient>
  <linearGradient id="ring-gold" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#fee05a"/><stop offset="0.6" stop-color="#fcc513"/><stop offset="1" stop-color="#f59204"/></linearGradient>
  <linearGradient id="grip-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#36d4ff"/><stop offset="1" stop-color="#1d8bfe"/></linearGradient>
  {grads}
  <clipPath id="clip-lens"><circle cx="{LC[0]}" cy="{LC[1]}" r="{RI}"/></clipPath>
  <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<g id="badge">
{ribbons}{medal}<g id="sparkles">
{star(196, 300, 36, 'star-1')}
{star(660, 452, 32, 'star-2')}
</g>
{graph()}
{loupe}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/insight/insight-badge.svg', 'w').write(svg)
print(len(svg))
