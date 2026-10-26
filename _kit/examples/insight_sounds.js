    const S = {
      // medal appears: bouncy "boop"
      pop(t, d, v) { marimba(t, G5, 1.1 * v, 0, -.25); marimba(t, C5, .5 * v, 0, -.2); },
      // ribbons drop: soft low double flap
      flap(t) { marimba(t, C4 + 7, .5, -.4, -.15); marimba(t + .07, C5, .45, .4, -.15); },
      // baseline draws: soft left → right pluck sweep
      swipe(t, d) { [C5, E5, G5].forEach((n, j) => pluck(t + j * d * .3, n, .35, -.6 + j * .5)); },
      // bar grows: a rising "bloop" that lands on its note (higher for each bar)
      grow(t, d, v, cue) {
        const n = cue.note, a = voice(cue.pan ?? 0, .4), o = osc('sine', N(n - 7), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(n), t + d * .6); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.08, t + d * .3); a.g.gain.linearRampToValueAtTime(0, t + d * .65);
        marimba(t + d * .6, n, .75, cue.pan ?? 0, -.08);
      },
      // line reaches a node: bright pluck + soft bell, climbing the scale
      node(t, d, v, cue) { pluck(t, cue.note, .9, cue.pan ?? 0); bell(t, cue.note, .2, cue.pan ?? 0, .5); },
      // peak node: "ping!" with a ring
      ping(t) { bell(t, C7, .7, .5, 1.1); bell(t + .05, E7, .35, .55, .9); marimba(t, C6, .5, .5, -.1); },
      // magnifier zooms in: rising glide
      zoom(t, d) {
        const a = voice(.6, .5), o = osc('sine', N(G5), t, t + d + .1);
        o.frequency.exponentialRampToValueAtTime(N(G6), t + d * .8); o.connect(a.g);
        a.g.gain.setValueAtTime(0, t); a.g.gain.linearRampToValueAtTime(.07, t + d * .4); a.g.gain.linearRampToValueAtTime(0, t + d);
        a.p.pan.setValueAtTime(.7, t); a.p.pan.linearRampToValueAtTime(-.3, t + d);
        marimba(t + d * .85, G5, .55, -.3, -.1);
      },
      // probing stop: a curious little "blip-blip"
      probe(t, d, v, cue) {
        [0, .07].forEach((dt, j) => {
          const a = voice(cue.pan ?? 0, .3), o = osc('sine', N(cue.note + j * 5), t + dt, t + dt + .12);
          o.connect(a.g); env(a.g.gain, t + dt, .09, .003, .07);
        });
      },
      // magnifier comes to rest: soft woody settle
      settle(t) { marimba(t, C6, .55, 0, -.15); marimba(t + .06, G5, .4, 0, -.1); },
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
