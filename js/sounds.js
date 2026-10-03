// Synthesised bird songs. Stand-ins until real recordings are added:
// drop an mp3 at sounds/<bird id>.mp3 and add the id to RECORDINGS.
const RECORDINGS = new Set([]);

const SONGS = {
  robin: [[2600, 3400, .12], [3400, 2400, .1], [2800, 4200, .08], [4000, 3000, .14], [2400, 3200, .1], [3600, 2600, .16]],
  bluetit: [[5200, 5000, .08], [5200, 5000, .08], [3600, 3400, .3]],
  magpie: [[1200, 900, .07], [1200, 900, .07], [1200, 900, .07], [1200, 900, .07], [1200, 900, .07], [1200, 900, .07]],
  blackbird: [[1800, 2400, .25], [2400, 1600, .3], [1600, 2200, .2], [2600, 2000, .35]],
  sparrow: [[3200, 2600, .1], [3200, 2600, .1], [3000, 2500, .1], [3200, 2600, .1]],
  mallard: [[500, 380, .18], [480, 360, .18], [460, 340, .18], [420, 320, .3]]
};
const HARSH = new Set(['magpie', 'mallard']);

let ctx = null;
let timer = null;
let audioEl = null;

export function stopSong() {
  clearTimeout(timer); timer = null;
  if (audioEl) { audioEl.pause(); audioEl = null; }
  if (ctx) { ctx.close().catch(() => {}); ctx = null; }
}

/** Plays the song for a bird. Calls onEnd when finished. */
export function playSong(id, onEnd) {
  stopSong();
  if (RECORDINGS.has(id)) {
    audioEl = new Audio(`sounds/${id}.mp3`);
    audioEl.onended = () => { audioEl = null; onEnd && onEnd(); };
    audioEl.play().catch(() => onEnd && onEnd());
    return;
  }

  const notes = SONGS[id];
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!notes || !AC) { onEnd && onEnd(); return; }
  ctx = new AC();
  let t = ctx.currentTime + 0.05;
  const harsh = HARSH.has(id);
  for (const [f0, f1, d] of notes) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = harsh ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(harsh ? 0.12 : 0.25, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + d + 0.02);
    t += d + 0.06;
  }
  timer = setTimeout(() => { stopSong(); onEnd && onEnd(); }, (t - ctx.currentTime) * 1000 + 200);
}
