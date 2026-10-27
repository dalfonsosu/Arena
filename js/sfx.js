/* Sonidos de la cajita: WebAudio puro, sin archivos externos. */
const SFX = (() => {
  'use strict';

  let ctx = null;
  let master = null;
  let muted = false;

  try {
    muted = localStorage.getItem('cafescan:muted') === '1';
  } catch (e) { /* modo privado */ }

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, opts) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const o = opts || {};
    const t0 = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t0 + dur);
    const peak = (o.gain == null ? 0.13 : o.gain);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noise(dur, gainValue, filterFreq) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = filterFreq || 1400;
    band.Q.value = 0.7;
    const g = c.createGain();
    g.gain.value = gainValue == null ? 0.08 : gainValue;
    src.connect(band); band.connect(g); g.connect(master);
    src.start(t0);
  }

  const sounds = {
    click: () => tone(660, 0.05, { gain: 0.06, type: 'square' }),
    move: () => tone(880, 0.04, { gain: 0.045, type: 'square' }),
    confirm: () => { tone(520, 0.06, { gain: 0.07 }); tone(780, 0.09, { gain: 0.07, delay: 0.06 }); },
    scan: () => {
      noise(0.55, 0.05, 1800);
      tone(300, 0.5, { to: 1200, gain: 0.05, type: 'sawtooth' });
    },
    shutter: () => { noise(0.08, 0.14, 3200); tone(1200, 0.05, { gain: 0.05, to: 400 }); },
    correct: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.16, { gain: 0.09, delay: i * 0.075, type: 'triangle' }));
    },
    wrong: () => {
      tone(220, 0.22, { gain: 0.1, type: 'sawtooth', to: 140 });
      tone(155, 0.3, { gain: 0.08, type: 'square', delay: 0.12, to: 90 });
    },
    hint: () => { tone(1046, 0.07, { gain: 0.06, type: 'triangle' }); tone(1318, 0.1, { gain: 0.06, type: 'triangle', delay: 0.07 }); },
    heart: () => tone(180, 0.3, { gain: 0.1, type: 'sawtooth', to: 70 }),
    over: () => {
      [392, 329.6, 261.6, 196].forEach((f, i) => tone(f, 0.28, { gain: 0.09, delay: i * 0.16, type: 'triangle' }));
    },
    record: () => {
      [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.2, { gain: 0.08, delay: i * 0.08, type: 'triangle' }));
    },
    boot: () => {
      tone(180, 0.12, { gain: 0.07, type: 'square' });
      tone(360, 0.12, { gain: 0.06, type: 'square', delay: 0.1 });
      tone(720, 0.18, { gain: 0.05, type: 'square', delay: 0.2 });
    }
  };

  function play(name) {
    const fn = sounds[name];
    if (!fn) return;
    try { fn(); } catch (e) { /* silencio */ }
  }

  function unlock() {
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function isMuted() { return muted; }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem('cafescan:muted', muted ? '1' : '0'); } catch (e) { /* nada */ }
    if (!muted) { unlock(); play('click'); }
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, unlock, { once: true, passive: true });
  });

  return { play, isMuted, setMuted, unlock };
})();
