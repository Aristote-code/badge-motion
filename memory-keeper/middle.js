  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds). Story: a baby elephant peeks up over the edge of the hexagon, slaps its paws on the rim,
  // flaps its ears open, blinks happily, then waves its raised trunk and trumpets three little notes.
  const T = {
    rise: [0.32, 0.82], paws: [0.46, 0.56], ear: [0.92, 1.36], blink: 1.42, trunk: [1.6, 2.2], toot: 2.2,
    notes: [2.22, 2.42, 2.62], bursts: [2.36, 2.44, 2.52, 2.6], impact: 2.95, stars: 3.03, shine: [3.18, 3.88]
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
    const riseB = L.rise ? centreOf(L.rise) : null;
    const earLB = L['ear-left'] ? centreOf(L['ear-left']) : null, earRB = L['ear-right'] ? centreOf(L['ear-right']) : null;
    const trunkB = L.trunk ? centreOf(L.trunk) : null;
    const eyeBs = ['eye-left', 'eye-right'].filter(n => L[n]).map(n => ({ el: L[n], c: centreOf(L[n]) }));
    const browB = L.brows ? centreOf(L.brows) : null;
    const pawBs = ['paw-left', 'paw-right'].filter(n => L[n]).map((n, i) => ({ el: L[n], c: centreOf(L[n]), i }));
    const burstEls = kids(L.burst).map((el, i) => ({ el, c: centreOf(el), i }));
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const rise = riseB ? { ...wrapAt(L.rise, { x: riseB.x, y: riseB.bottom }), drop: riseB.h * 0.75 } : null;
    const rd = rise ? toLocal(rise.w, riseB.x, riseB.bottom + riseB.h * 0.75) : null;
    if (rise) rise.dy = rd.y - rise.p.y;
    // ears hinge where they meet the head (left ear: its right side; right ear: its left side)
    const earL = earLB ? wrapAt(L['ear-left'], { x: earLB.right - earLB.w * 0.12, y: earLB.top + earLB.h * 0.42 }) : null;
    const earR = earRB ? wrapAt(L['ear-right'], { x: earRB.left + earRB.w * 0.12, y: earRB.top + earRB.h * 0.42 }) : null;
    // the raised trunk swings from where it leaves the face (bottom of the trunk layer)
    const trunk = trunkB ? wrapAt(L.trunk, { x: trunkB.left + trunkB.w * 0.3, y: trunkB.bottom }) : null;
    const eyes = eyeBs.map(e => wrapAt(e.el, e.c));
    const brows = browB ? wrapAt(L.brows, browB) : null;
    const paws = pawBs.map(p => ({ ...wrapAt(p.el, { x: p.c.x, y: p.c.bottom }), i: p.i }));
    if (paws.length) paws.forEach(p => { const q = toLocal(p.w, 0, 0), q2 = toLocal(p.w, 0, 60 * k); p.dy = q2.y - q.y; });
    // bursts pop outward from their inner ends (the end nearest the elephant)
    const ec = riseB ? { x: riseB.x, y: riseB.y } : C;
    const bursts = burstEls.map(b => {
      const dx = b.c.x - ec.x, dy = b.c.y - ec.y, L0 = Math.hypot(dx, dy) || 1;
      return { ...wrapAt(b.el, { x: b.c.x - dx / L0 * b.c.w * 0.4, y: b.c.y - dy / L0 * b.c.h * 0.4 }), i: b.i };
    });
    const stars = starsInfo.map((s, i) => ({ ...wrapAt(s.el, s.c), i }));

    // three little gold music notes, trumpeted out of the raised trunk (badge-local = artwork coords)
    const notes = [];
    if (trunkB) {
      const tip = toLocal(badgeW, trunkB.left + trunkB.w * 0.55, trunkB.top + trunkB.h * 0.06);
      const u = toLocal(badgeW, C.x + 100, C.y).x - toLocal(badgeW, C.x, C.y).x;   // 100 stage px in badge units
      const ng = make('g', {}, badgeW);
      [0, 1, 2].forEach(i => {
        const g = make('g', { opacity: 0 }, ng);
        const inner = make('g', { transform: `scale(${[1.25, 1.0, 1.12][i]})` }, g);
        const d = 'M -9 12 m -9 0 a 9 7 -20 1 0 18 0 a 9 7 -20 1 0 -18 0 M 0 10 V -28 Q 4 -16 18 -12 Q 12 -20 14 -26';
        make('path', { d, fill: '#140466', stroke: '#140466', 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, inner);
        make('path', { d, fill: 'url(#gold-fill)', stroke: '#fccb12', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, inner);
        // first note flies furthest, the next ones trail it (no overlaps): up and to the left over the head
        notes.push({ g, i, from: tip, to: { x: tip.x - [0.95, 0.62, 0.3][i] * u, y: tip.y - [0.62, 0.42, 0.22][i] * u }, wob: (i % 2 ? -1 : 1) });
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
    const COLORS = ['#fde15e', '#ce53fb', '#a2c8fc', '#fe8ebe', '#fccb12', '#629cfa', '#ffffff'];
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

    rig = { L, badgeW, badgePivot, C, k, rise, earL, earR, trunk, eyes, brows, paws, bursts, notes, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'notes:', notes.length, 'bursts:', bursts.length, 'paws:', paws.length);
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

    // Elephant peeks up from behind the bottom edge (clipped inside the hexagon), lands with a squash, breathes
    if (rig.rise) {
      const q = prog(t, T.rise[0], T.rise[1]);
      const up = q === 0 ? 0 : easeOutBack(q, 1.5);
      const lt0 = t - T.rise[1] + 0.1;
      const land = lt0 > 0 ? Math.exp(-lt0 * 8) * Math.sin(lt0 * 26) * 0.05 : 0;
      const bob = idleOn * 0.012 * Math.sin(w * 2);
      const tq = prog(t, T.trunk[0], T.toot + 0.35), tilt = tq > 0 && tq < 1 ? -3 * Math.sin(Math.PI * tq) : 0;   // leans into the trumpet
      set(rig.rise.w, { transform: `translate(0 ${(1 - up) * rig.rise.dy}) ${xf(rig.rise.p, tilt + idleOn * 1.2 * Math.sin(w), 1 + land * 0.5, 1 - land + bob)}` });
    }

    // Paws slap onto the rim, one after the other; a little tap in the loop
    for (const p of rig.paws) {
      const at = T.paws[p.i] ?? T.paws[0];
      const q = prog(t, at, at + 0.22);
      const y = (1 - easeOutBack(q, 2)) * p.dy;
      const lt1 = t - at - 0.22;
      const sq = lt1 > 0 ? Math.exp(-lt1 * 10) * Math.sin(lt1 * 32) * 0.08 : 0;
      const tapQ = idleT > 0 ? prog(lt, 0.4 + p.i * 0.18, 0.62 + p.i * 0.18) : 0;
      const tap = tapQ > 0 && tapQ < 1 ? -Math.sin(Math.PI * tapQ) * p.dy * 0.12 * idleOn : 0;
      set(p.w, { transform: `translate(0 ${y + tap}) ${xf(p.p, 0, 1 + sq, 1 - sq)}`, opacity: q > 0 ? 1 : 0 });
    }

    // Ears flap open from folded-in (hinged at the head), overshoot, then fan gently in the loop
    for (const [e, side] of [[rig.earL, -1], [rig.earR, 1]]) {
      if (!e) continue;
      const q = prog(t, T.ear[0] + (side > 0 ? 0.06 : 0), T.ear[1] + (side > 0 ? 0.06 : 0));
      const open = q === 0 ? 0.55 : lerp(0.55, 1, easeOutBack(q, 2.6));
      const lt2 = t - T.ear[1];
      const flap = lt2 > 0 ? Math.exp(-lt2 * 5) * Math.sin(lt2 * 15) * 5 : 0;
      const fan = idleOn * 2.6 * Math.sin(w * 2 + (side > 0 ? 0.5 : 0));
      set(e.w, { transform: xf(e.p, side * (flap + fan) + side * lerp(-10, 0, clamp(q * 1.5)), open, 1) });
    }

    // Eyes: a happy double blink after the ears open, then one blink per loop; brows lift
    const blinkAt = (x, at, d = 0.2) => { const q = prog(x, at, at + d); return q > 0 && q < 1 ? 1 - 0.9 * Math.sin(Math.PI * q) : 1; };
    const eyeS = Math.min(blinkAt(t, T.blink), blinkAt(t, T.blink + 0.26), idleT > 0 ? blinkAt(lt, 1.3) : 1);
    for (const e of rig.eyes) set(e.w, { transform: xf(e.p, 0, 1, eyeS) });
    if (rig.brows) {
      const q = prog(t, T.blink + 0.45, T.blink + 0.95);
      const lift = q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0;
      const lift2 = idleT > 0 ? Math.max(0, Math.sin(w * 2 - 1)) ** 4 * 0.5 * idleOn : 0;
      const v = toLocal(rig.brows.w, 0, 0), v2 = toLocal(rig.brows.w, 0, -8 * k);
      set(rig.brows.w, { transform: `translate(0 ${(v2.y - v.y) * (lift + lift2)})` });
    }

    // Raised trunk waves hello (two swings), then puffs on the "toot!"; sways in the loop
    if (rig.trunk) {
      const q = prog(t, T.trunk[0], T.trunk[1]);
      const wave = q > 0 && q < 1 ? 6 * Math.sin(q * TAU * 2) * Math.sin(Math.PI * q) : 0;
      const lt3 = t - T.toot;
      const toot = lt3 > 0 ? Math.exp(-lt3 * 6) * Math.sin(lt3 * 20) : 0;
      const sway = idleOn * 2.5 * Math.sin(w + 0.8);
      set(rig.trunk.w, { transform: xf(rig.trunk.p, wave + 2 * toot + sway, 1 + 0.05 * toot, 1 + 0.05 * toot) });
    }

    // Three gold notes puff out of the trunk tip and drift up over the head, fading
    for (const n of rig.notes) {
      const at = T.notes[n.i];
      const q = prog(t, at, at + 0.95);
      if (q <= 0 || q >= 1) { set(n.g, { opacity: 0 }); continue; }
      const e = 1 - Math.pow(1 - q, 4);
      const x = lerp(n.from.x, n.to.x, e) + n.wob * 6 * Math.sin(q * Math.PI * 2);
      const y = lerp(n.from.y, n.to.y, e);
      const sc = q < 0.25 ? easeOutBack(q / 0.25, 2.5) : 1;
      set(n.g, { transform: `translate(${x} ${y}) rotate(${n.wob * 12 * Math.sin(q * 6)}) scale(${Math.max(sc, .001)})`, opacity: q < 0.7 ? 1 : 1 - (q - 0.7) / 0.3 });
    }

    // Burst wedges pop out from their inner ends; pulse in the loop
    for (const b of rig.bursts) {
      const at = T.bursts[b.i] ?? T.bursts[T.bursts.length - 1];
      let sc = pop(t, at, 0.45);
      if (idleT > 0) { const ph = (lt - 2.0 - b.i * 0.08) / 0.3; if (ph > 0 && ph < 1) sc *= 1 + 0.18 * Math.sin(Math.PI * ph) * idleOn; }
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
    if (r.rise) cues.push({ t: T.rise[0], sound: 'rise', d: T.rise[1] - T.rise[0] - 0.08 });
    r.paws.forEach(p => cues.push({ t: (T.paws[p.i] ?? T.paws[0]) + 0.2, sound: 'pat', note: p.i, haptic: [{ t: 0, type: 'transient', i: 0.55 - p.i * 0.1, s: 0.35 }] }));
    if (r.earL || r.earR) cues.push({ t: T.ear[0] + 0.04, sound: 'earflap', d: T.ear[1] - T.ear[0],
      haptic: [{ t: 0, type: 'continuous', d: 0.2, i: 0.3, s: 0.2, ramp: [0.4, 1] }, { t: 0.34, type: 'transient', i: 0.45, s: 0.35 }] });
    if (r.eyes.length) cues.push({ t: T.blink, sound: 'wink', haptic: [{ t: 0.08, type: 'transient', i: 0.3, s: 0.8 }, { t: 0.34, type: 'transient', i: 0.3, s: 0.8 }] });
    if (r.trunk) cues.push(
      { t: T.trunk[0] + 0.02, sound: 'swing', d: T.toot - T.trunk[0] },
      { t: T.toot, sound: 'trumpet', haptic: [{ t: 0, type: 'continuous', d: 0.32, i: 0.5, s: 0.25, ramp: [0.6, 1] }, { t: 0.34, type: 'transient', i: 0.55, s: 0.5 }] });
    const noteNotes = [79, 83, 86];
    r.notes.forEach(n => cues.push({ t: T.notes[n.i] + 0.02, sound: 'note', note: noteNotes[n.i], pan: 0.3 - n.i * 0.25, haptic: [{ t: 0, type: 'transient', i: 0.28, s: 0.9 }] }));
    r.bursts.forEach(b => cues.push({ t: (T.bursts[b.i] ?? 2.5) + 0.02, sound: 'ping', note: [88, 91, 93, 96][b.i % 4], pan: b.i < 2 ? -0.5 : 0.5 }));
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [{ at: 1.3, sound: 'blink', v: 0.5 }, { at: 2.6, sound: 'shine', d: 0.7, v: 0.55 }];

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

