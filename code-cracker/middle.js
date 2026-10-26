  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16, lock: 0.32,
    spin: [0.68, 0.72, 0.76],            // per dial (left, middle, right): reels start rolling
    land: [1.34, 2.06, 1.7],             // per dial: lands on its answer (left → right → star in the middle last)
    decel: [0.42, 0.62, 0.46],           // per dial: how long it slows down before landing (the star keeps you waiting)
    unlock: 2.4, swing: 2.56,
    impact: 2.98, stars: 3.06, shine: [3.2, 3.9]
  };
  // Shackle's unlocked pose in the artwork, relative to locked (in artwork units / degrees):
  // lifted LIFT along the body's up axis, then swung SWING degrees about hole-left.
  const SHACKLE = { lift: 40 * 1.10, swing: -13 };   // = gen.py LIFT * SCALE, SWING
  const START_SLOTS = [3, 2, 4];         // how many symbols before the answer each reel shows when the lock appears
  const SPIN_SPEED = 1050;               // deg/s top speed of the reels

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
    // bounds of el in the user space of `space` (works through rotations of ancestors above `space`)
    const boxIn = (el, space) => {
      const m = space.getScreenCTM().inverse().multiply(el.getScreenCTM()), b = el.getBBox();
      const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, sy: Math.hypot(m.c, m.d) };
    };

    let badgeEl = L.badge;
    if (!badgeEl) { badgeEl = make('g', {}); while (art.firstChild) badgeEl.appendChild(art.firstChild); art.appendChild(badgeEl); }
    const anchor = L['medal-outline'] || L.medal || badgeEl;
    const mc = centreOf(anchor);
    const C = { x: mc.x, y: mc.y };
    const k = Math.max(mc.w, mc.h) / 2 / 360;
    const artK = mc.w / 2 / 392;          // artwork px → stage px

    // --- measure everything before wrapping changes the tree ---
    const ribbonsInfo = ['ribbon-left', 'ribbon-right'].filter(n => L[n]).map(n => { const b = stageBox(L[n]); return { el: L[n], top: { x: b.x + b.w / 2, y: b.y }, side: n.endsWith('left') ? -1 : 1 }; });
    const bodyC = L['lock-body'] ? centreOf(L['lock-body']) : (L.padlock ? centreOf(L.padlock) : C);
    const holeL = L['hole-left'] ? centreOf(L['hole-left']) : null;
    const holeR = L['hole-right'] ? centreOf(L['hole-right']) : null;
    // the body's "up" axis in stage space (perpendicular to the line through the two holes)
    const tiltRad = holeL && holeR ? Math.atan2(holeR.y - holeL.y, holeR.x - holeL.x) : 0;
    const up = { x: Math.sin(tiltRad), y: -Math.cos(tiltRad) };
    const dialsInfo = kids(L.dials).map(el => {
      const drum = el.querySelector('[id*="drum"]'), reel = el.querySelector('[id*="reel"]');
      if (!drum || !reel) return null;
      const db = boxIn(drum, reel);
      const slots = kids(reel).map(s => ({ el: s, b: boxIn(s, reel), hidden: s.getAttribute('opacity') === '0' }));
      let face = 0, best = Infinity;
      slots.forEach((s, j) => { const dd = Math.hypot(s.b.x - db.x, s.b.y - db.y); if (!s.hidden && dd < best) { best = dd; face = j; } });
      return { el, reel, db, slots, face, c: centreOf(drum), isStar: !!el.querySelector('[id*="glow"]') };
    }).filter(Boolean);
    const glowC = L['dial-glow'] ? centreOf(L['dial-glow']) : null;
    const burstInfo = kids(L.bursts).map(el => ({ el, c: centreOf(el) }));
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    const bursts = burstInfo.map((b, i) => {
      const r = wrapAt(b.el, b.c), dx = b.c.x - bodyC.x, dy = b.c.y - bodyC.y, len = Math.hypot(dx, dy) || 1;
      return { ...r, i, out: vecLocal(r.w, dx / len * 34 * k, dy / len * 34 * k) };
    });
    const stars = starsInfo.map((s, i) => ({ ...wrapAt(s.el, s.c), i }));
    const padlock = L.padlock ? { ...wrapAt(L.padlock, bodyC), drop: vecLocal(badgeW, up.x * 60 * k, up.y * 60 * k) } : null;

    // Shackle: the artwork is the open pose; locked = pushed down LIFT along the body axis and swung back
    let shackle = null;
    if (L.shackle && holeL) {
      const w = wrap(L.shackle);
      const liftLen = SHACKLE.lift * artK;
      shackle = { w, piv: toLocal(w, holeL.x, holeL.y), down: vecLocal(w, -up.x * liftLen, -up.y * liftLen), swing: SHACKLE.swing };
    }

    // Dials: every slot of the reel sits on a cylinder; render() rolls the cylinder
    const defsEl = art.querySelector('defs') || make('defs', {}, art);
    const dials = dialsInfo.map((d, i) => {
      const n = d.slots.length, step = 360 / n;
      const slots = d.slots.map((s, j) => {
        s.el.removeAttribute('opacity');
        const w = wrap(s.el);
        return { w, x: s.b.x, y: s.b.y, s: s.b.sy || 1, base: (j - d.face) * step };
      });
      // blur wrapper for speed
      const f = make('filter', { id: `fx-reelblur-${i}`, x: '-20%', y: '-60%', width: '140%', height: '220%' }, defsEl);
      const blur = make('feGaussianBlur', { stdDeviation: '0 0' }, f);
      const bw = wrap(d.reel);
      // motion: accelerate (a), cruise, decelerate (dec) onto the answer; total turn rounded so it lands exactly
      const ts = T.spin[i] ?? T.spin[0] + 0.04 * i, tl = T.land[i] ?? ts + 0.8 + 0.3 * i, dec = T.decel[i] ?? 0.45, a = 0.14;
      const D = tl - ts, P = a / 2 + (D - dec - a) + dec / 2;
      const extra = (START_SLOTS[i] ?? 2) * step;
      const turns = Math.max(1, Math.round((SPIN_SPEED * P - extra) / 360));
      const total = turns * 360 + extra, omega = total / P;
      const R = d.db.h / 2 * 1.06;
      return { i, slots, step, cx: d.db.x, cy: d.db.y, R, ts, tl, dec, a, D, total, omega, bw, blur, filterId: `fx-reelblur-${i}`,
               dial: wrapAt(d.el, d.c), isStar: d.isStar };
    });
    // landing order (by time) → note / haptic strength
    [...dials].sort((p, q) => p.tl - q.tl).forEach((d, r) => { d.rank = r; });
    const glow = L['dial-glow'] ? wrapAt(L['dial-glow'], glowC) : null;

    // Shine sweep, masked to the medal
    let shine = null;
    {
      const src = L.medal || anchor;
      const mask = make('mask', { id: 'fx-shine-mask', maskUnits: 'userSpaceOnUse', x: -5000, y: -5000, width: 10000, height: 10000 }, defsEl);
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
    const COLORS = ['#fde15e', '#ff7a12', '#36d4ff', '#4ff0a8', '#f6eaea', '#1d8bfe', '#fccb12'];
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

    rig = { L, badgeW, badgePivot, C, k, ribbons, padlock, shackle, dials, glow, bursts, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'dials:', dials.map(d => `${d.slots.length} slots, ${Math.round(d.total)}°`).join(' | '));
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.max(sx, .001)} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;
  const ring = (t, at, decay = 9, freq = 30) => { const q = t - at; return q > 0 ? Math.exp(-q * decay) * Math.sin(q * freq) : 0; };

  // reel angle (deg, 0 = answer at the front) and speed (deg/s) at time t
  function reelAngle(d, t) {
    const tau = t - d.ts, { a, D, dec, omega, total } = d;
    let pos, v;
    if (tau <= 0) { pos = 0; v = 0; }
    else if (tau < a) { pos = tau * tau / (2 * a); v = tau / a; }
    else if (tau < D - dec) { pos = a / 2 + (tau - a); v = 1; }
    else if (tau < D) { const u = (tau - (D - dec)) / dec; pos = a / 2 + (D - dec - a) + dec * (u - u * u / 2); v = 1 - u; }
    else { pos = a / 2 + (D - dec - a) + dec / 2; v = 0; }
    const ang = -total + omega * pos + 9 * ring(t, d.tl, 13, 34);   // a little click past the detent and back
    return { ang, speed: omega * v };
  }

  function render(t) {
    if (!rig) return;
    const { badgeW, badgePivot: P, C, k } = rig;
    const idleT = Math.max(0, t - CONFIG.intro);
    const idleOn = clamp(idleT * 2);
    const lt = idleT % CONFIG.loop;
    const W = idleT * TAU / CONFIG.loop;
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

    // Padlock drops in (closed), jolts on every dial landing, recoils on unlock
    if (rig.padlock) {
      const pl = rig.padlock, q = prog(t, T.lock, T.lock + 0.6);
      const sc = q === 0 ? 0.001 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q);
      const fall = 1 - easeOutBack(clamp(q * 1.4), 1.6);
      let rot = lerp(-14, 0, easeOutBack(q, 2));
      for (const d of rig.dials) rot += 1.1 * ring(t, d.tl, 10, 34) * (d.i - 1 || 0.6);
      const recoil = 0.05 * ring(t, T.unlock, 9, 30);
      set(pl.w, { transform: `translate(${pl.drop.x * fall} ${pl.drop.y * fall}) ${xf(pl.p, rot, sc * (1 + recoil * 0.5), sc * (1 - recoil))}`, opacity: q > 0 ? 1 : 0 });
    }

    // Shackle: locked until the code is in, then "click-clack": springs up and swings open; idle wobble
    if (rig.shackle) {
      const sh = rig.shackle;
      const tug = -0.12 * Math.sin(Math.PI * prog(t, T.unlock - 0.1, T.unlock));       // tiny pull-down before it pops
      const qa = prog(t, T.unlock, T.unlock + 0.26), a = qa === 0 ? tug : easeOutBack(qa, 2.6);
      const qb = prog(t, T.swing, T.swing + 0.4), b = qb === 0 ? 0 : easeOutBack(qb, 1.8);
      const wob = idleOn * 2.2 * Math.sin(W) + 1.2 * ring(t, T.swing + 0.4, 6, 18);
      set(sh.w, { transform: `translate(${sh.down.x * (1 - a)} ${sh.down.y * (1 - a)}) rotate(${-sh.swing * (1 - b) + wob} ${sh.piv.x} ${sh.piv.y})` });
    }

    // Dials roll like slot reels and land one by one; idle: a tiny nudge in sequence
    for (const d of rig.dials) {
      let { ang, speed } = reelAngle(d, t);
      if (idleT > 0) { const ph = prog(lt, 0.4 + d.i * 0.22, 0.4 + d.i * 0.22 + 0.42); ang += idleOn * 14 * Math.sin(Math.PI * ph) * (1 - ph); }
      for (const sl of d.slots) {
        const th = (sl.base + ang) * Math.PI / 180, c = Math.cos(th);
        if (c <= 0.02) { set(sl.w, { opacity: 0, transform: 'scale(0.001)' }); continue; }
        set(sl.w, { opacity: clamp(c * 5), transform: `translate(${sl.x} ${d.cy + d.R * Math.sin(th)}) scale(1 ${c / sl.s}) translate(${-sl.x} ${-sl.y})` });
      }
      const blur = Math.min(9, speed / 120);
      if (blur > 0.3) { d.bw.setAttribute('filter', `url(#${d.filterId})`); d.blur.setAttribute('stdDeviation', `0 ${blur.toFixed(2)}`); }
      else d.bw.removeAttribute('filter');
      const thunk = ring(t, d.tl, 12, 30);
      set(d.dial.w, { transform: xf(d.dial.p, 0, 1 + 0.035 * Math.abs(thunk), 1 - 0.05 * thunk) });
    }

    // Star glow: flashes when the star dial lands, then breathes
    if (rig.glow) {
      const sd = rig.dials.find(d => d.isStar), at = sd ? sd.tl : T.land[1];
      const q = prog(t, at - 0.02, at + 0.5);
      const flash = q > 0 ? 1 + 0.9 * Math.exp(-q * 4) * (q < 1 ? 1 : 0) : 0;
      const sc = q > 0 ? 1 + 1.1 * Math.sin(Math.PI * Math.min(1, q * 1.6)) * (1 - q) : 1;
      const br = idleOn * 0.2 * Math.sin(W * 2);
      set(rig.glow.w, { transform: xf(rig.glow.p, 0, sc * (1 + br * 0.4)), opacity: clamp(q * 6) * Math.min(1.6, flash) * (1 + br) });
    }

    // Burst dashes pop outward at the finale, then pulse
    for (const b of rig.bursts) {
      const at = T.impact + 0.02 + b.i * 0.03, q = prog(t, at, at + 0.5);
      const sc = pop(t, at, 0.5);
      const out = -0.6 * (1 - easeOutBack(q, 2.4));
      const pulse = idleOn * 0.14 * Math.sin(W * 2 - b.i * 0.7);
      set(b.w, { transform: `translate(${b.out.x * (out + pulse * 0.5)} ${b.out.y * (out + pulse * 0.5)}) ${xf(b.p, 0, sc * (1 + pulse))}`, opacity: q > 0 ? 1 : 0 });
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
    if (r.padlock) cues.push({ t: T.lock + 0.04, sound: 'boop', haptic: [{ t: 0, type: 'transient', i: 0.45, s: 0.5 }] });
    if (r.dials.length) {
      // reel clicks: one woody tick every time a symbol passes the index (from the real reel motion), thinned
      const t0 = Math.min(...r.dials.map(d => d.ts)), t1 = Math.max(...r.dials.map(d => d.tl));
      const ticks = [];
      for (const d of r.dials) {
        let prev = Math.floor(reelAngle(d, d.ts).ang / d.step);
        for (let tt = d.ts; tt < d.tl; tt += 0.004) { const c = Math.floor(reelAngle(d, tt).ang / d.step); if (c !== prev) { ticks.push({ dt: tt - t0, pan: -0.5 + d.i * 0.5 }); prev = c; } }
      }
      ticks.sort((a, b) => a.dt - b.dt);
      const thin = []; for (const tk of ticks) if (!thin.length || tk.dt - thin[thin.length - 1].dt > 0.034) thin.push(tk);
      const landFirst = Math.min(...r.dials.map(d => d.tl));
      cues.push({ t: t0, sound: 'reel', d: t1 - t0, ticks: thin,
        haptic: [{ t: 0, type: 'continuous', d: landFirst - t0 - 0.04, i: 0.18, s: 0.9 }, { t: landFirst - t0 + 0.06, type: 'continuous', d: t1 - landFirst - 0.1, i: 0.12, s: 0.9 }] });
      const notes = [72, 76, 79];                                  // C5, E5, G5 in landing order
      for (const d of r.dials) {
        cues.push({ t: d.tl, sound: 'thunk', note: notes[d.rank % 3], pan: -0.5 + d.i * 0.5,
          haptic: [{ t: 0, type: 'transient', i: 0.45 + d.rank * 0.12, s: 0.75 }] });
        if (d.isStar) cues.push({ t: d.tl + 0.09, sound: 'glint', pan: 0 });
      }
    }
    if (r.shackle) cues.push(
      { t: T.unlock - 0.08, sound: 'click', haptic: [{ t: 0, type: 'transient', i: 0.4, s: 1 }] },
      { t: T.unlock + 0.02, sound: 'unlock', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.55 }, { t: 0.08, type: 'transient', i: 0.6, s: 0.4 }] },
      { t: T.swing + 0.3, sound: 'clack', haptic: [{ t: 0, type: 'transient', i: 0.35, s: 0.6 }] }
    );
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
