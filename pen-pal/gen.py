"""Pen Pal badge: an opened envelope (seen from its flap side) with a letter rising out of the pocket.

Envelope anatomy (corrected vs the AI reference, which put a purple triangle on the front pocket):
  back panel (purple lining visible in the mouth) → top flap folded UP behind the letter (purple inner side)
  → letter (clipped so it only exists inside / above the pocket) → pocket = two side flaps + bottom flap (gold)
  → closed flap (gold outer side, heart seal) used only at the start of the animation.
"""
import sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import THEMES, defs, ribbons, medal, star, dash

t = THEMES['green']
f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
MC = (420, 412)
OUT = '#14301a'          # deep outline (dark green-black like the reference)

# ---------- envelope geometry (local: top edge centre = 0,0) ----------
W, H = 452, 278          # envelope body
R = 26                   # corner radius
FLAP_UP = 176            # open flap height (above the top edge)
FLAP_DN = 172            # closed flap reach (down over the pocket)
VY = 150                 # where the side flaps meet (mouth V apex)
BY = 120                 # bottom flap apex
LW, LH = 300, 292        # letter card
LTOP = -136              # letter top when fully out
SLIDE = 300              # how far the letter starts down inside the pocket
DEPTH = (3, 6)          # thin dark lip under the envelope, like the reference

# icon vertical extent: flap tip (incl. outline) .. bottom (+ depth)
top_y, bot_y = -FLAP_UP - 10, H + DEPTH[1] + 8
OX, OY = MC[0], MC[1] - (top_y + bot_y) / 2
G = lambda x, y: (OX + x, OY + y)   # local → canvas

L, Rr = -W / 2, W / 2


def heart_d(s):
    pts = [(0, .85), (-.45, .55), (-1, .2), (-1, -.3), (-1, -.7), (-.65, -.95), (-.35, -.95), (-.15, -.95), (0, -.82), (0, -.62),
           (0, -.82), (.15, -.95), (.35, -.95), (.65, -.95), (1, -.7), (1, -.3), (1, .2), (.45, .55), (0, .85)]
    P = [(x * s, (y + .05) * s) for x, y in pts]
    d = f"M {f(P[0][0])} {f(P[0][1])}"
    for i in range(1, len(P), 3):
        d += ' C ' + ' '.join(f"{f(x)} {f(y)}" for x, y in P[i:i + 3])
    return d + ' Z'


def heart(s, fill, deep, hi=True):
    return (f'<path d="{heart_d(s)}" transform="translate(2 4)" fill="{deep}" stroke="{deep}" stroke-width="{f(s*.18)}" stroke-linejoin="round"/>'
            f'<path d="{heart_d(s)}" fill="{fill}" stroke="{fill}" stroke-width="{f(s*.18)}" stroke-linejoin="round"/>'
            + (f'<ellipse cx="{f(-s*.48)}" cy="{f(-s*.42)}" rx="{f(s*.17)}" ry="{f(s*.11)}" transform="rotate(-35 {f(-s*.48)} {f(-s*.42)})" fill="#ffffff" opacity="0.85"/>' if hi else ''))


def rrect(x, y, w, h, r):
    return f'M {f(x + r)} {f(y)} H {f(x + w - r)} Q {f(x + w)} {f(y)} {f(x + w)} {f(y + r)} V {f(y + h - r)} Q {f(x + w)} {f(y + h)} {f(x + w - r)} {f(y + h)} H {f(x + r)} Q {f(x)} {f(y + h)} {f(x)} {f(y + h - r)} V {f(y + r)} Q {f(x)} {f(y)} {f(x + r)} {f(y)} Z'


body = rrect(L, 0, W, H, R)
# flap triangles (slightly inset at the hinge so the round join sits on the corners)
flap_up = f'M {f(L + 8)} 6 L 0 {-FLAP_UP} L {f(Rr - 8)} 6 Z'
flap_dn = f'M {f(L + 6)} 4 L 0 {FLAP_DN} L {f(Rr - 6)} 4 Z'
side_l = f'M {f(L + 4)} 6 L 0 {VY} L {f(L + 4)} {H - 6} Z'
side_r = f'M {f(Rr - 4)} 6 L 0 {VY} L {f(Rr - 4)} {H - 6} Z'
bottom = f'M {f(L + 8)} {H - 4} L 0 {BY} L {f(Rr - 8)} {H - 4} Z'

# letter text lines (stroked; animate with dasharray)
lines = [(-112, 112, 4), (-112, 92, 46), (-112, 40, 88)]   # x0, x1, y (relative to letter top + 96)
LINE_Y0 = LTOP + 112
line_paths = '\n'.join(
    f'          <path id="line-{i}" d="M {x0} {f(LINE_Y0 + y)} H {x1}" stroke="#c4b3c8" stroke-width="17" stroke-linecap="round"/>'
    for i, (x0, x1, y) in enumerate(lines, 1))
HEART_C = (0, LTOP + 66)

bursts = '\n'.join(dash(-LW / 2 + 4, LTOP + 6, a, 42, 92, 28, 11, name=f'burst-{i}', color='#ffd23a')
                   for i, a in enumerate((198, 232, 266), 1))

icon = f'''  <g id="burst" transform="translate({f(OX)} {f(OY)})">
{bursts}
  </g>
  <g id="envelope" transform="translate({f(OX)} {f(OY)})">
    <path d="{body}" transform="translate({DEPTH[0]} {DEPTH[1]})" fill="{OUT}" stroke="{OUT}" stroke-width="18" stroke-linejoin="round"/>
    <path d="{body}" fill="{OUT}" stroke="{OUT}" stroke-width="18" stroke-linejoin="round"/>
    <g id="envelope-back">
      <path d="{body}" fill="url(#lining-fill)"/>
    </g>
    <g id="flap-open">
      <path d="M {f(L + 8)} 6 L 0 {-FLAP_UP} L {f(Rr - 8)} 6" stroke="{OUT}" stroke-width="34" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="{flap_up}" fill="url(#flap-inner)" stroke="url(#flap-inner)" stroke-width="16" stroke-linejoin="round"/>
      <path d="M {f(-W * .27)} {f(-FLAP_UP * .38)} L {f(-W * .07)} {f(-FLAP_UP * .84)}" stroke="#d9c2ff" stroke-width="9" stroke-linecap="round" opacity="0.9"/>
      <path d="M {f(L + 30)} 4 H {f(Rr - 30)}" stroke="#6a35c8" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
    </g>
    <g clip-path="url(#clip-pocket)">
      <g id="letter">
        <rect x="{-LW/2 + 4}" y="{LTOP + 10}" width="{LW}" height="{LH}" rx="22" fill="{OUT}" opacity="0.35"/>
        <rect x="{-LW/2}" y="{LTOP}" width="{LW}" height="{LH}" rx="22" fill="url(#paper-fill)" stroke="{OUT}" stroke-width="10"/>
        <path d="M {-LW/2 + 26} {LTOP + 14} H {LW/2 - 70}" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
        <g id="letter-lines">
{line_paths}
        </g>
        <g id="heart" transform="translate({HEART_C[0]} {f(HEART_C[1])})">
          {heart(38, '#ff5a5f', '#c8303f')}
        </g>
      </g>
    </g>
    <g id="pocket">
     <g clip-path="url(#clip-body)">
      <path d="M {f(L + 4)} 6 L 0 {VY} L {f(Rr - 4)} 6" stroke="{OUT}" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="{side_l}" fill="url(#side-fill)" stroke="url(#side-fill)" stroke-width="14" stroke-linejoin="round"/>
      <path d="{side_r}" fill="url(#side-fill-r)" stroke="url(#side-fill-r)" stroke-width="14" stroke-linejoin="round"/>
      <path d="M {f(L + 14)} 18 L {f(-10)} {VY - 4}" stroke="#fff4a8" stroke-width="8" stroke-linecap="round" opacity="0.95"/>
      <path d="M {f(Rr - 14)} 18 L {f(10)} {VY - 4}" stroke="#fff4a8" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
      <path d="{bottom}" transform="translate(0 -6)" fill="#d86d05" stroke="#d86d05" stroke-width="14" stroke-linejoin="round" opacity="0.8"/>
      <path d="{bottom}" fill="url(#bottom-fill)" stroke="url(#bottom-fill)" stroke-width="14" stroke-linejoin="round"/>
      <path d="M {f(L + 30)} {H - 18} L {f(-14)} {BY + 14}" stroke="#fff4a8" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
      <path d="M {f(L + 34)} {H - 22} H {f(Rr - 34)}" stroke="#e98a06" stroke-width="7" stroke-linecap="round" opacity="0.5"/>
      <ellipse cx="{f(L + 26)}" cy="{f(H * .36)}" rx="9" ry="22" fill="#fffbe0" opacity="0.85"/>
      <circle cx="{f(L + 26)}" cy="{f(H * .36 + 36)}" r="6" fill="#fffbe0" opacity="0.7"/>
     </g>
    </g>
    <path d="M {f(L)} {R} V {H - R} Q {f(L)} {H} {f(L + R)} {H} H {f(Rr - R)} Q {f(Rr)} {H} {f(Rr)} {H - R} V {R}" stroke="{OUT}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
    <g id="flap-closed">
      <path d="{flap_dn}" transform="translate(0 7)" fill="#c25a04" stroke="#c25a04" stroke-width="16" stroke-linejoin="round" opacity="0.85"/>
      <path d="{flap_dn}" fill="url(#flap-outer)" stroke="url(#flap-outer)" stroke-width="16" stroke-linejoin="round"/>
      <path d="M {f(L + 32)} 14 L {f(-18)} {FLAP_DN - 22}" stroke="#fff4a8" stroke-width="8" stroke-linecap="round" opacity="0.9"/>
      <g id="seal" transform="translate(0 {FLAP_DN - 42})">
        <circle r="34" fill="#a3182c" transform="translate(2 4)"/>
        <circle r="34" fill="#e8344a"/>
        <circle r="26" stroke="#ff8f9b" stroke-width="4" opacity="0.7"/>
        {heart(13, '#ffd0d6', '#c8203a', hi=False)}
      </g>
    </g>
  </g>'''

sparkles = f'''<g id="sparkles">
{star(*G(W / 2 + 4, -96), 30, 'star-1')}
{star(*G(W / 2 + 42, 10), 18, 'star-2')}
</g>'''

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Pen Pal badge (open envelope + letter), source artwork. Same workflow as the other badges.
  Layer names the animation uses:
    badge, medal, ribbon-left, ribbon-right, sparkles (star-1, star-2),
    envelope (flies in and lands), envelope-back (purple lining), flap-open (inner/purple side, folded up behind the letter),
    flap-closed (outer/gold side, folded down over the pocket; flips up through 0 into flap-open), seal (heart seal on the closed flap),
    letter (slides up out of the pocket; its parent group clips it to the envelope), letter-lines (line-1.. write on left → right),
    heart (pops + beats), pocket (side flaps + bottom flap, in front of the letter; clipped to the envelope's rounded body so no flap corner pokes out), burst (burst-1.. pop + pulse)
  The envelope is centred on the medal (420, 412).
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>{defs(t)}
  <linearGradient id="lining-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6a30d0"/><stop offset="0.35" stop-color="#9a62f4"/><stop offset="1" stop-color="#8b52ec"/></linearGradient>
  <linearGradient id="flap-inner" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c39bff"/><stop offset="1" stop-color="#8d50f0"/></linearGradient>
  <linearGradient id="flap-outer" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fee45a"/><stop offset="1" stop-color="#fcc012"/></linearGradient>
  <linearGradient id="paper-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffaf0"/><stop offset="0.6" stop-color="#fdf1d8"/><stop offset="1" stop-color="#f6d9b4"/></linearGradient>
  <linearGradient id="side-fill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fdd64a"/><stop offset="1" stop-color="#f9b21c"/></linearGradient>
  <linearGradient id="side-fill-r" x1="1" y1="0" x2="0" y2="0"><stop stop-color="#f7a412"/><stop offset="1" stop-color="#f9b21c"/></linearGradient>
  <linearGradient id="bottom-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fed23a"/><stop offset="1" stop-color="#f9ad16"/></linearGradient>
  <clipPath id="clip-body"><path d="{body}"/></clipPath>
  <clipPath id="clip-pocket"><rect x="{f(L)}" y="-1000" width="{W}" height="{1000 + H - 12}"/></clipPath>
</defs>
<g id="badge">
{ribbons(t)}{medal(t)}{sparkles}
{icon}
</g>
</svg>
'''
import os
here = os.path.dirname(os.path.abspath(__file__))
# open-state artwork: flap-closed + seal are hidden in the static file (the animation shows them at the start)
svg = svg.replace('<g id="flap-closed">', '<g id="flap-closed" opacity="0">' if '--closed' not in sys.argv else '<g id="flap-closed">')
open(os.path.join(here, 'pen-pal-badge.svg'), 'w').write(svg)
print('icon origin', f(OX), f(OY), 'extent', top_y, bot_y)
