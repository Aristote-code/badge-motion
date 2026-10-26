  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, baseline: [0.36, 0.62], bars: [0.56, 0.74, 0.92], barGrow: 0.42,
    line0: 1.18, seg: 0.17,
    loupe: { fly: 2.08, p1: 2.46, p2: 2.84, p3: 3.16, rest: 3.5 },
    impact: 3.62, stars: 3.7, shine: [3.84, 4.54]
  };
  const ZOOM = 1.32;   // lens magnification

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
    const wrapCentred = el => wrapAt(el, centreOf(el));
    const vecLocal = (el, dx, dy) => { const a = toLocal(el, 0, 0), b = toLocal(el, dx, dy); return { x: b.x - a.x, y: b.y - a.y }; };
    const kids = el => el ? [...el.children].filter(c => c.getBBox && c.getBBox().width + c.getBBox().height > 0) : [];

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const baseB = L.baseline ? centreOf(L.baseline) : null;
    const barEls = kids(L.bars), barB = barEls.map(centreOf);
    const nodeEls = kids(L.nodes), nodeC = nodeEls.map(centreOf);
    const targetC = L.target ? centreOf(L.target) : null;
    const lensC = L.lens ? centreOf(L.lens) : (L.loupe ? centreOf(L.loupe) : C);
    // where along the line each node sits (0..1), so each pops exactly when the line reaches it
    const pathEl = L['line-path'];
    const stops = [...nodeC.map((c, i) => ({ kind: 'node', i, c })), ...(targetC ? [{ kind: 'target', c: targetC }] : [])];
    if (pathEl) {
      const len = pathEl.getTotalLength(), m = pathEl.getScreenCTM(), sm = stageSvg.getScreenCTM().inverse();
      const samples = [];
      for (let i = 0; i <= 300; i++) { const q = pathEl.getPointAtLength(len * i / 300).matrixTransform(m).matrixTransform(sm); samples.push({ f: i / 300, x: q.x, y: q.y }); }
      for (const s of stops) { let best = 0, bd = Infinity; for (const p of samples) { const d = (p.x - s.c.x) ** 2 + (p.y - s.c.y) ** 2; if (d < bd) { bd = d; best = p.f; } } s.f = best; }
    } else stops.forEach((s, i) => { s.f = i / Math.max(1, stops.length - 1); });
    stops.sort((a, b) => a.f - b.f);
    stops.forEach((s, i) => { s.at = T.line0 + i * T.seg; });
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];
    // a live copy of the graph for the lens (taken before any animation wrappers are added)
    const graphCopy = L.graph ? L.graph.cloneNode(true) : null;
    if (graphCopy) { graphCopy.removeAttribute('id'); graphCopy.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); }

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const baseline = L.baseline ? wrapAt(L.baseline, { x: baseB.left, y: baseB.y }) : null;          // grows from its left end
    const bars = barEls.map((el, i) => ({ ...wrapAt(el, { x: barB[i].x, y: barB[i].bottom }), i })); // grow up from the baseline
    const nodes = nodeEls.map((el, i) => wrapAt(el, nodeC[i]));
    stops.forEach(s => { if (s.kind === 'node') s.h = nodes[s.i]; });
    const target = L.target ? wrapAt(L.target, targetC) : null;
    const ring = L['target-ring'] ? wrapAt(L['target-ring'], targetC) : null;
    if (target) stops.forEach(s => { if (s.kind === 'target') s.h = target; });
    if (pathEl) pathEl.setAttribute('pathLength', '1');

    // Loupe: flies in, probes the chart (bar → bar → peak), then rests; the lens magnifies live
    let loupe = null;
    if (L.loupe) {
      const { w, p } = wrapAt(L.loupe, lensC);
      const offTo = pt => vecLocal(w, pt.x - lensC.x, pt.y - lensC.y);
      const P1 = barB[0] ? { x: barB[0].x, y: barB[0].top + 10 * k } : lensC;
      const P2 = stops[2] ? stops[2].c : lensC;
      const P3 = targetC ? { x: targetC.x - 20 * k, y: targetC.y + 30 * k } : lensC;
      const L0 = T.loupe;
      const keys = [
        { t: L0.fly, o: offTo({ x: lensC.x + 420 * k, y: lensC.y + 360 * k }), s: 0.35, r: 25 },
        { t: L0.p1, o: offTo(P1), s: 1.04, r: -6 },
        { t: L0.p1 + 0.1, o: offTo(P1), s: 1.04, r: -6 },
        { t: L0.p2, o: offTo(P2), s: 1.04, r: 4 },
        { t: L0.p2 + 0.08, o: offTo(P2), s: 1.04, r: 4 },
        { t: L0.p3, o: offTo(P3), s: 1.04, r: 8 },
        { t: L0.p3 + 0.1, o: offTo(P3), s: 1.04, r: 8 },
        { t: L0.rest, o: { x: 0, y: 0 }, s: 1, r: 0 }
      ];
      loupe = { w, p, keys, hover: vecLocal(w, 14 * k, 9 * k) };
      // live magnified view inside the lens
      if (L['lens-view'] && graphCopy && L.graph) {
        L['lens-view'].replaceChildren();
        const g = make('g', {}, L['lens-view']);
        g.appendChild(graphCopy);
        loupe.view = { g, host: L['lens-view'], graphParent: L.graph.parentNode, lens: L.lens };
      }
    }
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
    seed = 51;
    const COLORS = ['#fde15e', '#ff7a12', '#36d4ff', '#4ff0a8', '#f6eaea', '#1d8bfe', '#fccb12'];
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

    rig = { L, badgeW, badgePivot, C, k, ribbons, baseline, bars, pathEl, stops, nodes, target, ring, loupe, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'bars:', bars.length, 'line stops:', stops.map(s => s.f.toFixed(2)));
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;

  // loupe pose at time t: interpolate between keyframes, then add the idle hover
  function loupePose(lp, t, idleT, idleOn) {
    const ks = lp.keys;
    let o = ks[0].o, s = 0, r = ks[0].r;
    if (t >= ks[0].t) {
      let i = ks.length - 1;
      for (let j = 0; j < ks.length - 1; j++) if (t < ks[j + 1].t) { i = j; break; }
      if (i >= ks.length - 1) { o = ks[ks.length - 1].o; s = ks[ks.length - 1].s; r = ks[ks.length - 1].r; }
      else {
        const a = ks[i], b = ks[i + 1], q = (t - a.t) / (b.t - a.t);
        const e = i === 0 ? easeOutBack(q, 1.3) : easeInOutCubic(q);
        o = { x: lerp(a.o.x, b.o.x, e), y: lerp(a.o.y, b.o.y, e) }; s = lerp(a.s, b.s, i === 0 ? easeOutCubic(q) : e); r = lerp(a.r, b.r, e);
      }
    }
    const w = idleT * TAU / CONFIG.loop;
    o = { x: o.x + lp.hover.x * Math.sin(w) * idleOn, y: o.y + lp.hover.y * Math.sin(2 * w) * idleOn };
    r += 2.5 * Math.sin(w + 0.5) * idleOn;
    return { o, s, r };
  }

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
    const lt = idleT % CONFIG.loop;
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

    // Baseline draws from left to right
    if (rig.baseline) {
      const q = prog(t, T.baseline[0], T.baseline[1]);
      set(rig.baseline.w, { transform: xf(rig.baseline.p, 0, easeOutCubic(q), 1), opacity: q > 0 ? 1 : 0 });
    }

    // Bars grow up from the baseline one by one (overshoot + settle)
    const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.05 : 0;
    for (const b of rig.bars) {
      const at = T.bars[b.i] ?? T.bars[T.bars.length - 1] + 0.18 * (b.i - T.bars.length + 1);
      const q = prog(t, at, at + T.barGrow);
      const sy = q === 0 ? 0.001 : easeOutBack(q, 1.9);
      const sx = q > 0 && q < 1 ? 1 - 0.08 * Math.sin(Math.PI * q) : 1;
      set(b.w, { transform: xf(b.p, 0, sx, sy * (1 + bump)), opacity: q > 0 ? 1 : 0 });
    }

    // Trend line draws node to node; each node pops as the line reaches it, the peak gets a ring ping
    const stops = rig.stops;
    let f = 0;
    if (stops.length) {
      if (t >= stops[stops.length - 1].at) f = 1;
      else for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        if (t < a.at) break;
        if (t < b.at) { f = lerp(a.f, b.f, easeInOutCubic((t - a.at) / (b.at - a.at))); break; }
        f = b.f;
      }
    }
    if (rig.pathEl) set(rig.pathEl, { 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 - f, opacity: t >= (stops[0]?.at ?? 0) ? 1 : 0 });
    stops.forEach((sp, i) => {
      if (!sp.h) return;
      let sc = pop(t, sp.at - 0.02, sp.kind === 'target' ? 0.6 : 0.45);
      if (idleT > 0) { const ph = (lt - 0.5 - i * 0.07) / 0.25; if (ph > 0 && ph < 1) sc *= 1 + 0.22 * Math.sin(Math.PI * ph) * idleOn; }
      set(sp.h.w, { transform: xf(sp.h.p, 0, sc), opacity: t >= sp.at - 0.02 ? 1 : 0 });
    });
    if (rig.ring) {
      const tAt = stops.find(sp => sp.kind === 'target')?.at ?? 2;
      const q = prog(t, tAt + 0.08, tAt + 0.5);
      let sc = q > 0 && q < 1 ? 1 + 0.5 * Math.sin(Math.PI * q) : 1;
      if (idleT > 0) sc *= 1 + 0.18 * Math.max(0, Math.sin(idleT * TAU / 2)) * idleOn;
      set(rig.ring.w, { transform: xf(rig.ring.p, 0, sc) });
    }

    // Loupe: flies in, probes bar → bar → peak, rests, then hovers; lens shows a live magnified view
    if (rig.loupe) {
      const lp = rig.loupe, pose = loupePose(lp, t, idleT, idleOn);
      const sc = pose.s * (1 + bump);
      set(lp.w, { transform: `translate(${pose.o.x} ${pose.o.y}) ${xf(lp.p, pose.r, sc)}`, opacity: t >= lp.keys[0].t ? 1 : 0 });
      if (lp.view && t >= lp.keys[0].t) {
        const { g, host, graphParent, lens } = lp.view;
        const M = el => DOMMatrix.fromMatrix(el.getCTM());
        const lb = lens.getBBox(), gp = M(graphParent);
        const cRoot = new DOMPoint(lb.x + lb.width / 2, lb.y + lb.height / 2).matrixTransform(M(lens));
        const c = cRoot.matrixTransform(gp.inverse());
        const mag = new DOMMatrix().translate(c.x, c.y).scale(ZOOM).translate(-c.x, -c.y);
        const m = M(host).inverse().multiply(gp).multiply(mag);
        g.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
      }
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
    if (r.baseline) cues.push({ t: T.baseline[0], sound: 'swipe', d: T.baseline[1] - T.baseline[0] });
    const barNotes = [72, 76, 79, 84];
    r.bars.forEach((b, i) => cues.push({ t: (T.bars[i] ?? 1) + 0.04, sound: 'grow', note: barNotes[i % 4], d: T.barGrow, pan: -0.5 + i * 0.4,
      haptic: [{ t: 0, type: 'continuous', d: T.barGrow * 0.6, i: 0.25 + i * 0.08, s: 0.4, ramp: [0.3, 1] }, { t: T.barGrow * 0.62, type: 'transient', i: 0.4 + i * 0.1, s: 0.6 }] }));
    const lineNotes = [84, 86, 88, 91, 93, 96, 98];
    r.stops.forEach((sp, i) => cues.push(sp.kind === 'target'
      ? { t: sp.at, sound: 'ping', haptic: [{ t: 0, type: 'transient', i: 0.65, s: 1 }] }
      : { t: sp.at, sound: 'node', note: lineNotes[i % lineNotes.length], pan: -0.6 + i * 0.25, haptic: [{ t: 0, type: 'transient', i: 0.3, s: 0.9 }] }));
    if (r.loupe) {
      const L0 = T.loupe;
      cues.push(
        { t: L0.fly, sound: 'zoom', d: L0.p1 - L0.fly, haptic: [{ t: L0.p1 - L0.fly - 0.04, type: 'transient', i: 0.55, s: 0.5 }] },
        { t: L0.p1 + 0.02, sound: 'probe', note: 88, pan: -0.5, haptic: [{ t: 0, type: 'transient', i: 0.3, s: 0.8 }] },
        { t: L0.p2 + 0.02, sound: 'probe', note: 91, pan: 0, haptic: [{ t: 0, type: 'transient', i: 0.3, s: 0.8 }] },
        { t: L0.p3 + 0.02, sound: 'probe', note: 96, pan: 0.5, haptic: [{ t: 0, type: 'transient', i: 0.35, s: 0.9 }] },
        { t: L0.rest - 0.02, sound: 'settle', haptic: [{ t: 0, type: 'transient', i: 0.45, s: 0.5 }] }
      );
    }
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

