  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16,
    tiles: [0.42, 0.72, 1.02], fall: 0.22, settle: 0.62,   // each tile lands at tiles[i] + fall
    flip: [1.44, 1.84],                                     // C flips cream → gold (swap at the midpoint)
    swoosh: [1.98, 2.86],                                   // back half then front half, one continuous stroke
    starPop: 2.88, burst: 2.9,
    impact: 3.16, stars: 3.24, shine: [3.38, 4.08]
  };
  const GLINT = [1.0, 2.2];   // idle: when (within each loop) the glint runs along the swoosh

  function buildRig(svgText, label) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.nodeName !== 'svg') throw new Error('That file is not a valid SVG');
    const holder = $('fx-art');
    holder.replaceChildren();
    const art = document.importNode(doc.documentElement, true);
    if (!art.getAttribute('viewBox')) {
      const w = parseFloat(art.getAttribute('width')) || 1000, h = parseFloat(art.getAttribute('height')) || 1000;
      art.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    set(art, { x: 165, y: 128, width: 670, height: 706, overflow: 'visible', preserveAspectRatio: 'xMidYMid meet' });
    art.removeAttribute('style');
    holder.appendChild(art);

    const L = {};
    for (const n of LAYERS) L[n] = findLayer(art, n);
    const found = LAYERS.filter(n => L[n]), missing = LAYERS.filter(n => !L[n]);
    const centreOf = el => { const b = stageBox(el); return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h, top: b.y, bottom: b.y + b.h, left: b.x }; };
    const wrapAt = (el, stagePt) => { const w = wrap(el); return { w, p: toLocal(w, stagePt.x, stagePt.y) }; };
    const vecLocal = (el, dx, dy) => { const a = toLocal(el, 0, 0), b = toLocal(el, dx, dy); return { x: b.x - a.x, y: b.y - a.y }; };
    const kids = el => el ? [...el.children].filter(c => c.getBBox && c.getBBox().width + c.getBBox().height > 0) : [];
    const stagePts = (pathEl, n = 240) => {
      const len = pathEl.getTotalLength(), m = pathEl.getScreenCTM(), sm = stageSvg.getScreenCTM().inverse(), out = [];
      for (let i = 0; i <= n; i++) { const q = pathEl.getPointAtLength(len * i / n).matrixTransform(m).matrixTransform(sm); out.push({ f: i / n, x: q.x, y: q.y }); }
      return out;
    };

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    // tiles drop in reading order (left → right), whatever their stacking order is
    const tileInfo = kids(L.tiles).map(el => ({ el, c: centreOf(el) })).sort((a, b) => a.c.x - b.c.x);
    const groupC = L.spelling ? centreOf(L.spelling) : C;
    const flipEl = L['tile-c'] || (tileInfo.length ? tileInfo[tileInfo.length - 1].el : null);
    const halves = [['swoosh-back', 'swoosh-back-path'], ['swoosh-front', 'swoosh-front-path']]
      .filter(([g, p]) => L[g] && L[p]).map(([g, p]) => ({ el: L[g], path: L[p], len: L[p].getTotalLength() }));
    const frontPts = L['swoosh-front-path'] ? stagePts(L['swoosh-front-path']) : null;
    const starC = L['magic-star'] ? centreOf(L['magic-star']) : null;
    let starF = 1;
    if (frontPts && starC) { let bd = Infinity; for (const p of frontPts) { const d = (p.x - starC.x) ** 2 + (p.y - starC.y) ** 2; if (d < bd) { bd = d; starF = p.f; } } }
    const burstInfo = kids(L.burst).map(el => ({ el, c: centreOf(el) }));
    const burstO = burstInfo.length ? (flipEl ? centreOf(flipEl) : groupC) : null;   // dashes radiate away from the C tile
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const defs = art.querySelector('defs') || make('defs', {}, art);

    // Tiles: pivot at the bottom centre (they land on it), fall from above the medal
    const tiles = tileInfo.map((ti, i) => {
      const h = wrapAt(ti.el, { x: ti.c.x, y: ti.c.bottom });
      return { ...h, i, drop: vecLocal(h.w, 0, -72 * k), hop: vecLocal(h.w, 0, -11 * k), spin: [-16, 12, -10][i % 3] };
    });
    // C flip: an inner group so it turns over around the tile's own axis (cream face → gold face)
    let flip = null;
    if (flipEl && L['tile-c-gold'] && L['tile-c-cream']) {
      const g = make('g', {});
      while (flipEl.firstChild) g.appendChild(flipEl.firstChild);
      flipEl.appendChild(g);
      const b = g.getBBox();
      flip = { g, p: { x: b.x + b.width / 2, y: b.y + b.height / 2 }, gold: L['tile-c-gold'], cream: L['tile-c-cream'],
        tile: tiles.find(tt => tt.w.firstChild === flipEl) };
      set(flip.cream, { opacity: 1 }); set(flip.gold, { opacity: 0 });
    }

    // Swoosh: each half is revealed by a mask that strokes along its centre line; a glint rides it in the idle
    const total = halves.reduce((s, h) => s + h.len, 0) || 1;
    let acc = 0;
    const swoosh = halves.map((h, i) => {
      const m = make('mask', { id: `fx-swoosh-mask-${i}`, maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defs);
      const draw = make('path', { d: h.path.getAttribute('d'), transform: h.path.getAttribute('transform') || '', fill: 'none', stroke: '#fff', 'stroke-width': 76, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, m);
      h.el.setAttribute('mask', `url(#${m.id})`);
      const glint = make('path', { d: h.path.getAttribute('d'), transform: h.path.getAttribute('transform') || '', fill: 'none', stroke: '#fffbe6', 'stroke-width': 12, 'stroke-linecap': 'round', pathLength: 1, opacity: 0 }, h.el);
      const out = { draw, glint, f0: acc / total, f1: (acc + h.len) / total, len: h.len };
      acc += h.len;
      return out;
    });
    const glintLen = 120;   // in artwork units

    // Star: rides the front half of the swoosh to its spot, then pops
    let star = null;
    if (starC) {
      const h = wrapAt(L['magic-star'], starC);
      star = { ...h, f: starF, offs: frontPts.map(p => vecLocal(h.w, p.x - starC.x, p.y - starC.y)) };
    }
    const burst = burstInfo.map((b, i) => {
      const dx = b.c.x - burstO.x, dy = b.c.y - burstO.y, l = Math.hypot(dx, dy) || 1;
      const inner = { x: b.c.x - dx / l * b.c.h * 0.3, y: b.c.y - dy / l * b.c.h * 0.3 };
      return { ...wrapAt(b.el, inner), i, out: null, dir: { x: dx / l, y: dy / l } };
    });
    burst.forEach(b => { b.out = vecLocal(b.w, b.dir.x * 14 * k, b.dir.y * 14 * k); });
    const stars = starsInfo.map((s, i) => ({ ...wrapAt(s.el, s.c), i }));

    // Shine sweep, masked to the medal
    let shine = null;
    {
      const src = L.medal || anchor;
      const mask = make('mask', { id: 'fx-shine-mask', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defs);
      const m = badgeW.getScreenCTM().inverse().multiply(src.parentNode.getScreenCTM());
      const holderG = make('g', { transform: `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})` }, mask);
      const clone = src.cloneNode(true);
      clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      [clone, ...clone.querySelectorAll('*')].forEach(e => { e.removeAttribute('filter'); e.style.fill = '#fff'; e.style.stroke = 'none'; e.style.opacity = 1; });
      holderG.appendChild(clone);
      const g = make('g', { mask: 'url(#fx-shine-mask)' }, badgeW);
      const xfG = make('g', {}, g);
      const band = make('g', { transform: 'rotate(35)' }, xfG);
      const H = Math.max(bb.width, bb.height) * 2.2, w1 = bb.width * 0.16;
      make('rect', { x: -w1 / 2, y: -H / 2, width: w1, height: H, fill: 'url(#fx-shine)', opacity: .28 }, band);
      make('rect', { x: w1 * 0.66, y: -H / 2, width: w1 * 0.28, height: H, fill: 'url(#fx-shine)', opacity: .24 }, band);
      shine = { xf: xfG, travel: bb.width * 0.85 };
    }

    // Rings, confetti, twinkles, glow
    set($('fx-ringGold'), { cx: C.x, cy: C.y });
    set($('fx-ringWhite'), { cx: C.x, cy: C.y });
    set($('fx-glowDisc'), { cx: C.x, cy: C.y, r: 470 * k });
    seed = 51;
    const COLORS = ['#fde15e', '#ff7a70', '#fff6dc', '#fccb12', '#f6eaea', '#ff5a52', '#ffb3a8'];
    const cg = $('fx-confetti'); cg.replaceChildren();
    const confetti = [];
    for (let i = 0; i < 80; i++) {
      const a = rnd() * TAU, sp = (380 + rnd() * 520) * k;
      const isRect = rnd() < .7;
      const el = isRect ? make('rect', {}, cg) : make('circle', {}, cg);
      if (isRect) { const w = 6 + rnd() * 6, h = 14 + rnd() * 14; set(el, { x: -w / 2, y: -h / 2, width: w, height: h, rx: 2 }); }
      else el.setAttribute('r', 3 + rnd() * 4);
      el.setAttribute('fill', COLORS[i % COLORS.length]);
      confetti.push({ el, a, sp, spin: (rnd() - .5) * 1400, r0: (250 + rnd() * 60) * k, delay: rnd() * .08, life: .9 + rnd() * .7 });
    }
    const tg = $('fx-twinkles'); tg.replaceChildren();
    const twinkles = [
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#ffb3a8'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, tiles, flip, swoosh, total, glintLen, star, burst, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'tiles:', tiles.length, 'swoosh halves:', swoosh.length, 'star at', starF.toFixed(2), 'of front');
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  // how far the swoosh is drawn (0..1 over its whole length, back half first)
  const swooshF = t => easeInOutCubic(prog(t, T.swoosh[0], T.swoosh[1]));

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
    const lt = idleT % CONFIG.loop;
    const w = idleT * TAU / CONFIG.loop;
    const st = t - T.impact;

    // Medal pops in, squashes on completion
    const kPop = prog(t, 0.0, 0.6);
    const s = kPop === 0 ? 0.001 : easeOutElastic(kPop) * 0.9 + 0.1 * easeOutCubic(kPop);
    const squash = st > 0 ? Math.exp(-st * 7) * Math.sin(st * 26) * 0.05 : 0;
    const tilt = lerp(-10, 0, easeOutBack(kPop, 2.2));
    set(badgeW, { transform: `translate(${P.x} ${P.y}) rotate(${tilt}) scale(${s * (1 + squash)} ${s * (1 - squash)}) translate(${-P.x} ${-P.y})`, opacity: clamp(kPop * 6) });
    set($('fx-glowDisc'), { opacity: easeOutCubic(prog(t, .1, .9)) * (0.9 + 0.1 * Math.sin(t * TAU / 4)) });

    // Ribbons drop and swing
    for (const r of rig.ribbons) {
      const q = prog(t, T.ribbons, T.ribbons + 0.7);
      const sy = q === 0 ? 0.001 : easeOutBack(clamp(q * 1.6), 2.2);
      const swing = q === 0 ? 0 : -r.side * 22 * Math.exp(-q * 5) * Math.cos(q * 11);
      const sway = idleOn * r.side * 1.2 * Math.sin(idleT * TAU / 4 + (r.side > 0 ? 0.6 : 0));
      set(r.w, { transform: xf(r.p, swing + sway, 1, sy) });
    }

    // Tiles drop in A → B → C: fall, squash on landing, a small bounce and a rotation settle
    const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.05 : 0;
    const fl = rig.flip;
    for (const tl of rig.tiles) {
      const at = T.tiles[tl.i] ?? T.tiles[T.tiles.length - 1] + 0.3 * (tl.i - T.tiles.length + 1);
      const tt = t - at;
      let dy = 0, rot = 0, sx = 1, sy = 1;
      if (tt < T.fall) {
        const q = clamp(tt / T.fall);
        dy = 1 - q * q;
        rot = tl.spin * (1 - 0.35 * q);
        sx = sy = lerp(0.72, 1, easeOutCubic(q));   // drops in from just above its spot, growing in
      } else {
        const u = tt - T.fall;
        dy = 0.22 * Math.exp(-u * 9) * Math.abs(Math.sin(u * 13));
        rot = tl.spin * 0.65 * Math.exp(-u * 7) * Math.cos(u * 17);
        const sq = 0.12 * Math.exp(-u * 13) * Math.cos(u * 30);
        sy = 1 - sq; sx = 1 + sq * 0.7;
      }
      // idle: a hop wave A → B → C
      let hx = 0, hy = 0;
      if (idleT > 0) {
        const ph = (lt - 0.25 - tl.i * 0.16) / 0.5;
        if (ph > 0 && ph < 1) {
          const hp = Math.sin(Math.PI * ph) * idleOn;
          hx = tl.hop.x * hp; hy = tl.hop.y * hp;
          rot += 3 * Math.sin(TAU * ph) * idleOn * (tl.i % 2 ? -1 : 1);
        }
      }
      // the flipping tile lifts a little while it turns over
      let lift = 0;
      if (fl && fl.tile === tl) { const q = prog(t, T.flip[0], T.flip[1]); lift = q > 0 && q < 1 ? 0.06 * Math.sin(Math.PI * q) : 0; }
      const ox = tl.drop.x * (dy + lift) + hx, oy = tl.drop.y * (dy + lift) + hy;
      set(tl.w, { transform: `translate(${ox} ${oy}) ${xf(tl.p, rot, sx * (1 + bump), sy * (1 + bump))}`, opacity: clamp(tt / 0.12) });
    }
    // C turns over: cream face squeezes to an edge, the gold face opens out with a little overshoot
    if (fl) {
      const q = prog(t, T.flip[0], T.flip[1]);
      const gold = q >= 0.5;
      const sx = q <= 0 ? 1 : q < 0.5 ? Math.cos(Math.PI * q) : Math.max(0.001, easeOutBack((q - 0.5) * 2, 2.4));
      set(fl.g, { transform: `translate(${fl.p.x} ${fl.p.y}) scale(${Math.max(sx, 0.05)} 1) translate(${-fl.p.x} ${-fl.p.y})` });
      set(fl.cream, { opacity: gold ? 0 : 1 }); set(fl.gold, { opacity: gold ? 1 : 0 });
    }

    // Swoosh draws around the tiles like a wand trail: back half (behind), then front half (in front)
    const sf = swooshF(t);
    // idle glint position along the whole swoosh (in 0..1 of its length)
    const gq = idleT > 0 ? prog(lt, GLINT[0], GLINT[1]) : 0;
    const gHead = lerp(0.3, 1.08, easeInOutCubic(gq));
    const gOn = gq > 0 && gq < 1 ? Math.sin(Math.PI * gq) * idleOn : 0;
    const gl = rig.glintLen / rig.total;
    for (const h of rig.swoosh) {
      const local = clamp((sf - h.f0) / (h.f1 - h.f0));
      set(h.draw, { 'stroke-dashoffset': 1 - local });
      const span = h.f1 - h.f0, g0 = (gHead - gl - h.f0) / span, gLen = gl / span;
      set(h.glint, { 'stroke-dasharray': `${gLen} 4`, 'stroke-dashoffset': -g0, opacity: 0.95 * gOn });
    }

    // Star rides the front half at the head of the stroke, settles on its spot, then pops with the burst
    if (rig.star) {
      const sr = rig.star, front = rig.swoosh[rig.swoosh.length - 1];
      const ff = front ? clamp((sf - front.f0) / (front.f1 - front.f0)) : 1;
      const on = front ? sf > front.f0 : t >= T.starPop;
      const pos = Math.min(ff, sr.f), idx = Math.round(pos * (sr.offs.length - 1));
      const o = sr.offs[idx] || { x: 0, y: 0 };
      const riding = ff < sr.f;
      const arrive = prog(t, T.swoosh[0], T.swoosh[1]) >= 1 ? 1 : 0;
      let sc = on ? (riding ? 0.62 : lerp(0.62, 0.8, clamp((ff - sr.f) / Math.max(1e-3, 1 - sr.f)))) : 0;
      let rot = on ? -540 * (1 - pos / Math.max(sr.f, 1e-3)) : 0;
      if (arrive) { sc = 0.8 + 0.2 * pop(t, T.starPop, 0.6) / 1 + 0.3 * Math.sin(Math.PI * prog(t, T.starPop, T.starPop + 0.28)); rot = 0; }
      // idle: twinkle (and a brighter flash as the glint passes it)
      if (idleT > 0) {
        const pass = gOn > 0 ? Math.exp(-Math.pow((gHead - (front ? front.f0 + sr.f * (front.f1 - front.f0) : 1)) / 0.05, 2)) : 0;
        sc *= 1 + (0.08 * Math.sin(2 * w) + 0.22 * pass) * idleOn;
        rot += 8 * Math.sin(w) * idleOn;
      }
      set(sr.w, { transform: `translate(${o.x} ${o.y}) ${xf(sr.p, rot, sc * (1 + bump))}`, opacity: on ? 1 : 0 });
    }

    // Burst dashes shoot out from the C tile's corner
    for (const b of rig.burst) {
      const at = T.burst + b.i * 0.05;
      const q = prog(t, at, at + 0.4);
      const sc = q === 0 ? 0 : easeOutBack(q, 2.6);
      let push = q > 0 ? (1 - easeOutCubic(q)) : 0;
      if (idleT > 0) { const ph = (lt - 3.0 - b.i * 0.06) / 0.4; if (ph > 0 && ph < 1) push -= 0.6 * Math.sin(Math.PI * ph) * idleOn; }
      set(b.w, { transform: `translate(${-b.out.x * push} ${-b.out.y * push}) ${xf(b.p, 0, sc)}`, opacity: q > 0 ? 1 : 0 });
    }

    // Sparkle stars burst in, then twinkle
    for (const sp of rig.stars) {
      const at = T.stars + sp.i * 0.1;
      const sc = pop(t, at, 0.5);
      const tw = idleT > 0 ? 1 + 0.25 * Math.sin(idleT * TAU / 2 + sp.i * 2.1) * idleOn : 1;
      set(sp.w, { transform: xf(sp.p, lerp(-90, 0, easeOutCubic(prog(t, at, at + .5))), sc * tw) });
    }

    // Shockwave rings
    const kG = prog(t, T.impact, T.impact + .7), kW = prog(t, T.impact + .12, T.impact + .95);
    set($('fx-ringGold'), { r: lerp(330, 520, easeOutCubic(kG)) * k, 'stroke-width': lerp(16, 1, kG), opacity: kG > 0 && kG < 1 ? 1 - kG : 0 });
    set($('fx-ringWhite'), { r: lerp(330, 560, easeOutCubic(kW)) * k, 'stroke-width': lerp(8, 1, kW), opacity: kW > 0 && kW < 1 ? (1 - kW) * 0.8 : 0 });

    // Confetti
    for (const p of rig.confetti) {
      const ltc = t - T.impact - 0.03 - p.delay;
      if (ltc <= 0 || ltc > p.life) { p.el.setAttribute('opacity', 0); continue; }
      const d = p.r0 + p.sp * (1 - Math.exp(-ltc * 3.2)) / 3.2;
      const x = C.x + Math.cos(p.a) * d, y = C.y + Math.sin(p.a) * d + 140 * k * ltc * ltc;
      const sc = 1 - Math.pow(ltc / p.life, 3);
      set(p.el, { transform: `translate(${x} ${y}) rotate(${p.a * DEG + p.spin * ltc}) scale(${sc} ${sc * Math.abs(Math.cos(ltc * 9 + p.a))})`, opacity: 1 });
    }

    // Twinkles around the badge
    const twIn = clamp(prog(t, T.impact + .45, T.impact + 1.15));
    for (const s2 of rig.twinkles) {
      const tw = Math.pow(Math.max(0, Math.sin((t + s2.ph) * TAU / 4)), 3) * twIn;
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 90 / CONFIG.loop}) scale(${Math.max(s2.s * tw, 0.001)})`, opacity: tw });
    }

    renderRays(t, T.impact);

    // Shine sweep: once in the intro, then once per loop
    if (rig.shine) {
      const ph = t < CONFIG.intro ? prog(t, T.shine[0], T.shine[1]) : prog(lt, 2.6, 3.3);
      const x = lerp(-rig.shine.travel, rig.shine.travel, easeInOutCubic(ph));
      set(rig.shine.xf, { transform: `translate(${P.x + x} ${P.y})`, opacity: ph > 0 && ph < 1 ? 1 : 0 });
    }
  }

  // ---------------------------------------------------------------------------
  // Cue sheet: sound + haptics, on the same timeline as render(t)
  //   haptic types: transient (tap; i = intensity, s = sharpness 0..1)
  //                 continuous (buzz; d = duration, ramp = intensity curve start→end)
  // ---------------------------------------------------------------------------
  let CUES = [];
  function buildCues(r) {
    const cues = [
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },
    ];
    // each tile is "spoken" as it lands: woody clack + a rising note C5, E5, G5 (taps get stronger)
    const tileNotes = [72, 76, 79, 84];
    r.tiles.forEach((tl, i) => cues.push({ t: +((T.tiles[i] ?? 1) + T.fall).toFixed(3), sound: 'tile', note: tileNotes[i % 4], pan: -0.45 + i * 0.45,
      haptic: [{ t: 0, type: 'transient', i: 0.4 + i * 0.15, s: 0.55 + i * 0.1 }] }));
    if (r.flip) cues.push({ t: T.flip[0] + 0.02, sound: 'flip', d: T.flip[1] - T.flip[0], pan: 0.45,
      haptic: [{ t: (T.flip[1] - T.flip[0]) * 0.5, type: 'transient', i: 0.6, s: 0.8 }] });
    if (r.swoosh.length) cues.push({ t: T.swoosh[0], sound: 'shimmer', d: T.swoosh[1] - T.swoosh[0],
      haptic: [{ t: 0, type: 'continuous', d: T.swoosh[1] - T.swoosh[0], i: 0.22, s: 0.3, ramp: [0.4, 1] }] });
    if (r.star) cues.push({ t: T.starPop, sound: 'bell', haptic: [{ t: 0, type: 'transient', i: 0.75, s: 1 }] });
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [{ at: 2.6, sound: 'shine', d: 0.7, v: 0.55 }];

  function cuesBetween(a, b) {
    const out = CUES.filter(c => c.t >= a && c.t < b);
    for (const ic of IDLE_CUES) {
      for (let k = Math.max(0, Math.floor((a - CONFIG.intro - ic.at) / CONFIG.loop)); ; k++) {
        const t = CONFIG.intro + ic.at + k * CONFIG.loop;
        if (t >= b) break;
        if (t >= a) out.push({ ...ic, t });
      }
    }
    return out.sort((x, y) => x.t - y.t);
  }

