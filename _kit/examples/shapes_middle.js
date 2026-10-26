  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16,
    shapes: { triangle: 0.42, circle: 0.6, square: 0.78 },
    arrows: { 'arrow-top': [1.0, 1.32], 'arrow-left': [1.14, 1.46] },
    hops: [1.62, 1.92, 2.22], hopDur: 0.28,
    impact: 2.6, stars: 2.68, shine: [2.82, 3.52]
  };
  const SPIN = { triangle: 120, square: 90, circle: 0 };   // spin per hop (adds up to whole turns over 3 hops)

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
    set(art, { x: 125, y: 95, width: 750, height: 790, overflow: 'visible', preserveAspectRatio: 'xMidYMid meet' });
    art.removeAttribute('style');
    holder.appendChild(art);

    const L = {};
    for (const n of LAYERS) L[n] = findLayer(art, n);
    const found = LAYERS.filter(n => L[n]), missing = LAYERS.filter(n => !L[n]);
    const centreOf = el => { const b = stageBox(el); return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h }; };
    const wrapAt = (el, stagePt) => { const w = wrap(el); return { w, p: toLocal(w, stagePt.x, stagePt.y) }; };
    const vecLocal = (el, dx, dy) => { const a = toLocal(el, 0, 0), b = toLocal(el, dx, dy); return { x: b.x - a.x, y: b.y - a.y }; };
    // Visual centre of a shape: average of points around its biggest outline (true centre for triangles too)
    const outlineCentre = el => {
      const paths = shapesOf(el).filter(s => typeof s.getTotalLength === 'function' && s.getTotalLength() > 0);
      if (!paths.length) return centreOf(el);
      const big = paths.reduce((a, b) => (stageBox(a).w * stageBox(a).h >= stageBox(b).w * stageBox(b).h ? a : b));
      const len = big.getTotalLength(), m = big.getScreenCTM(), sm = stageSvg.getScreenCTM().inverse();
      let x = 0, y = 0;
      for (let i = 0; i < 120; i++) { const q = big.getPointAtLength(len * i / 120).matrixTransform(m).matrixTransform(sm); x += q.x; y += q.y; }
      return { x: x / 120, y: y / 120 };
    };

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // Measure before wrapping changes the tree
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const shapeNames = ['triangle', 'circle', 'square'].filter(n => L[n]);
    const shapeInfo = shapeNames.map(n => ({ name: n, el: L[n], c: outlineCentre(L[n]) }));
    // Cycle centre: middle of the shapes; slots ordered clockwise around it
    const cc = shapeInfo.length ? { x: shapeInfo.reduce((s, q) => s + q.c.x, 0) / shapeInfo.length, y: shapeInfo.reduce((s, q) => s + q.c.y, 0) / shapeInfo.length } : C;
    shapeInfo.forEach(q => { q.ang = Math.atan2(q.c.y - cc.y, q.c.x - cc.x); q.rad = Math.hypot(q.c.x - cc.x, q.c.y - cc.y); });
    const slots = [...shapeInfo].sort((a, b) => a.ang - b.ang);
    shapeInfo.forEach(q => { q.slot = slots.indexOf(q); });
    const arrowInfo = ['arrow-top', 'arrow-left'].filter(n => L[n]).map(n => {
      const all = shapesOf(L[n]);
      const isStroke = s => (s.getAttribute('fill') || getComputedStyle(s).fill) === 'none';
      return { name: n, lines: all.filter(isStroke), heads: all.filter(s => !isStroke(s)) };
    });
    const headCentres = arrowInfo.map(a => a.heads.map(h => centreOf(h)));
    const starsInfo = L.sparkles ? [...L.sparkles.children].map(el => ({ el, c: centreOf(el) })) : [];

    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const shapes = shapeInfo.map(q => {
      const { w, p } = wrapAt(q.el, q.c);
      // positions along the hop path (stage), turned into local offsets from the shape's home
      const offsetAt = (slotF) => {
        const n = slots.length, i0 = Math.floor(slotF) % n, i1 = (i0 + 1) % n, f = slotF - Math.floor(slotF);
        const a0 = slots[i0].ang; let a1 = slots[i1].ang; while (a1 <= a0) a1 += TAU;
        const a = lerp(a0, a1, f), r = lerp(slots[i0].rad, slots[i1].rad, f);
        return vecLocal(w, cc.x + Math.cos(a) * r - q.c.x, cc.y + Math.sin(a) * r - q.c.y);
      };
      const path = [];
      for (let i = 0; i <= 3 * 24; i++) path.push(offsetAt(q.slot + i / 24));     // 3 hops, 24 samples each
      return { name: q.name, w, p, path };
    });
    const arrows = arrowInfo.map((a, i) => {
      a.lines.forEach(s => s.setAttribute('pathLength', '1'));
      return { name: a.name, lines: a.lines, heads: a.heads.map((h, j) => ({ ...wrapAt(h, headCentres[i][j]) })) };
    });
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
    seed = 31;
    const COLORS = ['#fde15e', '#f23a2e', '#1e9bff', '#ffc21f', '#f6eaea', '#16c8ff', '#ff6a4d'];
    const cg = $('fx-confetti'); cg.replaceChildren();
    const confetti = [];
    for (let i = 0; i < 80; i++) {
      const a = rnd() * TAU, sp = (380 + rnd() * 520) * k;
      const kind = rnd();
      // confetti in the badge's own shapes: triangles, circles and squares
      const el = kind < .33 ? make('path', { d: 'M 0 -8 L 7 5 L -7 5 Z' }, cg) : kind < .66 ? make('circle', { r: 4 + rnd() * 3 }, cg) : make('rect', { x: -5, y: -5, width: 10, height: 10, rx: 2 }, cg);
      el.setAttribute('fill', COLORS[i % COLORS.length]);
      confetti.push({ el, a, sp, spin: (rnd() - .5) * 1400, r0: (250 + rnd() * 60) * k, delay: rnd() * .08, life: .9 + rnd() * .7 });
    }
    const tg = $('fx-twinkles'); tg.replaceChildren();
    const twinkles = [
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#1e9bff'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, shapes, arrows, stars, shine, confetti, twinkles };
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing);
  }

  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  // idle signature moves (seconds into each loop)
  const IDLE = { triangle: [0.35, 0.7], square: [0.95, 0.6], circle: [1.6, 0.6] };

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

    // Shapes: pop in one by one, hop around the cycle (3 hops back home), then idle moves
    for (const sh of rig.shapes) {
      const at = T.shapes[sh.name] ?? 0.5;
      let sc = pop(t, at, 0.55);
      let rot = lerp(-35, 0, easeOutCubic(prog(t, at, at + .5)));
      // hops
      let hopF = 0, hopping = 0;
      T.hops.forEach((h0, i) => { const q = prog(t, h0, h0 + T.hopDur); hopF += easeInOutCubic(q); if (q > 0 && q < 1) hopping = Math.sin(Math.PI * q); });
      const idx = Math.min(sh.path.length - 1, hopF * 24);
      const i0 = Math.floor(idx), f = idx - i0, a = sh.path[i0], b = sh.path[Math.min(i0 + 1, sh.path.length - 1)];
      const off = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
      rot += hopF * (SPIN[sh.name] ?? 0);
      sc *= 1 - 0.12 * hopping;                                              // tuck in while travelling
      const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22 + sh.p.x) * 0.06 : 0;
      // idle signature moves
      let sx = 1, sy = 1, dy = 0;
      const [i0t, idur] = IDLE[sh.name] ?? [0, 0];
      const qi = idleT > 0 ? prog(lt, i0t, i0t + idur) : 0;
      if (qi > 0 && qi < 1) {
        if (sh.name === 'triangle') rot += 14 * Math.sin(qi * TAU * 1.5) * (1 - qi) * idleOn;
        if (sh.name === 'square') rot += 90 * easeInOutCubic(qi) * idleOn;
        if (sh.name === 'circle') { const bnc = Math.sin(Math.PI * qi); dy = -26 * k * bnc * idleOn; sx = 1 + 0.08 * Math.sin(qi * TAU * 2) * (1 - qi); sy = 2 - sx; }
      }
      set(sh.w, { transform: `translate(${off.x} ${off.y + dy}) ${xf(sh.p, rot, sc * (1 + bump) * sx, sc * (1 + bump) * sy)}` });
    }

    // Arrows draw on clockwise, heads pop at the end; glow pulses while the shapes hop and idle
    for (const ar of rig.arrows) {
      const [a0, a1] = T.arrows[ar.name] ?? [1, 1.3];
      const q = easeInOutCubic(prog(t, a0, a1));
      let pulse = 0;
      T.hops.forEach(h0 => { const qh = prog(t, h0, h0 + T.hopDur); if (qh > 0 && qh < 1) pulse = Math.max(pulse, Math.sin(Math.PI * qh)); });
      if (idleT > 0) pulse = Math.max(pulse, 0.5 + 0.5 * Math.sin(idleT * TAU / 2 + (ar.name === 'arrow-left' ? Math.PI : 0)) * idleOn - 0.5 * (1 - idleOn));
      for (const ln of ar.lines) {
        const isGlow = /glow/i.test(ln.id || '') || ln.getAttribute('filter');
        set(ln, { 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 - q, opacity: q > 0.002 ? (isGlow ? 0.25 + 0.6 * pulse : 1) : 0 });
      }
      for (const hd of ar.heads) set(hd.w, { transform: xf(hd.p, 0, pop(t, a1 - 0.06, 0.45) * (1 + 0.15 * pulse)) });
    }

    // Sparkle stars burst in after the cycle, then twinkle
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
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 30}) scale(${Math.max(s2.s * w, 0.001)})`, opacity: w });
    }

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
    const names = r.shapes.map(s => s.name);
    const cues = [
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },                   // medal
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },     // ribbons
    ];
    // each shape has its own voice: triangle = bright ting, circle = round boop, square = woody tok
    const voice = { triangle: { s: 'ting', i: 0.45, sh: 1 }, circle: { s: 'round', i: 0.5, sh: 0.2 }, square: { s: 'tok', i: 0.5, sh: 0.6 } };
    for (const n of names) cues.push({ t: T.shapes[n] + 0.02, sound: voice[n].s, haptic: [{ t: 0, type: 'transient', i: voice[n].i, s: voice[n].sh }] });
    for (const [n, [a0, a1]] of Object.entries(T.arrows)) if (r.arrows.some(a => a.name === n))
      cues.push({ t: a0, sound: 'swoosh', d: a1 - a0, pan: n === 'arrow-top' ? 0.4 : -0.4, haptic: [{ t: a1 - a0 - 0.04, type: 'transient', i: 0.35, s: 0.8 }] });
    T.hops.forEach((h0, i) => cues.push({ t: h0 + 0.04, sound: 'hop', step: i, d: T.hopDur,
      haptic: [{ t: 0, type: 'continuous', d: T.hopDur - 0.06, i: 0.3, s: 0.5, ramp: [0.4, 1] }, { t: T.hopDur - 0.04, type: 'transient', i: 0.45 + i * 0.1, s: 0.7 }] }));
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

