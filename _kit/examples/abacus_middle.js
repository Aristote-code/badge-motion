  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, abacus: 0.34, beads: [0.62, 1.5], beadSlide: 0.32,
    plus: 1.7, minus: 1.88, impact: 2.12, stars: 2.2, shine: [2.35, 3.05]
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
    set(art, { x: 125, y: 95, width: 750, height: 790, overflow: 'visible', preserveAspectRatio: 'xMidYMid meet' });
    art.removeAttribute('style');
    holder.appendChild(art);

    const L = {};
    for (const n of LAYERS) L[n] = findLayer(art, n);
    const found = LAYERS.filter(n => L[n]), missing = LAYERS.filter(n => !L[n]);
    const centreOf = el => { const b = stageBox(el); return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h }; };
    const wrapAt = (el, stagePt) => { const w = wrap(el); return { w, p: toLocal(w, stagePt.x, stagePt.y) }; };
    const wrapCentred = el => wrapAt(el, centreOf(el));
    const vecLocal = (el, dx, dy) => { const a = toLocal(el, 0, 0), b = toLocal(el, dx, dy); return { x: b.x - a.x, y: b.y - a.y }; };

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // Measure before wrapping changes the tree
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const frameC = L.frame ? centreOf(L.frame) : (L.abacus ? centreOf(L.abacus) : C);
    // Each row: its beads in order; the rod direction is taken from the first → last bead
    const rowsInfo = ['row-1', 'row-2', 'row-3'].filter(n => L[n]).map(n => {
      const beads = [...L[n].children].filter(c => c.getBBox && c.getBBox().width > 0);
      const cs = beads.map(centreOf);
      const a = cs[0], z = cs[cs.length - 1];
      const len = Math.hypot(z.x - a.x, z.y - a.y) || 1;
      const step = cs.length > 1 ? len / (cs.length - 1) : 60 * k;
      return { beads, cs, dir: { x: (z.x - a.x) / len, y: (z.y - a.y) / len }, step };
    });
    const starsInfo = L.sparkles ? [...L.sparkles.children].map(el => ({ el, c: centreOf(el) })) : [];

    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const abacus = L.abacus ? wrapAt(L.abacus, frameC) : null;
    // Beads slide in from the far end of their rod, one by one, row by row
    const beads = [];
    rowsInfo.forEach((row, ri) => row.beads.forEach((el, bi) => {
      const w = wrap(el);
      const c = row.cs[bi];
      const n = row.beads.length;
      // travel: from beyond the last bead's slot to its own slot, along the rod
      const travel = (n - bi) * row.step + row.step * 0.9;
      beads.push({ w, p: toLocal(w, c.x, c.y), row: ri, idx: bi, travel: vecLocal(w, row.dir.x * travel, row.dir.y * travel), nudge: vecLocal(w, row.dir.x * row.step * 0.55, row.dir.y * row.step * 0.55) });
    }));
    const nB = beads.length;
    beads.forEach((b, i) => { b.at = lerp(T.beads[0], T.beads[1], i / Math.max(1, nB - 1)); });
    const plus = L.plus ? wrapCentred(L.plus) : null;
    const minus = L.minus ? wrapCentred(L.minus) : null;
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
    seed = 21;
    const COLORS = ['#fde15e', '#f23a2e', '#1e9bff', '#ffc21f', '#f6eaea', '#8f9bff', '#3a22c8'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#1e9bff'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, abacus, beads, plus, minus, stars, shine, confetti, twinkles };
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'beads:', beads.length);
  }

  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
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

    // Abacus frame pops in with a twist; nods when the sum completes
    if (rig.abacus) {
      const sc = pop(t, T.abacus, 0.6);
      const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.04 : 0;
      const rot = lerp(-18, 0, easeOutBack(prog(t, T.abacus, T.abacus + .6), 2)) + idleOn * 1.2 * Math.sin(idleT * TAU / 4);
      set(rig.abacus.w, { transform: xf(rig.abacus.p, rot, sc * (1 + bump)) });
    }

    // Beads slide in along their rods (one by one), then idle counting flicks
    for (const b of rig.beads) {
      const q = prog(t, b.at, b.at + T.beadSlide);
      const e = q === 0 ? 0 : easeOutBack(q, 1.6);
      let dx = b.travel.x * (1 - e), dy = b.travel.y * (1 - e);
      // idle: a counting wave — each bead flicks along its rod and back, row by row
      if (idleT > 0) {
        const ph = ((idleT % CONFIG.loop) - 0.4 - b.row * 0.32 - (2 - b.idx) * 0.09) / 0.42;
        if (ph > 0 && ph < 1) { const f = Math.sin(Math.PI * ph) * idleOn; dx += b.nudge.x * f; dy += b.nudge.y * f; }
      }
      const squish = q > 0 && q < 1 ? 1 + 0.12 * Math.sin(Math.PI * q) : 1;
      set(b.w, { transform: `translate(${dx} ${dy}) ${xf(b.p, 0, squish, 1 / squish)}`, opacity: q > 0 ? 1 : 0 });
    }

    // Plus and minus pop in, then bob gently
    for (const [sg, at, ph] of [[rig.plus, T.plus, 0], [rig.minus, T.minus, 1.7]]) {
      if (!sg) continue;
      const sc = pop(t, at, 0.55);
      const bob = idleOn * 6 * k * Math.sin(idleT * TAU / 2 + ph);
      const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22 + ph) * 0.06 : 0;
      set(sg.w, { transform: `translate(0 ${bob}) ${xf(sg.p, lerp(-40, 0, easeOutCubic(prog(t, at, at + .45))), sc * (1 + bump))}` });
    }

    // Sparkle stars burst in after the sum, then twinkle
    for (const sp of rig.stars) {
      const sc = pop(t, T.stars + sp.i * 0.09, 0.5);
      const tw = idleT > 0 ? 1 + 0.25 * Math.sin(idleT * TAU / 2 + sp.i * 2.1) * idleOn : 1;
      set(sp.w, { transform: xf(sp.p, lerp(-90, 0, easeOutCubic(prog(t, T.stars + sp.i * .09, T.stars + sp.i * .09 + .5))), sc * tw) });
    }

    // Shockwave rings
    const kG = prog(t, T.impact, T.impact + .7), kW = prog(t, T.impact + .12, T.impact + .95);
    set($('fx-ringGold'), { r: lerp(330, 520, easeOutCubic(kG)) * k, 'stroke-width': lerp(16, 1, kG), opacity: kG > 0 && kG < 1 ? 1 - kG : 0 });
    set($('fx-ringWhite'), { r: lerp(330, 560, easeOutCubic(kW)) * k, 'stroke-width': lerp(8, 1, kW), opacity: kW > 0 && kW < 1 ? (1 - kW) * 0.8 : 0 });

    // Confetti
    for (const p of rig.confetti) {
      const lt = t - T.impact - 0.03 - p.delay;
      if (lt <= 0 || lt > p.life) { p.el.setAttribute('opacity', 0); continue; }
      const d = p.r0 + p.sp * (1 - Math.exp(-lt * 3.2)) / 3.2;
      const x = C.x + Math.cos(p.a) * d, y = C.y + Math.sin(p.a) * d + 140 * k * lt * lt;
      const sc = 1 - Math.pow(lt / p.life, 3);
      set(p.el, { transform: `translate(${x} ${y}) rotate(${p.a * DEG + p.spin * lt}) scale(${sc} ${sc * Math.abs(Math.cos(lt * 9 + p.a))})`, opacity: 1 });
    }

    // Twinkles around the badge
    const twIn = clamp(prog(t, T.impact + .45, T.impact + 1.15));
    for (const s2 of rig.twinkles) {
      const w = Math.pow(Math.max(0, Math.sin((t + s2.ph) * TAU / 4)), 3) * twIn;
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 30}) scale(${Math.max(s2.s * w, 0.001)})`, opacity: w });
    }

    // Shine sweep: once in the intro, then once per loop
    if (rig.shine) {
      const ph = t < CONFIG.intro ? prog(t, T.shine[0], T.shine[1]) : prog(idleT % CONFIG.loop, 2.6, 3.3);
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
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },                   // medal
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },     // ribbons
      { t: T.abacus + 0.02, sound: 'boop', haptic: [{ t: 0, type: 'transient', i: 0.5, s: 0.5 }] },       // abacus frame
    ];
    // one woody clack per bead as it lands, counting up a C-major scale
    const scale = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];
    r.beads.forEach((b, i) => cues.push({
      t: +(b.at + T.beadSlide * 0.55).toFixed(3), sound: 'clack', note: scale[i % scale.length], pan: -0.4 + (b.idx * 0.4),
      haptic: [{ t: 0, type: 'transient', i: 0.3 + 0.03 * i, s: 0.85 }]
    }));
    cues.push(
      { t: T.plus + 0.02, sound: 'sign', note: 96, pan: -0.5, haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.7 }] },   // + goes up
      { t: T.minus + 0.02, sound: 'sign', note: 91, pan: 0.5, haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.7 }] },   // − answers lower
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

