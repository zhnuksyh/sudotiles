import { useEffect, useState, type ComponentType } from "react";
import { K, TypeLine } from "./kinetic";
import IndexScene, { INDEX_DUR, LESSON_COUNT, indexCues } from "./indexScene";
import LessonBoard, {
  BOARD_W,
  COL_GAP,
  PAD_W,
  lessonById,
  lessonCues,
  planLength,
  type LessonPlan,
} from "./lessonBoard";
import { GitHubIcon } from "../src/components/icons";
import { REPO_URL } from "../src/game/constants";
import type { CueSpec } from "./audio";

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
const HERO = "text-[clamp(2.4rem,8vw,6.4rem)] font-bold leading-[0.98] tracking-[-0.02em]";
const SUB = "text-[clamp(1.1rem,3.2vw,2rem)] font-medium leading-tight";
const KICKER = "text-[clamp(0.8rem,2vw,1.1rem)] font-semibold tracking-[0.35em] uppercase";

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
    {children}
  </div>
);

/* ── Scene 1: cold open — the wall every player hits ─────────────────────── */
function Stuck({ t }: SceneProps) {
  return (
    <Stage>
      <div className="grid">
        {/* Each line exits before the next enters, so they never overlap. */}
        {t < 0.9 && (
          <K at={0} until={0.7} kind="slam" className={`${HERO} [grid-area:1/1] text-[var(--ink0)]`}>
            Stuck.
          </K>
        )}
        {t >= 0.9 && (
          <K at={0} kind="slam" className={`${HERO} [grid-area:1/1] text-[var(--t2-ember)]`}>
            Not out of moves.
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
      <K at={0} kind="rise" className={`${KICKER} mb-5 text-[var(--ink4)]`}>
        Out of patterns
      </K>
      <div className="grid gap-1">
        <K at={0.16} kind="drop" className={`${HERO} text-[var(--ink0)]`}>
          Learn the ones
        </K>
        {t >= 0.42 && (
          <K at={0} kind="drop" className={`${HERO} text-[var(--t2-ember)]`}>
            you're missing.
          </K>
        )}
      </div>
    </Stage>
  );
}

/* ── Scene 3: the library, dealing itself in ─────────────────────────────── */
function Library() {
  return <IndexScene />;
}

/* ── Scene 4: how a lesson works ─────────────────────────────────────────── */
function HowItWorks() {
  return (
    <Stage>
      <div className="grid gap-2">
        <K at={0} kind="rise" className={`${SUB} text-[var(--ink4)]`}>
          Not a wall of theory.
        </K>
        <K at={0.18} kind="drop" className={`${HERO} !text-[clamp(2rem,6.5vw,4.6rem)] text-[var(--ink0)]`}>
          A real board.
        </K>
        <TypeLine
          at={0.72}
          dur={0.8}
          text="Spot the pattern. Make the move."
          className={`${SUB} mt-3 justify-center text-[var(--t2-ember)]`}
        />
      </div>
    </Stage>
  );
}

/* ── Scenes 5-6: two lessons teaching themselves ─────────────────────────── */

/* Each plan walks a real lesson's authored steps on the scene clock. `hold` is
 * tuned per lesson: enough to read the step, short enough to stay snappy. The
 * scene durations below are derived from the plans, so retiming one is a
 * one-number change.
 *
 * The first lesson holds slightly longer — it carries the candidates primer and
 * teaches the format. The second accelerates, which also reads as rising
 * difficulty. */
const POINTING: LessonPlan = { lesson: lessonById("pointing"), in: 0.5, hold: 1.85, settle: 0.3 };
const XWING: LessonPlan = { lesson: lessonById("x-wing"), in: 0.4, hold: 1.65, settle: 0.28 };

/* The lesson block's intrinsic size, derived from LessonBoard's own constants so
 * it can never drift from the real layout. */
const LESSON_W = BOARD_W + COL_GAP + PAD_W;
const LESSON_H = 690; // title row + board + legend line

/* The block is scaled to FIT THE VIEWPORT rather than by a hardcoded 1080p
 * factor. A fixed scale-up overflows and clips any window smaller than the
 * assumed frame — a browser with tabs and a URL bar is well under 1080 tall —
 * which is exactly what reads as the scene randomly being "too big". Measuring
 * the real viewport keeps the stage stable at any window size, while still
 * scaling up to fill a true 1920×1080 export frame.
 *
 * FIT_PAD leaves breathing room so the block never touches the frame edge;
 * MAX_SCALE stops it ballooning on very large displays. */
const FIT_PAD = 40;
const MAX_SCALE = 1.32;

function useFitScale(w: number, h: number): number {
  const [scale, setScale] = useState(MAX_SCALE);
  useEffect(() => {
    const measure = () =>
      setScale(
        Math.min(
          (window.innerWidth - FIT_PAD * 2) / w,
          (window.innerHeight - FIT_PAD * 2) / h,
          MAX_SCALE,
        ),
      );
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [w, h]);
  return scale;
}

/* The lesson stage. The technique title lives inside LessonBoard (over the
 * board), so this only centers and scales the block.
 *
 * `scale` on a wrapper leaves the parent reserving the UNSCALED size, which would
 * push the stage off-center — so the outer box is given the post-scale size
 * explicitly and the transform origin is the top-left, making the visual box and
 * the layout box agree. */
function LessonScene({ plan, t, kicker }: { plan: LessonPlan; t: number; kicker: string }) {
  const scale = useFitScale(LESSON_W, LESSON_H);
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <div style={{ width: LESSON_W * scale, height: LESSON_H * scale }}>
        <div
          style={{
            width: LESSON_W,
            height: LESSON_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <LessonBoard plan={plan} t={t} kicker={kicker} />
        </div>
      </div>
    </div>
  );
}

const Pointing = ({ t }: SceneProps) => <LessonScene plan={POINTING} t={t} kicker="Lesson one" />;
const XWingScene = ({ t }: SceneProps) => (
  <LessonScene plan={XWING} t={t} kicker="Then the hard stuff" />
);

/* ── Scene 8: the payoff ────────────────────────────────────────────────── */
function Payoff() {
  return (
    <Stage>
      <div className="grid gap-2">
        <K at={0} kind="rise" className={`${SUB} text-[var(--ink4)]`}>
          {LESSON_COUNT} techniques.
        </K>
        <K at={0.18} kind="drop" className={`${HERO} !text-[clamp(2rem,6.5vw,4.6rem)] text-[var(--ink0)]`}>
          Every one interactive.
        </K>
        <TypeLine
          at={0.72}
          dur={0.85}
          text="Free. Offline. No sign-up."
          className={`${SUB} mt-3 justify-center text-[var(--t2-ember)]`}
        />
      </div>
    </Stage>
  );
}

/* ── Scene 9: end card ──────────────────────────────────────────────────── */
function EndCard({ t }: SceneProps) {
  return (
    <Stage>
      <K at={0} kind="slam" className={`${HERO} !text-[clamp(2.6rem,10vw,7.5rem)] text-[var(--t2-ember)]`}>
        Sudotiles
      </K>
      <K at={0.4} kind="rise" className={`${SUB} mt-2 text-[var(--ink2)]`}>
        Learn the patterns.
      </K>
      {t >= 0.9 && (
        <K
          at={0}
          kind="cut"
          /* `display` must be set here, not via a class: K's inline style sets
             inline-block, which would beat an inline-flex utility and stack the
             icon above the text. */
          style={{ display: "inline-flex" }}
          className="mt-8 items-center gap-2 rounded-full bg-white/[0.06] px-5 py-2.5 text-[clamp(0.9rem,2.4vw,1.3rem)] font-medium text-[var(--ink0)] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
        >
          <GitHubIcon />
          {REPO_URL.replace("https://github.com/", "github.com/")}
        </K>
      )}
    </Stage>
  );
}

/* The timeline. dur is per-scene seconds; STARTS/TOTAL derive from these. The
 * lesson scenes size themselves from their plans so a retimed lesson can never
 * be cut off mid-deduction. */
export const SCENES: Scene[] = [
  {
    id: "stuck",
    dur: 1.95,
    Comp: Stuck,
    cues: [
      { t: 0, cue: "error" },
      { t: 0.9, cue: "blip" },
    ],
  },
  {
    id: "promise",
    dur: 1.8,
    Comp: Promise,
    cues: [
      { t: 0.16, cue: "scribble" },
      { t: 0.42, cue: "unit" },
    ],
  },
  { id: "library", dur: INDEX_DUR, Comp: Library, cues: indexCues() },
  {
    id: "how",
    dur: 2.35,
    Comp: HowItWorks,
    cues: [
      { t: 0.18, cue: "step" },
      { t: 0.8, cue: "hint" },
    ],
  },
  { id: "pointing", dur: planLength(POINTING), Comp: Pointing, cues: lessonCues(POINTING) },
  { id: "xwing", dur: planLength(XWING), Comp: XWingScene, cues: lessonCues(XWING) },
  { id: "payoff", dur: 2.6, Comp: Payoff, cues: [{ t: 0.18, cue: "streak" }] },
  { id: "end", dur: 3.2, Comp: EndCard, cues: [{ t: 0, cue: "win" }] },
];

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
