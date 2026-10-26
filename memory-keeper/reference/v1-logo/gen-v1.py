"""Memory Keeper badge: a purple hexagon with a stylised elephant head (elephants never forget).

Writes memory-keeper-badge.svg. Follows the user's reference (reference/memory-keeper-reference.svg): the elephant
curves are taken from the reference and mapped onto the badge canvas (scale K, ref hexagon centre → (420, 480)),
then split into parts that can move on their own:
  ear (behind the head, flat top), head (dome + flat face front + the tusk sweeping left under the mouth slit),
  trunk (one spiral: down from the face, round the bottom, up the right and curling in over the top; the dark "C"
  is the gap between the curled tip and the trunk), eye.
All parts share one userSpaceOnUse gradient so the seams between them are invisible.
Correction vs the reference: the ear's razor-sharp top-right corner (a crop artefact) is softened slightly.
"""
import re, sys, math
sys.path.insert(0, '/Users/ariga/Documents/badges/_kit')
from medal import star, dash

f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
OUT = '/Users/ariga/Documents/badges/memory-keeper/memory-keeper-badge.svg'
K = 0.72
RC = (626.5, 622)            # reference hexagon centre
C = (420, 480)               # badge centre on the 840 x 960 canvas (no ribbons → vertically centred)
X = lambda x: C[0] + (x - RC[0]) * K
Y = lambda y: C[1] + (y - RC[1]) * K


def ref(d):
    """map an absolute M/L/C/Q/Z path from reference coords onto the canvas"""
    out, nums = [], []
    for tok in re.findall(r'[MLCQZ]|-?\d+(?:\.\d+)?', d):
        if tok.isalpha():
            out.append(tok)
        else:
            nums.append(float(tok))
            if len(nums) == 2:
                out.append(f'{f(X(nums[0]))} {f(Y(nums[1]))}')
                nums = []
    return ' '.join(out)


# ---------------- hexagon frame ----------------
def hexagon(R, rx=1.0, r=40):
    """pointy-top rounded hexagon around C; R = circumradius (canvas px), rx stretches it horizontally"""
    pts = [(C[0] + R * rx * math.cos(math.radians(a)), C[1] + R * math.sin(math.radians(a))) for a in (-90, -30, 30, 90, 150, 210)]
    d = ''
    for i in range(6):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % 6]
        u = lambda a, b: ((b[0] - a[0]) / math.dist(a, b), (b[1] - a[1]) / math.dist(a, b))
        ua, ub = u(p1, p0), u(p1, p2)
        a = (p1[0] + ua[0] * r, p1[1] + ua[1] * r); b = (p1[0] + ub[0] * r, p1[1] + ub[1] * r)
        d += (f'M {f(a[0])} {f(a[1])}' if i == 0 else f' L {f(a[0])} {f(a[1])}') + f' Q {f(p1[0])} {f(p1[1])} {f(b[0])} {f(b[1])}'
    return d + ' Z'


RO = 548 * K                 # outer circumradius (reference: top vertex y 73 → bottom 1169)
SX = 1.015                   # the reference hexagon is a touch wider than regular
frame = f'''<g id="medal">
<path id="medal-outline" d="{hexagon(RO, SX, 44)}" fill="#3a1c69"/>
<path d="{hexagon(RO - 26, SX, 36)}" fill="url(#bevel-fill)"/>
<path d="{hexagon(RO - 58, SX, 30)}" fill="#3a1c69" opacity="0.55"/>
<path id="medal-face" d="{hexagon(RO - 64, SX, 28)}" fill="url(#face-fill)"/>
<path d="{hexagon(RO - 64, SX, 28)}" fill="url(#face-sheen)" clip-path="url(#clip-face)"/>
</g>'''

# ---------------- elephant (reference curves) ----------------
EAR = ('M 633.5 380 C 648.6 355.7 668.2 337.6 696.6 330.2 C 712.7 326 728.8 326.9 745.3 326.9 L 914 327 '
       'Q 930.2 327 930.2 343 L 930.1 508.4 C 930.1 522.7 930.5 537.7 928.5 551.9 C 923.6 586.5 908 618.7 883.8 644 '
       'C 851.9 676.8 811.5 690.7 766.6 690.6 C 712 690.5 674.3 683 629.8 650.6 C 619.1 642.8 608.8 632.4 600 622.6 L 590 520 Z')
HEAD = ('M 633.7 327 C 620.9 327 606.7 327.8 594.2 330.6 C 498 352.2 416.6 436 400.6 533.7 C 396.7 557.5 398.5 590.8 398.5 615.7 '
        'L 398.5 729 C 439.6 716.5 460.3 706.1 495.5 680 '
        'C 464.9 727.3 422.6 759.8 371.6 783 C 353.9 791.1 336.9 796.2 318.5 802 C 313.8 803.5 317.2 809.6 321.2 811.2 '
        'C 334.1 816.4 357 823.1 370.9 822.9 C 385 823 400.7 822.8 432.1 820.2 '
        'L 470 862 L 520 842 L 532 795 L 540 726 L 596 668 L 600.2 626.1 L 633.5 380 Z')   # hidden under the trunk: fills in behind it when it swings
TRUNK = ('M 600.2 626.1 C 602.4 642.5 610.4 661.4 619.8 675 C 566.7 689.1 538.5 740.1 547.3 793.2 '
         'C 552.1 813.6 561.5 830.3 578.3 843.3 C 598.4 858.8 632.2 861.4 648.6 839.2 '
         'C 634.5 842.3 617.6 843 604.9 835 C 576.3 817.2 573.4 776.7 589.3 749.8 C 599.8 731.9 617.2 719 637.5 714.2 '
         'C 669.5 706.2 705.3 717.6 725.9 743.4 C 733.5 752.9 742.6 766.8 745.6 778.7 C 750.8 791.3 752.6 808 752 821.5 '
         'C 750 867 724 907.6 684.1 929.3 C 641.2 952.7 587.9 952.7 543.4 933.9 C 510 920 469.8 884.3 432.1 820.2 '
         'L 470 790 L 543.5 734.7 L 602.2 659.4 Z')
EYE = (495.5, 548.6, 25.4)

ex, ey, er = X(EYE[0]), Y(EYE[1]), EYE[2] * K
elephant = f'''<g id="elephant">
  <g id="ear">
    <path d="{ref(EAR)}" fill="url(#ele-fill)"/>
    <path d="{ref('M 712 336 L 905 336')}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
  </g>
  <g id="trunk">
    <path d="{ref(TRUNK)}" fill="url(#ele-fill)"/>
  </g>
  <g id="head">
    <path d="{ref(HEAD)}" fill="url(#ele-fill)"/>
    <path d="{ref('M 418 540 C 434 452 498 384 580 352')}" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
  </g>
  <g id="eye">
    <circle cx="{f(ex)}" cy="{f(ey)}" r="{f(er)}" fill="#3a1c69"/>
    <circle cx="{f(ex - er * .3)}" cy="{f(ey - er * .32)}" r="{f(er * .26)}" fill="#ffffff" opacity="0.85"/>
  </g>
</g>'''

sparkles = '<g id="sparkles"></g>'      # the reference has no stars; the layer stays for the finale

svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Memory Keeper badge (purple hexagon + elephant head), source artwork (generated by gen.py).
  Layer names the animation uses:
    badge, medal (the hexagon frame; medal-outline = outer hexagon, medal-face = inner face),
    elephant (whole head), ear (behind the head; flaps about its root), head (dome + face + tusk),
    trunk (the spiral; swings / curls about where it leaves the face), eye (blinks), sparkles (empty; finale stars)
  Centre of the badge: (420, 480).
-->
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="960" viewBox="0 0 840 960" fill="none">
<defs>
  <linearGradient id="gold-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fef058"/><stop offset="1" stop-color="#fccb12"/></linearGradient>
  <linearGradient id="gold-deep" x1="0.2" y1="0" x2="0.8" y2="1"><stop stop-color="#fee05a"/><stop offset="0.6" stop-color="#fcc513"/><stop offset="1" stop-color="#f59204"/></linearGradient>
  <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <linearGradient id="bevel-fill" x1="0.15" y1="0.1" x2="0.85" y2="0.95"><stop stop-color="#c280f8"/><stop offset="0.45" stop-color="#8f49da"/><stop offset="1" stop-color="#7a35c6"/></linearGradient>
  <linearGradient id="face-fill" x1="0.3" y1="0" x2="0.7" y2="1"><stop stop-color="#6a37b4"/><stop offset="0.5" stop-color="#532a8c"/><stop offset="1" stop-color="#43206f"/></linearGradient>
  <linearGradient id="face-sheen" x1="0" y1="0.3" x2="1" y2="0.75"><stop stop-color="#ffffff" stop-opacity="0"/><stop offset="0.48" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.07"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  <linearGradient id="ele-fill" gradientUnits="userSpaceOnUse" x1="{f(X(400))}" y1="{f(Y(380))}" x2="{f(X(820))}" y2="{f(Y(940))}"><stop stop-color="#ffffff"/><stop offset="0.4" stop-color="#f8f2fe"/><stop offset="0.62" stop-color="#e9dafb"/><stop offset="1" stop-color="#dcc6f8"/></linearGradient>
  <clipPath id="clip-bevel-tl"><rect x="0" y="0" width="420" height="480"/></clipPath>
  <clipPath id="clip-face"><path d="{hexagon(RO - 64, SX, 28)}"/></clipPath>
</defs>
<g id="badge">
{frame}
{sparkles}
{elephant}
</g>
</svg>
'''
open(OUT, 'w').write(svg)
print('written', OUT)
