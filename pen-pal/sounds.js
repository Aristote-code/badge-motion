    const G4 = 67;
    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // envelope flies in: a soft airy swoosh (band-passed noise sweeping up then down) + a faint sine glide
      swoosh(t, d) {
        const a = voice(.5, .3), n = noise(t, t + d + .1), bp = filt('bandpass', 700, 1.4);
        bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(2200, t + d * .55); bp.frequency.exponentialRampToValueAtTime(900, t + d);
        n.connect(bp); bp.connect(a.g); swell(a.g.gain, t, d * .9, .07, .55);
        a.p.pan.setValueAtTime(.6, t); a.p.pan.linearRampToValueAtTime(0, t + d);
        const b = voice(.4, .4), o = osc('sine', N(E5), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(C5), t + d); o.connect(b.g); swell(b.g.gain, t, d * .8, .025, .5);
      },
      // envelope lands: soft papery tap (short filtered tick) + a low woody knock
      tap(t) {
        const a = voice(0, .15), n = noise(t, t + .08), hp = filt('bandpass', 1800, .9);
        n.connect(hp); hp.connect(a.g); env(a.g.gain, t, .16, .002, .045);
        marimba(t, C4 + 7, .65, 0, -.12);
      },
      // seal pops off: little rising "blup"
      unseal(t) {
        const a = voice(0, .3), o = osc('sine', N(C5), t, t + .16);
        o.frequency.exponentialRampToValueAtTime(N(C6), t + .08); o.connect(a.g); env(a.g.gain, t, .14, .004, .1);
        bell(t + .05, G6, .2, .1, .4);
      },
      // flap opens: quick rising "fwip" pluck that lands on a marimba note
      fwip(t, d) {
        const a = voice(-.1, .3), o = osc('triangle', N(G4), t, t + .16);
        o.frequency.exponentialRampToValueAtTime(N(G5 + 5), t + .11); o.connect(a.g); env(a.g.gain, t, .1, .004, .11);
        pluck(t + .1, C6, .7, .1);
        marimba(t + d * .62, E5 + 12, .45, .1, -.08);
      },
      // letter slides up: smooth rising glide that lands on a woody note
      glide(t, d) {
        const a = voice(0, .45), o = osc('sine', N(C5), t, t + d + .15);
        o.frequency.exponentialRampToValueAtTime(N(C6 + 7), t + d * .8); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.065, t + d * .35); a.g.gain.linearRampToValueAtTime(0, t + d * .9);
        marimba(t + d * .8, G5 + 12, .6, 0, -.08);
      },
      // a text line writes on: soft pen ticks + a gentle note
      tick(t, d, v, cue) {
        for (let i = 0; i < 4; i++) {
          const at = t + d * i / 4, a = voice(cue.pan ?? 0, .05), o = osc('sine', 2600 + i * 120, at, at + .03);
          o.connect(a.g); env(a.g.gain, at, .035, .001, .015);
        }
        pluck(t, cue.note, .5, cue.pan ?? 0);
      },
      // heart pops in: warm "boing" + bell
      heartpop(t) { marimba(t, C5 + 12, .8, 0, -.3); marimba(t + .05, E5 + 12, .55, .1, -.15); bell(t + .05, G6, .35, .1, .8); },
      // heartbeat: warm low two-note "ba-dum" on the marimba
      badum(t, d, v) { marimba(t, C4 + 4, .95 * v, 0, -.12); marimba(t + .15, C4, .75 * v, 0, -.1); },
      // burst dashes: three quick bright plucks
      burst(t, d, v, cue) { [G6, C7, E7].slice(0, cue.n || 3).forEach((n, j) => pluck(t + j * .07, n, .6, -.6 + j * .15)); },
      // complete: "ta-da!" chord with a bell on top and a soft kick
      tada(t) {
        const kk = voice(0, .1), o = osc('sine', 120, t, t + .3);
        o.frequency.exponentialRampToValueAtTime(55, t + .12); o.connect(kk.g); env(kk.g.gain, t, .5, .002, .16);
        [C5, E5, G5].forEach((n, j) => marimba(t + j * .012, n, .75, -.3 + j * .3));
        marimba(t + .11, C6, .9, .2);
        bell(t + .11, E6, .9, .25, 1.4);
        bell(t + .11, G6, .5, -.2, 1.2);
      },
      sparkle(t) { [E7, C7 + 7].forEach((n, j) => bell(t + j * .1, n, .35, -.4 + j * .8, .6)); },
      confetti(t) {
        const notes = [C6, D6, E6, G6, A6, C7, E7];
        for (let j = 0; j < 12; j++) {
          const kq = j / 12, at = t + .15 + Math.pow(r(), 1.3) * .8;
          pluck(at, notes[Math.floor(r() * notes.length)], .7 * (1 - kq * .6), r() * 1.4 - .7);
        }
      },
      shine(t, d, v) { [C6, D6, E6, G6, A6, C7].forEach((n, j) => pluck(t + .06 + j * d * .09, n, .8 * v, -.5 + j * .2)); }
    };
    return { out, play(cue, at) { S[cue.sound]?.(Math.max(at, 0), cue.d ?? .6, cue.v ?? 1, cue); } };
  }
