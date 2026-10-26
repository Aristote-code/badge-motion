    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // globe pops in: round woody "boop" with a little upward bend
      boop(t) { marimba(t, C5, .9, 0, -.3); marimba(t + .06, G5, .55, .1, -.2); },
      // globe spins: soft rising whirr (sine sweep with a slowing flutter), fading as it eases to a stop
      whirr(t, d) {
        const a = voice(0, .35), o = osc('sine', N(55), t, t + d + .2);
        o.frequency.exponentialRampToValueAtTime(N(67), t + d * .55);
        o.frequency.exponentialRampToValueAtTime(N(72), t + d);
        const trem = ctx.createGain(); trem.gain.value = .6; o.connect(trem); trem.connect(a.g);
        const lfo = osc('sine', 16, t, t + d + .2); lfo.frequency.exponentialRampToValueAtTime(3, t + d);
        const lg = ctx.createGain(); lg.gain.value = .4; lfo.connect(lg); lg.connect(trem.gain);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.09, t + d * .25); a.g.gain.exponentialRampToValueAtTime(.0001, t + d + .15);
        a.p.pan.setValueAtTime(-.4, t); a.p.pan.linearRampToValueAtTime(.4, t + d);
      },
      // pin lands: bright "plink" (C6, then G6)
      plink(t, d, v, cue) { marimba(t, cue.note, .85, cue.pan ?? 0, .12); bell(t + .01, cue.note + 12, .28, cue.pan ?? 0, .6); },
      // each dash of the route: a soft tick, climbing
      tick(t, d, v, cue) {
        const a = voice(cue.pan ?? 0, .25), o = osc('triangle', N(cue.note + 12), t, t + .08);
        o.connect(a.g); env(a.g.gain, t, .05, .001, .035);
        pluck(t, cue.note, .35, cue.pan ?? 0);
      },
      // plane pops up on pin 2: small hopeful two-note
      takeoff(t) { marimba(t, G5, .55, .35, -.1); marimba(t + .07, C6, .5, .35, -.08); },
      // flight: smooth sine glide with gentle vibrato, panning with the plane round the globe
      glide(t, d) {
        const a = voice(.4, .55), o = osc('sine', N(67), t, t + d + .3);
        o.frequency.exponentialRampToValueAtTime(N(76), t + d * .3);
        o.frequency.exponentialRampToValueAtTime(N(72), t + d * .62);
        o.frequency.exponentialRampToValueAtTime(N(79), t + d);
        const vib = osc('sine', 5.2, t, t + d + .3), vg = ctx.createGain(); vg.gain.value = 7;
        vib.connect(vg); vg.connect(o.frequency);
        const lp = filt('lowpass', 1800); o.connect(lp); lp.connect(a.g);
        const o2 = osc('sine', N(55), t, t + d + .3); o2.frequency.exponentialRampToValueAtTime(N(60), t + d);
        const g2 = ctx.createGain(); g2.gain.value = .35; o2.connect(g2); g2.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.075, t + .25);
        a.g.gain.linearRampToValueAtTime(.045, t + d * .45);   // quieter behind the globe
        a.g.gain.linearRampToValueAtTime(.075, t + d * .8);
        a.g.gain.exponentialRampToValueAtTime(.0001, t + d + .2);
        a.p.pan.setValueAtTime(.4, t); a.p.pan.linearRampToValueAtTime(.7, t + d * .2);
        a.p.pan.linearRampToValueAtTime(-.7, t + d * .55); a.p.pan.linearRampToValueAtTime(.5, t + d);
      },
      // plane arrives at rest: landing bell
      land(t) { bell(t, G6, .6, .5, 1.1); marimba(t, G5, .5, .5, -.1); },
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
