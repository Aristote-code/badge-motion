"""Memory Keeper elephant, v3: every shape of the user's illustration redrawn as a smooth curve and organised
into parts that can move on their own.

Each colour region of the reference was re-drawn as a clean closed Catmull-Rom curve fitted to its outline
(reference/fitted-shapes.json, made by sampling the region's outline). Regions are sorted into parts by where they
sit (part outlines from elephant.py). Every part also gets:
  - a dark outline underlay (its own shapes, stroked), so the outline moves with it;
  - a full base shape in its base colour underneath, extended under the parts in front of it, so moving a part
    never opens a hole (ear roots, the trunk's base, the paws).
"""
import json, re
from elephant import smooth, EAR_L, EAR_R, HEAD, TRUNK, PAW_L, PAW_R, CHEST, EYE_L, EYE_R

BASE = '/Users/ariga/Documents/badges/memory-keeper'
OL = '#140466'
F = {r['i']: r for r in json.load(open(f'{BASE}/reference/fitted-shapes.json'))}
G = json.load(open(f'{BASE}/reference/groups.json'))


def inside(pt, poly):
    x, y = pt; c = False
    for i in range(len(poly)):
        x1, y1 = poly[i - 1]; x2, y2 = poly[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c


def ell(cx, cy, rx, ry, pad=6):
    import math
    return [(cx + (rx + pad) * math.cos(a), cy + (ry + pad) * math.sin(a)) for a in [k * math.pi / 12 for k in range(24)]]


BROW_L = [(556, 528), (566, 488), (612, 470), (626, 490), (580, 512), (572, 534)]
BROW_R = [(766, 474), (788, 446), (828, 452), (826, 472), (790, 466), (776, 482)]
MOUTH_P = [(640, 700), (790, 756), (780, 800), (716, 836), (680, 826), (646, 750)]
CHEST_P = [(684, 836), (770, 836), (772, 990), (684, 990)]
# the real trunk is wider than my first outline: its inner edge runs down at x ~850 beside the right eye
TRUNK2 = [(700, 690), (735, 728), (790, 744), (850, 740), (912, 716), (962, 670), (992, 604), (1004, 528), (1001, 452),
          (986, 392), (956, 352), (920, 335), (884, 340), (858, 362), (850, 396), (848, 444), (850, 500), (846, 556),
          (826, 588), (790, 598), (752, 592), (720, 602), (698, 632)]
PINKS = {'#DB31B5', '#E740B7', '#FE90C1', '#F96ABF', '#FE8EBE', '#FC89FD', '#F5BAF9'}

# which part each region belongs to: first match wins (front to back)
PARTS = [('paw-left', [PAW_L, CHEST_P]), ('paw-right', [PAW_R]), ('eye-left', [ell(*EYE_L)]), ('eye-right', [ell(*EYE_R)]),
         ('brows', [BROW_L, BROW_R]), ('mouth', [MOUTH_P]), ('trunk', [TRUNK2]), ('ear-right', [EAR_R]), ('head', [HEAD]),
         ('ear-left', [EAR_L])]
elephant_ids = sorted(set(sum((G[k] for k in G if k not in ('frame', 'burst')), [])))
assign = {name: [] for name, _ in PARTS}
for i in elephant_ids:
    if i == 87: continue                                   # the whole-body base: used as the head's base below
    r = F[i]; c = (r['cx'], r['cy'])
    if i in (192, 193):                                    # the head's own edge line low on the left
        assign['head'].append(i); continue
    if r['fill'].upper() in PINKS and r['area'] > 600 and not any(inside(c, p) for p in (ell(*EYE_L), ell(*EYE_R))):
        assign['ear-left' if r['cx'] < 676 else 'ear-right'].append(i); continue
    for name, polys in PARTS:
        if name in ('eye-left', 'eye-right', 'brows', 'mouth') and r['area'] > 16000:
            continue                                       # big shading regions are never part of an eye/brow/mouth
        if any(inside(c, poly) for poly in polys):
            assign[name].append(i); break
    else:
        # ears are partly outside my outlines: fall back to the original grouping
        g = next(k for k in G if i in G[k])
        assign.setdefault({'ear-left': 'ear-left', 'ear-right': 'ear-right'}.get(g, 'head'), []).append(i)

shp = lambda i, extra='': f'<path d="{F[i]["d"]}" fill="{F[i]["fill"]}" stroke="{F[i]["fill"]}" stroke-width="1.6" stroke-linejoin="round"{extra}/>'
under = lambda ids, w=16: ''.join(f'<path d="{F[i]["d"]}" fill="{OL}" stroke="{OL}" stroke-width="{w}" stroke-linejoin="round"/>' for i in ids)
white = lambda ids, w=12: ''.join(f'<path d="{F[i]["d"]}" fill="#fff" stroke="#fff" stroke-width="{w}" stroke-linejoin="round"/>' for i in ids)
black = lambda ids, w=30: ''.join(f'<path d="{F[i]["d"]}" fill="#000" stroke="#000" stroke-width="{w}" stroke-linejoin="round"/>' for i in ids)


def build():
    A = {k: sorted(v) for k, v in assign.items()}
    M = lambda mid, inner: f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">{inner}</mask>'
    ears = A['ear-left'] + A['ear-right']
    defs = [
        # base shapes are only allowed where the part shows, or where a part in front hides it
        M('m-earl', white(A['ear-left']) + f'<path d="{smooth(HEAD)}" fill="#fff"/>'),
        M('m-earr', white(A['ear-right']) + f'<path d="{smooth(HEAD)}" fill="#fff"/><path d="{smooth(TRUNK2)}" fill="#fff"/>'),
        M('m-trunk', white(A['trunk']) + f'<path d="{smooth(HEAD)}" fill="#fff"/>'),
        # no dark outline along the snout's top edge or over the right eye: the reference has a soft light edge there
        M('m-trunk-ol', '<rect width="1254" height="1254" fill="#fff"/>' + f'<path d="{smooth([(690, 560), (770, 548), (850, 500), (868, 540), (860, 600), (800, 636), (720, 648), (690, 620)])}" fill="#000"/>'),
        M('m-trunk-cut', '<rect width="1254" height="1254" fill="#fff"/>' + ''.join(f'<path d="{F[i]["d"]}" fill="#000"/>' for i in A['ear-right'])),
        M('m-body', '<rect width="1254" height="1254" fill="#fff"/>' + black(ears)),
        M('m-body-fill', '<rect width="1254" height="1254" fill="#fff"/>' + black(ears, 2)),
    ]
    part = lambda name, ids, base='': f'<g id="{name}">{under(ids)}{base}{"".join(shp(i) for i in ids)}</g>'
    out = dict(
        ear_l=part('ear-left', A['ear-left'], f'<path d="{smooth(EAR_L)}" fill="#8abafc" mask="url(#m-earl)"/>'),
        ear_r=part('ear-right', A['ear-right'], f'<path d="{smooth(EAR_R)}" fill="#8abafc" mask="url(#m-earr)"/>'),
        head=(f'<g id="head"><g mask="url(#m-body)">{under([87])}</g><g mask="url(#m-trunk-cut)">'
              f'<g mask="url(#m-body-fill)">{shp(87)}</g>{"".join(shp(i) for i in A["head"])}</g></g>'),
        mouth=f'<g id="mouth">{"".join(shp(i) for i in A["mouth"])}</g>',
        # the reference draws the right ear over the trunk's right edge, so the trunk is cut where those ear shapes are
        # one smooth outline for the trunk (not along the snout top, which has a soft light edge), a full base shape,
        # then the trunk's fitted shapes on top
        # the trunk's silhouette is its two big regions (147 = body + curve, 129 = raised part): outline those only
        trunk=(f'<g id="trunk"><g mask="url(#m-trunk-ol)">{under([147, 129], 18)}</g>'
               f'{"".join(shp(i) for i in A["trunk"])}</g>'),
        eyes=f'<g id="eyes"><g id="eye-left">{"".join(shp(i) for i in A["eye-left"])}</g><g id="eye-right">{"".join(shp(i) for i in A["eye-right"])}</g></g>',
        brows=f'<g id="brows">{"".join(shp(i) for i in A["brows"])}</g>',
        paw_l=part('paw-left', A['paw-left'], f'<path d="{smooth(PAW_L)}" fill="#8abafc" mask="url(#m-pawl)"/>'),
        paw_r=part('paw-right', A['paw-right'], f'<path d="{smooth(PAW_R)}" fill="#8abafc" mask="url(#m-pawr)"/>'),
    )
    defs += [M('m-pawl', white(A['paw-left'])), M('m-pawr', white(A['paw-right']))]
    out['defs'] = ''.join(defs)
    out['assign'] = A
    return out


if __name__ == '__main__':
    for k, v in build()['assign'].items(): print(k, len(v), v)
