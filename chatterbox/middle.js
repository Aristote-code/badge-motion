  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, yellow: 0.42, purple: 0.92,
    dots: [1.3, 1.76], dotGap: 0.11, dotDur: 0.32,       // typing indicator: two waves
    react: 2.26, ha: [2.42, 2.8],                         // eyes squeeze + mouth opens, then "ha-ha" hops
    burst: 3.04, burstGap: 0.05,
    impact: 3.46, stars: 3.54, shine: [3.68, 4.38]
  };
  const HA = { pre: 0.06, air: 0.2, land: 0.1 };          // one "ha" hop: anticipation, airborne, landing squash
  const IDLE = { dots: 0.3, ha: [1.5, 1.86], burst: 1.56 };

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

    // the "before" face states are hidden in the static artwork (it shows the finished laugh)
    for (const n of ['eyes-open', 'mouth-smile']) if (L[n]) { L[n].removeAttribute('opacity'); L[n].style.opacity = ''; }

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    // a bubble's tail tip = the point of its outline path farthest from the bubble's centre
    const tailTip = el => {
      const c = centreOf(el), path = el.querySelector('path');
      if (!path || !path.getTotalLength) return { x: c.x, y: c.bottom };
      const len = path.getTotalLength(), m = path.getScreenCTM(), sm = stageSvg.getScreenCTM().inverse();
      let best = { x: c.x, y: c.bottom }, bd = -1;
      for (let i = 0; i <= 400; i++) {
        const q = path.getPointAtLength(len * i / 400).matrixTransform(m).matrixTransform(sm);
        const d = (q.x - c.x) ** 2 + (q.y - c.y) ** 2;
        if (d > bd) { bd = d; best = { x: q.x, y: q.y }; }
      }
      return best;
    };
    const yC = L['bubble-yellow'] ? centreOf(L['bubble-yellow']) : C;
    const yTip = L['bubble-yellow'] ? tailTip(L['bubble-yellow']) : C;
    const pC = L['bubble-purple'] ? centreOf(L['bubble-purple']) : C;
    const pTip = L['bubble-purple'] ? tailTip(L['bubble-purple']) : C;
    const faceC = L.face ? centreOf(L.face) : yC;
    const eyesOpenC = L['eyes-open'] ? centreOf(L['eyes-open']) : null;
    const eyesHappyC = L['eyes-happy'] ? centreOf(L['eyes-happy']) : null;
    const smileC = L['mouth-smile'] ? centreOf(L['mouth-smile']) : null;
    const laughB = L['mouth-laugh'] ? centreOf(L['mouth-laugh']) : null;
    const dotEls = kids(L['typing-dots']), dotC = dotEls.map(centreOf);
    const dashEls = kids(L.burst), dashC = dashEls.map(centreOf);
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    // bubbles pop out of their tail tips; the yellow one hops/squashes from a point under its face
    const yellow = L['bubble-yellow'] ? wrapAt(L['bubble-yellow'], yTip) : null;
    if (yellow) {
      yellow.base = toLocal(yellow.w, faceC.x, yTip.y);
      yellow.up = vecLocal(yellow.w, 0, -k);
      yellow.float = vecLocal(yellow.w, 0, 4 * k);
    }
    const purple = L['bubble-purple'] ? wrapAt(L['bubble-purple'], pTip) : null;
    if (purple) purple.float = vecLocal(purple.w, 0, 4 * k);
    const face = L.face ? wrapAt(L.face, faceC) : null;
    if (face) { const d = Math.hypot(pC.x - faceC.x, pC.y - faceC.y) || 1; face.look = vecLocal(face.w, (pC.x - faceC.x) / d * 7 * k, (pC.y - faceC.y) / d * 7 * k); }
    const eyesOpen = eyesOpenC ? wrapAt(L['eyes-open'], eyesOpenC) : null;
    const eyesHappy = eyesHappyC ? wrapAt(L['eyes-happy'], { x: eyesHappyC.x, y: eyesHappyC.bottom }) : null;
    const smile = smileC ? wrapAt(L['mouth-smile'], smileC) : null;
    const laugh = laughB ? wrapAt(L['mouth-laugh'], { x: laughB.x, y: laughB.top }) : null;   // opens from its top edge
    const dots = dotEls.map((el, i) => { const h = wrapAt(el, dotC[i]); return { ...h, i, up: vecLocal(h.w, 0, -15 * k) }; });
    const dashes = dashEls.map((el, i) => {
      const h = wrapAt(el, dashC[i]);
      const dx = dashC[i].x - yC.x, dy = dashC[i].y - yC.y, d = Math.hypot(dx, dy) || 1;
      return { ...h, i, out: vecLocal(h.w, dx / d * 26 * k, dy / d * 26 * k) };
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
    const COLORS = ['#ffd84a', '#c79bff', '#56e84a', '#fff6c8', '#ff7f96', '#8af27a', '#fccb12'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#ffd84a'], [120, 600, 10, 2.3, '#c79bff'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#ffd84a'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#ffd84a'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, yellow, purple, face, eyesOpen, eyesHappy, smile, laugh, dots, dashes, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'dots:', dots.length, 'dashes:', dashes.length,
      'tips:', [yTip, pTip].map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(' / '));
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  const hump = (t, a, b) => { const q = prog(t, a, b); return q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0; };

  // one "ha" hop starting at h: crouch → hop up stretched → land squashed. Returns lift (0..1), stretch (+) / squash (−), mouth pulse
  function haHop(t, h) {
    const a = h, b = a + HA.pre, c = b + HA.air, d = c + HA.land;
    return {
      lift: hump(t, b, c),
      st: -0.11 * hump(t, a, b) + 0.1 * hump(t, b, c) - 0.13 * hump(t, c, d),
      mouth: hump(t, a + 0.02, c + 0.04)
    };
  }
  // one typing-dot bounce
  const dotHop = (t, at) => { const q = prog(t, at, at + T.dotDur); return q > 0 && q < 1 ? Math.sin(Math.PI * easeOutCubic(q)) : 0; };

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
    const lt = idleT % CONFIG.loop;
    const inIdle = idleT > 0;
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

    // "ha-ha": two hops in the intro, a smaller pair every idle loop
    let lift = 0, stretch = 0, mouthPulse = 0;
    for (const h of T.ha) { const o = haHop(t, h); lift += o.lift; stretch += o.st; mouthPulse += o.mouth; }
    if (inIdle) for (const h of IDLE.ha) { const o = haHop(lt, h); lift += 0.55 * o.lift * idleOn; stretch += 0.6 * o.st * idleOn; mouthPulse += 0.7 * o.mouth * idleOn; }
    const impactBump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.05 : 0;

    // Yellow bubble pops out of its tail tip, then hops when it laughs, then floats
    if (rig.yellow) {
      const y = rig.yellow;
      const sc = pop(t, T.yellow, 0.55);
      const rot = lerp(-14, 0, easeOutBack(prog(t, T.yellow, T.yellow + 0.5), 2));
      const fl = idleOn * Math.sin(w);
      const ox = y.up.x * 36 * lift + y.float.x * fl, oy = y.up.y * 36 * lift + y.float.y * fl;
      const sy = 1 + stretch + impactBump, sx = 1 - stretch * 0.8 - impactBump;
      set(y.w, { transform: `translate(${ox} ${oy}) ${xf(y.p, rot + 1.2 * idleOn * Math.sin(w + 0.4), sc)} ${xf(y.base, 0, sx, sy)}`, opacity: t >= T.yellow ? 1 : 0 });
    }

    // Purple bubble pops out of its tail tip, breathes with each typing dot, floats in counter-phase
    let dotBreath = 0;
    const dotLift = rig.dots.map(d => {
      let v = 0;
      for (const w0 of T.dots) v += dotHop(t, w0 + d.i * T.dotGap);
      if (inIdle) v += dotHop(lt, IDLE.dots + d.i * T.dotGap) * idleOn;
      dotBreath += v;
      return v;
    });
    if (rig.purple) {
      const pp = rig.purple;
      const sc = pop(t, T.purple, 0.5) * (1 + 0.012 * dotBreath + impactBump * 0.6);
      const rot = lerp(16, 0, easeOutBack(prog(t, T.purple, T.purple + 0.45), 2));
      const fl = idleOn * Math.sin(w + Math.PI * 0.8);
      set(pp.w, { transform: `translate(${pp.float.x * fl} ${pp.float.y * fl}) ${xf(pp.p, rot - 1.2 * idleOn * Math.sin(w + 2.9), sc)}`, opacity: t >= T.purple ? 1 : 0 });
    }

    // Typing dots: dim while typing, each lights up as it bounces (a wave), twice; then bright
    const dim = 1 - 0.5 * (1 - prog(t, T.react - 0.1, T.react + 0.15));
    rig.dots.forEach((d, i) => {
      const v = dotLift[i];
      set(d.w, { transform: `translate(${d.up.x * v} ${d.up.y * v}) ${xf(d.p, 0, 1 + 0.14 * v)}`, opacity: Math.min(1, dim + 0.5 * v) });
    });

    // Face: glances at the purple bubble while it types, then laughs
    const look = easeInOutCubic(prog(t, T.purple + 0.2, T.purple + 0.45)) * (1 - easeInOutCubic(prog(t, T.react - 0.12, T.react + 0.08)));
    if (rig.face) set(rig.face.w, { transform: `translate(${rig.face.look.x * look} ${rig.face.look.y * look})` });
    const shut = prog(t, T.react, T.react + 0.08);
    if (rig.eyesOpen) set(rig.eyesOpen.w, { transform: xf(rig.eyesOpen.p, 0, 1, 1 - easeInOutCubic(shut)), opacity: shut < 1 ? 1 : 0 });
    if (rig.eyesHappy) {
      const q = prog(t, T.react + 0.06, T.react + 0.36);
      const sq = 1 + 0.12 * mouthPulse * 0.5;
      set(rig.eyesHappy.w, { transform: xf(rig.eyesHappy.p, 0, lerp(0.6, 1, easeOutBack(q, 2.4)) * (2 - sq), lerp(0.2, 1, easeOutBack(q, 2.4)) * sq), opacity: q > 0 ? 1 : 0 });
    }
    const close = prog(t, T.react, T.react + 0.1);
    if (rig.smile) set(rig.smile.w, { transform: xf(rig.smile.p, 0, 1 - 0.4 * close, 1 - close), opacity: close < 1 ? 1 : 0 });
    if (rig.laugh) {
      const q = prog(t, T.react + 0.04, T.react + 0.34);
      const sy = (q === 0 ? 0.001 : easeOutBack(q, 2.6)) * (1 + 0.16 * mouthPulse);
      const sx = lerp(0.55, 1, easeOutBack(q, 1.8)) * (1 - 0.04 * mouthPulse);
      set(rig.laugh.w, { transform: xf(rig.laugh.p, 0, sx, sy), opacity: q > 0 ? 1 : 0 });
    }

    // Burst dashes pop outward one by one, then pulse with each idle laugh
    for (const d of rig.dashes) {
      const at = T.burst + d.i * T.burstGap;
      const q = prog(t, at, at + 0.4);
      const sc = pop(t, at, 0.45);
      const slide = 1 - easeOutCubic(q);
      let pulse = 0;
      if (inIdle) pulse = hump(lt, IDLE.burst + d.i * 0.04, IDLE.burst + d.i * 0.04 + 0.36) * idleOn;
      const ox = -d.out.x * slide + d.out.x * 0.35 * pulse, oy = -d.out.y * slide + d.out.y * 0.35 * pulse;
      set(d.w, { transform: `translate(${ox} ${oy}) ${xf(d.p, 0, sc * (1 + 0.2 * pulse))}`, opacity: q > 0 ? 1 : 0 });
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
      const tw = Math.pow(Math.max(0, Math.sin((t + s2.ph) * TAU / 4)), 3) * twIn;
      set(s2.el, { transform: `translate(${s2.x} ${s2.y}) rotate(${t * 90 / CONFIG.loop}) scale(${Math.max(s2.s * tw, 0.001)})`, opacity: tw });
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
    if (r.yellow) cues.push({ t: T.yellow + 0.02, sound: 'boop', note: 76, pan: -0.3, haptic: [{ t: 0, type: 'transient', i: 0.6, s: 0.45 }] });
    if (r.purple) cues.push({ t: T.purple + 0.02, sound: 'boop', note: 83, pan: 0.35, haptic: [{ t: 0, type: 'transient', i: 0.5, s: 0.6 }] });
    const dotNotes = [88, 91, 93];
    T.dots.forEach(w0 => r.dots.forEach((d, i) => cues.push({ t: w0 + i * T.dotGap + 0.02, sound: 'plink', note: dotNotes[i % 3], pan: 0.15 + i * 0.15,
      haptic: [{ t: 0, type: 'transient', i: 0.18, s: 0.9 }] })));
    if (r.laugh) T.ha.forEach((h, j) => cues.push({ t: h + HA.pre, sound: 'ha', note: j ? 84 : 79, pan: -0.25,
      haptic: [{ t: 0, type: 'transient', i: 0.55 + j * 0.1, s: 0.75 }] }));
    if (r.dashes.length) cues.push({ t: T.burst + 0.02, sound: 'burst', d: r.dashes.length * T.burstGap,
      haptic: [{ t: 0, type: 'transient', i: 0.3, s: 0.8 }] });
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [
    ...[88, 91, 93].map((n, i) => ({ at: IDLE.dots + i * T.dotGap + 0.02, sound: 'plink', note: n, pan: 0.15 + i * 0.15, v: 0.45 })),
    ...IDLE.ha.map((h, j) => ({ at: h + HA.pre, sound: 'ha', note: j ? 84 : 79, pan: -0.25, v: 0.45 })),
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
