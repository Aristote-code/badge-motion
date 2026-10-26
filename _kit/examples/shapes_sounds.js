    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // triangle: bright, pointy bell ting
      ting(t) { bell(t, E6 + 12, .55, -.3, .9); marimba(t, E6, .45, -.3, -.1); },
      // circle: round, bouncy boop (pitch swoops up)
      round(t) { marimba(t, C5, .9, .3, -.35); marimba(t + .06, G5, .4, .3, -.2); },
      // square: woody block tok
      tok(t) {
        const a = voice(-.1, .15), o = osc('sine', 1500, t, t + .06);
        o.frequency.exponentialRampToValueAtTime(800, t + .03); o.connect(a.g); env(a.g.gain, t, .16, .001, .03);
        marimba(t + .004, G5, .75, -.1, -.05);
      },
      // arrow draws on: quick rising harp run
      swoosh(t, d, v, cue) { [C6, D6, E6, G6].forEach((n, j) => pluck(t + j * d * .22, n, .55, (cue.pan ?? 0) * (j / 3 * 2 - 1))); },
      // hop around the cycle: a slide-whistle "whee" that lands on a rising marimba note
      hop(t, d, v, cue) {
        const land = [C6, E6, G6][cue.step ?? 0];
        const a = voice(0, .4), o = osc('sine', N(land - 7), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(land), t + d * .85); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.06, t + d * .4); a.g.gain.linearRampToValueAtTime(0, t + d);
        marimba(t + d * .85, land, .7, .1, -.08);
      },
      // cycle complete: "ta-da!" chord with a bell on top and a soft kick
      tada(t) {
        const kk = voice(0, .1), o = osc('sine', 120, t, t + .3);
        o.frequency.exponentialRampToValueAtTime(55, t + .12); o.connect(kk.g); env(kk.g.gain, t, .5, .002, .16);
        [C5, E5, G5].forEach((n, j) => marimba(t + j * .012, n, .75, -.3 + j * .3));
        marimba(t + .11, C6, .9, .2);
        bell(t + .11, E6, .9, .25, 1.4);
        bell(t + .11, G6, .5, -.2, 1.2);
      },
      // stars burst: quick tings
      sparkle(t) { [E7, C7 + 7].forEach((n, j) => bell(t + j * .1, n, .35, -.4 + j * .8, .6)); },
      // confetti: twinkly pentatonic sparkles
      confetti(t) {
        const notes = [C6, D6, E6, G6, A6, C7, E7];
        for (let j = 0; j < 12; j++) {
          const kq = j / 12, at = t + .15 + Math.pow(r(), 1.3) * .8;
          pluck(at, notes[Math.floor(r() * notes.length)], .7 * (1 - kq * .6), r() * 1.4 - .7);
        }
      },
      // shine: soft upward harp glissando
      shine(t, d, v) { [C6, D6, E6, G6, A6, C7].forEach((n, j) => pluck(t + .06 + j * d * .09, n, .8 * v, -.5 + j * .2)); }
    };
    return { out, play(cue, at) { S[cue.sound]?.(Math.max(at, 0), cue.d ?? .6, cue.v ?? 1, cue); } };
  }
