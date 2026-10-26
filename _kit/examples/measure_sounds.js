    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // protractor swings in: low-to-high woody swing
      swing(t) { marimba(t, C5, .55, .3, -.3); marimba(t + .09, G5, .6, .3, -.15); },
      // dial ticks: a soft clockwork run sweeping left → right
      dial(t, d, v, cue) {
        const n = cue.n || 19;
        for (let i = 0; i < n; i++) {
          const at = t + d * i / (n - 1), a = voice(-.6 + 1.2 * i / (n - 1), .1), o = osc('sine', 2400 + i * 40, at, at + .04);
          o.connect(a.g); env(a.g.gain, at, .05, .001, .018);
          if (i % 3 === 0) marimba(at, [C6, D6, E6, G6, A6, C7, D6 + 12][(i / 3) % 7], .18, -.6 + 1.2 * i / (n - 1), 0);
        }
      },
      // ruler slides into place: quick rising glide that lands on a marimba note
      slide(t, d) {
        const a = voice(-.4, .4), o = osc('triangle', N(G5), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(C6 + 7), t + d * .75); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.05, t + d * .3); a.g.gain.linearRampToValueAtTime(0, t + d * .8);
        a.p.pan.setValueAtTime(-.5, t); a.p.pan.linearRampToValueAtTime(.3, t + d);
        marimba(t + d * .75, C6, .7, .1, -.1);
      },
      // ruler ticks count up: a measuring-tape "zip" of tiny clicks rising in pitch, a note on every long tick
      zip(t, d, v, cue) {
        const n = cue.n || 36, notes = [C5, D5, E5, G5, A5, C6, D6, E6];
        for (let i = 0; i < n; i++) {
          const at = t + d * i / (n - 1), pan = -.5 + i / (n - 1);
          const a = voice(pan, .05), o = osc('sine', 1600 + i * 55, at, at + .03);
          o.connect(a.g); env(a.g.gain, at, .07, .001, .014);
          if (i % 5 === 0) marimba(at, notes[Math.min(notes.length - 1, i / 5)], .32, pan, 0);
        }
      },
      // glint reaches the tip: bright "measured!" ting
      measured(t) { bell(t, E6 + 12, .6, .4, 1); bell(t + .06, C7 + 7, .35, .45, .8); },
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
