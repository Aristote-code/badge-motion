  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, base: 0.40, stand: [0.62, 1.02],
    drop: [1.08, 1.36], settle: 0.62,          // mic falls into the yoke, then rocks upright on its pivots
    taps: [2.04, 2.22],                        // "tap tap" on the mic
    notes: [2.44, 2.70, 2.96, 3.24], noteLen: [0.22, 0.22, 0.24, 0.44],
    sides: [-1, 1, -1, 0],                     // which wave fan pulses on each note (0 = both)
    gem: 3.70,
    impact: 3.92, stars: 4.0, shine: [4.14, 4.84]
  };
  const IDLE_BEATS = [0, 1, 2, 3];             // idle wave pulses (seconds into each 4 s loop), alternating L / R

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
    const baseC = L.base ? centreOf(L.base) : null;
    const stemC = L.stem ? centreOf(L.stem) : null;
    const micC = L.mic ? centreOf(L.mic) : C;
    const knobEls = kids(L.knobs), knobC = knobEls.map(centreOf);
    // the pivot: centre between the two knobs (falls back to the mic's middle)
    const pivot = knobC.length >= 2 ? { x: (knobC[0].x + knobC[knobC.length - 1].x) / 2, y: (knobC[0].y + knobC[knobC.length - 1].y) / 2 } : { x: micC.x, y: micC.y };
    const grilleC = L['mic-grille'] ? centreOf(L['mic-grille']) : { x: micC.x, y: micC.top + micC.h * 0.3 };
    // where the stand grows from: the top of the base (where the stem enters)
    const standFoot = stemC ? { x: stemC.x, y: stemC.bottom } : baseC ? { x: baseC.x, y: baseC.top } : C;
    const waveInfo = ['waves-left', 'waves-right'].map((n, si) => kids(L[n]).map((el, j) => {
      const c = centreOf(el), dx = c.x - grilleC.x, dy = c.y - grilleC.y, len = Math.hypot(dx, dy) || 1;
      return { el, c, j, side: si ? 1 : -1, dir: { x: dx / len, y: dy / len } };
    }));
    const gemC = L.gem ? centreOf(L.gem) : null;
    const glintC = L['gem-glint'] ? centreOf(L['gem-glint']) : null;
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const base = L.base ? wrapAt(L.base, { x: baseC.x, y: baseC.bottom }) : null;
    const gem = L.gem ? wrapAt(L.gem, gemC) : null;
    const glint = L['gem-glint'] ? wrapAt(L['gem-glint'], glintC) : null;
    const stand = L.stand ? wrapAt(L.stand, standFoot) : null;
    const knobs = knobEls.map((el, i) => wrapAt(el, knobC[i]));
    const knobsAll = L.knobs ? wrapAt(L.knobs, standFoot) : null;   // follows the stand
    let mic = null;
    if (L.mic) {
      const m = wrapAt(L.mic, pivot);
      mic = { ...m, fall: vecLocal(m.w, 0, -64 * k), unit: vecLocal(m.w, 0, k) };
    }
    const waves = waveInfo.map(list => list.map(wv => {
      const h = wrapAt(wv.el, wv.c);
      return { ...h, j: wv.j, side: wv.side, out: vecLocal(h.w, wv.dir.x * 14 * k, wv.dir.y * 14 * k) };
    }));
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
    const COLORS = ['#fde15e', '#56e84a', '#b56cff', '#ffd23a', '#f6eaea', '#22b52a', '#fccb12'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#56e84a'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, base, stand, knobs, knobsAll, mic, waves, gem, glint, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'waves:', waves.map(w => w.length).join('+'), 'knobs:', knobs.length);
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  const bell1 = q => q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0;          // 0 → 1 → 0 hump

  // how strongly the wave fan on `side` is pulsing at time t (intro notes + idle beats)
  function wavePulse(t, side, j, idleT, idleOn) {
    const lag = j === 1 ? 0 : 0.04;                                        // middle dash leads, outer two follow
    let p = 0;
    T.notes.forEach((at, i) => { if (T.sides[i] === side || T.sides[i] === 0) p = Math.max(p, bell1(prog(t, at + lag, at + lag + (i === 3 ? 0.5 : 0.34))) * (i === 3 ? 1.25 : 1)); });
    if (idleT > 0) {
      const lt = idleT % CONFIG.loop;
      IDLE_BEATS.forEach((b, i) => { if ((i % 2 ? 1 : -1) === side) p = Math.max(p, 0.8 * idleOn * bell1(prog(lt, b + lag, b + lag + 0.34))); });
    }
    return p;
  }
  // which beat (if any) is making the mic bob right now: returns { q 0..1 hump, side }
  function micBeat(t, idleT, idleOn) {
    let best = { h: 0, side: 0 };
    T.notes.forEach((at, i) => { const h = bell1(prog(t, at - 0.02, at + T.noteLen[i] + 0.06)); if (h > best.h) best = { h, side: T.sides[i] }; });
    if (idleT > 0) {
      const lt = idleT % CONFIG.loop;
      IDLE_BEATS.forEach((b, i) => { const h = 0.4 * idleOn * bell1(prog(lt, b, b + 0.3)); if (h > best.h) best = { h, side: i % 2 ? 1 : -1 }; });
    }
    return best;
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

    // Landing jolt: the whole stand dips a touch when the mic lands, and again on the finale
    const land = T.drop[1];
    const jl = t > land ? Math.exp(-(t - land) * 9) * Math.sin((t - land) * 30) * 0.035 : 0;
    const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.04 : 0;

    // Base pops in (squash-and-stretch from its bottom edge)
    if (rig.base) {
      const sc = pop(t, T.base, 0.55);
      const sq = t > T.base ? Math.exp(-(t - T.base) * 8) * Math.sin((t - T.base) * 24) * 0.08 : 0;
      set(rig.base.w, { transform: xf(rig.base.p, 0, sc * (1 + sq), sc * (1 - sq) * (1 - jl * 0.5)), opacity: t >= T.base ? 1 : 0 });
    }

    // Stem + yoke rise out of the base (grow up from the socket with overshoot); knobs ride along
    const qs = prog(t, T.stand[0], T.stand[1]);
    const sy = qs === 0 ? 0.001 : easeOutBack(qs, 2.0);
    const sx = qs > 0 && qs < 1 ? 1 - 0.12 * Math.sin(Math.PI * qs) : 1;
    const standXf = p => xf(p, 0, sx * (1 + jl * 0.6), sy * (1 - jl) * (1 + bump));
    if (rig.stand) set(rig.stand.w, { transform: standXf(rig.stand.p), opacity: t >= T.stand[0] ? 1 : 0 });
    if (rig.knobsAll) set(rig.knobsAll.w, { transform: standXf(rig.knobsAll.p), opacity: t >= T.stand[0] ? 1 : 0 });
    // the knobs give a little "click" when the mic seats on them
    rig.knobs.forEach((kn, i) => {
      const q = prog(t, land + 0.02 + i * 0.03, land + 0.32 + i * 0.03);
      set(kn.w, { transform: xf(kn.p, 0, 1 + 0.25 * bell1(q)) });
    });

    // Mic: falls in tilted, lands on the pivots, rocks upright with a damped bounce; then the taps and the song
    if (rig.mic) {
      const m = rig.mic;
      const qf = prog(t, T.drop[0], T.drop[1]);
      const fallK = 1 - qf * qf;                                             // accelerate into the yoke
      let rot = 0, dy = 0, scx = 1, scy = 1;
      if (t < land) rot = lerp(8, 20, qf);
      else {
        const u = t - land;
        rot = 20 * Math.exp(-u * 5.2) * Math.cos(u * 15.5);                  // settle on the pivots
        const sq = Math.exp(-u * 10) * Math.sin(u * 32) * 0.06;
        scx = 1 + sq; scy = 1 - sq;
      }
      // tap tap: the mic dips under a fingertip
      T.taps.forEach(at => { dy += 7 * bell1(prog(t, at, at + 0.12)); });
      // singing: bob up and lean towards the side that sings
      const beat = micBeat(t, idleT, idleOn);
      dy -= 12 * beat.h;
      rot += beat.side * 4 * beat.h;
      const sing = 1 + 0.045 * beat.h;
      // idle: gentle sway on the pivot
      rot += 3 * Math.sin(idleT * TAU / CONFIG.loop) * idleOn;
      const ox = m.fall.x * fallK + m.unit.x * dy, oy = m.fall.y * fallK + m.unit.y * dy;
      set(m.w, { transform: `translate(${ox} ${oy}) ${xf(m.p, rot, scx * sing * (1 + bump), scy * sing * (1 - bump))}`, opacity: t >= T.drop[0] ? clamp(qf * 2.5) : 0 });
    }

    // Sound-wave dashes: each fan pops in with its first note, then pulses outward on every note / idle beat
    rig.waves.forEach(list => list.forEach(wv => {
      const first = T.notes[T.sides.findIndex(sd => sd === wv.side || sd === 0)];
      const lag = wv.j === 1 ? 0 : 0.04;
      const appear = pop(t, first + lag, 0.45);
      const p = wavePulse(t, wv.side, wv.j, idleT, idleOn);
      const sc = appear * (1 + 0.22 * p);
      set(wv.w, { transform: `translate(${wv.out.x * p} ${wv.out.y * p}) ${xf(wv.p, 0, sc)}`, opacity: t >= first + lag ? 1 : 0 });
    }));

    // Gem sparkles (and twinkles once per loop in idle)
    if (rig.gem) {
      const q = prog(t, T.gem, T.gem + 0.4);
      set(rig.gem.w, { transform: xf(rig.gem.p, 0, 1 + 0.22 * bell1(q)) });
    }
    if (rig.glint) {
      const qi = prog(t, T.gem, T.gem + 0.55);
      let sc = qi === 0 ? 0 : easeOutBack(qi, 2.5) * (1 + 0.5 * bell1(qi)), rot = lerp(-90, 0, easeOutCubic(qi));
      if (idleT > 0) { const qq = prog(lt, 1.5, 2.1); sc *= 1 + 0.7 * bell1(qq) * idleOn; rot += 90 * easeInOutCubic(qq) * idleOn; }
      set(rig.glint.w, { transform: xf(rig.glint.p, rot, Math.max(sc, 0.001)), opacity: qi > 0 ? 1 : 0 });
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
    if (r.base) cues.push({ t: T.base + 0.03, sound: 'thump', haptic: [{ t: 0, type: 'transient', i: 0.6, s: 0.35 }] });
    if (r.stand) cues.push({ t: T.stand[0], sound: 'rise', d: T.stand[1] - T.stand[0],
      haptic: [{ t: 0, type: 'continuous', d: 0.3, i: 0.25, s: 0.4, ramp: [0.3, 1] }, { t: 0.34, type: 'transient', i: 0.4, s: 0.6 }] });
    if (r.mic) {
      cues.push(
        { t: T.drop[0], sound: 'fall', d: T.drop[1] - T.drop[0] },
        { t: T.drop[1], sound: 'land', haptic: [{ t: 0, type: 'transient', i: 0.75, s: 0.55 }] },
        { t: T.drop[1] + 0.3, sound: 'seat', haptic: [{ t: 0, type: 'transient', i: 0.3, s: 0.8 }] },
        ...T.taps.map((at, i) => ({ t: at, sound: 'tap', v: 1 - i * 0.1, haptic: [{ t: 0, type: 'transient', i: 0.4, s: 0.3 }] }))
      );
    }
    const melody = [79, 84, 88, 91];                                         // G5 C6 E6 G6
    T.notes.forEach((at, i) => cues.push({ t: at, sound: 'sing', note: melody[i], d: T.noteLen[i], pan: T.sides[i] * 0.45,
      haptic: [{ t: 0, type: 'transient', i: i === 3 ? 0.45 : 0.3, s: 0.7 }].concat(i === 3 ? [{ t: 0.05, type: 'continuous', d: 0.3, i: 0.18, s: 0.3, ramp: [1, 0.2] }] : []) }));
    if (r.gem) cues.push({ t: T.gem, sound: 'gem', haptic: [{ t: 0, type: 'transient', i: 0.3, s: 1 }] });
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
