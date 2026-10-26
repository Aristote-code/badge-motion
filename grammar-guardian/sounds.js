    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // shield appears: rounder, lower "boop" with a little upward bend
      boop(t) { marimba(t, C5, 1.0, 0, -.3); marimba(t + .05, G5, .55, 0, -.15); marimba(t, C4, .35, 0, -.2); },
      // wings unfurl: a soft airy swell under quick rising plucks fanning out to both sides
      whoosh(t, d) {
        const n = noise(t, t + d + .2), bp = filt('bandpass', 700, 0.9), a = voice(0, .6);
        bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(2400, t + d * .8);
        n.connect(bp); bp.connect(a.g); swell(a.g.gain, t, d * .8, .045, .55);
        [C5, D5, E5, G5, A5, C6, D6, E6].forEach((n2, j) => pluck(t + .03 + j * d * .1, n2, .55 + j * .04, (j % 2 ? 1 : -1) * (.2 + j * .08)));
      },
      // wing flap: soft woody "fwup" (low marimba pair) with a puff of air
      wingflap(t, d, v, cue) {
        const base = cue.note ? G5 - 12 + 2 : G5 - 12;
        marimba(t, base, .55, -.35, -.2); marimba(t + .03, base, .55, .35, -.2);
        marimba(t + .05, base + 12, .25, 0, -.1);
        const n = noise(t, t + .25), lp = filt('lowpass', 900, 0.7), a = voice(0, .3);
        n.connect(lp); lp.connect(a.g); env(a.g.gain, t, .05, .02, .14);
      },
      // "!" lands: bright alert bell (two of these, the second higher → "ding-ding")
      ding(t, d, v, cue) { bell(t, cue.note, .75, cue.pan ?? 0, 1.0); marimba(t, cue.note - 12, .45, cue.pan ?? 0, -.05); pluck(t, cue.note + 12, .35, cue.pan ?? 0); },
      // burst dashes + star pop: quick sparkly plucks and a glint
      burst(t) { [G6, A6, C7].forEach((n, j) => pluck(t + j * .05, n, .6, -.5 + j * .5)); bell(t + .1, E7, .25, 0, .7); },
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
