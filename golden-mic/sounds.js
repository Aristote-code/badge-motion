    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // base lands: soft round thump with a woody low note
      thump(t) {
        const kk = voice(0, .1), o = osc('sine', 150, t, t + .3);
        o.frequency.exponentialRampToValueAtTime(58, t + .12); o.connect(kk.g); env(kk.g.gain, t, .45, .002, .18);
        marimba(t, C4, .8, 0, -.2); marimba(t + .01, C5, .35, 0, -.1);
      },
      // stem + yoke rise: rising glide that lands on a woody note
      rise(t, d) {
        const a = voice(0, .5), o = osc('sine', N(C5), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(C6), t + d * .8); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.07, t + d * .4); a.g.gain.linearRampToValueAtTime(0, t + d);
        marimba(t + d * .82, G5, .6, 0, -.1);
      },
      // mic falls: a short soft descending whistle
      fall(t, d) {
        const a = voice(0, .4), o = osc('sine', N(G6), t, t + d + .05);
        o.frequency.exponentialRampToValueAtTime(N(G5), t + d); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.045, t + d * .3); a.g.gain.linearRampToValueAtTime(0, t + d);
      },
      // mic lands in the yoke: woody clunk with a bright click
      land(t) { marimba(t, C5 - 5, 1, 0, -.22); marimba(t + .012, C5, .6, 0, -.15); pluck(t, C7, .5, 0); },
      // mic seats upright on its pivots: little two-note click
      seat(t) { marimba(t, C6, .5, -.3, -.08); marimba(t + .08, G5, .4, .3, -.08); },
      // fingertip tap on the mic: muffled "tup"
      tap(t, d, v) {
        const a = voice(0, .15), o = osc('sine', 230, t, t + .16);
        o.frequency.exponentialRampToValueAtTime(95, t + .07); o.connect(a.g); env(a.g.gain, t, .38 * v, .002, .09);
        const nz = noise(t, t + .08), lp = filt('lowpass', 900), b = voice(0, .1);
        nz.connect(lp); lp.connect(b.g); env(b.g.gain, t, .06 * v, .002, .04);
      },
      // sung note: triangle + sine "voice", small scoop into pitch, vibrato that grows while held
      sing(t, d, v, cue) {
        const f = N(cue.note), pan = cue.pan ?? 0, end = t + d + .3;
        const lp = filt('lowpass', 2600, .9), a = voice(pan, .55);
        lp.connect(a.g);
        const o1 = osc('triangle', f * .965, t, end), o2 = osc('sine', f * .965, t, end), o3 = osc('sine', f * 2 * .965, t, end);
        const lfo = osc('sine', 5.6, t, end), lg = ctx.createGain();
        lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .006, t + .1); lg.gain.linearRampToValueAtTime(f * .016, t + d + .1);
        lfo.connect(lg);
        const g2 = ctx.createGain(); g2.gain.value = .9; const g3 = ctx.createGain(); g3.gain.value = .18;
        [o1, o2, o3].forEach((o, j) => {
          o.frequency.linearRampToValueAtTime(f * (j === 2 ? 2 : 1), t + .05);
          lg.connect(o.frequency);
          if (j === 0) o.connect(lp); else if (j === 1) { o.connect(g2); g2.connect(lp); } else { o.connect(g3); g3.connect(lp); }
        });
        const pk = .12 * v;
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(pk, t + .03);
        a.g.gain.linearRampToValueAtTime(pk * .8, t + d * .7); a.g.gain.exponentialRampToValueAtTime(.0001, t + d + .26);
        pluck(t, cue.note, .35, pan);
      },
      // gem sparkles: two tings
      gem(t) { bell(t, E7, .45, .2, .8); bell(t + .09, E7 + 3, .3, .35, .7); },
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
