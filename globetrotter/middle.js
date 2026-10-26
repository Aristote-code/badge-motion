  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, globe: 0.28, spin: [0.32, 1.4],
    pin1: 1.22, fall: 0.26, route0: 1.6, dash: 0.07, pin2: 2.12,
    plane: 2.5, fly: [2.6, 4.32],
    impact: 4.42, stars: 4.5, shine: [4.64, 5.34]
  };
  const SPIN = 1.6;      // how many continent periods the globe spins through in the intro

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
    const sm = () => stageSvg.getScreenCTM().inverse();
    const samplePath = (el, n) => {           // n+1 stage-space points along a path (by length)
      const len = el.getTotalLength(), m = el.getScreenCTM(), s = sm(), out = [];
      for (let i = 0; i <= n; i++) { const q = el.getPointAtLength(len * i / n).matrixTransform(m).matrixTransform(s); out.push({ x: q.x, y: q.y, f: i / n }); }
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
    const globeC = L['globe-body'] ? centreOf(L['globe-body']) : (L.globe ? centreOf(L.globe) : C);
    // continents: the children are copies of the land strip, one period apart
    const landCopies = kids(L.continents).map(centreOf);
    const periodStage = landCopies.length > 1 ? Math.abs(landCopies[1].x - landCopies[0].x) : globeC.w;
    const pinInfo = ['pin-1', 'pin-2'].filter(n => L[n]).map(n => { const c = centreOf(L[n]); return { el: L[n], tip: { x: c.x, y: c.bottom } }; });
    const shadowEls = kids(L['pin-shadows']), shadowC = shadowEls.map(centreOf);
    const dashEls = kids(L.route), dashC = dashEls.map(centreOf);
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // flight path (pin 2 → round the globe → rest) and the two orbit halves, all in stage space
    const NF = 720;
    const fl = L['flight-path'] ? samplePath(L['flight-path'], NF) : null;
    const ringEls = ['ring-front', 'ring-back'].map(n => L[n]);
    const ringPaths = ringEls.map(g => g ? [...g.querySelectorAll('path')] : []);
    const ringSamples = ringPaths.map(ps => ps.length ? samplePath(ps[0], 240) : []);
    let axis = null;
    if (ringSamples[0].length) {   // the front half runs from one end of the major axis to the other
      const a = ringSamples[0][0], b = ringSamples[0][ringSamples[0].length - 1];
      const ux = b.x - a.x, uy = b.y - a.y, n = Math.hypot(ux, uy);
      axis = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, nx: -uy / n, ny: ux / n, half: n / 2 };
      // make the normal point towards the front half
      const mid = ringSamples[0][120];
      if ((mid.x - axis.cx) * axis.nx + (mid.y - axis.cy) * axis.ny < 0) { axis.nx *= -1; axis.ny *= -1; }
    }
    let flight = null;
    if (fl) {
      let prevA = null;
      for (let i = 0; i <= NF; i++) {
        const p = fl[i], q = fl[Math.min(NF, i + 1)], o = fl[Math.max(0, i - 1)];
        let a = Math.atan2(q.y - o.y, q.x - o.x) * DEG;
        if (prevA !== null) { while (a - prevA > 180) a -= 360; while (a - prevA < -180) a += 360; }
        p.a = a; prevA = a;
        // depth: +1 front, -1 back (distance from the orbit's major axis, normalised by the minor radius)
        let best = { d: Infinity };
        ringSamples.forEach((rs, ri) => rs.forEach(s => { const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2; if (d < best.d) best = { d, ri, f: s.f }; }));
        p.ring = best.ri; p.rf = best.f;
        p.depth = axis ? clamp(((p.x - axis.cx) * axis.nx + (p.y - axis.cy) * axis.ny) / (axis.half * 0.3), -1, 1) : 1;
      }
      flight = { pts: fl, len: L['flight-path'].getTotalLength() };
    }

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const globe = L.globe ? wrapAt(L.globe, globeC) : null;
    let lands = null;
    if (L.continents) { const w = wrap(L.continents); lands = { w, period: vecLocal(w, periodStage, 0).x }; }
    const pins = pinInfo.map((pi, i) => ({ ...wrapAt(pi.el, pi.tip), i, at: i === 0 ? T.pin1 : T.pin2, drop: vecLocal(pi.el, 0, -150 * k).y }));
    const shadows = shadowEls.map((el, i) => wrapAt(el, shadowC[i]));
    const dashes = dashEls.map((el, i) => ({ ...wrapAt(el, dashC[i]), at: T.route0 + i * T.dash }));
    const rings = ringEls.map((g, i) => g ? { g, paths: ringPaths[i], op: g.getAttribute('opacity') ?? '1' } : null);
    rings.forEach(r => r && r.paths.forEach(p => p.setAttribute('pathLength', '1')));
    let plane = null;
    if (L.plane && flight) {
      const end = flight.pts[NF];
      const { w, p } = wrapAt(L.plane, end);
      const ex = vecLocal(w, 1, 0), ey = vecLocal(w, 0, 1);   // measured once, before any animation transform
      plane = { w, p, parent: w.parentNode, after: w.nextSibling, end, toLocal: (dx, dy) => ({ x: ex.x * dx + ey.x * dy, y: ex.y * dx + ey.y * dy }) };
      plane.globeW = globe ? globe.w : null;
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
    const COLORS = ['#fde15e', '#ff7a12', '#36d4ff', '#8af27a', '#f6eaea', '#ff5a52', '#b98cff'];
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

    rig = { L, badgeW, badgePivot, C, k, ribbons, globe, lands, pins, shadows, dashes, rings, flight, plane, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'dashes:', dashes.length, 'pins:', pins.length, 'flight samples:', flight ? flight.pts.length : 0, 'period:', lands && lands.period.toFixed(1));
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  const easeInOutSine = q => -(Math.cos(Math.PI * q) - 1) / 2;

  // flight progress 0..1 along flight-path (smooth take-off, cruise, gentle landing)
  const flightProgress = t => {
    const q = prog(t, T.fly[0], T.fly[1]);
    return 0.5 * easeInOutCubic(q) + 0.5 * easeInOutSine(q);
  };
  // sample the flight path at progress s (interpolated)
  function flightAt(fl, s) {
    const n = fl.pts.length - 1, x = clamp(s) * n, i = Math.min(n - 1, Math.floor(x)), q = x - i;
    const a = fl.pts[i], b = fl.pts[i + 1];
    return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), a: lerp(a.a, b.a, q), depth: lerp(a.depth, b.depth, q), i: q < 0.5 ? i : i + 1 };
  }
  // stroke-dasharray that shows only the parts of each orbit half the plane has flown over
  function trail(fl, upto) {
    const iv = [[], []];
    let cur = null;
    for (let i = 0; i <= upto; i++) {
      const p = fl.pts[i];
      if (p.ring === undefined) continue;
      if (cur && cur.ring === p.ring && Math.abs(p.rf - cur.b) < 0.06) { cur.lo = Math.min(cur.lo, p.rf); cur.hi = Math.max(cur.hi, p.rf); cur.b = p.rf; }
      else { cur = { ring: p.ring, lo: p.rf, hi: p.rf, b: p.rf }; iv[p.ring].push(cur); }
    }
    return iv.map(list => {
      const s = list.map(c => [c.lo, c.hi]).sort((a, b) => a[0] - b[0]);
      const m = [];
      for (const r of s) { if (m.length && r[0] <= m[m.length - 1][1] + 0.01) m[m.length - 1][1] = Math.max(m[m.length - 1][1], r[1]); else m.push([...r]); }
      if (!m.length) return null;
      if (m.length === 1 && m[0][0] <= 0.005 && m[0][1] >= 0.995) return 'full';
      if (m.length === 2 && m[0][0] <= 0.005 && m[1][1] >= 0.995 && m[1][0] <= m[0][1] + 0.01) return 'full';
      const arr = [];
      for (let j = 0; j < m.length; j++) {
        arr.push(Math.max(m[j][1] - m[j][0], 0.0001));
        arr.push(j < m.length - 1 ? m[j + 1][0] - m[j][1] : 1 - m[j][1] + m[0][0] + 0.01);   // +0.01: no stray repeat dot at the path end
      }
      return { arr: arr.join(' '), off: -m[0][0] };
    });
  }

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

    // Globe pops in (and bumps on completion)
    const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.04 : 0;
    if (rig.globe) {
      const sc = pop(t, T.globe, 0.6);
      set(rig.globe.w, { transform: xf(rig.globe.p, 0, sc * (1 + bump)), opacity: t >= T.globe ? 1 : 0 });
    }

    // Continents spin west → east inside the globe, easing to a stop; idle: a slow sway (returns every loop)
    if (rig.lands) {
      const W = rig.lands.period;
      const q = prog(t, T.spin[0], T.spin[1]);
      let x = -SPIN * W * (1 - easeOutCubic(q));
      x += 16 * Math.sin(w) * idleOn;
      x = ((x + W / 2) % W + W) % W - W / 2;
      set(rig.lands.w, { transform: `translate(${x} 0)` });
    }

    // Pins drop onto their tips with a squash, then bounce gently in turn
    rig.pins.forEach((pn, i) => {
      const fallEnd = pn.at + T.fall;
      const q = prog(t, pn.at, fallEnd);
      let dy = pn.drop * (1 - q * q), sx = 1, sy = 1;
      if (t >= fallEnd) {
        const u = t - fallEnd;
        sy = 1 - 0.24 * Math.exp(-u * 9) * Math.cos(u * 26);
        sx = 1 + 0.6 * (1 - sy);
      } else if (q > 0) { sy = 1 + 0.12 * q; sx = 1 - 0.06 * q; }
      let hop = 0;
      if (idleT > 0) {
        const ph = (lt - 0.4 - i * 1.0) / 0.5;
        if (ph > 0 && ph < 1) {
          hop = Math.sin(Math.PI * ph) * idleOn;
          dy += pn.drop * 0.07 * hop;
          const sq = Math.sin(ph * TAU) * 0.05 * idleOn;
          sy *= 1 + sq; sx *= 1 - sq * 0.6;
        }
      }
      set(pn.w, { transform: `translate(0 ${dy}) ${xf(pn.p, 0, sx, sy)}`, opacity: t >= pn.at ? clamp(q * 2.5) : 0 });
      const sh = rig.shadows[i];
      if (sh) { const k2 = q * (1 - 0.25 * hop); set(sh.w, { transform: xf(sh.p, 0, Math.max(k2, .001), Math.max(k2, .001)), opacity: q }); }
    });

    // Route: dashes appear one by one from pin 1 to pin 2
    for (const d of rig.dashes) {
      const q = prog(t, d.at, d.at + 0.22);
      set(d.w, { transform: xf(d.p, 0, q === 0 ? 0.001 : easeOutBack(q, 2.4)), opacity: q > 0 ? 1 : 0 });
    }

    // Plane takes off from pin 2 and flies once round the globe (behind it on the back half) to its rest;
    // the orbit ring is drawn as its trail. Idle: bobs back and forth along a short stretch of the path.
    const fl = rig.flight;
    if (fl) {
      let sProg = flightProgress(t);
      if (idleT > 0) sProg -= (26 / fl.len) * (1 - Math.cos(w)) / 2 * idleOn;   // 26 art units back along the path
      const here = flightAt(fl, sProg);
      // orbit trail
      if (t < T.fly[0]) rig.rings.forEach(r => r && set(r.g, { opacity: 0 }));
      else {
        const tr = trail(fl, here.i);
        rig.rings.forEach((r, ri) => {
          if (!r) return;
          const v = tr[ri];
          if (!v) { set(r.g, { opacity: 0 }); return; }
          set(r.g, { opacity: r.op });
          for (const p of r.paths) {
            if (v === 'full') { p.removeAttribute('stroke-dasharray'); p.removeAttribute('stroke-dashoffset'); }
            else set(p, { 'stroke-dasharray': v.arr, 'stroke-dashoffset': v.off });
          }
        });
      }
      if (rig.plane) {
        const pl = rig.plane, end = pl.end;
        const o = pl.toLocal(here.x - end.x, here.y - end.y);
        const takeoff = pop(t, T.plane, 0.4);
        const persp = 0.84 + 0.16 * (here.depth + 1) / 2;
        // tiny banking wobble in flight
        const fq = prog(t, T.fly[0], T.fly[1]);
        const wob = fq > 0 && fq < 1 ? 4 * Math.sin(fq * TAU * 3) : 0;
        const sc = takeoff * persp * (1 + bump);
        set(pl.w, { transform: `translate(${o.x} ${o.y}) ${xf(pl.p, here.a - end.a + wob, sc)}`, opacity: t >= T.plane ? (here.depth < 0 ? 0.85 : 1) : 0 });
        // behind the globe on the back half
        const behind = here.depth < 0 && t >= T.fly[0];
        if (pl.globeW) {
          const isBehind = pl.w.nextSibling === pl.globeW;
          if (behind && !isBehind) pl.parent.insertBefore(pl.w, pl.globeW);
          else if (!behind && isBehind) pl.parent.insertBefore(pl.w, pl.after);
        }
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
      const w2 = Math.pow(Math.max(0, Math.sin((t + s2.ph) * TAU / 4)), 3) * twIn;
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 90 / CONFIG.loop}) scale(${Math.max(s2.s * w2, 0.001)})`, opacity: w2 });
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
    if (r.globe) cues.push({ t: T.globe + 0.08, sound: 'boop', haptic: [{ t: 0, type: 'transient', i: 0.45, s: 0.35 }] });
    if (r.lands) cues.push({ t: T.spin[0] + 0.06, sound: 'whirr', d: T.spin[1] - T.spin[0] - 0.06, haptic: [{ t: 0, type: 'continuous', d: 0.7, i: 0.18, s: 0.25, ramp: [1, 0.2] }] });
    const pinNotes = [84, 91];   // C6, G6
    r.pins.forEach((pn, i) => cues.push({ t: pn.at + T.fall, sound: 'plink', note: pinNotes[i % 2], pan: i ? 0.35 : -0.45,
      haptic: [{ t: 0, type: 'transient', i: 0.55 + i * 0.1, s: 0.75 }] }));
    const dashNotes = [76, 79, 81, 84, 86, 88, 91, 93];
    r.dashes.forEach((d, i) => cues.push({ t: d.at + 0.01, sound: 'tick', note: dashNotes[i % dashNotes.length], pan: -0.5 + i * 0.15,
      haptic: [{ t: 0, type: 'transient', i: 0.18, s: 0.9 }] }));
    if (r.plane) {
      cues.push(
        { t: T.plane, sound: 'takeoff', haptic: [{ t: 0, type: 'transient', i: 0.35, s: 0.5 }] },
        { t: T.fly[0], sound: 'glide', d: T.fly[1] - T.fly[0], haptic: [{ t: 0, type: 'continuous', d: T.fly[1] - T.fly[0] - 0.05, i: 0.2, s: 0.2, ramp: [0.6, 1, 0.4] }] },
        { t: T.fly[1] - 0.02, sound: 'land', haptic: [{ t: 0, type: 'transient', i: 0.5, s: 0.6 }] }
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
