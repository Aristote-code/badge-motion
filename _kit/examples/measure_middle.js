  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, protractor: 0.36, dial: [0.62, 1.02], edge: [0.72, 1.08],
    ruler: [0.95, 1.35], ticks: [1.4, 1.98], glint: [2.04, 2.4],
    impact: 2.5, stars: 2.58, shine: [2.72, 3.42]
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
    const centreOf = el => { const b = stageBox(el); return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h }; };
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

    // Measure before wrapping changes the tree
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const proC = L.protractor ? centreOf(L['protractor-body'] || L.protractor) : C;
    const rulerC = L.ruler ? centreOf(L['ruler-body'] || L.ruler) : C;
    const rTicks = kids(L['ruler-ticks']), rTickC = rTicks.map(centreOf);
    // ruler axis: from the first tick to the last (hole end → tip)
    let axis = { x: Math.SQRT1_2, y: -Math.SQRT1_2 }, rulerLen = 400 * k;
    if (rTickC.length > 1) {
      const a = rTickC[0], z = rTickC[rTickC.length - 1], l = Math.hypot(z.x - a.x, z.y - a.y) || 1;
      axis = { x: (z.x - a.x) / l, y: (z.y - a.y) / l }; rulerLen = l;
    }
    if (L['ruler-body']) { const b = stageBox(L['ruler-body']); rulerLen = Math.max(rulerLen, Math.hypot(b.w, b.h) * 0.9); }
    const pTicks = [...kids(L['protractor-ticks'])].map(el => ({ el, c: centreOf(el) }));
    const eTicks = [...kids(L['protractor-edge-ticks'])].map(el => ({ el, c: centreOf(el) }));
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const protractor = L.protractor ? wrapAt(L.protractor, proC) : null;
    const dial = pTicks.map(t => wrapAt(t.el, t.c));
    const edge = eTicks.map(t => wrapAt(t.el, t.c));
    const ruler = L.ruler ? wrapAt(L.ruler, rulerC) : null;
    if (ruler) {
      ruler.slide = vecLocal(ruler.w, -axis.x * rulerLen * 0.9, -axis.y * rulerLen * 0.9);   // comes in from the hole end
      ruler.angle = Math.atan2(axis.y, axis.x) * DEG;
    }
    const ticks = rTicks.map((el, i) => wrapAt(el, rTickC[i]));

    // Glint that runs along the ruler, masked to the ruler body, moving with the ruler
    let glint = null;
    if (ruler && L['ruler-body']) {
      const host = L.ruler;
      const defs = art.querySelector('defs') || make('defs', {}, art);
      const mask = make('mask', { id: 'fx-glint-mask', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defs);
      const body = L['ruler-body'];
      const m = host.getScreenCTM().inverse().multiply(body.parentNode.getScreenCTM());
      const hg = make('g', { transform: `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})` }, mask);
      const clone = body.cloneNode(true); clone.removeAttribute('id'); clone.style.fill = '#fff'; clone.style.stroke = 'none';
      hg.appendChild(clone);
      const g = make('g', { mask: 'url(#fx-glint-mask)' }, host);
      const c0 = toLocal(host, rulerC.x, rulerC.y);
      const ax = vecLocal(host, axis.x, axis.y), len = Math.hypot(ax.x, ax.y);
      const ang = Math.atan2(ax.y, ax.x) * DEG;
      const band = make('g', {}, g);
      const W = 46 * k * len, H = 300 * k * len;
      make('rect', { x: -W / 2, y: -H / 2, width: W, height: H, fill: 'url(#fx-shine)', opacity: .85 }, band);
      make('rect', { x: W * 0.7, y: -H / 2, width: W * 0.3, height: H, fill: 'url(#fx-shine)', opacity: .6 }, band);
      glint = { band, c0, ang, reach: (rulerLen / 2 + 40 * k) * len };
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
    seed = 41;
    const COLORS = ['#fde15e', '#ffb81a', '#1e9bff', '#2ad0ff', '#f6eaea', '#8f9bff', '#f23a2e'];
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

    rig = { L, badgeW, badgePivot, C, k, ribbons, protractor, dial, edge, ruler, ticks, glint, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'ruler ticks:', ticks.length, 'dial ticks:', dial.length);
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  const tickIn = (t, at) => { const q = prog(t, at, at + 0.18); return q === 0 ? 0 : easeOutBack(q, 3); };

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

    // Protractor swings in, then rocks gently while idle
    if (rig.protractor) {
      const q = prog(t, T.protractor, T.protractor + 0.7);
      const sc = pop(t, T.protractor, 0.55);
      let rot = q === 0 ? 0 : -60 * (1 - easeOutBack(q, 1.8));
      rot += idleOn * 2.2 * Math.sin(idleT * TAU / 4 + 0.8);
      const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.04 : 0;
      set(rig.protractor.w, { transform: xf(rig.protractor.p, rot, sc * (1 + bump)) });
    }

    // Dial ticks sweep on around the arc, edge ticks along the straight edge; idle: a ripple runs through them
    const ripple = (i, n, at) => { if (idleT <= 0) return 0; const ph = (lt - at - (i / Math.max(1, n - 1)) * 0.5) / 0.22; return ph > 0 && ph < 1 ? Math.sin(Math.PI * ph) * idleOn : 0; };
    rig.dial.forEach((d, i, a) => {
      const at = lerp(T.dial[0], T.dial[1], i / Math.max(1, a.length - 1));
      set(d.w, { transform: xf(d.p, 0, tickIn(t, at) * (1 + 0.35 * ripple(i, a.length, 1.6))), opacity: clamp(prog(t, at, at + .08)) });
    });
    rig.edge.forEach((d, i, a) => {
      const at = lerp(T.edge[0], T.edge[1], i / Math.max(1, a.length - 1));
      set(d.w, { transform: xf(d.p, 0, tickIn(t, at) * (1 + 0.35 * ripple(i, a.length, 1.75))), opacity: clamp(prog(t, at, at + .08)) });
    });

    // Ruler slides in along its length (hole end first), settles with a little rock
    if (rig.ruler) {
      const q = prog(t, T.ruler[0], T.ruler[1]);
      const e = q === 0 ? 0 : easeOutBack(q, 1.5);
      const off = { x: rig.ruler.slide.x * (1 - e), y: rig.ruler.slide.y * (1 - e) };
      const after = t - T.ruler[1];
      let rot = after > 0 ? 3 * Math.exp(-after * 6) * Math.sin(after * 20) : 0;
      rot += idleOn * 1.2 * Math.sin(idleT * TAU / 4 + 2.4);
      const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22 + 1) * 0.04 : 0;
      set(rig.ruler.w, { transform: `translate(${off.x} ${off.y}) ${xf(rig.ruler.p, rot, 1 + bump)}`, opacity: q > 0 ? 1 : 0 });
    }

    // Ruler ticks count up from the hole end to the tip; idle ripple follows the glint
    rig.ticks.forEach((d, i, a) => {
      const at = lerp(T.ticks[0], T.ticks[1], i / Math.max(1, a.length - 1));
      set(d.w, { transform: xf(d.p, 0, tickIn(t, at) * (1 + 0.4 * ripple(i, a.length, 0.95))), opacity: clamp(prog(t, at, at + .06)) });
    });

    // Glint runs along the ruler: once after counting, then once per loop
    if (rig.glint) {
      const g = rig.glint;
      const ph = t < CONFIG.intro ? prog(t, T.glint[0], T.glint[1]) : prog(lt, 0.9, 1.4);
      const d = lerp(-g.reach, g.reach, easeInOutCubic(ph));
      const rad = g.ang / DEG;
      set(g.band, { transform: `translate(${g.c0.x + Math.cos(rad) * d} ${g.c0.y + Math.sin(rad) * d}) rotate(${g.ang})`, opacity: ph > 0 && ph < 1 ? 1 : 0 });
    }

    // Sparkle stars burst in after the measure, then twinkle
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
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },                   // medal
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },     // ribbons
    ];
    if (r.protractor) cues.push({ t: T.protractor + 0.03, sound: 'swing', haptic: [{ t: 0.05, type: 'transient', i: 0.5, s: 0.45 }] });
    if (r.dial.length) cues.push({ t: T.dial[0], sound: 'dial', d: T.dial[1] - T.dial[0], n: r.dial.length });
    if (r.ruler) cues.push({ t: T.ruler[0], sound: 'slide', d: T.ruler[1] - T.ruler[0], haptic: [{ t: (T.ruler[1] - T.ruler[0]) * 0.75, type: 'transient', i: 0.6, s: 0.6 }] });
    if (r.ticks.length) cues.push({ t: T.ticks[0], sound: 'zip', d: T.ticks[1] - T.ticks[0], n: r.ticks.length,
      haptic: [{ t: 0, type: 'continuous', d: T.ticks[1] - T.ticks[0], i: 0.32, s: 0.95, ramp: [0.3, 1] }] });
    if (r.glint) cues.push({ t: T.glint[1] - 0.12, sound: 'measured', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 1 }] });
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

