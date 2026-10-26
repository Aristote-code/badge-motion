    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // book lands: soft woody thump (low marimba + gentle kick), little bounce knock after
      thump(t) {
        const kk = voice(0, .08), o = osc('sine', 150, t, t + .3);
        o.frequency.exponentialRampToValueAtTime(60, t + .1); o.connect(kk.g); env(kk.g.gain, t, .45, .002, .14);
        marimba(t, C4, .9, 0, -.3); marimba(t + .01, C4 + 7, .45, 0, -.25);
        marimba(t + .2, C5, .35, 0, -.15);
      },
      // covers swing open: two woody notes spreading left / right, a soft rising breath between
      open(t, d) {
        marimba(t, E5, .5, -.6, -.1); marimba(t + .05, G5, .5, .6, -.1);
        const a = voice(0, .5), o = osc('sine', N(C5), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(C6), t + d * .8); o.connect(a.g);
        swell(a.g.gain, t, d * .8, .045, .6);
        marimba(t + d * .8, C6, .45, 0, -.1);
      },
      // page layers fan up: airy soft rising shimmer of plucks
      fan(t, d) { [G5, C6, E6].forEach((n, j) => pluck(t + j * d * .22, n, .32, -.4 + j * .4)); },
      // one page flips: a soft paper "fff" (gentle filtered noise) + a quick soft pluck, rising each page
      flip(t, d, v, cue) {
        const pan = cue.pan ?? 0, n = noise(t, t + .14), bp = filt('bandpass', 2600, 1.2), a = voice(pan, .2);
        n.connect(bp); bp.connect(a.g); env(a.g.gain, t, .05 * v, .02, .07);
        pluck(t + .03, cue.note, .85 * v, pan); marimba(t + .03, cue.note, .25 * v, pan, -.05);
      },
      // bookmark unfurls: a quick downward slide landing on a soft woody tok
      unfurl(t, d) {
        const a = voice(.5, .4), o = osc('triangle', N(G6), t, t + d * .6);
        o.frequency.exponentialRampToValueAtTime(N(G5), t + d * .45); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.04, t + d * .15); a.g.gain.linearRampToValueAtTime(0, t + d * .5);
        marimba(t + d * .45, G5, .55, .5, -.12);
      },
      // star rises out of the book: soft rising glide
      rise(t, d) {
        const a = voice(0, .6), o = osc('sine', N(C6), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(C7), t + d); o.connect(a.g);
        swell(a.g.gain, t, d, .05, .8);
      },
      // star appears: gentle bell "ding"
      ding(t) { bell(t, C7, .75, 0, 1.4); bell(t + .04, G6, .35, -.2, 1.1); bell(t + .09, E7, .2, .3, .8); },
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
