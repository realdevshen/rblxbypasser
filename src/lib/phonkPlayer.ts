// Slowed "worry" phonk synthesizer — richer mix with sub bass, cowbell,
// snare, hats, vinyl noise, and a melodic lead routed through a delay send.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let delayBus: GainNode | null = null;
let vinylSrc: AudioBufferSourceNode | null = null;
let vinylGain: GainNode | null = null;
let timerId: number | null = null;

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
  o1.type = "square"; o2.type = "square";
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.5;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);
  o1.connect(g); o2.connect(g);
  g.connect(masterGain!);
  g.connect(delayBus!);
  o1.start(time); o2.start(time);
  o1.stop(time + 0.5); o2.stop(time + 0.5);
}

function sub(time: number, freq: number, dur = 0.7, gain = 0.7) {
  const c = getCtx();
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(freq * 2, time);
  o.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
  const dist = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 2.2);
  }
  dist.curve = curve;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(dist); dist.connect(g); g.connect(masterGain!);
  o.start(time); o.stop(time + dur + 0.05);
}

function hat(time: number, gain = 0.06, dur = 0.05) {
  const c = getCtx();
  const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 7000;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(hp); hp.connect(g); g.connect(masterGain!);
  src.start(time);
}

function snare(time: number, gain = 0.22) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.value = gain;
  // Body tone
  const tone = c.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(220, time);
  tone.frequency.exponentialRampToValueAtTime(120, time + 0.12);
  const tg = c.createGain();
  tg.gain.setValueAtTime(gain * 0.5, time);
  tg.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  tone.connect(tg); tg.connect(masterGain!);
  src.connect(bp); bp.connect(g); g.connect(masterGain!); g.connect(delayBus!);
  tone.start(time); tone.stop(time + 0.2);
  src.start(time);
}

function lead(time: number, freq: number, dur = 0.9, gain = 0.12) {
  const c = getCtx();
  const o = c.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(freq, time);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1200, time);
  lp.frequency.exponentialRampToValueAtTime(500, time + dur);
  lp.Q.value = 6;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gain, time + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(lp); lp.connect(g); g.connect(masterGain!); g.connect(delayBus!);
  o.start(time); o.stop(time + dur + 0.05);
}

function startVinyl() {
  const c = getCtx();
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
  vinylSrc = c.createBufferSource();
  vinylSrc.buffer = buf;
  vinylSrc.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 2200;
  const hp = c.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 400;
  vinylGain = c.createGain();
  vinylGain.gain.value = 0.04;
  vinylSrc.connect(hp); hp.connect(lp); lp.connect(vinylGain); vinylGain.connect(masterGain!);
  vinylSrc.start();
}

// Slowed phonk: ~64 BPM, 16 steps/bar at 8th notes (~0.469s)
const STEP_SEC = 0.469;
const BASS_STEPS = [0, 6, 8, 14];
const COWBELL_STEPS = [0, 3, 6, 10, 12];
const HAT_STEPS = [2, 4, 6, 10, 12, 14];
const SNARE_STEPS = [4, 12];
const LEAD_STEPS = [0, 6, 10];

// A minor mood: A1, A1, G1, G#1
const BASS_NOTES = [55, 55, 49, 52];
// Lead melodies per bar (Hz). Minor pentatonic-ish.
const LEAD_BARS = [
  [440, 523.25, 659.25], // A4 C5 E5
  [392, 523.25, 587.33], // G4 C5 D5
  [415.3, 523.25, 622.25], // G#4 C5 D#5
  [392, 466.16, 587.33], // G4 A#4 D5
];

export function startPhonk() {
  const c = getCtx();
  if (c.state === "suspended") c.resume().catch(() => {});
  if (timerId !== null) return;

  masterGain = c.createGain();
  masterGain.gain.value = 0.55;
  masterGain.connect(c.destination);

  // Delay send (slap-back for that lo-fi feel)
  delayBus = c.createGain();
  delayBus.gain.value = 0.35;
  const delay = c.createDelay();
  delay.delayTime.value = STEP_SEC * 0.5;
  const feedback = c.createGain();
  feedback.gain.value = 0.32;
  const delayLp = c.createBiquadFilter();
  delayLp.type = "lowpass"; delayLp.frequency.value = 2400;
  delayBus.connect(delay);
  delay.connect(delayLp); delayLp.connect(feedback); feedback.connect(delay);
  delayLp.connect(masterGain);

  startVinyl();

  let bar = 0;
  const tick = () => {
    const now = c.currentTime + 0.05;
    const lp = LEAD_BARS[bar % LEAD_BARS.length];
    for (let s = 0; s < 16; s++) {
      const t = now + s * STEP_SEC;
      if (BASS_STEPS.includes(s)) sub(t, BASS_NOTES[bar % BASS_NOTES.length]);
      if (COWBELL_STEPS.includes(s)) cowbell(t, 540, 0.13);
      if (HAT_STEPS.includes(s)) hat(t, 0.05);
      if (SNARE_STEPS.includes(s)) snare(t, 0.2);
      const li = LEAD_STEPS.indexOf(s);
      if (li >= 0) lead(t, lp[li % lp.length], 1.0, 0.11);
    }
    bar++;
  };
  tick();
  timerId = window.setInterval(tick, STEP_SEC * 16 * 1000);
}

export function stopPhonk() {
  if (timerId !== null) { window.clearInterval(timerId); timerId = null; }
  if (vinylSrc) { try { vinylSrc.stop(); } catch {} vinylSrc = null; }
  vinylGain = null;
  if (masterGain && ctx) {
    const t = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    const g = masterGain;
    const d = delayBus;
    window.setTimeout(() => {
      try { g.disconnect(); } catch {}
      try { d?.disconnect(); } catch {}
    }, 600);
    masterGain = null;
    delayBus = null;
  }
}