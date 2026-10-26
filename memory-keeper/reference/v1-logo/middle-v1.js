  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds). Story: elephants never forget. The elephant rises into the hexagon, its ear unfolds,
  // the trunk swings up and trumpets three little notes, then it gives a knowing wink.
  const T = {
    rise: [0.34, 0.86], ear: [0.78, 1.28], trunk: [1.12, 1.62], toot: 1.66, notes: [1.68, 1.92, 2.16],
    wink: 2.5, impact: 2.9, stars: 2.98, shine: [3.12, 3.82]
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
    const kids = el => el ? [...el.children].filter(c => c.getBBox && c.getBBox().width + c.getBBox().height > 0) : [];

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;

    // --- measure everything before wrapping changes the tree ---
    const eleB = L.elephant ? centreOf(L.elephant) : null;
    const earB = L.ear ? centreOf(L.ear) : null;
    const trunkB = L.trunk ? centreOf(L.trunk) : null;
    const eyeB = L.eye ? centreOf(L.eye) : null;
    const trunkArt = L.trunk ? L.trunk.getBBox() : null;
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    // the ear hinges where it tucks behind the head; the trunk swings from where it leaves the face
    const ear = earB ? wrapAt(L.ear, { x: earB.left + earB.w * 0.12, y: earB.top + earB.h * 0.5 }) : null;
    const trunk = trunkB ? wrapAt(L.trunk, { x: trunkB.left + trunkB.w * 0.52, y: trunkB.top + trunkB.h * 0.04 }) : null;
    const eye = eyeB ? wrapAt(L.eye, eyeB) : null;
    const ele = eleB ? wrapAt(L.elephant, { x: eleB.x, y: eleB.bottom }) : null;
    const stars = starsInfo.map((s, i) => ({ ...wrapAt(s.el, s.c), i }));

    // three little gold music notes, puffed out of the trunk when it trumpets (drawn in badge space)
    const notes = [];
    if (L.trunk) {
      // badge-local coords = artwork coords (840 x 960); the trunk's bbox is taken before it is wrapped
      const tb = trunkArt;
      const tip = { x: tb.x + tb.width * 0.86, y: tb.y + tb.height * 0.26 };
      const ng = make('g', {}, badgeW);
      [[0, 0, 1], [1, 0, 0.8], [2, 0, 0.92]].forEach(([i, dbl, sz]) => {
        const g = make('g', { opacity: 0 }, ng);
        const inner = make('g', { transform: `scale(${sz * 1.6})` }, g);
        const d = dbl
          ? 'M -9 12 m -9 0 a 9 7 -20 1 0 18 0 a 9 7 -20 1 0 -18 0 M 0 10 V -26 L 30 -32 V 4 M 21 4 m -9 0 a 9 7 -20 1 0 18 0 a 9 7 -20 1 0 -18 0 M 0 -16 L 30 -22'
          : 'M -9 12 m -9 0 a 9 7 -20 1 0 18 0 a 9 7 -20 1 0 -18 0 M 0 10 V -28 Q 4 -16 18 -12 Q 12 -20 14 -26';
        make('path', { d, fill: '#3a1c69', stroke: '#3a1c69', 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, inner);
        make('path', { d, fill: 'url(#gold-fill)', stroke: '#fccb12', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, inner);
        // drift out to the right of the trunk, into the dark face under the ear
        notes.push({ g, i, from: tip, to: { x: tip.x + [205, 150, 95][i], y: tip.y + [18, 60, 96][i] }, wob: (i % 2 ? -1 : 1) });
      });
    }
    // Shine sweep, masked to the hexagon
    let shine = null;
    {
      const src = L.medal || anchor;
      const defs = art.querySelector('defs') || make('defs', {}, art);
      const mask = make('mask', { id: 'fx-shine-mask', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defs);
      const m = badgeW.getScreenCTM().inverse().multiply(src.parentNode.getScreenCTM());
      const holderG = make('g', { transform: `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})` }, mask);
      const clone = src.cloneNode(true);
      clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      [clone, ...clone.querySelectorAll('*')].forEach(e => { e.removeAttribute('filter'); e.removeAttribute('clip-path'); e.style.fill = '#fff'; e.style.stroke = 'none'; e.style.opacity = 1; });
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
    const COLORS = ['#fde15e', '#c280f8', '#f1e6fd', '#8f49da', '#fccb12', '#36d4ff', '#ffffff'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#c280f8'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ele, ear, trunk, eye, notes, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'notes:', notes.length);
  }

/*RAYS*/
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
    const lt = idleT % CONFIG.loop;
    const w = idleT * TAU / CONFIG.loop;
    const st = t - T.impact;

    // Hexagon pops in, squashes on completion
    const kPop = prog(t, 0.0, 0.6);
    const s = kPop === 0 ? 0.001 : easeOutElastic(kPop) * 0.9 + 0.1 * easeOutCubic(kPop);
    const squash = st > 0 ? Math.exp(-st * 7) * Math.sin(st * 26) * 0.05 : 0;
    const tilt = lerp(-10, 0, easeOutBack(kPop, 2.2));
    set(badgeW, { transform: `translate(${P.x} ${P.y}) rotate(${tilt}) scale(${s * (1 + squash)} ${s * (1 - squash)}) translate(${-P.x} ${-P.y})`, opacity: clamp(kPop * 6) });
    set($('fx-glowDisc'), { opacity: easeOutCubic(prog(t, .1, .9)) * (0.9 + 0.1 * Math.sin(t * TAU / 4)) });

    // Elephant rises into the hexagon from below and lands with a squash; then breathes gently
    if (rig.ele) {
      const q = prog(t, T.rise[0], T.rise[1]);
      const up = q === 0 ? 0 : easeOutBack(q, 1.6);
      const land = t > T.rise[1] - 0.12 ? Math.exp(-(t - T.rise[1] + 0.12) * 9) * Math.sin((t - T.rise[1] + 0.12) * 30) * 0.06 : 0;
      const bob = idleOn * 0.012 * Math.sin(w);
      const dy = (1 - up) * 140 * k;
      const sc = lerp(0.55, 1, up);
      const tq = prog(t, T.trunk[0], T.trunk[1] + 0.3), tip = tq > 0 && tq < 1 ? -7 * Math.sin(Math.PI * tq) : 0;   // head tilts back to trumpet
      set(rig.ele.w, { transform: `translate(0 ${dy}) ${xf(rig.ele.p, lerp(-8, 0, up) + tip, sc * (1 + land), sc * (1 - land + bob))}`, opacity: clamp(q * 4) });
    }

    // Ear unfolds out from behind the head (hinge at its root), overshoots, flaps once, then gently fans in the loop
    if (rig.ear) {
      const q = prog(t, T.ear[0], T.ear[1]);
      const open = q === 0 ? 0.08 : easeOutBack(q, 2.4);
      const flapI = t > T.ear[1] ? Math.exp(-(t - T.ear[1]) * 5) * Math.sin((t - T.ear[1]) * 16) * 6 : 0;
      const fan = idleOn * (3.2 * Math.sin(w * 2) );
      set(rig.ear.w, { transform: xf(rig.ear.p, lerp(26, 0, clamp(open)) + flapI + fan, Math.max(open, 0.08), 1), opacity: clamp(q * 5) });
    }

    // Trunk: while the head tilts back it gathers (squeezes in), then puffs out on the "toot!" and settles with a wobble.
    // (No big rotation: the trunk is cut from one silhouette with the head, so swinging it would open a seam.)
    if (rig.trunk) {
      const q = prog(t, T.trunk[0], T.toot);
      const gather = q > 0 && q < 1 ? -0.05 * Math.sin(Math.PI * q) : 0;
      const toot = t > T.toot ? Math.exp(-(t - T.toot) * 6) * Math.sin((t - T.toot) * 20) : 0;
      const sway = idleOn * 0.9 * Math.sin(w + 0.8);
      const sc = 1 + gather + 0.07 * toot + idleOn * 0.012 * Math.sin(w * 2 + 1);
      set(rig.trunk.w, { transform: xf(rig.trunk.p, sway + 1.5 * toot, sc, 1 + gather * 0.6 + 0.05 * toot), opacity: t >= T.rise[0] ? 1 : 0 });
    }

    // Three gold notes puff out of the trunk and drift up, fading
    for (const n of rig.notes) {
      const at = T.notes[n.i];
      const q = prog(t, at, at + 0.95);
      if (q <= 0 || q >= 1) { set(n.g, { opacity: 0 }); continue; }
      const e = 1 - Math.pow(1 - q, 4);
      const x = lerp(n.from.x, n.to.x, e) + n.wob * 10 * Math.sin(q * Math.PI * 2);
      const y = lerp(n.from.y, n.to.y, e);
      const sc = q < 0.25 ? easeOutBack(q / 0.25, 2.5) : 1;
      set(n.g, { transform: `translate(${x} ${y}) rotate(${n.wob * 12 * Math.sin(q * 6)}) scale(${Math.max(sc, .001)})`, opacity: q < 0.7 ? 1 : 1 - (q - 0.7) / 0.3 });
    }

    // Eye: open once the head has risen; a knowing wink, then one blink per loop
    if (rig.eye) {
      let sy = 1;
      const blink = (t0, at, d = 0.22) => { const q = prog(t0, at, at + d); return q > 0 && q < 1 ? 1 - 0.92 * Math.sin(Math.PI * q) : 1; };
      sy = Math.min(blink(t, T.wink, 0.32), idleT > 0 ? blink(lt, 1.2) : 1);
      set(rig.eye.w, { transform: xf(rig.eye.p, 0, 1, sy) });
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
      const ww = Math.pow(Math.max(0, Math.sin((t + s2.ph) * TAU / 4)), 3) * twIn;
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 90 / CONFIG.loop}) scale(${Math.max(s2.s * ww, 0.001)})`, opacity: ww });
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
    ];
    if (r.ele) cues.push(
      { t: T.rise[0], sound: 'rise', d: T.rise[1] - T.rise[0] - 0.1 },
      { t: T.rise[1] - 0.1, sound: 'thump', haptic: [{ t: 0, type: 'transient', i: 0.75, s: 0.3 }, { t: 0.09, type: 'transient', i: 0.3, s: 0.3 }] });
    if (r.ear) cues.push({ t: T.ear[0] + 0.05, sound: 'earflap', d: T.ear[1] - T.ear[0],
      haptic: [{ t: 0, type: 'continuous', d: 0.2, i: 0.3, s: 0.2, ramp: [0.4, 1] }, { t: 0.32, type: 'transient', i: 0.45, s: 0.35 }] });
    if (r.trunk) cues.push(
      { t: T.trunk[0] + 0.02, sound: 'swing', d: T.toot - T.trunk[0] },
      { t: T.toot, sound: 'trumpet', haptic: [{ t: 0, type: 'continuous', d: 0.32, i: 0.5, s: 0.25, ramp: [0.6, 1] }, { t: 0.34, type: 'transient', i: 0.55, s: 0.5 }] });
    const noteNotes = [79, 83, 86];
    r.notes.forEach(n => cues.push({ t: T.notes[n.i] + 0.02, sound: 'note', note: noteNotes[n.i], pan: 0.2 + n.i * 0.25, haptic: [{ t: 0, type: 'transient', i: 0.28, s: 0.9 }] }));
    if (r.eye) cues.push({ t: T.wink, sound: 'wink', haptic: [{ t: 0.08, type: 'transient', i: 0.35, s: 0.8 }] });
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [{ at: 1.2, sound: 'blink', v: 0.5 }, { at: 2.6, sound: 'shine', d: 0.7, v: 0.55 }];

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

