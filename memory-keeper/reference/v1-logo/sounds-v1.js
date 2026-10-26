    const S = {
      // hexagon appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // elephant rises: soft low rising glide
      rise(t, d) {
        const a = voice(0, .4), o = osc('sine', N(C4), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(67), t + d); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.07, t + d * .5); a.g.gain.linearRampToValueAtTime(0, t + d);
      },
      // lands: a big soft woody "thump" (an elephant step) + little knock
      thump(t) {
        const kk = voice(0, .1), o = osc('sine', 110, t, t + .35);
        o.frequency.exponentialRampToValueAtTime(48, t + .18); o.connect(kk.g); env(kk.g.gain, t, .55, .003, .22);
        marimba(t, C4, .7, 0, -.2); marimba(t + .09, 67, .35, 0, -.15);
      },
      // ear unfolds: airy upward flap + two woody notes
      earflap(t, d) {
        const a = voice(.4, .5), o = osc('sine', N(E5), t, t + d);
        o.frequency.exponentialRampToValueAtTime(N(A5), t + d * .5); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.05, t + d * .25); a.g.gain.linearRampToValueAtTime(0, t + d * .6);
        marimba(t + d * .45, E5, .5, .4, -.12); marimba(t + d * .6, A5, .45, .5, -.1);
      },
      // trunk swings up: a little rising pluck run
      swing(t, d) { [67, C5, E5].forEach((n, j) => pluck(t + j * d * .22, n, .45, -.2 + j * .2)); },
      // trumpet: a friendly two-note "toot-toot!" (soft brassy tone: filtered saw + sine, with a little vibrato)
      trumpet(t) {
        [[G5, 0, .16], [C6, .2, .3]].forEach(([n, dt, dur]) => {
          const a = voice(.25, .3), lp = filt('lowpass', 1800, .8);
          const o1 = osc('sawtooth', N(n) * .985, t + dt, t + dt + dur + .1), o2 = osc('sine', N(n), t + dt, t + dt + dur + .1);
          const vib = osc('sine', 6, t + dt, t + dt + dur + .1), vg = ctx.createGain(); vg.gain.value = N(n) * .012;
          vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
          o1.frequency.setValueAtTime(N(n) * .94, t + dt); o1.frequency.exponentialRampToValueAtTime(N(n), t + dt + .05);
          const g1 = ctx.createGain(); g1.gain.value = .35; o1.connect(g1); g1.connect(lp); o2.connect(lp); lp.connect(a.g);
          a.g.gain.setValueAtTime(0, t + dt); a.g.gain.linearRampToValueAtTime(.11, t + dt + .03);
          a.g.gain.setValueAtTime(.1, t + dt + dur - .04); a.g.gain.linearRampToValueAtTime(0, t + dt + dur + .06);
        });
        marimba(t + .2, C6, .4, .25, -.1);
      },
      // each music note pops out: bright pluck + bell, climbing
      note(t, d, v, cue) { pluck(t, cue.note, .8, cue.pan ?? 0); bell(t, cue.note + 12, .18, cue.pan ?? 0, .5); },
      // knowing wink: tiny "tink"
      wink(t) { bell(t + .08, E7, .4, -.3, .5); pluck(t + .08, 95, .35, -.3); },
      blink(t, d, v) { bell(t + .05, E7, .22 * v, -.3, .4); },
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
