import type { ComponentType } from "react";
import { K, TypeLine } from "./kinetic";
import PlayingBoard, { MiniBoard, SPECS, boardCueTimes, boardDoneTime } from "./playingBoard";
import MomentsBoard, { MOMENTS_CUES } from "./momentsBoard";
import SettingsScene from "./settingsScene";
import WinBoard, { WIN_CUES } from "./winBoard";
import SceneConfetti from "./sceneConfetti";
import type { CueSpec } from "./audio";
import { GitHubIcon } from "../src/components/icons";
import { REPO_URL } from "../src/game/constants";

export interface SceneProps {
  /* Scene-relative time in seconds since this scene mounted. */
  t: number;
}

export interface Scene {
  id: string;
  dur: number;
  Comp: ComponentType<SceneProps>;
  /* Scene-relative cue times fired while this scene is on screen. */
  cues: CueSpec[];
}

/* Shared, COLORLESS size/weight strings. Color is always set at the call site
 * so an intended override never loses to stylesheet order (see TRAILER.md). */
const HERO = "text-[clamp(2.6rem,9vw,7rem)] font-bold leading-[0.98] tracking-[-0.02em]";
const SUB = "text-[clamp(1.1rem,3.2vw,2rem)] font-medium leading-tight";
const KICKER = "text-[clamp(0.8rem,2vw,1.1rem)] font-semibold tracking-[0.35em] uppercase";

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
    {children}
  </div>
);

/* ── Scene 1: cold open (two lines, second replaces the first) ───────────── */
function Open({ t }: SceneProps) {
  return (
    <Stage>
      <div className="grid">
        {/* First line exits before the second enters, so they never overlap. */}
        {t < 1.05 && (
          <K at={0} until={0.85} kind="slam" className={`${HERO} [grid-area:1/1] text-[var(--accent)]`}>
            Numbers.
          </K>
        )}
        {t >= 1.05 && (
          <K at={0} kind="slam" className={`${HERO} [grid-area:1/1] text-[#ecebe8]`}>
            Nine of them.
          </K>
        )}
      </div>
    </Stage>
  );
}

/* ── Scene 2: the promise ───────────────────────────────────────────────── */
function Promise({ t }: SceneProps) {
  return (
    <Stage>
      <K at={0} kind="rise" className={`${KICKER} mb-5 text-[#7d766c]`}>
        A Sudoku, reimagined
      </K>
      <div className="grid gap-1">
        <K at={0.18} kind="drop" className={`${HERO} text-[#ecebe8]`}>
          One rule.
        </K>
        {t >= 0.5 && (
          <K at={0} kind="drop" className={`${HERO} text-[var(--accent)]`}>
            Endless boards.
          </K>
        )}
      </div>
    </Stage>
  );
}

/* ── Scene 3: three difficulties, playing themselves side by side ────────── */
function MultiPlay({ t }: SceneProps) {
  // Fixed per-board footprint so three sit side by side without overlapping.
  // Scales down on narrow viewports via clamp on the box width.
  // A SINGLE scene-level confetti canvas fires over each board as it completes
  // (three separate canvases dimmed the scene when overlapping).
  const bursts = SPECS.map((spec, i) => ({
    t: boardDoneTime(spec),
    count: 80,
    x: 0.28 + i * 0.22, // roughly centered over each of the three boards
    y: 0.55,
  }));
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 px-4">
      <K at={0} kind="rise" className={`${KICKER} text-[#7d766c]`}>
        Six tiers. Watch three solve.
      </K>
      <div className="flex items-start justify-center gap-4 sm:gap-8">
        {SPECS.map((spec, i) => (
          <div key={spec.label} style={{ animation: `tr-rise 0.4s ease-out ${0.1 + i * 0.12}s both` }}>
            <MiniBoard spec={spec} t={t} boxWidth={MINI_W} />
          </div>
        ))}
      </div>
      <SceneConfetti t={t} bursts={bursts} />
    </div>
  );
}

/* Per-board footprint in the multi-board scene: 3 × 300 + gaps ≈ 1000px, well
 * inside the 1920-wide export frame; the flex row centers it. */
const MINI_W = 300;

/* ── Scene 4: a single board, up close, playing the real HUD ────────────── */
function CloseUp({ t }: SceneProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-4">
      <K at={0} kind="rise" className={`${KICKER} text-[#7d766c]`}>
        Score. Streak. Multiplier.
      </K>
      <div style={{ transform: "scale(0.9)", transformOrigin: "center" }}>
        <PlayingBoard t={t} />
      </div>
    </div>
  );
}

/* ── Scene 5: gameplay feedback — a miss, a life lost, a row completed ───── */
function Moments({ t }: SceneProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4">
      <K at={0} kind="rise" className={`${KICKER} text-[#7d766c]`}>
        Every move counts
      </K>
      <div style={{ transform: "scale(0.9)", transformOrigin: "center" }}>
        <MomentsBoard t={t} />
      </div>
    </div>
  );
}

/* ── Scene 6: the settings panel ────────────────────────────────────────── */
function SettingsShowcase({ t }: SceneProps) {
  return <SettingsScene t={t} />;
}

/* ── Scene 7: the win ───────────────────────────────────────────────────── */
function Win({ t }: SceneProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-4">
      <div style={{ transform: "scale(0.9)", transformOrigin: "center" }}>
        <WinBoard t={t} />
      </div>
    </div>
  );
}

/* ── Scene 8: offline / PWA line ─────────────────────────────────────────── */
function Offline() {
  return (
    <Stage>
      <div className="grid gap-2">
        <K at={0} kind="rise" className={`${SUB} text-[#7d766c]`}>
          Installs like an app.
        </K>
        <K at={0.2} kind="drop" className={`${HERO} !text-[clamp(2rem,7vw,5rem)] text-[#ecebe8]`}>
          Plays offline.
        </K>
        <TypeLine
          at={0.9}
          dur={1.1}
          text="No ads. No tracking. No dependencies."
          className={`${SUB} mt-3 justify-center text-[var(--accent)]`}
        />
      </div>
    </Stage>
  );
}

/* ── Scene 9: end card (no ▶ symbol on the link) ─────────────────────────── */
function EndCard({ t }: SceneProps) {
  return (
    <Stage>
      <K at={0} kind="slam" className={`${HERO} !text-[clamp(3rem,12vw,9rem)] text-[var(--accent)]`}>
        Sudotiles
      </K>
      <K at={0.4} kind="rise" className={`${SUB} mt-2 text-[#c2bcb2]`}>
        Fill every tile.
      </K>
      {t >= 0.9 && (
        <K
          at={0}
          kind="cut"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-5 py-2.5 text-[clamp(0.9rem,2.4vw,1.3rem)] font-medium text-[#ecebe8] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
        >
          <GitHubIcon />
          {REPO_URL.replace("https://github.com/", "github.com/")}
        </K>
      )}
    </Stage>
  );
}

/* The timeline. dur is per-scene seconds; STARTS/TOTAL derive from these. */
export const SCENES: Scene[] = [
  { id: "open", dur: 2.4, Comp: Open, cues: [{ t: 0, cue: "blip" }, { t: 1.05, cue: "blip" }] },
  { id: "promise", dur: 2.2, Comp: Promise, cues: [{ t: 0.18, cue: "scribble" }, { t: 0.5, cue: "unit" }] },
  { id: "multi", dur: 6.0, Comp: MultiPlay, cues: multiPlayCues() },
  { id: "closeup", dur: 5.2, Comp: CloseUp, cues: closeUpCues() },
  { id: "moments", dur: 4.0, Comp: Moments, cues: MOMENTS_CUES },
  { id: "settings", dur: 7.0, Comp: SettingsShowcase, cues: settingsCues() },
  { id: "win", dur: 4.0, Comp: Win, cues: WIN_CUES },
  { id: "offline", dur: 3.2, Comp: Offline, cues: [{ t: 0.2, cue: "streak" }] },
  { id: "end", dur: 3.4, Comp: EndCard, cues: [{ t: 0, cue: "win" }] },
];

/* A blip on every other placement across the three mini-boards (thinned so the
 * dense fast fills don't turn into noise), a unit chime on each row/box
 * completion, and a win fanfare when each board is fully solved. */
function multiPlayCues(): CueSpec[] {
  const cues: CueSpec[] = [];
  for (const spec of SPECS) {
    const { blips, units } = boardCueTimes(spec);
    blips.forEach((b, i) => {
      if (i % 2 === 0) cues.push({ t: b, cue: "blip" });
    });
    for (const u of units) cues.push({ t: u, cue: "unit" });
    cues.push({ t: boardDoneTime(spec), cue: "win" });
  }
  return cues;
}

/* Theme/toggle change chimes for the settings scene, aligned to lookAt():
 * Hard@1.1, Void@1.6, toggle@1.6, Expert@2.2, then custom photos every 1.2s
 * from 3.0. */
function settingsCues(): CueSpec[] {
  return [
    { t: 1.1, cue: "blip" }, // difficulty → Hard
    { t: 1.6, cue: "scribble" }, // → Void
    { t: 2.2, cue: "blip" }, // difficulty → Expert
    { t: 3.0, cue: "unit" }, // custom chosen → board appears, photo 1
    { t: 4.2, cue: "scribble" }, // photo 2
    { t: 5.4, cue: "scribble" }, // photo 3
  ];
}

/* Blips for the single-board close-up (mirrors SPECS[0]'s schedule), its
 * row/box completion chimes, plus a win fanfare on completion. */
function closeUpCues(): CueSpec[] {
  const { blips, units } = boardCueTimes(SPECS[0]);
  const cues: CueSpec[] = blips.map((t) => ({ t, cue: "blip" as const }));
  for (const u of units) cues.push({ t: u, cue: "unit" });
  cues.push({ t: boardDoneTime(SPECS[0]), cue: "win" });
  return cues;
}

export const STARTS: number[] = (() => {
  const s: number[] = [];
  let acc = 0;
  for (const sc of SCENES) {
    s.push(acc);
    acc += sc.dur;
  }
  return s;
})();

export const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);
