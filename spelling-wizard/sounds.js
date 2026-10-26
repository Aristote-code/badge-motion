    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // tile lands: woody clack + the tile "says" its note with a quick rising glide (C5, E5, G5)
      tile(t, d, v, cue) {
        const pan = cue.pan ?? 0, n = cue.note;
        const a = voice(pan, .15), o = osc('sine', 1700, t, t + .06);
        o.frequency.exponentialRampToValueAtTime(800, t + .03); o.connect(a.g); env(a.g.gain, t, .18, .001, .03);
        marimba(t + .004, n - 12, .45, pan, -.08);
        const b = voice(pan, .45), g = osc('triangle', N(n - 4), t + .02, t + .4);
        g.frequency.exponentialRampToValueAtTime(N(n), t + .09); g.connect(b.g); env(b.g.gain, t + .02, .07, .01, .28);
        marimba(t + .05, n, .8, pan, -.04);
      },
      // C turns over: a little upward "fwip" then the gold reveal (bright marimba + bell)
      flip(t, d, v, cue) {
        const pan = cue.pan ?? 0, a = voice(pan, .4), o = osc('sine', N(G5), t, t + d * .55);
        o.frequency.exponentialRampToValueAtTime(N(C7), t + d * .45); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.05, t + d * .25); a.g.gain.linearRampToValueAtTime(0, t + d * .5);
        marimba(t + d * .5, C6, .75, pan, -.06);
        bell(t + d * .5, G6, .35, pan, .9);
      },
      // swoosh draws: quick rising harp glissando with a soft high shimmer underneath
      shimmer(t, d) {
        const notes = [C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, C7];
        notes.forEach((n, j) => pluck(t + j * d * .085, n, .75, -.7 + j * .14));
        const a = voice(0, .9), o = osc('sine', N(C7), t, t + d + .3), o2 = osc('sine', N(C7) * 1.006, t, t + d + .3);
        o.connect(a.g); o2.connect(a.g); swell(a.g.gain, t, d, .018, .8);
      },
      // star pops at the end of the swoosh: bell
      bell(t) { bell(t, C7, .75, .2, 1.2); bell(t + .06, G6 + 12, .3, .3, .9); marimba(t, C6, .45, .2, -.1); },
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
