"""Shared badge parts: themed medal + ribbons (blue / red / green), stars, burst dashes.

Every badge in the set uses an 840 x 960 canvas with the medal centred at (420, 412), r = 392.
The icon inside should sit centred on (420, 412) and stay mostly inside the inner face (r ~ 306).

Usage in a generator:
    import sys; sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
    from medal import THEMES, defs, ribbons, medal, star, dash
    t = THEMES['red']
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
    <defs>{defs(t)} ...your gradients... </defs>
    <g id="badge">
    {ribbons(t)}{medal(t)}
    ... your icon groups (named layers) ...
    </g></svg>'''
"""
import math

f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')

THEMES = {
    'blue': dict(outline='#14074f', ring0='#1d8bfe', ring1='#006bfd', rim='#0721b5', hi='#67f8fd', hi2='#96f7fc',
                 face0='#231277', face1='#14074f', sheen='#2a1a8f',
                 rib_out='#170a66', rib_light='#14c6ff', rib_mid='#1a7ff6', rib_dark='#3a3ff0'),
    'red': dict(outline='#4a0618', ring0='#ff5a52', ring1='#e8232f', rim='#a3101f', hi='#ffb3a8', hi2='#ffd0c8',
                face0='#7a0c33', face1='#45061e', sheen='#8f1a45',
                rib_out='#4a0618', rib_light='#ff7a70', rib_mid='#f0303a', rib_dark='#b8142a'),
    'green': dict(outline='#0b3d12', ring0='#56e84a', ring1='#22b52a', rim='#13852a', hi='#c4ff9e', hi2='#e2ffcc',
                  face0='#1a6a2e', face1='#0b3a1a', sheen='#2a7a3e',
                  rib_out='#0b3d12', rib_light='#8af27a', rib_mid='#34c83a', rib_dark='#1c9a2a'),
}

RIB_L = ["M249.055 661.876L406.663 701.218L324.916 916.46L266.057 857.608L169.413 853.127L249.055 661.876Z",
         "M258.775 687.908L381.415 718.179L324.199 867.632L275.297 821.658L205.941 817.822L258.775 687.908Z",
         "M249.055 661.878L406.663 701.22L390.014 738.941L235.669 704.22L249.055 661.878Z"]
RIB_R = ["M629.245 661.394L472.176 702.836L556.789 916.969L614.858 857.336L711.433 851.566L629.245 661.394Z",
         "M619.873 687.552L497.648 719.457L556.854 868.134L605.138 821.511L674.437 816.749L619.873 687.552Z",
         "M629.245 661.394L472.176 702.836L489.327 740.331L643.195 703.554L629.245 661.394Z"]


def defs(t):
    """Gradients/filters the medal + stars use. Put inside <defs>."""
    return f'''
  <linearGradient id="ring-fill" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="{t['ring0']}"/><stop offset="0.5" stop-color="{t['ring1']}"/><stop offset="1" stop-color="{t['ring0']}"/></linearGradient>
  <radialGradient id="inner-fill" cx="0.4" cy="0.3" r="0.8"><stop stop-color="{t['face0']}"/><stop offset="1" stop-color="{t['face1']}"/></radialGradient>
  <linearGradient id="gold-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef058"/><stop offset="1" stop-color="#fccb12"/></linearGradient>
  <linearGradient id="gold-deep" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#fee05a"/><stop offset="0.6" stop-color="#fcc513"/><stop offset="1" stop-color="#f59204"/></linearGradient>
  <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>'''


def ribbons(t):
    def one(name, paths):
        a, b, c = paths
        return f'''<g id="{name}">
<path d="{a}" fill="{t['rib_out']}" stroke="{t['rib_out']}" stroke-width="54" stroke-linejoin="round"/>
<path d="{a}" fill="{t['rib_light']}"/>
<path d="{b}" fill="{t['rib_mid']}"/>
<path d="{c}" fill="{t['rib_dark']}"/>
</g>
'''
    return one('ribbon-left', RIB_L) + one('ribbon-right', RIB_R)


def medal(t):
    return f'''<g id="medal">
<circle id="medal-outline" cx="420" cy="412" r="392" fill="{t['outline']}"/>
<circle cx="420" cy="412" r="362" fill="url(#ring-fill)"/>
<circle cx="420" cy="422" r="350" stroke="{t['rim']}" stroke-width="12" opacity="0.35"/>
<path d="M 98 330 A 330 330 0 0 1 380 84" stroke="{t['hi']}" stroke-width="16" stroke-linecap="round"/>
<path d="M 446 82 A 330 330 0 0 1 572 112" stroke="{t['hi2']}" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
<path d="M 128 520 A 300 300 0 0 0 176 600" stroke="{t['hi']}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
<circle cx="420" cy="412" r="314" fill="{t['rim']}"/>
<circle cx="420" cy="412" r="306" fill="url(#inner-fill)"/>
<ellipse cx="330" cy="200" rx="120" ry="34" fill="{t['sheen']}" opacity="0.45" transform="rotate(-12 330 200)"/>
</g>
'''


def star(x, y, s, name):
    """Glowing gold 4-point star (a named group, so it can be animated)."""
    k = 0.2
    d = (f"M 0 {-s} C {s*k} {-s*k} {s*k} {-s*k} {s} 0 C {s*k} {s*k} {s*k} {s*k} 0 {s} "
         f"C {-s*k} {s*k} {-s*k} {s*k} {-s} 0 C {-s*k} {-s*k} {-s*k} {-s*k} 0 {-s} Z")
    return f'''    <g id="{name}" transform="translate({x} {y})">
      <path d="{d}" fill="#f59204" opacity="0.5" filter="url(#star-glow)"/>
      <path d="{d}" fill="url(#gold-fill)" stroke="#f59204" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="{f(-s*0.12)}" cy="{f(-s*0.3)}" rx="{f(s*0.07)}" ry="{f(s*0.16)}" fill="#fefde4" opacity="0.9"/>
    </g>'''


def dash(cx, cy, angle_deg, r0, r1, w0=14, w1=6, name=None, color='#ffc83a'):
    """A tapered 'burst' dash pointing outward from (cx, cy) at angle, from radius r0 to r1 (the little
    yellow tick marks around icons). Wide at the outer end like the references."""
    a = math.radians(angle_deg)
    ux, uy, nx, ny = math.cos(a), math.sin(a), -math.sin(a), math.cos(a)
    p = lambda r, w: (cx + ux * r + nx * w / 2, cy + uy * r + ny * w / 2)
    q = lambda r, w: (cx + ux * r - nx * w / 2, cy + uy * r - ny * w / 2)
    pts = [p(r0, w1), p(r1, w0), q(r1, w0), q(r0, w1)]
    d = 'M ' + ' L '.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'
    gid = f' id="{name}"' if name else ''
    return f'<path{gid} d="{d}" fill="{color}" stroke="{color}" stroke-width="6" stroke-linejoin="round"/>'
