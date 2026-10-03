import { BIRDS, byId, birdSvg, silhouetteSvg, garySvg } from './birds.js';
import { getFlock, addSighting, release } from './store.js';
import { identify, DEMO_MODE } from './identify.js';
import { playSong, stopSong } from './sounds.js';

const app = document.getElementById('app');

const state = {
  screen: 'welcome',
  method: null,
  grumble: false,
  result: null,      // { birdId, confidence }
  savedCount: 0,     // >0 once the current result is saved
  snapshot: null,    // small data-URL of the user's photo or doodle
  describe: {},
  detail: null,
  releaseArmed: false
};

let cleanup = null; // stops camera / mic when leaving a screen

/* ---------- small helpers ---------- */

const icon = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  mic: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,
  chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  pencil: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/></svg>',
  grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  upload: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/></svg>'
};

const METHOD_NAMES = { photo: 'Photo', sound: 'Sound', describe: 'Words', draw: 'Doodle' };

function flockSummary() {
  const flock = getFlock();
  const ids = Object.keys(flock).filter(byId);
  return {
    flock,
    found: ids.length,
    sightings: ids.reduce((n, id) => n + flock[id].count, 0)
  };
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch (e) { return ''; }
}

/** Shrinks any image source to a small JPEG data URL for the gallery. */
function toThumb(source, sw, sh, max = 360) {
  const k = Math.min(1, max / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}

/* ---------- navigation ---------- */

function go(screen, extra = {}) {
  stopSong();
  Object.assign(state, { screen }, extra);
  render();
  window.scrollTo(0, 0);
}

function render() {
  if (cleanup) { cleanup(); cleanup = null; }
  app.innerHTML = SCREENS[state.screen]();
  const mount = MOUNTS[state.screen];
  if (mount) cleanup = mount() || null;
}

async function ask(input) {
  state.method = input.method;
  state.snapshot = input.image || null;
  go('thinking');
  const result = await identify(input);
  if (state.screen !== 'thinking') return; // user left meanwhile
  go('result', { result, savedCount: 0 });
}

/* ---------- screens ---------- */

const SCREENS = {
  welcome() {
    const { found } = flockSummary();
    return `<section class="screen center">
      <div class="spacer"></div>
      <div class="gary-bob">${garySvg(180, '#fff')}</div>
      <h1>Who Dat Bird?</h1>
      <p style="font-size:18px;max-width:300px">Meet Gary. He's a pigeon. He knows every bird. He will not let you forget it.</p>
      <div class="spacer"></div>
      <button class="btn primary block" data-act="chat">Say hi to Gary</button>
      ${found ? `<button class="link-btn" data-act="gallery">My flock (${found})</button>` : ''}
    </section>`;
  },

  chat() {
    const { found } = flockSummary();
    const opener = state.grumble
      ? 'Wrong bird?! Impossible. Fine. Again.'
      : found ? 'Back again? Good. Show me another one.' : 'Oi. You there. With the binoculars.';
    return `<section style="min-height:100dvh;display:flex;flex-direction:column">
      <header class="chat-head">
        ${garySvg(44)}
        <div class="who"><strong>Gary the Pigeon</strong><span>bird expert · self-appointed</span></div>
        <button class="flock-pill" data-act="gallery" aria-label="My flock, ${found} birds">${icon.grid}${found}</button>
      </header>
      <div class="chat-body">
        <div class="bubble">${opener}</div>
        <div class="bubble">I know every bird in this park. Personally. Show me yours and I'll tell you who it is.</div>
        <div class="bubble"><strong>So… how are we doing this?</strong></div>
      </div>
      <div class="reply-tray">
        <span class="label">Reply to Gary</span>
        <div class="reply-grid">
          <button class="btn" data-act="pick" data-m="photo">${icon.camera}<span>Here's a pic</span></button>
          <button class="btn" data-act="pick" data-m="sound">${icon.mic()}<span>Listen to this</span></button>
          <button class="btn" data-act="pick" data-m="describe">${icon.chat}<span>I'll describe it</span></button>
          <button class="btn" data-act="pick" data-m="draw">${icon.pencil}<span>Let me draw it</span></button>
        </div>
      </div>
    </section>`;
  },

  photo() {
    return `<section class="screen dark">
      <div class="topbar">
        <button class="icon-btn ring" data-act="chat" aria-label="Back to Gary">${icon.close}</button>
        <span class="grow" style="text-align:center;font-weight:700">Gary says: "Don't scare it."</span>
        <span style="width:44px"></span>
      </div>
      <div class="viewfinder">
        <video id="cam" playsinline muted autoplay></video>
        <div class="frame"></div>
        <div class="hint">Bird in the box, please</div>
        <div class="fallback" id="cam-fallback" hidden>
          <p><strong>No camera access.</strong><br>Upload a photo instead. Gary isn't fussy.</p>
          <label class="btn" style="color:var(--ink)">${icon.upload}<span>Choose a photo</span>
            <input class="visually-hidden" type="file" accept="image/*" data-file></label>
        </div>
        <div class="flash" id="flash"></div>
      </div>
      <div class="shutter-row">
        <label class="icon-btn ring file-label" aria-label="Upload a photo">${icon.upload}
          <input class="visually-hidden" type="file" accept="image/*" data-file></label>
        <button class="shutter" data-act="snap" aria-label="Take photo"></button>
        <span style="width:44px"></span>
      </div>
    </section>`;
  },

  sound() {
    return `<section class="screen center">
      <div class="topbar" style="align-self:stretch"><button class="icon-btn" data-act="chat" aria-label="Back to Gary">${icon.back}</button></div>
      <h2 id="snd-title">Let Gary listen</h2>
      <p id="snd-hint" style="max-width:300px;font-size:17px">Tap the mic and point your phone at the singing.</p>
      <div class="meter" id="meter">${'<span></span>'.repeat(9)}</div>
      <button class="mic" id="mic" data-act="rec" aria-label="Start recording">${icon.mic(44)}</button>
      <span id="mic-label" style="font-weight:700">Tap to record</span>
      <div class="spacer"></div>
      <button class="btn primary block" id="ask-sound" data-act="ask-sound" disabled>Ask Gary</button>
    </section>`;
  },

  describe() {
    const groups = [
      ['size', 'Size', ['Tiny', 'Pigeon-ish', 'Chonky', 'Huge']],
      ['colour', 'Main colour', ['Brown', 'Red / orange', 'Blue', 'Black', 'Black & white']],
      ['vibe', 'Vibe', ['Smug', 'Chaotic', 'Shy', 'Loud']]
    ];
    return `<section class="screen">
      <div class="topbar"><button class="icon-btn" data-act="chat" aria-label="Back to Gary">${icon.back}</button></div>
      <h2>Describe the suspect.</h2>
      ${groups.map(([key, label, opts]) => `
        <div style="display:flex;flex-direction:column;gap:8px">
          <span class="label">${label}</span>
          <div class="chips">${opts.map((o) => `<button class="chip" data-act="chip" data-g="${key}" data-v="${o}" aria-pressed="${state.describe[key] === o}">${o}</button>`).join('')}</div>
        </div>`).join('')}
      <label style="display:flex;flex-direction:column;gap:8px">
        <span class="label">Anything else?</span>
        <input type="text" id="desc-text" placeholder="e.g. stole my sandwich" maxlength="140">
      </label>
      <div class="spacer"></div>
      <button class="btn primary block" data-act="ask-describe">Ask Gary</button>
    </section>`;
  },

  draw() {
    return `<section class="screen">
      <div class="topbar">
        <button class="icon-btn" data-act="chat" aria-label="Back to Gary">${icon.back}</button>
        <span class="grow"></span>
        <button class="chip" data-act="clear">Clear</button>
      </div>
      <h2>Draw it. Gary won't laugh.</h2>
      <p class="small">(Gary will laugh.)</p>
      <div class="pad"><canvas id="pad"></canvas><span class="empty" id="pad-empty">Doodle here with your finger</span></div>
      <div class="spacer"></div>
      <button class="btn primary block" data-act="ask-draw">Ask Gary</button>
    </section>`;
  },

  thinking() {
    return `<section class="screen center">
      <div class="spacer"></div>
      <div class="gary-bob">${garySvg(140, '#fff')}</div>
      <h2 style="font-size:28px">Gary is consulting his notes…</h2>
      <div class="dots"><span></span><span></span><span></span></div>
      <p class="small">(he doesn't have notes)</p>
      <div class="spacer"></div>
    </section>`;
  },

  result() {
    const b = byId(state.result.birdId);
    const lines = {
      photo: `Blurry, but I would know a ${b.short} anywhere.`,
      sound: `That song? Classic ${b.short}. You were a bit off-key though.`,
      describe: `From that description? ${b.short}. Obviously.`,
      draw: `Your drawing is… brave. But I got it. ${b.short}.`
    };
    const saved = state.savedCount > 0;
    return `<section class="screen">
      <span class="label">Gary's verdict</span>
      <div class="card">
        <div class="art">${birdSvg(b, 170)}${state.snapshot ? `<img class="yours" src="${state.snapshot}" alt="Your ${state.method === 'draw' ? 'doodle' : 'photo'}">` : ''}</div>
        <div class="body">
          <span class="name">${b.name}</span>
          <span class="latin">${b.latin}</span>
          <span class="tag">Gary is ${state.result.confidence}% sure</span>
          ${DEMO_MODE ? '<span class="demo">Demo mode: Gary is guessing for now.</span>' : ''}
        </div>
      </div>
      <div class="say">${garySvg(40)}<div class="bubble">${lines[state.method] || lines.photo}</div></div>
      <div class="spacer"></div>
      ${saved
        ? `<div class="done">${icon.check}${state.savedCount > 1 ? `Saved. That's ${state.savedCount} ${b.short}s now.` : 'New bird! Gary is proud of you.'}</div>
           <button class="btn block" data-act="gallery" style="background:var(--accent)">See my flock</button>`
        : `<button class="btn primary block" data-act="save">Add to my flock</button>`}
      <button class="btn block" data-act="again">${saved ? 'Find another bird' : 'Nope, wrong bird — try again'}</button>
    </section>`;
  },

  gallery() {
    const { flock, found, sightings } = flockSummary();
    const pct = Math.round((found / BIRDS.length) * 100);
    return `<section class="screen">
      <div class="topbar">
        <button class="icon-btn" data-act="chat" aria-label="Back to Gary">${icon.back}</button>
        <h2 class="grow" style="font-size:32px">My flock</h2>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;font-weight:700"><span>${found} of ${BIRDS.length} birds found</span><span>${sightings} sightings</span></div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${BIRDS.length}" aria-valuenow="${found}"><div style="width:${pct}%"></div></div>
      </div>
      <div class="grid">
        ${BIRDS.map((b) => flock[b.id]
          ? `<button class="slot" data-act="detail" data-id="${b.id}" aria-label="${b.name}, seen ${flock[b.id].count} times">
               ${birdSvg(b, 72)}<span class="nm">${b.short}</span><span class="count">×${flock[b.id].count}</span></button>`
          : `<div class="slot locked">${silhouetteSvg(72)}<span class="nm">???</span></div>`).join('')}
      </div>
      ${found === 0 ? `<div class="say">${garySvg(40)}<div class="bubble">Empty. Tragic. Go find me a bird.</div></div>` : ''}
      <div class="spacer"></div>
      <button class="btn primary block" data-act="chat">Find another bird</button>
      ${state.detail ? detailSheet(flock) : ''}
    </section>`;
  }
};

function detailSheet(flock) {
  const b = byId(state.detail);
  const f = flock[b.id];
  if (!f) return '';
  return `<div class="sheet-backdrop" data-act="backdrop">
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${b.name}">
      <div class="topbar" style="align-items:flex-start">
        <div class="grow" style="display:flex;flex-direction:column">
          <span style="font-weight:800;font-size:26px;line-height:1.1">${b.name}</span>
          <span class="latin">${b.latin}</span>
        </div>
        <button class="icon-btn ring" data-act="close-detail" aria-label="Close">${icon.close}</button>
      </div>
      <div class="media-row">
        <div class="pic">${birdSvg(b, 130)}</div>
        <button class="song-btn" id="song" data-act="song" aria-label="Play song">${songInner(false)}</button>
      </div>
      <div class="stats">
        <div class="stat"><span class="label">Spotted</span><strong>${f.count === 1 ? 'Once' : `${f.count} times`}</strong></div>
        <div class="stat"><span class="label">Caught by</span><strong>${METHOD_NAMES[f.method] || 'Photo'}</strong></div>
      </div>
      ${f.snapshot ? `<div class="yours-row"><img src="${f.snapshot}" alt="Your capture of the ${b.short}"><span class="small">Your evidence · first seen ${formatDate(f.firstSeen)}</span></div>`
                   : `<span class="small">First seen ${formatDate(f.firstSeen)}</span>`}
      <div class="take"><strong>Gary's take:</strong> ${b.take}</div>
      <button class="link-btn" data-act="release">${state.releaseArmed ? 'Tap again to release it for real' : 'Release back into the wild'}</button>
    </div>
  </div>`;
}

function songInner(playing) {
  return playing
    ? '<div class="bars"><span></span><span></span><span></span><span></span><span></span></div><span>Playing…</span>'
    : `<div class="play">${icon.play}</div><span>Play song</span>`;
}

/* ---------- screen behaviour (camera, mic, drawing) ---------- */

const MOUNTS = {
  photo() {
    const video = document.getElementById('cam');
    let stream = null;
    let alive = true;
    const fallback = () => { document.getElementById('cam-fallback').hidden = false; };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then((s) => {
          if (!alive) { s.getTracks().forEach((t) => t.stop()); return; }
          stream = s; video.srcObject = s;
        })
        .catch(fallback);
    } else fallback();
    return () => { alive = false; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  },

  draw() {
    const canvas = document.getElementById('pad');
    const empty = document.getElementById('pad-empty');
    const g = canvas.getContext('2d');
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#fff'; g.fillRect(0, 0, r.width, r.height);
      g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#2B2340';
    };
    size();
    let drawing = false;
    let last = null;
    const pt = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = (e) => {
      drawing = true; last = pt(e); canvas.setPointerCapture(e.pointerId);
      g.beginPath(); g.arc(last[0], last[1], 2.5, 0, Math.PI * 2); g.fillStyle = '#2B2340'; g.fill();
      empty.hidden = true; state.drew = true;
    };
    const move = (e) => {
      if (!drawing) return;
      const p = pt(e);
      g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke();
      last = p;
    };
    const up = () => { drawing = false; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    state.drew = false;
    state.clearPad = () => { size(); empty.hidden = false; state.drew = false; };
    state.padSnapshot = () => toThumb(canvas, canvas.width, canvas.height);
    return () => { delete state.clearPad; delete state.padSnapshot; };
  },

  sound() {
    const rec = { stream: null, recorder: null, ctx: null, raf: 0, timer: 0, recording: false, recorded: false };
    const $ = (id) => document.getElementById(id);
    const bars = [...$('meter').children];

    const setUi = (mode) => {
      const mic = $('mic');
      mic.classList.toggle('rec', mode === 'rec');
      mic.setAttribute('aria-label', mode === 'rec' ? 'Stop recording' : 'Start recording');
      $('mic-label').textContent = mode === 'rec' ? 'Tap to stop' : mode === 'done' ? 'Record again' : 'Tap to record';
      $('snd-title').textContent = mode === 'rec' ? 'Listening…' : mode === 'done' ? 'Got it!' : mode === 'nomic' ? 'No mic? No problem.' : 'Let Gary listen';
      $('snd-hint').textContent = mode === 'rec' ? 'Hold still. Or do your best impression.'
        : mode === 'done' ? 'Lovely. Gary is ready to judge.'
        : mode === 'nomic' ? "Gary couldn't use the microphone. Just squawk at him and tap Ask Gary." : 'Tap the mic and point your phone at the singing.';
      $('ask-sound').disabled = !(mode === 'done' || mode === 'nomic');
    };

    const stopAll = () => {
      cancelAnimationFrame(rec.raf); clearTimeout(rec.timer);
      if (rec.recorder && rec.recorder.state !== 'inactive') rec.recorder.stop();
      if (rec.stream) rec.stream.getTracks().forEach((t) => t.stop());
      if (rec.ctx) rec.ctx.close().catch(() => {});
      rec.stream = rec.recorder = rec.ctx = null;
      bars.forEach((b) => { b.style.height = '12px'; });
    };

    state.toggleRec = async () => {
      if (rec.recording) {
        rec.recording = false; rec.recorded = true; stopAll(); setUi('done');
        return;
      }
      try {
        rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) { setUi('nomic'); return; }
      rec.recording = true; setUi('rec');
      if (window.MediaRecorder) {
        rec.recorder = new MediaRecorder(rec.stream);
        rec.chunks = [];
        rec.recorder.ondataavailable = (ev) => rec.chunks.push(ev.data);
        rec.recorder.onstop = () => { state.audio = new Blob(rec.chunks, { type: rec.recorder ? rec.recorder.mimeType : 'audio/webm' }); };
        rec.recorder.start();
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        rec.ctx = new AC();
        const an = rec.ctx.createAnalyser(); an.fftSize = 64;
        rec.ctx.createMediaStreamSource(rec.stream).connect(an);
        const data = new Uint8Array(an.frequencyBinCount);
        const tick = () => {
          an.getByteFrequencyData(data);
          bars.forEach((b, i) => { b.style.height = `${12 + (data[i + 2] / 255) * 108}px`; });
          rec.raf = requestAnimationFrame(tick);
        };
        tick();
      }
      rec.timer = setTimeout(() => { if (rec.recording) state.toggleRec(); }, 15000);
    };
    return () => { stopAll(); delete state.toggleRec; };
  },

  gallery() {
    if (!state.detail) return null;
    const onKey = (e) => { if (e.key === 'Escape') go('gallery', { detail: null, releaseArmed: false }); };
    document.addEventListener('keydown', onKey);
    const close = document.querySelector('[data-act="close-detail"]');
    if (close) close.focus();
    return () => document.removeEventListener('keydown', onKey);
  }
};

/* ---------- actions ---------- */

const ACTIONS = {
  chat: () => go('chat'),
  gallery: () => go('gallery', { detail: null, releaseArmed: false }),
  pick: (el) => go(el.dataset.m, { method: el.dataset.m, grumble: state.grumble }),

  snap: () => {
    const video = document.getElementById('cam');
    if (!video || !video.videoWidth) {
      document.getElementById('cam-fallback').hidden = false;
      return;
    }
    const image = toThumb(video, video.videoWidth, video.videoHeight);
    const flash = document.getElementById('flash');
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    setTimeout(() => ask({ method: 'photo', image }), 250);
  },

  rec: () => state.toggleRec && state.toggleRec(),
  'ask-sound': () => ask({ method: 'sound', audio: state.audio || null }),

  chip: (el) => {
    const key = el.dataset.g;
    const val = state.describe[key] === el.dataset.v ? null : el.dataset.v;
    state.describe[key] = val;
    el.parentElement.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.v === val)));
  },
  'ask-describe': () => {
    const text = (document.getElementById('desc-text') || {}).value || '';
    ask({ method: 'describe', description: { ...state.describe, text } });
  },

  clear: () => state.clearPad && state.clearPad(),
  'ask-draw': () => ask({ method: 'draw', image: state.drew && state.padSnapshot ? state.padSnapshot() : null }),

  save: () => {
    const count = addSighting(state.result.birdId, state.method, state.snapshot);
    state.savedCount = count;
    render();
  },
  again: () => go('chat', { grumble: state.savedCount === 0, describe: {} }),

  detail: (el) => go('gallery', { detail: el.dataset.id, releaseArmed: false }),
  'close-detail': () => go('gallery', { detail: null, releaseArmed: false }),
  backdrop: (el, e) => { if (e.target === el) ACTIONS['close-detail'](); },
  song: (el) => {
    if (el.classList.contains('playing')) {
      stopSong();
      el.classList.remove('playing'); el.innerHTML = songInner(false); el.setAttribute('aria-label', 'Play song');
      return;
    }
    el.classList.add('playing'); el.innerHTML = songInner(true); el.setAttribute('aria-label', 'Stop song');
    playSong(state.detail, () => {
      el.classList.remove('playing'); el.innerHTML = songInner(false); el.setAttribute('aria-label', 'Play song');
    });
  },
  release: () => {
    if (!state.releaseArmed) { state.releaseArmed = true; render(); return; }
    release(state.detail);
    go('gallery', { detail: null, releaseArmed: false });
  }
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el, e);
});

// Photo uploads (fallback when there's no camera, or by choice).
app.addEventListener('change', (e) => {
  const input = e.target.closest('[data-file]');
  if (!input || !input.files || !input.files[0]) return;
  const url = URL.createObjectURL(input.files[0]);
  const img = new Image();
  img.onload = () => {
    const image = toThumb(img, img.naturalWidth, img.naturalHeight);
    URL.revokeObjectURL(url);
    ask({ method: 'photo', image });
  };
  img.src = url;
});

render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
