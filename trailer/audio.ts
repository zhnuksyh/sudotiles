import { setSoundsBoost, sounds } from "../src/game/sounds";

/* Cue names map to the app's existing synthesized SFX — no new audio assets. */
export type Cue = keyof typeof sounds;

/* Fire the SFX above the music bed. The app never touches this multiplier
 * (it defaults to 1); the trailer opts in so beats punch through. */
setSoundsBoost(1.7);

/* ── Background music ───────────────────────────────────────────────────────
 * Drop any `track.*` file into trailer/music/ and it is picked up here as a
 * bundled (hashed) asset — resolves correctly under the /sudotiles/ base. If no
 * file is present we fall back to a soft synthesized bed so it's never silent.
 * The glob is eager so the URL is inlined at build time. */
const trackModules = import.meta.glob("./music/track.*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const TRACK_URL: string | null = Object.values(trackModules)[0] ?? null;

let bedCtx: AudioContext | null = null;
let bedGain: GainNode | null = null;
let bedTimer: number | null = null;
let bedStep = 0;
let audioEl: HTMLAudioElement | null = null;

const MUSIC_VOL = 0.32; // the real track sits under the boosted SFX
const BED_VOL = 0.05;

// Fallback bed: a warm, unobtrusive loop in A minor pentatonic.
const BED_NOTES = [220, 261.63, 329.63, 392, 329.63, 261.63, 293.66, 349.23];

export function startMusic(): void {
  if (TRACK_URL) {
    if (audioEl) return;
    audioEl = new Audio(TRACK_URL);
    audioEl.loop = true;
    audioEl.volume = MUSIC_VOL;
    void audioEl.play().catch(() => {
      // If the real track can't play, fall back to the synth bed.
      audioEl = null;
      startBed();
    });
    return;
  }
  startBed();
}

function startBed(): void {
  if (bedTimer != null) return;
  if (typeof AudioContext === "undefined") return;
  bedCtx = new AudioContext();
  if (bedCtx.state === "suspended") void bedCtx.resume();
  bedGain = bedCtx.createGain();
  bedGain.gain.value = BED_VOL;
  bedGain.connect(bedCtx.destination);

  const tick = () => {
    const c = bedCtx;
    const out = bedGain;
    if (!c || !out) return;
    const freq = BED_NOTES[bedStep % BED_NOTES.length];
    bedStep++;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(1, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
    osc.connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + 0.6);
  };
  tick();
  bedTimer = window.setInterval(tick, 300);
}

export function setMusicMuted(muted: boolean): void {
  if (audioEl) audioEl.volume = muted ? 0 : MUSIC_VOL;
  if (bedGain) bedGain.gain.value = muted ? 0 : BED_VOL;
}

/* Restart the music from the top (used on trailer restart / export). */
export function rewindMusic(): void {
  if (audioEl) {
    audioEl.currentTime = 0;
    void audioEl.play().catch(() => {});
  }
}

export function stopMusic(): void {
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
  if (bedTimer != null) window.clearInterval(bedTimer);
  bedTimer = null;
  bedStep = 0;
  if (bedCtx) void bedCtx.close();
  bedCtx = null;
  bedGain = null;
}

/* ── One-time cue scheduler ────────────────────────────────────────────────
 * Each frame, compare the previous vs current elapsed time and fire any cue
 * whose absolute time was crossed. The fired-set is cleared by reset() on each
 * restart/seek, so cues re-fire correctly after either. */
export interface CueSpec {
  t: number;
  cue: Cue;
}

export class CueScheduler {
  private fired = new Set<string>();
  private prev = 0;
  private muted = false;
  private specs: CueSpec[];

  constructor(specs: CueSpec[]) {
    this.specs = specs;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    setMusicMuted(m);
  }

  reset(elapsed: number): void {
    this.fired.clear();
    this.prev = elapsed;
    this.specs.forEach((s, i) => {
      if (s.t <= elapsed) this.fired.add(String(i));
    });
  }

  tick(elapsed: number): void {
    const from = this.prev;
    this.prev = elapsed;
    if (this.muted) return;
    this.specs.forEach((s, i) => {
      if (this.fired.has(String(i))) return;
      if (s.t > from && s.t <= elapsed) {
        this.fired.add(String(i));
        sounds[s.cue]();
      }
    });
  }
}
