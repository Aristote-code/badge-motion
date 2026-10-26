  // ---------------------------------------------------------------------------
  // Rig: load the SVG and attach animation handles to its layers
  // ---------------------------------------------------------------------------
  let rig = null;
  let seed;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

  // Key moments (seconds)
  const T = {
    ribbons: 0.16,
    drop: [0.34, 0.72],            // closed book falls, lands at drop[1]
    open: [0.9, 1.34],             // front cover swings open: [start, end]
    swap: 1.08,                    // front cover is edge-on: closed book → open covers
    pages: 1.04, pageGap: 0.06, pageGrow: 0.36,   // page layers fan up out of the gutter, back → front
    leaves: [1.52, 1.66, 1.8, 1.94], leafDur: 0.34,  // loose leaves flip right → left (flutter)
    bookmark: [2.38, 2.86],        // ribbon unfurls down
    star: [2.74, 3.18], burst: 3.1,
    impact: 3.4, stars: 3.48, shine: [3.62, 4.32]
  };
  const IDLE_FLIP = [0.5, 1.6];    // idle: the top leaf turns over in this window of each loop

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
    const bookB = L.book ? centreOf(L.book) : null;
    const clB = L['cover-left'] ? centreOf(L['cover-left']) : null, crB = L['cover-right'] ? centreOf(L['cover-right']) : null;
    const gx = clB && crB ? (clB.x + crB.x) / 2 : (bookB ? bookB.x : C.x);          // gutter x (book is symmetric)
    const coverPivot = crB ? { x: gx, y: crB.bottom - crB.h * 0.06 } : C;           // bottom of the gutter
    const pageEls = [...kids(L['pages-left']).map((el, i) => ({ el, i, side: -1 })), ...kids(L['pages-right']).map((el, i) => ({ el, i, side: 1 }))];
    const pageB = pageEls.map(p => centreOf(p.el));
    const leafEls = kids(L.leaves), leafB = leafEls.map(centreOf);
    const gutterTop = leafB[0] ? { x: gx, y: leafB[0].bottom - 6 * k } : (bookB ? { x: gx, y: bookB.y } : C);
    const closedB = L['book-closed'] ? centreOf(L['book-closed']) : null;
    const markB = L.bookmark ? centreOf(L.bookmark) : null;
    const starB = L.star ? centreOf(L.star) : null;
    const burstEls = kids(L.burst);
    const starsInfo = L.sparkles ? kids(L.sparkles).map(el => ({ el, c: centreOf(el) })) : [];

    // --- wrap ---
    const badgeW = wrap(badgeEl);
    badgeW.setAttribute('filter', 'url(#fx-drop)');
    const badgePivot = toLocal(badgeW, C.x, C.y);
    const pTo = toLocal(badgeW, C.x + mc.w, C.y + mc.h);
    const bb = { width: Math.abs(pTo.x - badgePivot.x), height: Math.abs(pTo.y - badgePivot.y) };

    const ribbons = ribbonsInfo.map(r => ({ ...wrapAt(r.el, r.top), side: r.side }));
    // book: falls from above, lands on its spine (squash pivot at the bottom of the gutter)
    let book = null;
    if (L.book) {
      const h = wrapAt(L.book, { x: gx, y: bookB.bottom });
      book = { ...h, fall: vecLocal(h.w, 0, -170 * k) };
    }
    // closed book (hidden in the static art): drops in centred, then its front cover swings open about the spine
    let closed = null;
    if (L['book-closed']) {
      const h = wrapAt(L['book-closed'], { x: gx, y: closedB.y });
      L['book-closed'].setAttribute('opacity', 1);
      closed = { ...h, shift: vecLocal(h.w, C.x - closedB.x, 0), front: L['closed-front'] ? wrapAt(L['closed-front'], { x: gx, y: closedB.y }) : null };
    }
    const spineW = L.spine ? wrapAt(L.spine, { x: gx, y: coverPivot.y }) : null;
    const covers = ['cover-left', 'cover-right'].filter(n => L[n]).map(n => ({ ...wrapAt(L[n], coverPivot), side: n.endsWith('left') ? -1 : 1 }));
    const pages = pageEls.map((p, j) => ({ ...wrapAt(p.el, { x: gx, y: pageB[j].bottom }), i: p.i, side: p.side }));
    const leaves = leafEls.map((el, i) => {
      const h = wrapAt(el, { x: gx, y: leafB[i].bottom });
      // a shade copy of the leaf outline that darkens the page while it is edge-on
      const src = el.querySelector('path');
      let shade = null;
      if (src) { shade = src.cloneNode(false); shade.removeAttribute('id'); set(shade, { fill: '#e0a050', stroke: 'none', opacity: 0 }); src.after(shade); }
      return { ...h, i, shade, lift: vecLocal(h.w, 0, -26 * k) };
    });
    const bookmark = L.bookmark ? wrapAt(L.bookmark, { x: markB.x, y: markB.top }) : null;
    let star = null;
    if (L.star) {
      const h = wrapAt(L.star, starB);
      star = { ...h, from: vecLocal(h.w, gutterTop.x - starB.x, gutterTop.y - starB.y) };
    }
    const bursts = starB ? burstEls.map((el, i) => ({ ...wrapAt(el, starB), i })) : [];
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
    const COLORS = ['#fde15e', '#ff7a12', '#ff5a52', '#a46bff', '#f6eaea', '#7a3cf0', '#fccb12'];
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
      [150, 170, 15, 0.0, '#f6eaea'], [870, 600, 12, 1.1, '#fde15e'], [120, 600, 10, 2.3, '#ffb3a8'],
      [900, 300, 9, 0.6, '#f6eaea'], [250, 930, 11, 3.0, '#fde15e'], [760, 930, 8, 1.7, '#f6eaea'],
      [880, 110, 13, 2.7, '#fde15e'], [100, 380, 8, 3.5, '#f6eaea']
    ].map(([x, y, s, ph, c]) => ({ el: make('use', { href: '#fx-star', fill: c }, tg), x: C.x + (x - 500) * k * .92, y: C.y + (y - 480) * k * .92, s, ph }));

    rig = { L, badgeW, badgePivot, C, k, ribbons, book, closed, spineW, covers, pages, leaves, bookmark, star, bursts, stars, shine, confetti, twinkles };
    buildRays(C, k);
    CUES = buildCues(rig);
    showStatus(`Loaded <b>${label}</b> · animating ${found.length}/${LAYERS.length} layers` + (missing.length ? ` · not found: ${missing.join(', ')}` : ''));
    console.log('[badge] layers found:', found, 'missing:', missing, 'pages:', pages.length, 'leaves:', leaves.length, 'bursts:', bursts.length);
  }

/*RAYS*/
  // ---------------------------------------------------------------------------
  // Timeline: render(t) draws the exact frame for time t (seconds)
  // ---------------------------------------------------------------------------
  const pop = (t, at, dur = 0.45) => { const q = prog(t, at, at + dur); return q === 0 ? 0 : easeOutElastic(q) * 0.85 + 0.15 * easeOutCubic(q); };
  const xf = (p, rot, sx, sy = sx) => `translate(${p.x} ${p.y}) rotate(${rot}) scale(${Math.abs(sx) < .001 ? .001 * (sx < 0 ? -1 : 1) : sx} ${Math.max(sy, .001)}) translate(${-p.x} ${-p.y})`;

  // where a leaf is in its turn: -1 = lying on the right stack, +1 = lying on the left stack
  function leafTurn(t, i, idleT) {
    if (idleT > 0 && i === rig.leaves.length - 1) {
      const lt = idleT % CONFIG.loop;
      const q = prog(lt, IDLE_FLIP[0], IDLE_FLIP[1]);
      return q > 0 && q < 1 ? { e: easeInOutCubic(q), on: true } : { e: 1, on: true };
    }
    const at = T.leaves[i] ?? T.leaves[T.leaves.length - 1] + 0.14 * (i - T.leaves.length + 1);
    const q = prog(t, at, at + T.leafDur);
    return { e: easeInOutCubic(q), on: t >= at };
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

    // Book: falls in shut, lands on its spine with a squash + bounce; breathes when idle
    if (rig.book) {
      const b = rig.book;
      const q = prog(t, T.drop[0], T.drop[1]);
      const fall = 1 - q * q;                                     // accelerates like a drop
      const lt2 = t - T.drop[1];
      const hop = lt2 > 0 && lt2 < 0.36 ? Math.sin(Math.PI * lt2 / 0.36) * 0.09 : 0;          // little bounce
      const land = lt2 > 0 ? Math.exp(-lt2 * 9) * Math.cos(lt2 * 30) * 0.16 : 0;            // squash on landing
      const openBump = (() => { const u = t - T.open[1]; return u > 0 ? Math.exp(-u * 8) * Math.sin(u * 24) * 0.03 : 0; })();
      const bump = st > 0 ? Math.exp(-st * 6) * Math.sin(st * 22) * 0.04 : 0;
      const breathe = 0.014 * Math.sin(w) * idleOn;
      const sy = 1 - land + bump + breathe + openBump, sx = 1 + land * 0.6 - bump * 0.4 + breathe * 0.5;
      const oy = b.fall.y * (fall + hop), ox = b.fall.x * (fall + hop);
      set(b.w, { transform: `translate(${ox} ${oy}) ${xf(b.p, (1 - easeOutCubic(q)) * -8, sx, sy)}`, opacity: clamp(q * 3) });
    }

    // Closed book: slides so its spine sits on the gutter while the front cover swings open (scaleX → 0 about the spine)
    const open = t >= T.swap;
    if (rig.closed) {
      const c = rig.closed, q = prog(t, T.open[0], T.swap);
      const m = 1 - easeInOutCubic(q);
      const big = lerp(1, 1.15, m);   // the shut book reads a touch bigger, settles to true size as it opens
      set(c.w, { transform: `translate(${c.shift.x * m} ${c.shift.y * m}) ${xf(c.p, 0, big)}`, opacity: 1 - prog(t, T.swap, T.swap + 0.12) });
      if (c.front) set(c.front.w, { transform: xf(c.front.p, 0, 1 - q * q, 1), opacity: open ? 0 : 1 });
    }
    if (rig.spineW) set(rig.spineW.w, { opacity: open || !rig.closed ? 1 : 0 });

    // Open covers: the front cover keeps swinging over to the left (scaleX 0 → 1), the back cover settles flat
    for (const c of rig.covers) {
      const q = prog(t, T.swap, T.open[1] + 0.08);
      const vis = open || !rig.closed;
      if (c.side < 0) set(c.w, { transform: xf(c.p, 0, q === 0 ? 0.001 : easeOutBack(q, 1.6), 1), opacity: vis ? 1 : 0 });
      else set(c.w, { transform: xf(c.p, 0, 1, 1 + 0.05 * Math.sin(Math.PI * q)), opacity: vis ? 1 : 0 });
    }

    // Page layers fan up out of the gutter, back to front, both sides together
    for (const pg of rig.pages) {
      const at = T.pages + pg.i * T.pageGap;
      const q = prog(t, at, at + T.pageGrow);
      const sy = q === 0 ? 0.001 : easeOutBack(q, 1.8);
      const sx = q === 0 ? 0.001 : lerp(0.2, 1, easeOutCubic(q));
      const fan = -pg.side * 14 * (1 - easeOutCubic(q));
      set(pg.w, { transform: xf(pg.p, fan, sx, sy), opacity: q > 0 ? 1 : 0 });
    }

    // Loose leaves flip from the right stack to the left one; the top leaf turns again every idle loop
    rig.leaves.forEach((lf, i) => {
      const { e, on } = leafTurn(t, i, idleT);
      const sx = -Math.cos(Math.PI * e);                       // -1 (right) → +1 (left)
      const arc = Math.sin(Math.PI * e);
      const lift = { x: lf.lift.x * arc, y: lf.lift.y * arc };
      set(lf.w, { transform: `translate(${lift.x} ${lift.y}) ${xf(lf.p, 0, sx, 1 + 0.16 * arc)}`, opacity: on ? 1 : 0 });
      if (lf.shade) lf.shade.setAttribute('opacity', 0.32 * Math.pow(arc, 4));
    });

    // Bookmark ribbon unfurls down from where it leaves the pages, swings and settles
    if (rig.bookmark) {
      const q = prog(t, T.bookmark[0], T.bookmark[1]);
      const sy = q === 0 ? 0.001 : easeOutBack(q, 2.2);
      const swing = q === 0 ? 0 : 14 * Math.exp(-q * 4) * Math.sin(q * 13);
      const sway = 1.8 * Math.sin(w + 0.8) * idleOn;
      set(rig.bookmark.w, { transform: xf(rig.bookmark.p, swing + sway, 1, sy), opacity: q > 0 ? 1 : 0 });
    }

    // Star rises out of the book, spins into place; twinkles when idle
    if (rig.star) {
      const sr = rig.star;
      const q = prog(t, T.star[0], T.star[1]);
      const e = easeOutBack(q, 1.6);
      const ox = sr.from.x * (1 - e), oy = sr.from.y * (1 - e);
      const sc = q === 0 ? 0.001 : lerp(0.25, 1, easeOutBack(q, 2.4));
      const ping = (() => { const u = t - T.star[1]; return u > 0 && u < 0.3 ? 0.18 * Math.sin(Math.PI * u / 0.3) : 0; })();
      const tw = 1 + (0.1 * Math.sin(2 * w) + 0.04 * Math.sin(4 * w + 1)) * idleOn;
      set(sr.w, { transform: `translate(${ox} ${oy}) ${xf(sr.p, lerp(-200, 0, easeOutCubic(q)) + 7 * Math.sin(w) * idleOn, sc * (1 + ping) * tw)}`, opacity: q > 0 ? 1 : 0 });
    }

    // Burst dashes shoot out from the star, then pulse with its twinkle
    for (const b of rig.bursts) {
      const sc = pop(t, T.burst + b.i * 0.05, 0.5);
      const pulse = 1 + 0.08 * Math.sin(2 * w - 0.6) * idleOn;
      set(b.w, { transform: xf(b.p, 0, sc * pulse), opacity: sc > 0 ? 1 : 0 });
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
    if (r.book) cues.push({ t: T.drop[1], sound: 'thump', haptic: [{ t: 0, type: 'transient', i: 0.8, s: 0.25 }, { t: 0.2, type: 'transient', i: 0.3, s: 0.2 }] });
    if (r.covers.length) cues.push({ t: T.open[0] + 0.06, sound: 'open', d: T.open[1] - T.open[0], haptic: [{ t: 0, type: 'continuous', d: 0.26, i: 0.2, s: 0.2, ramp: [0.4, 1] }, { t: 0.3, type: 'transient', i: 0.45, s: 0.4 }] });
    if (r.pages.length) cues.push({ t: T.pages + 0.04, sound: 'fan', d: T.pageGrow + 0.12 });
    const flipNotes = [72, 76, 79, 84, 88, 91];
    r.leaves.forEach((lf, i) => cues.push({ t: (T.leaves[i] ?? 2) + T.leafDur * 0.42, sound: 'flip', note: flipNotes[i % flipNotes.length], pan: 0.5 - i * 0.3,
      haptic: [{ t: 0, type: 'transient', i: 0.28 + i * 0.05, s: 0.75 }] }));
    if (r.bookmark) cues.push({ t: T.bookmark[0] + 0.02, sound: 'unfurl', d: T.bookmark[1] - T.bookmark[0], haptic: [{ t: 0.22, type: 'transient', i: 0.35, s: 0.4 }] });
    if (r.star) cues.push({ t: T.star[0] + 0.04, sound: 'rise', d: T.star[1] - T.star[0] - 0.08 },
      { t: T.star[1] - 0.04, sound: 'ding', haptic: [{ t: 0, type: 'transient', i: 0.7, s: 1 }] });
    cues.push(
      { t: T.impact, sound: 'tada', haptic: [{ t: 0, type: 'transient', i: 1, s: 0.65 }] },
      { t: T.impact + 0.03, sound: 'confetti', haptic: [0.05, 0.12, 0.2, 0.29, 0.4].map((dt, j) => ({ t: dt, type: 'transient', i: 0.38 - 0.05 * j, s: 0.9 })) },
      { t: T.stars, sound: 'sparkle' },
      { t: T.shine[0], sound: 'shine', d: 0.7 }
    );
    return cues.sort((a, b) => a.t - b.t);
  }
  const IDLE_CUES = [
    { at: IDLE_FLIP[0] + (IDLE_FLIP[1] - IDLE_FLIP[0]) * 0.45, sound: 'flip', note: 84, pan: 0, v: 0.45 },
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
