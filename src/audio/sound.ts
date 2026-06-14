/**
 * Tiny synthesized sound effects via the Web Audio API — no audio files, works
 * offline, loads instantly. Each effect is crafted from oscillators + gain
 * envelopes. A mute toggle persists in localStorage. Audio is unlocked on the
 * first user gesture (mobile autoplay policy) via unlockAudio().
 */

export type SoundName = 'clue' | 'accuse' | 'correct' | 'wrong' | 'culprit' | 'reveal';

const MUTE_KEY = 'mafioso.muted';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const listeners = new Set<(m: boolean) => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

/** Call from a user gesture (first tap) so audio can play on mobile. */
export function unlockAudio() {
  ensureCtx();
}

export function isMuted(): boolean {
  return muted;
}
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(m));
}
export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}
/** Subscribe to mute changes (for UI). Returns an unsubscribe fn. */
export function onMuteChange(fn: (m: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ---------------- synthesis helpers ----------------
interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  freqTo?: number;
  at?: number; // start offset in seconds
  dur?: number;
  gain?: number;
  attack?: number;
}
function tone(c: AudioContext, out: GainNode, o: ToneOpts) {
  const { type = 'sine', freq, freqTo, at = 0, dur = 0.3, gain = 0.3, attack = 0.012 } = o;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
function noise(
  c: AudioContext,
  out: GainNode,
  o: { at?: number; dur?: number; gain?: number; freq?: number; q?: number },
) {
  const { at = 0, dur = 0.3, gain = 0.2, freq = 900, q = 1 } = o;
  const t0 = c.currentTime + at;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = freq;
  filt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export function play(name: SoundName) {
  if (muted) return;
  const c = ensureCtx();
  if (!c || !master) return;
  const out = master;
  switch (name) {
    case 'clue': // intriguing two-note ping with a low pad
      tone(c, out, { type: 'triangle', freq: 659, dur: 0.18, gain: 0.16 });
      tone(c, out, { type: 'triangle', freq: 988, at: 0.12, dur: 0.32, gain: 0.14 });
      tone(c, out, { type: 'sine', freq: 330, dur: 0.4, gain: 0.06 });
      break;
    case 'reveal': // soft neutral "your secret" tone (plays for every player)
      tone(c, out, { type: 'sine', freq: 392, dur: 0.22, gain: 0.12 });
      tone(c, out, { type: 'sine', freq: 523, at: 0.1, dur: 0.28, gain: 0.1 });
      break;
    case 'culprit': // same neutral opener + a low ominous undertone (subtle; sub-bass
      // barely carries from a phone speaker, so it won't out the culprit across the table)
      tone(c, out, { type: 'sine', freq: 392, dur: 0.22, gain: 0.12 });
      tone(c, out, { type: 'sine', freq: 523, at: 0.1, dur: 0.28, gain: 0.1 });
      tone(c, out, { type: 'sawtooth', freq: 73, freqTo: 55, at: 0.04, dur: 1.0, gain: 0.12 });
      tone(c, out, { type: 'sawtooth', freq: 110, freqTo: 98, at: 0.12, dur: 0.9, gain: 0.06 });
      break;
    case 'accuse': { // tension: accelerating heartbeat thumps + a rising hiss
      const beats = [0, 0.34, 0.6, 0.8, 0.95];
      beats.forEach((b, i) =>
        tone(c, out, { type: 'sine', freq: 92, freqTo: 70, at: b, dur: 0.2, gain: 0.24 + i * 0.03 }),
      );
      noise(c, out, { at: 0.2, dur: 1.0, gain: 0.05, freq: 500, q: 0.7 });
      tone(c, out, { type: 'sine', freq: 55, dur: 1.2, gain: 0.08 });
      break;
    }
    case 'correct': { // bright ascending arpeggio + sparkle
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) =>
        tone(c, out, { type: 'triangle', freq: f, at: i * 0.09, dur: 0.5 - i * 0.05, gain: 0.2 }),
      );
      tone(c, out, { type: 'sine', freq: 1568, at: 0.36, dur: 0.5, gain: 0.08 });
      break;
    }
    case 'wrong': { // dramatic descending "fail" sting
      tone(c, out, { type: 'sawtooth', freq: 392, freqTo: 370, dur: 0.22, gain: 0.17 });
      tone(c, out, { type: 'sawtooth', freq: 294, freqTo: 233, at: 0.22, dur: 0.5, gain: 0.17 });
      tone(c, out, { type: 'sine', freq: 98, freqTo: 73, at: 0.22, dur: 0.5, gain: 0.12 });
      break;
    }
  }
}
