    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // paper slides in: a soft airy whoosh carried by a quick pluck run
      whoosh(t, d) {
        const a = voice(-.3, .5), n = noise(t, t + d + .2), bp = filt('bandpass', 900, .8);
        bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(2200, t + d * .7);
        n.connect(bp); bp.connect(a.g); swell(a.g.gain, t, d * .8, .035, .5);
        a.p.pan.setValueAtTime(-.6, t); a.p.pan.linearRampToValueAtTime(.4, t + d);
        [C5, D5, E5, G5, A5, C6].forEach((n2, j) => pluck(t + j * d * .1, n2, .3 + j * .04, -.6 + j * .2));
      },
      // corner curls up: a little woody "tok"
      curl(t) { marimba(t, A5, .45, .5, .12); marimba(t + .05, E6, .25, .55, .05); },
      // pen swoops in: soft descending glide that lands with a tap
      swoop(t, d) {
        const a = voice(.6, .45), o = osc('sine', N(C7), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(G5), t + d * .9); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.05, t + d * .4); a.g.gain.linearRampToValueAtTime(0, t + d);
        a.p.pan.setValueAtTime(.7, t); a.p.pan.linearRampToValueAtTime(-.2, t + d);
        marimba(t + d * .95, G5, .6, -.2, -.1);
      },
      // writing: a rising glissando of quick soft plucks (a pleasant "scribble"), with a gentle sine glide under it
      scribble(t, d) {
        const scale = [C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, C7];
        const n = 20;
        for (let j = 0; j < n; j++) {
          const q = j / (n - 1), at = t + d * (q * .92) + (r() - .5) * .012;
          const note = scale[Math.min(scale.length - 1, Math.round(q * (scale.length - 1)))];
          pluck(at, note, .28 + .22 * Math.sin(Math.PI * q), -.6 + q * 1.0);
        }
        const a = voice(0, .5), o = osc('sine', N(C5), t, t + d + .15);
        o.frequency.exponentialRampToValueAtTime(N(C6), t + d); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.025, t + d * .3); a.g.gain.linearRampToValueAtTime(0, t + d + .1);
      },
      // ink dot: a round little "plip" (water-drop chirp + soft marimba)
      plip(t) {
        const a = voice(.35, .4), o = osc('sine', N(G5), t, t + .12);
        o.frequency.exponentialRampToValueAtTime(N(G6 + 5), t + .05); o.connect(a.g); env(a.g.gain, t, .14, .003, .08);
        marimba(t + .01, E6, .45, .35, .04);
      },
      // pen comes to rest
      settle(t, d, v) { marimba(t, C6, .45 * v, .3, -.12); },
      // star: bright bell with a sparkle on top
      starBell(t) { bell(t, G6, .7, -.4, 1.2); bell(t + .06, C7, .45, -.35, 1.0); marimba(t, C6, .45, -.4, -.05); pluck(t + .12, E7, .35, -.2); },
      // idle shimmer along the ink: two faint tings
      glimmer(t, d, v) { [E6, G6, C7].forEach((n, j) => pluck(t + j * d * .22, n, .45 * v, -.5 + j * .3)); },
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
