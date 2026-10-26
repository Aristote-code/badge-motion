import re, math
comp = open('/Users/ariga/Documents/badges/compass/compass-badge.svg').read()
def group(name):
    m = re.search(r'<g id="%s">.*?\n</g>\n' % re.escape(name), comp, re.S)
    return m.group(0)
ribbons = group('ribbon-left') + group('ribbon-right')
medal = group('medal')
# inner disk: purple gradient + soft rim instead of flat navy
medal = medal.replace('fill="#170A66"/>\n</g>', 'fill="url(#inner-fill)"/>\n<path id="inner-rim" d="M420 712C585.685 712 720 577.685 720 412C720 246.315 585.685 112 420 112C254.315 112 120 246.315 120 412C120 577.685 254.315 712 420 712Z" stroke="#8F9BFF" stroke-width="6" opacity="0.7"/>\n</g>')
medal = medal.replace('fill="url(#paint0_linear_3208_771)"', 'fill="url(#ring-fill)"')
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')

# --- abacus, drawn in local space (centre 0,0), placed with rotate(12) ---
AC, AR = (408, 446), 12
rows = [('red', '#f23a2e', '#c71b24', '#ff8f80', -95, [-112, -40, 32]),
        ('blue', '#1e9bff', '#1d63ee', '#8af2ff', 0, [-122, -50, 22]),
        ('yellow', '#ffc21f', '#e88400', '#fff0a0', 95, [-132, -60, 12])]
def bead(i, j, c, dark, hi, x, y):
    return f'''      <g id="bead-{i}-{j}" transform="translate({x} {y})">
        <ellipse cx="3" cy="5" rx="37" ry="44" fill="{dark}"/>
        <ellipse rx="36" ry="43" fill="{c}"/>
        <path d="M -36 0 A 36 43 0 0 0 36 0 A 36 18 0 0 1 -36 0 Z" fill="{dark}" opacity="0.45"/>
        <ellipse cx="-12" cy="-20" rx="13" ry="9" fill="{hi}" transform="rotate(-25 -12 -20)"/>
        <ellipse cx="18" cy="-26" rx="4" ry="3" fill="#ffffff" opacity="0.7"/>
      </g>'''
rod_rows = []
for i, (name, c, dark, hi, y, xs) in enumerate(rows, 1):
    beads = '\n'.join(bead(i, j, c, dark, hi, x, y) for j, x in enumerate(xs, 1))
    rod_rows.append(f'''    <g id="row-{i}">
{beads}
    </g>''')
rods = '\n'.join(f'      <rect x="-190" y="{y - 7}" width="380" height="14" rx="7" fill="#f6dcae"/><rect x="-190" y="{y + 2}" width="380" height="5" rx="2.5" fill="#d9a35e"/>' for *_, y, _xs in rows)

def star(x, y, s, name):
    k = 0.18
    d = f"M 0 {-s} C {s*k} {-s*k} {s*k} {-s*k} {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} C {-s*k} {s*k} {-s*k} {s*k} {-s} 0 C {-s*k} {-s*k} {-s*k} {-s*k} 0 {-s} Z"
    return f'    <path id="{name}" transform="translate({x} {y})" d="{d}" fill="#ffc83a"/>'

def sign(name, x, y, r, c, dark, hi, glyph):
    return f'''  <g id="{name}" transform="translate({x} {y})">
    <circle cx="6" cy="8" r="{r}" fill="#170a66" opacity="0.35"/>
    <circle r="{r}" fill="{dark}"/>
    <circle cx="-4" cy="-5" r="{r - 6}" fill="{c}"/>
    <ellipse cx="{-r*0.38}" cy="{-r*0.5}" rx="{r*0.28}" ry="{r*0.15}" fill="{hi}" transform="rotate(-35 {-r*0.38} {-r*0.5})"/>
    <path d="{glyph}" stroke="#ffffff" stroke-width="22" stroke-linecap="round"/>
  </g>'''

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Abacus badge, source artwork. Same workflow as the rocket and compass badges.
  Layer names the animation uses:
    badge, medal (centre + shine mask), ribbon-left, ribbon-right, abacus (frame pops in),
    row-1, row-2, row-3 (their bead-* children slide in along the rod, one by one),
    plus, minus (pop in), sparkles (star-1..3 burst and twinkle)
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>
  <linearGradient id="ring-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1b7ff7"/><stop offset="1" stop-color="#1e9bff"/></linearGradient>
  <linearGradient id="inner-fill" x1="0.15" y1="0.1" x2="0.85" y2="0.95"><stop stop-color="#3a22c8"/><stop offset="0.55" stop-color="#211092"/><stop offset="1" stop-color="#170a66"/></linearGradient>
  <linearGradient id="frame-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd84a"/><stop offset="1" stop-color="#ffb81a"/></linearGradient>
  <clipPath id="clip-inner"><circle cx="420" cy="412" r="300"/></clipPath>
</defs>
<g id="badge">
{ribbons}{medal}<g id="sheen" clip-path="url(#clip-inner)" opacity="0.18">
  <path d="M 150 520 L 560 110 L 640 150 L 230 600 Z" fill="#8f9bff"/>
  <path d="M 260 660 L 700 230 L 730 260 L 300 690 Z" fill="#8f9bff" opacity="0.6"/>
</g>
<g id="sparkles">
{star(472, 196, 34, 'star-1')}
{star(168, 420, 30, 'star-2')}
{star(694, 362, 25, 'star-3')}
</g>
<g id="abacus" transform="translate({AC[0]} {AC[1]}) rotate({AR})">
  <g id="frame-back">
    <rect x="-218" y="-208" width="44" height="420" rx="12" fill="#e88400"/>
    <rect x="182" y="-208" width="44" height="420" rx="12" fill="#e88400"/>
    <rect x="-218" y="-208" width="444" height="40" rx="12" fill="#e88400"/>
  </g>
  <g id="rods">
{rods}
  </g>
{chr(10).join(rod_rows)}
  <g id="frame">
    <rect x="-226" y="-216" width="44" height="420" rx="12" fill="url(#frame-fill)"/>
    <rect x="174" y="-216" width="44" height="420" rx="12" fill="url(#frame-fill)"/>
    <rect x="-226" y="-216" width="444" height="40" rx="12" fill="url(#frame-fill)"/>
    <rect x="-258" y="168" width="490" height="54" rx="14" fill="#e88400"/>
    <rect x="-262" y="160" width="490" height="50" rx="14" fill="url(#frame-fill)"/>
    <path d="M -212 -200 L -212 150" stroke="#ffe680" stroke-width="8" stroke-linecap="round"/>
    <path d="M -170 -204 L 200 -204" stroke="#ffe680" stroke-width="7" stroke-linecap="round"/>
    <path d="M -244 172 L 210 172" stroke="#ffe680" stroke-width="7" stroke-linecap="round"/>
  </g>
</g>
{sign('plus', 222, 268, 84, '#f23a2e', '#c71b24', '#ff8f80', 'M -30 0 H 30 M 0 -30 V 30')}
{sign('minus', 664, 486, 80, '#1e9bff', '#1d63ee', '#8af2ff', 'M -30 0 H 30')}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/abacus/abacus-badge.svg', 'w').write(svg)
print(len(svg))
