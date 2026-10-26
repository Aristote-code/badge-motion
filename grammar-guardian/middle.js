  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, shield: 0.38,
    wings: 0.72, wingOpen: 0.55, rows: [0.84, 0.95, 1.06], rowFan: 0.42,   // rows: coverts, secondaries, primaries
    flaps: [1.52, 1.88], flapDur: 0.32,
    bar: 2.22, fall: 0.3, dot: 0.15,                                       // "!" bar lands at bar+fall, dot `dot` later
    burst: 2.92, star: 2.95,
    impact: 3.3, stars: 3.38, shine: [3.52, 4.22]
  };
  const ROWS = ['coverts', 'secondaries', 'primaries'];

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
    const kids = el => el ? [...el.children].filter(c => c.getBBox && c.getBBox().width + c.getBBox().height > 0) : [];

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const shieldC = L.shield ? centreOf(L.shield) : C;
    // wings: shoulder pivot, rows of feathers; each feather's angle from the shoulder (mirrored for the left wing)
    const wingsInfo = ['left', 'right'].filter(s => L['wing-' + s]).map(s => {
      const side = s === 'left' ? -1 : 1;
      const pv = L[`wing-${s}-pivot`] ? centreOf(L[`wing-${s}-pivot`]) : { x: shieldC.x + side * 80 * k, y: shieldC.y - 30 * k };
      const rows = ROWS.map((r, ri) => {
        const el = L[`wing-${s}-${r}`];
        const feathers = kids(el).map(f => { const c = centreOf(f); return { el: f, a: Math.atan2(c.y - pv.y, (c.x - pv.x) * side) * DEG }; });
        const top = Math.min(...feathers.map(f => f.a));
        feathers.forEach(f => { f.d = side * (top - f.a); });          // rotation that folds it onto the top feather
        return { el, ri, feathers };
      }).filter(r => r.el);
      return { el: L['wing-' + s], side, pv, rows };
    });
    const barC = L['exclaim-bar'] ? centreOf(L['exclaim-bar']) : null;
    const dotC = L['exclaim-dot'] ? centreOf(L['exclaim-dot']) : null;
    const exC = L.exclaim ? centreOf(L.exclaim) : shieldC;
    const dashInfo = kids(L.burst).map(el => ({ el, c: centreOf(el) }));
    const burstC = L.burst ? centreOf(L.burst) : C;
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const shield = L.shield ? wrapAt(L.shield, shieldC) : null;
    const wings = wingsInfo.map(wi => ({
      ...wrapAt(wi.el, wi.pv), side: wi.side,
      rows: wi.rows.map(r => ({ ...wrapAt(r.el, wi.pv), ri: r.ri, feathers: r.feathers.map(f => ({ ...wrapAt(f.el, wi.pv), d: f.d })) }))
    }));
    const exclaim = L.exclaim ? wrapAt(L.exclaim, { x: exC.x, y: exC.bottom }) : null;
    const drop = h => ({ ...h, up: (() => { const a = toLocal(h.w, 0, 0), b = toLocal(h.w, 0, -210 * k); return { x: b.x - a.x, y: b.y - a.y }; })() });
    const bar = barC ? drop(wrapAt(L['exclaim-bar'], { x: barC.x, y: barC.bottom })) : null;
    const dot = dotC ? drop(wrapAt(L['exclaim-dot'], { x: dotC.x, y: dotC.bottom })) : null;
    if (exclaim) { const a = toLocal(exclaim.w, 0, 0), b = toLocal(exclaim.w, 0, -7 * k); exclaim.bob = { x: b.x - a.x, y: b.y - a.y }; }
    const dashes = dashInfo.map((d, i) => {
      const h = wrapAt(d.el, d.c);
      const a = toLocal(h.w, 0, 0), b = toLocal(h.w, burstC.x - d.c.x, burstC.y - d.c.y);
      return { ...h, i, inward: { x: (b.x - a.x) * 0.35, y: (b.y - a.y) * 0.35 } };
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
    seed = 51;
    const COLORS = ['#fde15e', '#ff7a70', '#b48cff', '#e4d6ff', '#f6eaea', '#e8232f', '#fccb12'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#e4d6ff'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#e4d6ff']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, shield, wings, exclaim, bar, dot, dashes, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'wings:', wings.map(w => w.rows.map(r => r.feathers.length).join('/')), 'dashes:', dashes.length);
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  const easeIn = q => q * q;

  // "!" piece: falls from above (stretched), lands, squashes and wobbles back
  function dropPiece(h, t, land) {
    if (!h) return;
    const q = prog(t, land - T.fall, land);
    const st = t - land;
    let off = 1 - easeIn(q), sx = 1, sy = 1;
    if (st < 0) { sy = 1 + 0.16 * q; sx = 1 - 0.07 * q; }
    else { const w = Math.exp(-st * 7.5) * Math.cos(st * 24); sy = 1 - 0.22 * w; sx = 1 + 0.18 * w; }
    set(h.w, { transform: `translate(${h.up.x * off} ${h.up.y * off}) ${xf(h.p, 0, sx, sy)}`, opacity: clamp(q * 3) });
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

    // Shield pops in; dips a little when the "!" lands and on the finale
    if (rig.shield) {
      let sc = pop(t, T.shield, 0.6);
      const landBar = T.bar + T.fall, landDot = landBar + T.dot;
      for (const at of [landBar, landDot]) { const d = t - at; if (d > 0) sc *= 1 - 0.035 * Math.exp(-d * 9) * Math.sin(d * 30 + 0.3); }
      const sq = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.04 : 0;
      set(rig.shield.w, { transform: xf(rig.shield.p, 0, sc * (1 + sq), sc * (1 - sq)), opacity: t >= T.shield ? 1 : 0 });
    }

    // Wings unfurl from behind the shield (fold → open about the shoulder), rows fan out one after another,
    // then two flaps; idle: one gentle flap per loop
    for (const wg of rig.wings) {
      const q = prog(t, T.wings, T.wings + T.wingOpen);
      let rot = wg.side * 72 * (1 - easeOutBack(q, 1.5));
      const sc = lerp(0.45, 1, easeOutCubic(q));
      for (const fa of T.flaps) { const fq = prog(t, fa, fa + T.flapDur); if (fq > 0 && fq < 1) rot -= wg.side * 17 * Math.sin(Math.PI * fq) * (1 - 0.25 * fq); }
      rot -= wg.side * 9 * Math.pow((1 - Math.cos(w)) / 2, 2) * idleOn;
      set(wg.w, { transform: xf(wg.p, rot, sc), opacity: q > 0 ? 1 : 0 });
      for (const row of wg.rows) {
        const at = T.rows[row.ri] ?? T.rows[0];
        const rq = prog(t, at, at + T.rowFan);
        const fan = rq === 0 ? 0 : easeOutBack(rq, 1.4);
        // rows trail behind each flap a touch, so the feathers ripple
        let lag = 0;
        for (const fa of T.flaps) { const fq = prog(t, fa + 0.05 * row.ri, fa + T.flapDur + 0.05 * row.ri); if (fq > 0 && fq < 1) lag += wg.side * 4 * row.ri * Math.sin(Math.PI * fq); }
        lag += wg.side * 1.5 * row.ri * Math.pow((1 - Math.cos(w - 0.35)) / 2, 2) * idleOn;
        set(row.w, { transform: xf(row.p, lag, lerp(0.8, 1, clamp(fan))), opacity: rq > 0 ? 1 : 0 });
        row.feathers.forEach((f, j) => set(f.w, { transform: xf(f.p, f.d * (1 - fan), 1) }));
      }
    }

    // "!" drops in: bar lands, then the dot; idle: gentle bob
    const landBar = T.bar + T.fall;
    dropPiece(rig.bar, t, landBar);
    dropPiece(rig.dot, t, landBar + T.dot);
    if (rig.exclaim) {
      const b = Math.sin(2 * w) * idleOn, s2 = 1 + 0.03 * Math.sin(2 * w + Math.PI / 2) * idleOn;
      set(rig.exclaim.w, { transform: `translate(${rig.exclaim.bob.x * b} ${rig.exclaim.bob.y * b}) ${xf(rig.exclaim.p, 0, s2, 1 / s2)}` });
    }

    // Burst dashes shoot out from the star; idle: they pulse in a wave
    for (const d of rig.dashes) {
      const at = T.burst + [0, 1, 0, 1][d.i % 4] * 0.06;
      const q = prog(t, at, at + 0.35);
      const sc = pop(t, at, 0.5);
      const pull = 1 - easeOutCubic(q);
      const pulse = 1 + 0.18 * Math.max(0, Math.sin(2 * w - d.i * 0.5)) * idleOn;
      set(d.w, { transform: `translate(${d.inward.x * pull} ${d.inward.y * pull}) ${xf(d.p, 0, sc * pulse)}`, opacity: q > 0 ? 1 : 0 });
    }

    // Star pops (spinning in), sparkles again on the finale, then twinkles
    for (const sp of rig.stars) {
      const at = T.star + sp.i * 0.1;
      let sc = pop(t, at, 0.55);
      const re = prog(t, T.stars, T.stars + 0.4); if (re > 0 && re < 1) sc *= 1 + 0.35 * Math.sin(Math.PI * re);
      const tw = 1 + 0.14 * Math.sin(2 * w + sp.i * 2.1) * idleOn;
      const spin = lerp(-120, 0, easeOutCubic(prog(t, at, at + .55))) + 8 * Math.sin(w) * idleOn;
      set(sp.w, { transform: xf(sp.p, spin, sc * tw) });
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
    const landBar = T.bar + T.fall;
    const cues = [
      { t: 0.02, sound: 'pop', haptic: [{ t: 0, type: 'transient', i: 0.55, s: 0.4 }] },
      { t: T.ribbons + 0.05, sound: 'flap', haptic: [{ t: 0, type: 'transient', i: 0.25, s: 0.3 }] },
    ];
    if (r.shield) cues.push({ t: T.shield, sound: 'boop', haptic: [{ t: 0, type: 'transient', i: 0.6, s: 0.45 }] });
    if (r.wings.length) {
      cues.push({ t: T.wings + 0.02, sound: 'whoosh', d: T.rows[2] + T.rowFan - T.wings,
        haptic: [{ t: 0.05, type: 'continuous', d: 0.4, i: 0.18, s: 0.25, ramp: [0.4, 1] }] });
      T.flaps.forEach((fa, i) => cues.push({ t: fa + 0.03, sound: 'wingflap', note: i, haptic: [{ t: 0, type: 'continuous', d: 0.14, i: 0.32, s: 0.3, ramp: [1, 0.3] }] }));
    }
    if (r.bar) cues.push({ t: landBar, sound: 'ding', note: 88, pan: -0.15, haptic: [{ t: 0, type: 'transient', i: 0.8, s: 1 }] });
    if (r.dot) cues.push({ t: landBar + T.dot, sound: 'ding', note: 93, pan: 0.15, haptic: [{ t: 0, type: 'transient', i: 0.9, s: 1 }] });
    if (r.dashes.length || r.stars.length) cues.push({ t: T.burst, sound: 'burst', haptic: [0, 0.06].map(dt => ({ t: dt, type: 'transient', i: 0.3, s: 0.8 })) });
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
