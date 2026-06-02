// Lightweight Web Audio "slowed worry phonk" synthesizer.
// Generates a looping atmospheric phonk pattern (sub bass + cowbell + hat)
// without requiring any external audio file.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let timerId: number | null = null;
let stepIndex = 0;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    ctx = new AC();
  }
  return ctx;
}

function cowbell(time: number, freq: number, gain = 0.18) {
  const c = getCtx();
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = "square";
  o2.type = "square";
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.5;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
  o1.connect(g); o2.connect(g);
  g.connect(masterGain!);
  o1.start(time); o2.start(time);
  o1.stop(time + 0.4); o2.stop(time + 0.4);
}

function sub(time: number, freq: number, dur = 0.6, gain = 0.55) {
  const c = getCtx();
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq * 2, time);
  o.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g); g.connect(masterGain!);
  o.start(time); o.stop(time + dur + 0.05);
}

function hat(time: number, gain = 0.06) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 6000;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(hp); hp.connect(g); g.connect(masterGain!);
  src.start(time);
}

// Slow phonk: ~70 BPM, step = 8th note (~0.428s)
const STEP_SEC = 0.428;
// 16 steps per bar
// Bass on 1, 5, 9, 13 ; cowbell pattern; hats on offbeats
const BASS = [0, 6, 8, 14];
const COWBELL = [0, 3, 6, 10, 12];
const HAT = [2, 4, 6, 10, 12, 14];

const BASS_NOTES = [55, 55, 49, 52]; // A1, A1, G1, G#1 — moody

export function startPhonk() {
  const c = getCtx();
  if (c.state === "suspended") c.resume().catch(() => {});
  if (timerId !== null) return;
  masterGain = c.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(c.destination);
  stepIndex = 0;

  let bar = 0;
  const tick = () => {
    const now = c.currentTime + 0.05;
    for (let s = 0; s < 16; s++) {
      const t = now + s * STEP_SEC;
      if (BASS.includes(s)) sub(t, BASS_NOTES[bar % BASS_NOTES.length], 0.55, 0.6);
      if (COWBELL.includes(s)) cowbell(t, 540, 0.14);
      if (HAT.includes(s)) hat(t, 0.05);
    }
    bar++;
  };
  tick();
  timerId = window.setInterval(tick, STEP_SEC * 16 * 1000);
}

export function stopPhonk() {
  if (timerId !== null) { window.clearInterval(timerId); timerId = null; }
  if (masterGain && ctx) {
    const t = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    const g = masterGain;
    window.setTimeout(() => { try { g.disconnect(); } catch {} }, 600);
    masterGain = null;
  }
}