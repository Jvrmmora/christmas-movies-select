// Tiny synthesized sounds (Web Audio). No audio files to download.

export type SoundName = "bell" | "tick" | "jingle" | "swoosh";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Soft bell: inharmonic partials with a long exponential decay. */
function bell(ac: AudioContext) {
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.16;
  out.connect(ac.destination);
  for (const [ratio, amp, decay] of [[1, 1, 1.6], [2.76, 0.5, 0.9], [5.4, 0.25, 0.5], [8.93, 0.12, 0.3]]) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = 1046.5 * ratio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  }
}

function tick(ac: AudioContext) {
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(320, t + 0.09);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.14);
}

/** Short glockenspiel arpeggio (G6 B6 D7 G7). */
function jingle(ac: AudioContext) {
  const t0 = ac.currentTime;
  [1568, 1976, 2349, 3136].forEach((f, i) => {
    const t = t0 + i * 0.075;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}

function swoosh(ac: AudioContext) {
  const t = ac.currentTime;
  const len = Math.floor(ac.sampleRate * 0.5);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(380, t);
  f.frequency.exponentialRampToValueAtTime(3000, t + 0.45);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

const SOUNDS: Record<SoundName, (ac: AudioContext) => void> = { bell, tick, jingle, swoosh };

export function playSound(name: SoundName) {
  const ac = audio();
  if (!ac) return;
  try {
    SOUNDS[name](ac);
  } catch {
    // Audio is a nicety; never break the UI over it.
  }
}
