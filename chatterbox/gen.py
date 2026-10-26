"""Chatterbox badge (laughing speech bubble + typing bubble). Writes chatterbox-badge.svg.

Corrections vs the AI reference:
  * each bubble + tail is ONE continuous path; the tail leaves the outline with matching tangents
  * the purple bubble overlaps the yellow one cleanly, separated by its own dark outline
  * the face is centred in the yellow bubble and symmetric (the reference mouth is tilted / off-centre)
  * the three typing dots are evenly spaced and centred in the purple bubble
  * the whole pair (+ burst dashes) is centred on the medal (420, 412)
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['green']
MC = (420, 412)
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
OUT = '#08200f'          # dark outline around the bubbles
OW = 22                  # outline stroke width (half of it shows outside the shape)
DEPTH = (5, 12)


def P(c, rx, ry, a):
    a = math.radians(a)
    return (c[0] + rx * math.cos(a), c[1] + ry * math.sin(a))


def tang(rx, ry, a):
    a = math.radians(a)
    x, y = -rx * math.sin(a), ry * math.cos(a)
    n = math.hypot(x, y)
    return (x / n, y / n)


def bubble(c, rx, ry, A, B, tip, l1=34, l2=34, k1=0.42, k2=0.42, rt=7):
    """Ellipse + tail as one closed path. Arc runs from angle A all the way round (increasing angle)
    to angle B; the tail leaves at B and comes back in at A with the ellipse's own tangents, so the
    tail flows out of the outline. The tail ends in a small rounded tip (radius rt)."""
    pa, pb = P(c, rx, ry, A), P(c, rx, ry, B)
    da, db = tang(rx, ry, A), tang(rx, ry, B)
    m = ((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2)
    ux, uy = tip[0] - m[0], tip[1] - m[1]; n = math.hypot(ux, uy); ux, uy = ux / n, uy / n
    nx, ny = -uy, ux
    tb, ta = (tip[0] + nx * rt, tip[1] + ny * rt), (tip[0] - nx * rt, tip[1] - ny * rt)
    if math.dist(tb, pb) > math.dist(ta, pb): tb, ta = ta, tb
    tq = (tip[0] + ux * rt * 1.6, tip[1] + uy * rt * 1.6)
    c1 = (pb[0] + db[0] * l1, pb[1] + db[1] * l1)
    c4 = (pa[0] - da[0] * l2, pa[1] - da[1] * l2)
    c2 = (tb[0] + (pb[0] - tb[0]) * k1 * 0.5, tb[1] + (pb[1] - tb[1]) * k1)
    c3 = (ta[0] + (pa[0] - ta[0]) * k2, ta[1] + (pa[1] - ta[1]) * k2 * 0.5)
    pts = [pa, pb, c1, c2, tip, c3, c4]
    d = (f"M {f(pa[0])} {f(pa[1])} A {rx} {ry} 0 1 1 {f(pb[0])} {f(pb[1])} "
         f"C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(tb[0])} {f(tb[1])} "
         f"Q {f(tq[0])} {f(tq[1])} {f(ta[0])} {f(ta[1])} "
         f"C {f(c3[0])} {f(c3[1])} {f(c4[0])} {f(c4[1])} {f(pa[0])} {f(pa[1])} Z")
    return d, pts


# ---------------- layout (relative), then centred on the medal ----------------
Y = dict(c=(0, 0), rx=176, ry=150)
Pp = dict(c=(198, 118), rx=122, ry=103)
Y_tip = (-160, 204)
P_tip = (Pp['c'][0] - 150, Pp['c'][1] + 88)
# burst dashes: three fan out from the yellow bubble's upper right, two drop below between the tails
BURST_UP = [(-70, 190, 238), (-45, 198, 246), (-20, 204, 250)]
LOW_O = (6, 122)
BURST_LOW = [(116, 102, 146), (84, 104, 148)]


def all_points(dx, dy):
    pts = []
    for a in range(0, 360, 5):
        pts.append(P(Y['c'], Y['rx'] + OW / 2, Y['ry'] + OW / 2, a))
        q = P(Pp['c'], Pp['rx'] + OW / 2, Pp['ry'] + OW / 2, a); pts.append((q[0] + DEPTH[0], q[1] + DEPTH[1]))
        pts.append(q)
    pts += [(Y_tip[0] - 10, Y_tip[1] + 12), (P_tip[0] - 12, P_tip[1])]
    for a, r0, r1 in BURST_UP:
        pts.append(P(Y['c'], r1 + 8, r1 + 8, a))
    for a, r0, r1 in BURST_LOW:
        pts.append(P(LOW_O, r1 + 8, r1 + 8, a))
    return [(x + dx, y + dy) for x, y in pts]


pts = all_points(0, 0)
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
DX, DY = MC[0] - (minx + maxx) / 2, MC[1] - (miny + maxy) / 2
sh = lambda p: (p[0] + DX, p[1] + DY)
Yc, Pc = sh(Y['c']), sh(Pp['c'])
Ytip, Ptip = sh(Y_tip), sh(P_tip)
LOWo = sh(LOW_O)

y_d, y_pts = bubble(Yc, Y['rx'], Y['ry'], 140, 102, Ytip, l1=26, l2=22, k1=0.5, k2=0.5, rt=8)
p_d, p_pts = bubble(Pc, Pp['rx'], Pp['ry'], 160, 120, Ptip, l1=18, l2=16, k1=0.5, k2=0.5, rt=7)


def body(name, d, clip, grad, depth_col, shade_col):
    dx, dy = DEPTH
    return f'''    <g id="{name}-body">
      <path d="{d}" fill="{OUT}" stroke="{OUT}" stroke-width="{OW}" stroke-linejoin="round" transform="translate({dx} {dy})"/>
      <path d="{d}" fill="{OUT}" stroke="{OUT}" stroke-width="{OW}" stroke-linejoin="round"/>
      <path d="{d}" fill="{depth_col}" transform="translate({dx} {dy})"/>
      <g clip-path="url(#{clip})">
        <path d="{d}" fill="{shade_col}"/>
        <path d="{d}" fill="url(#{grad})" transform="translate(-7 -11)"/>
      </g>
    </g>'''


# ---------------- yellow bubble + face ----------------
cx, cy = Yc
FY = cy - 4                       # face centre line
EX, EY = 56, FY - 50              # eye offset / eye height
def eye_open(x):
    return (f'<ellipse cx="{f(x)}" cy="{f(EY)}" rx="15" ry="20" fill="#4a0b1c"/>'
            f'<circle cx="{f(x + 4)}" cy="{f(EY - 8)}" r="5.5" fill="#fffbe8"/>')
def eye_happy(x):
    return f'<path d="M {f(x - 20)} {f(EY + 8)} Q {f(x)} {f(EY - 24)} {f(x + 20)} {f(EY + 8)}" stroke="#4a0b1c" stroke-width="13" stroke-linecap="round"/>'

MT, MW, MH = FY - 2, 80, 92        # laughing mouth: top line y, half width, depth
mouth_d = (f"M {f(cx - MW)} {f(MT + 4)} Q {f(cx)} {f(MT - 10)} {f(cx + MW)} {f(MT + 4)} "
           f"C {f(cx + MW + 2)} {f(MT + 62)} {f(cx + 44)} {f(MT + MH)} {f(cx)} {f(MT + MH)} "
           f"C {f(cx - 44)} {f(MT + MH)} {f(cx - MW - 2)} {f(MT + 62)} {f(cx - MW)} {f(MT + 4)} Z")
yellow = f'''  <g id="bubble-yellow">
{body('bubble-yellow', y_d, 'clip-yellow', 'yellow-fill', '#e9820c', '#f7a816')}
    <ellipse cx="{f(cx - 92)}" cy="{f(cy - 62)}" rx="44" ry="26" fill="#fffbd6" opacity="0.85" transform="rotate(-38 {f(cx - 92)} {f(cy - 62)})"/>
    <circle cx="{f(cx - 128)}" cy="{f(cy - 4)}" r="9" fill="#fffbd6" opacity="0.8"/>
    <path d="M {f(cx - 70)} {f(cy - 118)} A 150 128 0 0 1 {f(cx + 30)} {f(cy - 136)}" stroke="#fffbd6" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
    <g id="face">
      <ellipse cx="{f(cx - 104)}" cy="{f(FY + 18)}" rx="20" ry="12" fill="#ff8a6a" opacity="0.55"/>
      <ellipse cx="{f(cx + 104)}" cy="{f(FY + 18)}" rx="20" ry="12" fill="#ff8a6a" opacity="0.55"/>
      <g id="eyes-open" opacity="0">{eye_open(cx - EX)}{eye_open(cx + EX)}</g>
      <g id="eyes-happy">{eye_happy(cx - EX)}{eye_happy(cx + EX)}</g>
      <path id="mouth-smile" opacity="0" d="M {f(cx - 40)} {f(MT + 18)} Q {f(cx)} {f(MT + 50)} {f(cx + 40)} {f(MT + 18)}" stroke="#4a0b1c" stroke-width="12" stroke-linecap="round"/>
      <g id="mouth-laugh">
        <path d="{mouth_d}" fill="#5a0d1e" stroke="#4a0b1c" stroke-width="6" stroke-linejoin="round"/>
        <g clip-path="url(#clip-mouth)">
          <ellipse cx="{f(cx)}" cy="{f(MT + MH + 8)}" rx="56" ry="44" fill="#ff5a78"/>
          <ellipse cx="{f(cx)}" cy="{f(MT + MH + 2)}" rx="38" ry="30" fill="#ff7f96"/>
        </g>
        <path d="M {f(cx - MW + 16)} {f(MT + 4)} Q {f(cx)} {f(MT - 4)} {f(cx + MW - 16)} {f(MT + 4)}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.2"/>
      </g>
    </g>
  </g>'''

# ---------------- purple bubble + typing dots ----------------
px, py = Pc
DS = 46
dots = '\n'.join(f'''        <g id="dot-{i + 1}">
          <circle cx="{f(px + (i - 1) * DS)}" cy="{f(py + 2)}" r="19" fill="#46106e"/>
          <circle cx="{f(px + (i - 1) * DS - 6)}" cy="{f(py - 5)}" r="5.5" fill="#b48cf0" opacity="0.9"/>
        </g>''' for i in range(3))
purple = f'''  <g id="bubble-purple">
{body('bubble-purple', p_d, 'clip-purple', 'purple-fill', '#7a3fd0', '#a46cf2')}
    <ellipse cx="{f(px - 58)}" cy="{f(py - 54)}" rx="30" ry="16" fill="#f4e8ff" opacity="0.85" transform="rotate(-32 {f(px - 58)} {f(py - 54)})"/>
    <path d="M {f(px - 20)} {f(py - 84)} A 104 88 0 0 1 {f(px + 54)} {f(py - 70)}" stroke="#f4e8ff" stroke-width="7" stroke-linecap="round" opacity="0.5"/>
    <g id="typing-dots">
{dots}
    </g>
  </g>'''

# ---------------- burst dashes ----------------
dashes = []
i = 1
for a, r0, r1 in BURST_UP:
    dashes.append('    ' + dash(Yc[0], Yc[1], a, r0, r1, w0=22, w1=9, name=f'dash-{i}', color='#ffd84a')); i += 1
for a, r0, r1 in BURST_LOW:
    dashes.append('    ' + dash(LOWo[0], LOWo[1], a, r0, r1, w0=20, w1=8, name=f'dash-{i}', color='#ffd84a')); i += 1
burst = '  <g id="burst">\n' + '\n'.join(dashes) + '\n  </g>'

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Chatterbox badge (laughing speech bubble + typing bubble), source artwork.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    bubble-yellow (pops from its tail tip, ha-ha squash/stretch), face, eyes-open / eyes-happy (swap when it laughs),
    mouth-smile / mouth-laugh (swap; the laugh opens from its top edge),
    bubble-purple (pops from its tail tip), typing-dots (dot-1..dot-3 bounce in a wave),
    burst (dash-1..dash-5 pop outward)
  The bubble pair + burst is centred on the medal (420, 412).
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <linearGradient id="yellow-fill" x1="0.2" y1="0" x2="0.6" y2="1"><stop stop-color="#fff27a"/><stop offset="0.45" stop-color="#ffd83a"/><stop offset="1" stop-color="#fdc21c"/></linearGradient>
  <linearGradient id="purple-fill" x1="0.2" y1="0" x2="0.6" y2="1"><stop stop-color="#e6cfff"/><stop offset="0.45" stop-color="#c79bff"/><stop offset="1" stop-color="#b47ff8"/></linearGradient>
  <clipPath id="clip-yellow"><path d="{y_d}"/></clipPath>
  <clipPath id="clip-purple"><path d="{p_d}"/></clipPath>
  <clipPath id="clip-mouth"><path d="{mouth_d}"/></clipPath>
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}<g id="sparkles">
{star(210, 232, 27, 'star-1')}
{star(656, 372, 26, 'star-2')}
</g>
{burst}
{yellow}
{purple}
</g>
</svg>
'''
open('/Users/ariga/Documents/badges/chatterbox/chatterbox-badge.svg', 'w').write(svg)
print('shift', round(DX, 1), round(DY, 1), 'yellow', [round(v) for v in Yc], 'purple', [round(v) for v in Pc],
      'ytip', [round(v) for v in Ytip], 'ptip', [round(v) for v in Ptip])
