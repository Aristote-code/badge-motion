"""Hand-drawn baby elephant for the Memory Keeper badge (drawn from scratch, in reference coordinates).

Every part is a smooth closed curve through points measured off the user's reference (Catmull-Rom → cubic Béziers),
with flat cartoon shading: base colour, a darker shade shape, a light/gloss shape, and a dark outline underlay.
build() returns the elephant layer group; ids match what the animation uses.
"""
import math

f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
OL = '#140466'                       # outline navy (matches the frame)
BLUE, BLUE_L, BLUE_S, BLUE_D = '#9cc3fb', '#c4ddfd', '#6f9ff5', '#4a72e4'
GLOSS = '#f4fafc'
PINK, PINK_L, PINK_S = '#fb8cc0', '#ffc6dc', '#e04cb8'


def smooth(pts, closed=True, t=1.0):
    """Catmull-Rom spline through pts → SVG path (closed by default)"""
    n = len(pts)
    P = lambda i: pts[i % n] if closed else pts[max(0, min(n - 1, i))]
    d = f'M {f(pts[0][0])} {f(pts[0][1])}'
    for i in range(n if closed else n - 1):
        p0, p1, p2, p3 = P(i - 1), P(i), P(i + 1), P(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * t, p1[1] + (p2[1] - p0[1]) / 6 * t)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * t, p2[1] - (p3[1] - p1[1]) / 6 * t)
        d += f' C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}'
    return d + (' Z' if closed else '')


def fill(d, c, extra=''):
    return f'<path d="{d}" fill="{c}"{extra}/>'


def under(d, w=18):
    return f'<path d="{d}" fill="{OL}" stroke="{OL}" stroke-width="{w}" stroke-linejoin="round"/>'


def line(pts, c, w, op=1, closed=False):
    return f'<path d="{smooth(pts, closed)}" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="{op}"/>'


# ---------------- shapes (reference coordinates) ----------------
EAR_L = [(512, 470), (468, 432), (418, 416), (366, 420), (316, 442), (274, 482), (246, 542), (238, 612), (250, 690),
         (284, 758), (342, 800), (418, 813), (472, 807), (506, 788), (512, 640)]
EAR_L_PINK = [(505, 525), (468, 498), (418, 490), (366, 498), (318, 528), (286, 578), (274, 642), (286, 710), (324, 762),
              (380, 790), (440, 797), (494, 786), (508, 660)]
EAR_L_PINK_S = [(508, 520), (470, 512), (448, 590), (452, 680), (446, 760), (430, 800), (500, 790), (512, 660)]
EAR_L_PINK_L = [(330, 560), (360, 540), (380, 560), (370, 620), (345, 680), (318, 700), (305, 660), (312, 600)]

EAR_R = [(880, 450), (920, 412), (975, 398), (1030, 412), (1072, 452), (1098, 515), (1104, 600), (1092, 680), (1060, 742),
         (1008, 782), (948, 792), (893, 778), (870, 700)]
EAR_R_PINK = [(905, 478), (960, 452), (1018, 462), (1058, 500), (1080, 560), (1083, 630), (1068, 695), (1035, 742),
              (982, 766), (925, 762), (895, 700)]
EAR_R_PINK_L = [(1040, 520), (1062, 560), (1066, 620), (1052, 660), (1040, 610)]

HEAD = [(493, 610), (500, 528), (528, 470), (568, 434), (616, 412), (672, 401), (730, 405), (786, 424), (836, 456),
        (876, 500), (902, 556), (908, 622), (888, 688), (846, 738), (790, 770), (735, 792), (680, 806), (624, 806),
        (572, 795), (530, 770), (503, 734), (492, 682)]
HEAD_SHADE = [(505, 690), (540, 740), (590, 770), (650, 782), (700, 778), (760, 760), (820, 735), (870, 690), (888, 688),
              (846, 738), (790, 770), (735, 792), (680, 806), (624, 806), (572, 795), (532, 772), (507, 738)]
HEAD_GLOSS = [(560, 470), (600, 440), (650, 428), (680, 436), (660, 452), (612, 462), (578, 480)]
TUFT = [(622, 404), (610, 376), (618, 350), (642, 334), (672, 328), (696, 334), (706, 350), (696, 366), (676, 372),
        (662, 392)]
TUFT2 = [(694, 400), (704, 383), (725, 374), (748, 378), (758, 392), (740, 402)]

CHEEK_L = [(510, 700), (540, 728), (585, 742), (620, 735), (600, 760), (560, 762), (525, 745)]

TRUNK = [(700, 690), (735, 728), (790, 744), (850, 740), (912, 716), (962, 670), (992, 604), (1004, 528), (1001, 452),
         (986, 392), (956, 352), (920, 335), (884, 340), (861, 362), (858, 394), (872, 418), (896, 424), (912, 446),
         (914, 504), (906, 556), (886, 590), (850, 604), (800, 602), (756, 594), (722, 604), (698, 632)]
TRUNK_SHADE = [(840, 738), (905, 712), (958, 668), (988, 604), (1000, 528), (998, 452), (984, 396), (970, 420),
               (972, 520), (960, 606), (928, 666), (880, 704), (820, 726)]
TRUNK_GLOSS = [(902, 360), (930, 350), (962, 362), (954, 376), (928, 372), (908, 380)]
TIP_HOLE = [(866, 392), (874, 376), (888, 372), (898, 384), (896, 404), (884, 414), (870, 410)]
WRINKLES = [[(934, 458), (962, 468), (994, 460)], [(932, 506), (960, 518), (996, 512)], [(924, 556), (952, 572), (986, 572)],
            [(930, 640), (948, 664), (958, 690)], [(888, 676), (900, 700), (904, 724)]]

MOUTH = [(644, 704), (672, 716), (714, 730), (754, 746), (782, 764), (776, 794), (752, 818), (716, 830), (686, 822),
         (664, 792), (650, 750)]
TONGUE = [(662, 790), (680, 762), (716, 754), (752, 766), (770, 796), (750, 820), (716, 830), (686, 822)]

EYE_L = (626, 612, 46, 57)      # cx, cy, rx, ry (dark iris/pupil, cartoon style)
EYE_R = (824, 562, 33, 46)

PAW_L = [(438, 985), (436, 925), (452, 870), (494, 830), (556, 810), (618, 813), (664, 836), (694, 878), (702, 935),
         (698, 985)]
PAW_R = [(748, 962), (750, 900), (772, 848), (816, 815), (868, 815), (904, 846), (920, 896), (920, 958)]
CHEST = [(686, 842), (726, 836), (764, 846), (770, 975), (686, 980)]


def eye(name, cx, cy, rx, ry):
    """big shiny cartoon eye: navy iris with a lavender lid-shine across the top, a thin white sliver on the
    lower right, one big and one small highlight"""
    e = lambda dx, dy, sx, sy: smooth([(cx + dx + sx * math.cos(a), cy + dy + sy * math.sin(a)) for a in [i * math.pi / 8 for i in range(16)]])
    return (f'<g id="{name}">'
            + fill(e(2, 2, rx + 8, ry + 8), OL)
            + fill(e(5, 4, rx, ry), '#ffffff')
            + fill(e(-1, -1, rx, ry), OL)
            + f'<path d="{e(-rx * 0.1, -ry * 0.62, rx * 0.95, ry * 0.5)}" fill="#f2c4fb" opacity="0.85" clip-path="url(#clip-{name})"/>'
            + f'<path d="{e(-rx * 0.1, -ry * 0.25, rx * 0.95, ry * 0.5)}" fill="{OL}" clip-path="url(#clip-{name})"/>'
            + f'<circle cx="{f(cx + rx * 0.2)}" cy="{f(cy - ry * 0.22)}" r="{f(rx * 0.32)}" fill="#ffffff"/>'
            + f'<circle cx="{f(cx - rx * 0.34)}" cy="{f(cy + ry * 0.4)}" r="{f(rx * 0.11)}" fill="#ffffff" opacity="0.9"/>'
            + '</g>'), f'<clipPath id="clip-{name}"><path d="{e(-1, -1, rx, ry)}"/></clipPath>'


def paw(name, pts, nails, sole_y):
    d = smooth(pts)
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    out = f'<g id="{name}">' + under(d, 16) + fill(d, f'url(#{name}-fill)')
    # rounded shading: a darker crescent along the lower right, then the dark sole as a crescent under the toes
    cx, cy = (x0 + x1) / 2, sole_y - 60
    out += f'<ellipse cx="{f(cx + 40)}" cy="{f(cy + 70)}" rx="{f((x1 - x0) * 0.62)}" ry="90" fill="{BLUE_S}" opacity="0.55" clip-path="url(#clip-{name})"/>'
    out += f'<ellipse cx="{f(cx + 14)}" cy="{f(sole_y + 46)}" rx="{f((x1 - x0) * 0.5)}" ry="34" fill="{BLUE_D}" clip-path="url(#clip-{name})"/>'
    for (nx, ny, nw, nh) in nails:
        nd = smooth([(nx - nw / 2, ny + nh / 2), (nx - nw / 2, ny - nh * 0.1), (nx - nw * 0.3, ny - nh / 2), (nx + nw * 0.3, ny - nh / 2),
                     (nx + nw / 2, ny - nh * 0.1), (nx + nw / 2, ny + nh / 2)])
        out += under(nd, 6) + fill(nd, '#fde9da') + f'<path d="M {f(nx - nw * 0.2)} {f(ny - nh * 0.25)} Q {f(nx)} {f(ny - nh * 0.38)} {f(nx + nw * 0.2)} {f(ny - nh * 0.25)}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none"/>'
    hx = x0 + (x1 - x0) * 0.25
    out += line([(hx, pts[3][1] + 22), (hx + 50, pts[4][1] + 12), (hx + 105, pts[4][1] + 16)], GLOSS, 9, 0.9)
    return out + '</g>', (f'<clipPath id="clip-{name}"><path d="{d}"/></clipPath>'
                          f'<linearGradient id="{name}-fill" gradientUnits="userSpaceOnUse" x1="{f(x0)}" y1="{f(pts[4][1])}" x2="{f(x1)}" y2="{f(sole_y)}">'
                          f'<stop stop-color="{BLUE_L}"/><stop offset="0.45" stop-color="{BLUE}"/><stop offset="1" stop-color="#7eadf8"/></linearGradient>')


def build():
    defs = []
    el, cl = eye('eye-left', *EYE_L); er, cr = eye('eye-right', *EYE_R); defs += [cl, cr]
    pl, cpl = paw('paw-left', PAW_L, [(578, 930, 54, 62), (634, 924, 58, 64), (683, 926, 36, 54)], 958); defs.append(cpl)
    # the chest between the paws travels with the left paw (so it doesn't hang under the chin while the head rises)
    pl = pl.replace('<g id="paw-left">', f'<g id="paw-left">{under(smooth(CHEST), 14)}{fill(smooth(CHEST), BLUE_D)}', 1)
    pr, cpr = paw('paw-right', PAW_R, [(808, 910, 44, 52), (853, 905, 46, 54), (892, 910, 26, 44)], 938); defs.append(cpr)
    defs.append(f'<clipPath id="clip-ear-l-pink"><path d="{smooth(EAR_L_PINK)}"/></clipPath>')
    defs.append(f'<clipPath id="clip-head"><path d="{smooth(HEAD)}"/></clipPath>')
    defs.append(f'<clipPath id="clip-trunk"><path d="{smooth(TRUNK)}"/></clipPath>')
    defs.append('<linearGradient id="trunk-fill" gradientUnits="userSpaceOnUse" x1="760" y1="560" x2="1000" y2="700">'
                '<stop stop-color="#a6cbfc"/><stop offset="0.55" stop-color="#86b4fb"/><stop offset="1" stop-color="#6b9cf4"/></linearGradient>')
    defs.append(f'<clipPath id="clip-mouth"><path d="{smooth(MOUTH)}"/></clipPath>')

    ear_l = (f'<g id="ear-left">{under(smooth(EAR_L))}{fill(smooth(EAR_L), BLUE)}'
             + line([(300, 452), (350, 430), (410, 424)], GLOSS, 10, 0.95) + line([(258, 560), (252, 610), (258, 660)], BLUE_L, 9, 0.9)
             + f'<path d="{smooth(EAR_L_PINK)}" fill="#4a72e4" transform="translate(4 -8)" opacity="0.7"/>'
             + fill(smooth(EAR_L_PINK), PINK)
             + f'<path d="{smooth(EAR_L_PINK_S)}" fill="{PINK_S}" opacity="0.8" clip-path="url(#clip-ear-l-pink)"/>'
             + fill(smooth(EAR_L_PINK_L), PINK_L, ' opacity="0.9"')
             + line([(340, 548), (352, 545)], '#ffffff', 10, 0.9)
             + line([(270, 520), (300, 470)], GLOSS, 12, 0.9) + line([(392, 432), (440, 436)], GLOSS, 8, 0.8) + '</g>')
    ear_r = (f'<g id="ear-right">{under(smooth(EAR_R))}{fill(smooth(EAR_R), BLUE)}'
             + line([(1000, 412), (1050, 438), (1082, 480)], GLOSS, 9, 0.9)
             + fill(smooth(EAR_R_PINK), PINK) + fill(smooth(EAR_R_PINK_L), PINK_L, ' opacity="0.85"')
             + line([(1030, 742), (990, 768), (940, 770)], PINK_S, 10, 0.7) + '</g>')
    head = (f'<g id="head">{under(smooth(TUFT), 16)}{under(smooth(TUFT2), 14)}{under(smooth(HEAD))}'
            + fill(smooth(TUFT), BLUE) + fill(smooth(TUFT2), BLUE)
            + line([(628, 368), (648, 344), (680, 338)], GLOSS, 8, 0.95)
            + fill(smooth(HEAD), BLUE)
            + f'<path d="{smooth(HEAD_SHADE)}" fill="{BLUE_S}" opacity="0.55" clip-path="url(#clip-head)"/>'
            + fill(smooth(HEAD_GLOSS), GLOSS, ' opacity="0.9"')
            + f'<ellipse cx="704" cy="424" rx="40" ry="9" fill="{GLOSS}" transform="rotate(-6 704 424)" opacity="0.95"/>'
            + f'<ellipse cx="752" cy="432" rx="10" ry="5" fill="{GLOSS}" opacity="0.9"/>'
            + line([(522, 520), (512, 580), (512, 650), (522, 712)], BLUE_L, 12, 0.85)
            + fill(smooth(CHEEK_L), BLUE_L, ' opacity="0.7"')
            + '</g>')
    body = '<g id="body"></g>'
    mouth = (f'<g id="mouth">{under(smooth(MOUTH), 12)}{fill(smooth(MOUTH), "#2a0142")}'
             + f'<path d="{smooth(TONGUE)}" fill="#fd5662" clip-path="url(#clip-mouth)"/>'
             + f'<path d="M 694 778 Q 716 766 742 778" stroke="#d0264b" stroke-width="6" stroke-linecap="round" fill="none" clip-path="url(#clip-mouth)"/>'
             + f'<ellipse cx="736" cy="790" rx="14" ry="7" fill="#fe8ebe" opacity="0.8" clip-path="url(#clip-mouth)"/>'
             + '</g>')
    trunk_outline = smooth(TRUNK[:-6], closed=False)          # dark outline round the trunk, but not along the snout top (a soft light rim there)
    trunk = (f'<g id="trunk"><path d="{trunk_outline}" stroke="{OL}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
             + fill(smooth(TRUNK), 'url(#trunk-fill)')
             + f'<path d="{smooth(TRUNK_SHADE)}" fill="{BLUE_S}" opacity="0.85" clip-path="url(#clip-trunk)"/>'
             + f'<path d="M 690 760 C 780 770 880 750 940 710 C 990 676 1012 620 1010 560 L 1040 560 L 1040 800 L 690 800 Z" fill="{BLUE_D}" opacity="0.5" clip-path="url(#clip-trunk)"/>'
             + f'<ellipse cx="770" cy="626" rx="58" ry="22" fill="{BLUE_L}" opacity="0.85" transform="rotate(-4 770 626)" clip-path="url(#clip-trunk)"/>'
             + f'<ellipse cx="764" cy="616" rx="30" ry="8" fill="{GLOSS}" opacity="0.95" transform="rotate(-6 764 616)"/>'
             + ''.join(line(w, BLUE_D, 6, 0.5) for w in WRINKLES)
             + line([(926, 446), (932, 520), (922, 590)], GLOSS, 9, 0.75)
             + fill(smooth(TRUNK_GLOSS), GLOSS, ' opacity="0.95"')
             + under(smooth(TIP_HOLE), 4) + fill(smooth(TIP_HOLE), '#2a3fb8')
             + '</g>')
    brows = (f'<g id="brows">{line([(566, 524), (580, 496), (614, 484)], "#1e36b1", 14)}'
             f'{line([(774, 470), (796, 452), (822, 462)], "#1e36b1", 13)}</g>')
    eyes = f'<g id="eyes">{el}{er}</g>'
    return dict(ear_l=ear_l, ear_r=ear_r, body=body, head=head, mouth=mouth, trunk=trunk, eyes=eyes, brows=brows,
                paw_l=pl, paw_r=pr, defs=''.join(defs))
