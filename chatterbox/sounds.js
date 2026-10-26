    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // speech bubble pops in: bubbly "boop" — a quick rising sine blip landing on a marimba note
      boop(t, d, v, cue) {
        const n = cue.note, a = voice(cue.pan ?? 0, .4), o = osc('sine', N(n - 9), t, t + .2);
        o.frequency.exponentialRampToValueAtTime(N(n + 2), t + .07); o.connect(a.g); env(a.g.gain, t, .13 * v, .004, .1);
        marimba(t + .05, n, .9 * v, cue.pan ?? 0, -.12);
        bell(t + .05, n + 12, .12 * v, cue.pan ?? 0, .4);
      },
      // typing dot bounces: soft little plink
      plink(t, d, v, cue) { pluck(t, cue.note, .75 * v, cue.pan ?? 0); marimba(t, cue.note, .22 * v, cue.pan ?? 0); },
      // "ha!": a quick rising marimba pair with a bell on top (second "ha" is higher)
      ha(t, d, v, cue) {
        const n = cue.note, p = cue.pan ?? 0;
        marimba(t, n, .85 * v, p, -.06); marimba(t + .07, n + 4, .9 * v, p, -.06);
        bell(t + .07, n + 16, .22 * v, p + .2, .6);
      },
      // burst dashes pop: quick sparkly pluck run
      burst(t, d, v) { [C6, E6, G6, C7, E7].forEach((n, j) => pluck(t + j * d / 5, n, .55 * v, -.2 + j * .15)); },
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
