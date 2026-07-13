/* Tiny synthesized sound effects via the Web Audio API — no audio assets.
 * The AudioContext is created lazily on the first play, which always happens
 * inside a user gesture, so autoplay policies are satisfied. */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundsEnabled(on: boolean): void {
  enabled = on;
}

function ac(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  /* Slide the pitch to this frequency over the tone's duration. */
  glide?: number;
}

/* Play one enveloped tone `start` seconds from now for `dur` seconds. */
function tone(freq: number, start: number, dur: number, opts: ToneOpts = {}): void {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.glide) osc.frequency.exponentialRampToValueAtTime(opts.glide, t0 + dur);
  const peak = opts.gain ?? 0.12;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export const sounds = {
  /* Correct number placed. */
  blip(): void {
    if (!enabled) return;
    tone(520, 0, 0.09, { glide: 780, gain: 0.11 });
  },
  /* Scribble toggled. */
  scribble(): void {
    if (!enabled) return;
    tone(420, 0, 0.055, { glide: 540, gain: 0.06 });
  },
  /* Cell erased. */
  erase(): void {
    if (!enabled) return;
    tone(320, 0, 0.08, { glide: 190, gain: 0.07 });
  },
  /* Wrong number. */
  error(): void {
    if (!enabled) return;
    tone(165, 0, 0.16, { type: "square", gain: 0.05 });
    tone(118, 0.08, 0.18, { type: "square", gain: 0.045 });
  },
  /* Row / column / box completed. */
  unit(): void {
    if (!enabled) return;
    tone(523, 0, 0.1, { gain: 0.11 });
    tone(784, 0.09, 0.16, { gain: 0.11 });
  },
  /* Streak milestone. */
  streak(): void {
    if (!enabled) return;
    tone(523, 0, 0.1, { gain: 0.11 });
    tone(659, 0.09, 0.1, { gain: 0.11 });
    tone(880, 0.18, 0.22, { gain: 0.12 });
  },
  /* Puzzle solved. */
  win(): void {
    if (!enabled) return;
    tone(523, 0, 0.14, { gain: 0.12 });
    tone(659, 0.12, 0.14, { gain: 0.12 });
    tone(784, 0.24, 0.14, { gain: 0.12 });
    tone(1047, 0.36, 0.4, { gain: 0.13 });
  },
};
