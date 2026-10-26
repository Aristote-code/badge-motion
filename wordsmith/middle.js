  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, paper: [0.34, 0.82], curl: [0.7, 1.02],
    pen: [0.86, 1.26], write: [1.32, 2.52], tap: 2.72, back: 2.98,
    star: 3.06, burst: 3.14, glint: [3.12, 3.72],
    impact: 3.46, stars: 3.54, shine: [3.68, 4.38]
  };

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
    const centreOf = el => { const b = stageBox(el); return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h, top: b.y, bottom: b.y + b.h, left: b.x, right: b.x + b.w }; };
    const wrapAt = (el, stagePt) => { const w = wrap(el); return { w, p: toLocal(w, stagePt.x, stagePt.y) }; };
    const vecLocal = (el, dx, dy) => { const a = toLocal(el, 0, 0), b = toLocal(el, dx, dy); return { x: b.x - a.x, y: b.y - a.y }; };
    const kids = el => el ? [...el.children].filter(c => c.getBBox && c.getBBox().width + c.getBBox().height > 0) : [];
    const defs = art.querySelector('defs') || make('defs', {}, art);
    const bare = el => { const c = el.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); return c; };

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const paperB = L.paper ? centreOf(L['paper-sheet'] || L.paper) : null;
    const curlB = L['paper-curl'] ? centreOf(L['paper-curl']) : null;
    const dotC = L['ink-dot'] ? centreOf(L['ink-dot']) : null;
    const starC = L.star ? centreOf(L.star) : null;
    const burstEls = kids(L.burst);
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];
    // the ink centreline, sampled in stage space (ignoring the highlight's own small offset)
    const pathEl = L['ink-path'];
    let samples = null;
    if (pathEl) {
      const len = pathEl.getTotalLength(), m = pathEl.parentNode.getScreenCTM(), sm = stageSvg.getScreenCTM().inverse();
      samples = [];
      for (let i = 0; i <= 400; i++) { const q = pathEl.getPointAtLength(len * i / 400).matrixTransform(m).matrixTransform(sm); samples.push({ x: q.x, y: q.y }); }
    }
    const E = samples ? samples[samples.length - 1] : (L.pen ? centreOf(L.pen) : C);      // nib tip at rest = end of the ink
    const nibC = L.nib ? centreOf(L.nib) : { x: E.x + 60, y: E.y - 80 };
    let axis = { x: nibC.x - E.x, y: nibC.y - E.y }; { const l = Math.hypot(axis.x, axis.y) || 1; axis = { x: axis.x / l, y: axis.y / l }; }  // tip → back of pen

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const curl = curlB ? wrapAt(L['paper-curl'], { x: curlB.right, y: curlB.bottom }) : null;      // rolls up from the corner
    const paper = paperB ? wrapAt(L.paper, { x: paperB.left, y: paperB.y }) : null;                  // unrolls from its left edge

    // Ink: the calligraphic body is revealed by a stroke along the centreline (mask), the highlight draws on too
    let ink = null;
    if (pathEl && L['ink-body']) {
      const body = L['ink-body'];
      const mask = make('mask', { id: 'fx-ink-mask', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defs);
      const mp = bare(pathEl);
      mp.removeAttribute('transform');
      set(mp, { stroke: '#fff', 'stroke-width': 60, 'stroke-linecap': 'butt', opacity: 1, pathLength: 1, 'stroke-dasharray': '1 1', fill: 'none' });
      mask.appendChild(mp);
      body.setAttribute('mask', 'url(#fx-ink-mask)');
      // shimmer: a light glint that runs along the stroke, masked to the ink shape
      const smask = make('mask', { id: 'fx-ink-shape', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defs);
      const sc = bare(body); sc.removeAttribute('mask');
      [sc, ...sc.querySelectorAll('*')].forEach(e => { e.style.fill = '#fff'; e.style.stroke = '#fff'; });
      smask.appendChild(sc);
      const gl = make('g', { mask: 'url(#fx-ink-shape)' });
      body.parentNode.insertBefore(gl, body.nextSibling);
      const glint = [[30, 0.16, 0.35], [12, 0.08, 0.75]].map(([w, a, o]) => {
        const p = bare(pathEl); p.removeAttribute('transform');
        set(p, { stroke: '#f1e6ff', 'stroke-width': w, 'stroke-linecap': 'round', opacity: o, pathLength: 1, 'stroke-dasharray': `${a} 3`, fill: 'none' });
        gl.appendChild(p); return { p, a };
      });
      pathEl.setAttribute('pathLength', '1');
      ink = { mp, glint };
    }
    const dot = dotC ? wrapAt(L['ink-dot'], { x: dotC.x, y: dotC.bottom - dotC.h * 0.3 }) : null;
    if (dot) {   // splash ring for the plop
      const host = dot.w.parentNode, c = toLocal(host, dotC.x, dotC.y);
      dot.ring = make('ellipse', { cx: c.x, cy: c.y, fill: 'none', stroke: '#9a5cf5', opacity: 0 }, host);
      host.insertBefore(dot.ring, dot.w);
    }

    // Pen: swoops in, writes (its tip follows the end of the ink), taps the full stop, rests, hovers
    let pen = null;
    if (L.pen) {
      const { w, p } = wrapAt(L.pen, E);
      const ex = vecLocal(w, 1, 0), ey = vecLocal(w, 0, 1);
      const loc = (dx, dy) => ({ x: ex.x * dx + ey.x * dy, y: ex.y * dx + ey.y * dy });
      pen = { w, p, loc, E, axis, D: dotC ? { x: dotC.x, y: dotC.y } : E };
    }
    const starW = starC ? wrapAt(L.star, starC) : null;
    const bursts = burstEls.map((el, i) => ({ ...wrapAt(el, starC || C), i }));
    const stars = starsInfo.map((s, i) => ({ ...wrapAt(s.el, s.c), i }));

    // Shine sweep, masked to the medal
    let shine = null;
    {
      const src = L.medal || anchor;
      const defs = art.querySelector('defs') || make('defs', {}, art);
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
    seed = 57;
    const COLORS = ['#fde15e', '#ff7468', '#9a5cf5', '#fff6dc', '#f6eaea', '#ff3b46', '#fccb12'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#36d4ff'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, paper, curl, ink, samples, dot, pen, starW, bursts, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'ink samples:', samples ? samples.length : 0, 'bursts:', bursts.length);
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  // how much of the flourish is written at time t (natural writing speed: eases in, flows, eases out)
  const inkF = t => { const q = prog(t, T.write[0], T.write[1]); return lerp(q, easeInOutCubic(q), 0.35); };
  function inkPoint(f) {
    const s = rig.samples, x = clamp(f) * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)), u = x - i;
    return { x: lerp(s[i].x, s[i + 1].x, u), y: lerp(s[i].y, s[i + 1].y, u) };
  }

  // where the nib tip is (stage offset from its rest point), the pen tilt, and its opacity
  function penPose(t, idleT, idleOn) {
    const pn = rig.pen, E = pn.E, A = pn.axis, k = rig.k;
    let o = { x: 0, y: 0 }, rot = 0;
    const P0 = rig.samples ? inkPoint(0) : E;
    if (t < T.pen[1]) {                       // swoop in from the top-right to the start of the flourish
      const q = prog(t, T.pen[0], T.pen[1]), e = easeOutBack(q, 1.25);
      const from = { x: P0.x + 330 * k, y: P0.y - 360 * k };
      o = { x: lerp(from.x, P0.x, e) - E.x, y: lerp(from.y, P0.y, e) - E.y };
      rot = lerp(16, 0, easeOutCubic(q));
    } else if (t < T.write[1]) {              // writing: the tip rides the end of the line
      const land = t - T.pen[1], f = inkF(t), P = rig.samples ? inkPoint(f) : E;
      const press = 5 * k * Math.exp(-land * 14) * Math.sin(land * 30);
      o = { x: P.x - E.x + A.x * press, y: P.y - E.y + A.y * press };
      rot = 2.2 * Math.sin((t - T.write[0]) * 14) * Math.sin(Math.PI * prog(t, T.write[0], T.write[1]));
    } else if (t < T.back) {                  // lift, tap the full stop, glide back to rest
      const hopTo = (a, b, q, h) => ({ x: lerp(a.x, b.x, easeInOutCubic(q)) + A.x * h * Math.sin(Math.PI * q), y: lerp(a.y, b.y, easeInOutCubic(q)) + A.y * h * Math.sin(Math.PI * q) });
      let P;
      if (t < T.tap) P = hopTo(E, pn.D, prog(t, T.write[1], T.tap), 34 * k);
      else { const dt = t - T.tap; P = hopTo(pn.D, E, prog(t, T.tap + 0.06, T.back), 18 * k); if (dt < 0.06) { P.x -= A.x * 4 * k * Math.sin(Math.PI * dt / 0.06); P.y -= A.y * 4 * k * Math.sin(Math.PI * dt / 0.06); } }
      o = { x: P.x - E.x, y: P.y - E.y };
      rot = -3 * Math.sin(Math.PI * prog(t, T.write[1], T.back));
    }
    // idle: hovers just above the paper (lifts along its own axis) and sways a little
    const w = idleT * TAU / CONFIG.loop;
    const lift = 7 * k * (0.5 - 0.5 * Math.cos(w)) * idleOn, side = 3 * k * Math.sin(w) * idleOn;
    o = { x: o.x + A.x * lift - A.y * side, y: o.y + A.y * lift + A.x * side };
    rot += 1.4 * Math.sin(w) * idleOn;
    return { o, rot };
  }

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
    const lt = idleT % CONFIG.loop;
    const st = t - T.impact;
    const W = idleT * TAU / CONFIG.loop;

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

    // Paper slides in and unrolls from its left edge; then the corner curls up
    if (rig.paper) {
      const q = prog(t, T.paper[0], T.paper[1]);
      const sx = q === 0 ? 0.001 : easeOutBack(q, 1.4);
      const sy = q === 0 ? 0.001 : lerp(0.55, 1, easeOutBack(clamp(q * 1.6), 2));
      const dx = -50 * k * (1 - easeOutCubic(q));
      const rot = lerp(-8, 0, easeOutBack(q, 1.6));
      set(rig.paper.w, { transform: `translate(${dx} 0) ${xf(rig.paper.p, rot, sx, sy)}`, opacity: clamp(q * 5) });
    }
    if (rig.curl) {
      const q = prog(t, T.curl[0], T.curl[1]);
      const sc = q === 0 ? 0.001 : easeOutBack(q, 2.4);
      const flick = idleOn * 0.04 * Math.max(0, Math.sin(W + 2.2));
      set(rig.curl.w, { transform: xf(rig.curl.p, lerp(-30, 0, easeOutCubic(q)), sc * (1 + flick)), opacity: q > 0 ? 1 : 0 });
    }

    // Ink: the flourish draws on behind the nib; a light glint runs along it once, then once per loop
    const f = inkF(t);
    if (rig.ink) {
      set(rig.ink.mp, { 'stroke-dashoffset': 1 - f });
      set(rig.L['ink-path'], { 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 - f });
      const ph = t < CONFIG.intro ? prog(t, T.glint[0], T.glint[1]) : prog(lt, 0.7, 1.6);
      for (const g of rig.ink.glint) {
        const d = lerp(g.a, -1 - g.a * 0.5, easeInOutCubic(ph));
        set(g.p, { 'stroke-dashoffset': d, visibility: ph > 0 && ph < 1 ? 'visible' : 'hidden' });
      }
    }

    // Full stop: the pen taps it in, it plops with a little splash
    if (rig.dot) {
      const q = prog(t, T.tap, T.tap + 0.5);
      const sc = pop(t, T.tap, 0.5);
      const sq = q > 0 ? 0.35 * Math.exp(-q * 6) * Math.cos(q * 18) : 0;
      const wob = idleOn * 0.06 * Math.max(0, Math.sin(W * 2 - 1.2)) ** 3;
      set(rig.dot.w, { transform: xf(rig.dot.p, 0, sc * (1 + sq + wob), sc * (1 - sq + wob)), opacity: q > 0 ? 1 : 0 });
      const r = prog(t, T.tap, T.tap + 0.42);
      set(rig.dot.ring, { rx: lerp(10, 40, easeOutCubic(r)) * 1, ry: lerp(8, 30, easeOutCubic(r)), 'stroke-width': lerp(7, 1, r), opacity: r > 0 && r < 1 ? (1 - r) * 0.9 : 0 });
    }

    // Pen
    if (rig.pen) {
      const pose = penPose(t, idleT, idleOn), o = rig.pen.loc(pose.o.x, pose.o.y);
      set(rig.pen.w, { transform: `translate(${o.x} ${o.y}) ${xf(rig.pen.p, pose.rot, 1)}`, opacity: t >= T.pen[0] ? 1 : 0 });
    }

    // Star pops (with a spin) and the burst dashes shoot out from it; idle: star twinkles, dashes pulse
    const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.06 : 0;
    if (rig.starW) {
      const sc = pop(t, T.star, 0.55);
      const tw = 1 + 0.14 * Math.sin(W * 2) * idleOn;
      set(rig.starW.w, { transform: xf(rig.starW.p, lerp(-120, 0, easeOutCubic(prog(t, T.star, T.star + .55))) + 6 * Math.sin(W) * idleOn, sc * tw * (1 + bump)), opacity: t >= T.star ? 1 : 0 });
    }
    for (const b of rig.bursts) {
      const at = T.burst + b.i * 0.05, q = prog(t, at, at + 0.35);
      const sc = q === 0 ? 0.001 : easeOutBack(q, 2.6);
      const pulse = 1 + 0.12 * Math.max(0, Math.sin(W * 2 + b.i * 1.3)) * idleOn;
      set(b.w, { transform: xf(b.p, 0, sc * pulse), opacity: clamp(q * 4) });
    }

    // Sparkle stars burst in at the finale, then twinkle
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
      const w = Math.pow(Math.max(0, Math.sin((t + s2.ph) * TAU / 4)), 3) * twIn;
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 90 / CONFIG.loop}) scale(${Math.max(s2.s * w, 0.001)})`, opacity: w });
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
  // ---------------------------------------------------------------------------
  let CUES = [];
  function buildCues(r) {
    const cues = [
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },
    ];
    if (r.paper) cues.push({ t: T.paper[0] + 0.02, sound: 'whoosh', d: T.paper[1] - T.paper[0], haptic: [{ t: 0.05, type: 'continuous', d: 0.3, i: 0.15, s: 0.2, ramp: [0.4, 1] }] });
    if (r.curl) cues.push({ t: T.curl[0] + 0.14, sound: 'curl', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.5 }] });
    if (r.pen) cues.push({ t: T.pen[0], sound: 'swoop', d: T.pen[1] - T.pen[0], haptic: [{ t: T.pen[1] - T.pen[0] - 0.02, type: 'transient', i: 0.5, s: 0.55 }] });
    if (r.ink) cues.push({ t: T.write[0], sound: 'scribble', d: T.write[1] - T.write[0],
      haptic: [{ t: 0, type: 'continuous', d: T.write[1] - T.write[0], i: 0.22, s: 0.85, ramp: [0.6, 1] }] });
    if (r.dot) cues.push({ t: T.tap, sound: 'plip', haptic: [{ t: 0, type: 'transient', i: 0.5, s: 0.7 }] });
    if (r.pen) cues.push({ t: T.back - 0.04, sound: 'settle', v: 0.6 });
    if (r.starW) cues.push({ t: T.star + 0.03, sound: 'starBell', haptic: [{ t: 0, type: 'transient', i: 0.7, s: 1 }] });
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [{ at: 0.7, sound: 'glimmer', d: 0.9, v: 0.5 }, { at: 2.6, sound: 'shine', d: 0.7, v: 0.55 }];

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

