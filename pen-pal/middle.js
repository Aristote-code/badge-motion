  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16,
    fly: [0.34, 0.86],            // closed envelope flies in and lands (paper tap at the end)
    seal: 1.0,                    // heart seal pops off
    flap: [1.18, 1.34, 1.6],      // flap folds up: gold side shrinks to 0, purple side grows up behind
    slide: [1.6, 2.1],            // letter rises out of the pocket
    lines: [2.12, 2.3, 2.48], lineDur: 0.2,
    heart: 2.7, beats: [2.96, 3.34], beatGap: 0.15,
    burst: [3.48, 3.55, 3.62],
    impact: 3.78, stars: 3.86, shine: [4.0, 4.7]
  };
  const IDLE_BEATS = [0.5, 2.5];  // heart beats twice per 4 s loop

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

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const backB = L['envelope-back'] ? centreOf(L['envelope-back']) : (L.envelope ? centreOf(L.envelope) : C);
    const envC = { x: backB.x, y: backB.y };                         // envelope body centre (flight pivot)
    const hinge = { x: backB.x, y: backB.top };                      // top edge: the flap folds about it
    const letterC = L.letter ? centreOf(L.letter) : null;
    const heartC = L.heart ? centreOf(L.heart) : null;
    const sealC = L.seal ? centreOf(L.seal) : null;
    const lineEls = kids(L['letter-lines']);
    const burstEls = kids(L.burst), burstC = burstEls.map(centreOf);
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    let envelope = null;
    if (L.envelope) {
      const e = wrapAt(L.envelope, envC);
      envelope = { ...e, from: vecLocal(e.w, 400 * k, -330 * k), lift: vecLocal(e.w, 0, (C.y - envC.y) * 0.85) };   // closed envelope sits centred, then settles as the letter rises
      envelope.pl = toLocal(e.w, envC.x, backB.bottom);                // squash from the bottom edge on landing
    }
    const flapOpen = L['flap-open'] ? wrapAt(L['flap-open'], hinge) : null;
    const flapClosed = L['flap-closed'] ? { ...wrapAt(L['flap-closed'], hinge), el: L['flap-closed'] } : null;
    const seal = L.seal && sealC ? wrapAt(L.seal, sealC) : null;
    let letter = null;
    if (L.letter && letterC) {
      const w = wrap(L.letter);
      letter = { w, p: toLocal(w, letterC.x, letterC.bottom), down: vecLocal(w, 0, backB.h * 1.08), bob: vecLocal(w, 0, -5 * k) };
    }
    lineEls.forEach(el => el.setAttribute('pathLength', '1'));
    const heart = L.heart && heartC ? wrapAt(L.heart, heartC) : null;
    const bursts = burstEls.map((el, i) => ({ ...wrapAt(el, burstC[i]), i }));
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
    const COLORS = ['#fde15e', '#ff5a5f', '#a46cf5', '#4ff0a8', '#f6eaea', '#56e84a', '#fccb12'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#a46cf5'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, envelope, flapOpen, flapClosed, seal, letter, lineEls, heart, bursts, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'lines:', lineEls.length, 'bursts:', bursts.length);
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  // one "ba-dum": a strong pulse then a softer one
  const bump1 = (t, at, d = 0.14) => { const q = (t - at) / d; return q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0; };
  const badum = (t, at) => 0.24 * bump1(t, at) + 0.15 * bump1(t, at + T.beatGap);

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
    const lt = idleT % CONFIG.loop;
    const st = t - T.impact;
    const w = idleT * TAU / CONFIG.loop;

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

    // Envelope flies in along an arc (closed, flap down), lands with a paper squash
    const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.05 : 0;
    if (rig.envelope) {
      const e = rig.envelope;
      const q = prog(t, T.fly[0], T.fly[1]);
      const qx = easeOutCubic(q), qy = 1 - Math.pow(1 - q, 1.6);      // x settles first → gentle arc
      const settle = easeInOutCubic(prog(t, T.flap[1], T.slide[1] - 0.05));
      const ox = e.from.x * (1 - qx) + e.lift.x * (1 - settle), oy = e.from.y * (1 - qy) + e.lift.y * (1 - settle);
      const rot = lerp(24, 0, easeOutCubic(q));
      const sc = lerp(0.35, 1, easeOutCubic(q));
      const lq = t - T.fly[1];
      const fq = t - T.flap[1];                                         // little hop as the flap snaps open
      const land = (lq > 0 ? Math.exp(-lq * 9) * Math.sin(lq * 30) * 0.07 : 0) + (fq > 0 ? Math.exp(-fq * 10) * Math.sin(fq * 28) * 0.035 : 0);
      const outer = `translate(${ox} ${oy}) ${xf(e.p, rot, sc)}`;
      set(e.w, { transform: `${outer} ${xf(e.pl, 0, 1 + land, (1 - land) * (1 + bump))}`, opacity: q > 0 ? clamp(q * 5) : 0 });
    }

    // Seal pops off: swell, then shrink + fade
    if (rig.seal) {
      const q = prog(t, T.seal, T.seal + 0.2);
      const sc = q < 0.35 ? 1 + 0.35 * Math.sin(Math.PI * q / 0.35 * 0.5) : lerp(1.35, 0, easeOutCubic((q - 0.35) / 0.65));
      set(rig.seal.w, { transform: xf(rig.seal.p, 0, sc), opacity: 1 - clamp((q - 0.4) / 0.6) });
    }

    // Flap: gold outer side folds up to 0 about the top edge, then the purple inner side grows up behind the letter
    if (rig.flapClosed) {
      const q = prog(t, T.flap[0], T.flap[1]);
      const sy = 1 - q * q;
      set(rig.flapClosed.el, { opacity: q < 1 ? 1 : 0 });
      set(rig.flapClosed.w, { transform: xf(rig.flapClosed.p, 0, 1, sy) });
    }
    if (rig.flapOpen) {
      const q = prog(t, T.flap[1], T.flap[2]);
      const sy = q === 0 ? 0.001 : easeOutBack(q, 2.4);
      const flutter = idleOn * 0.015 * Math.sin(w + 1);
      set(rig.flapOpen.w, { transform: xf(rig.flapOpen.p, 0, 1, sy + flutter), opacity: q > 0 ? 1 : 0 });
    }

    // Letter rises out of the pocket (its parent clips it to the envelope), then bobs
    if (rig.letter) {
      const lr = rig.letter;
      const q = prog(t, T.slide[0], T.slide[1]);
      const e = q === 0 ? 0 : easeOutBack(q, 1.5);
      const bob = idleOn * Math.sin(w);
      const stretch = q > 0 && q < 1 ? 0.06 * Math.sin(Math.PI * q) : 0;
      set(lr.w, { transform: `translate(${lr.down.x * (1 - e) + lr.bob.x * bob} ${lr.down.y * (1 - e) + lr.bob.y * bob}) ${xf(lr.p, 0, 1 - stretch * 0.6, 1 + stretch)}`, opacity: t >= T.slide[0] ? 1 : 0 });
    }

    // Text lines write on left → right
    rig.lineEls.forEach((el, i) => {
      const at = T.lines[i] ?? T.lines[T.lines.length - 1] + 0.18 * (i - T.lines.length + 1);
      const q = easeInOutCubic(prog(t, at, at + T.lineDur));
      set(el, { 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 - q, opacity: q > 0 ? 1 : 0 });
    });

    // Heart pops, beats twice, then beats on a steady rhythm in the idle loop
    if (rig.heart) {
      let sc = pop(t, T.heart, 0.55);
      for (const b of T.beats) sc *= 1 + badum(t, b);
      if (idleT > 0) for (const b of IDLE_BEATS) sc *= 1 + badum(lt, b) * idleOn;
      set(rig.heart.w, { transform: xf(rig.heart.p, lerp(-20, 0, easeOutCubic(prog(t, T.heart, T.heart + 0.4))), sc), opacity: t >= T.heart ? 1 : 0 });
    }

    // Burst dashes pop one by one, then pulse
    for (const b of rig.bursts) {
      const at = T.burst[b.i] ?? T.burst[T.burst.length - 1] + 0.07 * (b.i - T.burst.length + 1);
      let sc = pop(t, at, 0.42);
      if (idleT > 0) sc *= 1 + 0.14 * Math.sin(2 * w - b.i * 0.9) * idleOn;
      set(b.w, { transform: xf(b.p, 0, sc), opacity: t >= at ? 1 : 0 });
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
  const beatHaptic = (v = 1) => [{ t: 0, type: 'transient', i: 0.6 * v, s: 0.35 }, { t: T.beatGap, type: 'transient', i: 0.42 * v, s: 0.3 }];
  function buildCues(r) {
    const cues = [
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },
    ];
    if (r.envelope) cues.push(
      { t: T.fly[0], sound: 'swoosh', d: T.fly[1] - T.fly[0] },
      { t: T.fly[1], sound: 'tap', haptic: [{ t: 0, type: 'transient', i: 0.6, s: 0.45 }] });
    if (r.seal) cues.push({ t: T.seal + 0.04, sound: 'unseal', haptic: [{ t: 0, type: 'transient', i: 0.3, s: 0.8 }] });
    if (r.flapOpen) cues.push({ t: T.flap[0], sound: 'fwip', d: T.flap[2] - T.flap[0], haptic: [{ t: T.flap[1] - T.flap[0], type: 'transient', i: 0.4, s: 0.7 }] });
    if (r.letter) cues.push({ t: T.slide[0], sound: 'glide', d: T.slide[1] - T.slide[0],
      haptic: [{ t: 0, type: 'continuous', d: (T.slide[1] - T.slide[0]) * 0.8, i: 0.22, s: 0.25, ramp: [0.4, 1] }, { t: (T.slide[1] - T.slide[0]) * 0.8, type: 'transient', i: 0.35, s: 0.6 }] });
    const lineNotes = [84, 86, 88, 91];
    r.lineEls.forEach((el, i) => cues.push({ t: (T.lines[i] ?? 2.5) + 0.01, sound: 'tick', note: lineNotes[i % 4], d: T.lineDur, pan: -0.4 + i * 0.3,
      haptic: [{ t: 0, type: 'transient', i: 0.18, s: 0.9 }] }));
    if (r.heart) {
      cues.push({ t: T.heart, sound: 'heartpop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.6 }] });
      T.beats.forEach(b => cues.push({ t: b, sound: 'badum', haptic: beatHaptic() }));
    }
    if (r.bursts.length) cues.push({ t: T.burst[0], sound: 'burst', n: r.bursts.length, haptic: r.bursts.map((b, i) => ({ t: (T.burst[i] ?? T.burst[0]) - T.burst[0], type: 'transient', i: 0.25 + 0.05 * i, s: 0.9 })) });
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [
    { at: IDLE_BEATS[0], sound: 'badum', v: 0.45 },
    { at: IDLE_BEATS[1], sound: 'badum', v: 0.45 },
    { at: 2.6, sound: 'shine', d: 0.7, v: 0.55 }
  ];

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

