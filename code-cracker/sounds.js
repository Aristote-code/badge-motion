    // woody "tok": a quick pitched blip (wood block) used for reel clicks and the unlock clunk
    const tok = (t, f, v, pan, len = .03) => {
      const a = voice(pan, .12), o = osc('sine', f, t, t + len + .04);
      o.frequency.exponentialRampToValueAtTime(f * .5, t + len); o.connect(a.g); env(a.g.gain, t, .16 * v, .001, len);
    };
    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // padlock drops in: a heavier woody boop
      boop(t) { marimba(t, C5, .8, 0, -.25); marimba(t + .05, G5, .45, 0, -.1); tok(t, 520, .6, 0, .05); },
      // reels roll: woody ticks at every symbol pass, rising in pitch and getting softer as the reels slow down
      reel(t, d, v, cue) {
        const ticks = cue.ticks || [];
        ticks.forEach((tk, j) => {
          const q = tk.dt / Math.max(d, .01);
          tok(t + tk.dt, 1500 + q * 900 + (j % 3) * 60, .55 + .25 * q, tk.pan);
        });
      },
      // a dial lands: pitched "thunk" (wood block + marimba note C5 / E5 / G5)
      thunk(t, d, v, cue) {
        tok(t, 900, 1, cue.pan ?? 0, .05);
        const kk = voice(cue.pan ?? 0, .1), o = osc('sine', 180, t, t + .14);
        o.frequency.exponentialRampToValueAtTime(90, t + .08); o.connect(kk.g); env(kk.g.gain, t, .22, .002, .08);
        marimba(t + .005, cue.note, .9, cue.pan ?? 0, -.06);
        marimba(t + .005, cue.note + 12, .25, cue.pan ?? 0, 0);
      },
      // star dial glows: little shimmer
      glint(t) { bell(t, E6 + 12, .35, .1, .9); bell(t + .07, G6 + 12, .25, -.1, .8); },
      // latch releases: tiny metallic click
      click(t) { tok(t, 2600, .8, .2, .02); tok(t + .035, 2100, .5, .25, .02); },
      // shackle springs up: "ka-chunk" + bright bell
      unlock(t) {
        tok(t, 700, 1.2, .3, .06); tok(t + .07, 1100, 1, .3, .05);
        const kk = voice(0, .1), o = osc('sine', 150, t + .07, t + .3);
        o.frequency.exponentialRampToValueAtTime(70, t + .17); o.connect(kk.g); env(kk.g.gain, t + .07, .35, .002, .12);
        marimba(t + .07, G5, .7, .3, -.1);
        bell(t + .1, C7, .6, .3, 1.2); bell(t + .14, G6 + 12, .25, .35, .9);
      },
      // shackle swings to rest: soft woody clack
      clack(t) { tok(t, 1200, .5, -.3, .03); marimba(t, C6, .35, -.3, -.05); },
      // complete: "ta-da!" chord with a bell on top and a soft kick
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
