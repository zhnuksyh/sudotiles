import { useMemo } from "react";
import Board from "../src/components/Board";
import type { Cell, GameState } from "../src/game/types";
import { LESSONS, type Lesson, type LessonStep, type LegendKind } from "../learn/lessons";
import { K } from "./kinetic";
import type { CueSpec } from "./audio";

/* The board's kicker label. Unlike the shared style strings in scenes.tsx this
 * one is used at a single call site, so baking the colour in can't lose an
 * override to stylesheet order (see TRAILER.md). */
const KICKER = "text-[15px] font-semibold tracking-[0.35em] uppercase text-[var(--ink4)]";

/* The real Board's intrinsic width (and height — it's square). */
export const BOARD_W = 560;

/* Width of the right column: the number pad, and the narration card below it.
 * Sized so each pad key lands near the ~82px the vertical pad gets in the real
 * /learn/ layout — filling a wider column makes the keys visibly chunkier than
 * the game's. The narration card inherits this width, matching the page. */
export const PAD_W = 252;

/* Gap between the board and the right column. */
export const COL_GAP = 36;

/* ── A lesson playing itself ────────────────────────────────────────────────
 * Drives the real Board with the real lesson data from /learn/: it walks a
 * lesson's authored steps on the scene clock, highlighting the same unit /
 * pattern / target cells the page would, then "taps" the pad digit and strikes
 * the candidate out. Nothing is re-authored here — the copy, the board and the
 * elimination all come from learn/lessons.ts, so every claim on screen is the
 * lesson's own true deduction.
 *
 * Timing model, all scene-relative:
 *   step i is on screen from  IN + i*hold  to  IN + (i+1)*hold
 *   the last step holds, then at `elimAt` the pad key presses and the candidate
 *   is struck out; `doneAt` reveals the confirmation. */

export function lessonById(id: string): Lesson {
  const l = LESSONS.find((x) => x.id === id);
  if (!l) throw new Error(`trailer2: unknown lesson "${id}"`);
  return l;
}

export interface LessonPlan {
  lesson: Lesson;
  /* Scene-relative time the first step appears. */
  in: number;
  /* Seconds each narration step holds. */
  hold: number;
  /* Extra beat after the last step before the cross-out fires. */
  settle: number;
}

export function stepAt(plan: LessonPlan, t: number): number {
  const i = Math.floor((t - plan.in) / plan.hold);
  return Math.min(plan.lesson.steps.length - 1, Math.max(0, i));
}

/* When the pad key presses and the candidate gets struck. */
export function elimTime(plan: LessonPlan): number {
  return plan.in + plan.lesson.steps.length * plan.hold + plan.settle;
}

/* When the strike-out has finished and the "solved" state shows. */
export function doneTime(plan: LessonPlan): number {
  return elimTime(plan) + 0.6;
}

/* Total time the plan needs on screen, including the confirmation beat. */
export function planLength(plan: LessonPlan): number {
  return doneTime(plan) + 0.85;
}

/* Cues: a page-turn tick per step, a scribble as the key presses, a unit chime
 * when the candidate dies, and a win fanfare on the confirmation. */
export function lessonCues(plan: LessonPlan, offset = 0): CueSpec[] {
  const cues: CueSpec[] = [];
  for (let i = 0; i < plan.lesson.steps.length; i++) {
    cues.push({ t: offset + plan.in + i * plan.hold, cue: i === 0 ? "blip" : "step" });
  }
  cues.push({ t: offset + elimTime(plan), cue: "scribble" });
  cues.push({ t: offset + elimTime(plan) + 0.12, cue: "unit" });
  cues.push({ t: offset + doneTime(plan), cue: "win" });
  return cues;
}

/* ── Board state ────────────────────────────────────────────────────────────
 * Mirrors learn/Lesson.tsx's buildState: givens from the puzzle string plus the
 * pre-seeded candidate scribbles. Nothing is ever placed — the interaction is
 * removing one candidate — so no cell shows a value beyond the givens. */
function buildState(lesson: Lesson, struck: boolean, selected: number | null): GameState {
  const seeded: Record<number, Set<string>> = {};
  for (const [k, digits] of Object.entries(lesson.scribbles)) {
    seeded[Number(k)] = new Set(digits.split(""));
  }
  if (struck) seeded[lesson.elim.cell]?.delete(lesson.elim.digit);

  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const given = lesson.board[i] !== ".";
    const notes = seeded[i];
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value: given ? lesson.board[i] : "",
      error: false,
      scribbles: Array.from({ length: 9 }, (_, d) => (notes ? notes.has(String(d + 1)) : false)),
    });
  }
  return {
    board,
    solution: lesson.board, // no solving happens; solution is unused here
    dealing: false,
    selected,
    multiSelected: selected == null ? [] : [selected],
    pencil: true, // notes-only lesson: the pad always toggles candidates
    hintCells: [],
    started: true,
    hearts: 3,
    score: 0,
    streak: 0,
    elapsed: 0,
    over: false,
    won: false,
    difficulty: "Learn",
  };
}

/* ── Overlays ───────────────────────────────────────────────────────────────
 * Defined at MODULE scope, not inline: with a ~60fps clock the parent
 * re-renders constantly, and an inline component would remount every frame and
 * restart its CSS entrance at opacity:0 forever (see TRAILER.md). */

const LEGEND_SWATCH: Record<LegendKind, string> = {
  unit: "bg-[rgba(var(--pattern-rgb),0.18)] shadow-[0_0_0_1px_rgba(var(--pattern-rgb),0.5)_inset]",
  pattern: "bg-[rgba(var(--pattern-rgb),0.22)] shadow-[0_0_0_2px_rgba(var(--pattern-rgb),0.9)_inset]",
  target:
    "bg-[rgba(var(--lesson-target-rgb),0.18)] shadow-[0_0_0_2px_rgba(var(--lesson-target-rgb),0.95)_inset]",
};

function Legend({ items }: { items: NonNullable<LessonStep["legend"]> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className={`h-4 w-4 shrink-0 rounded-[4px] ${LEGEND_SWATCH[it.kind]}`} />
          <span className="text-[14px] text-[var(--ink3)]">{it.label}</span>
        </span>
      ))}
    </div>
  );
}

/* The narration card, styled exactly like the page's. Keyed by the caller so
 * each step replays the entrance. */
function StepCard({ step, index, total }: { step: LessonStep; index: number; total: number }) {
  return (
    <div
      className="w-full rounded-[18px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 shadow-[0_18px_44px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
      style={{ animation: "t2-rise 0.3s cubic-bezier(0.2,0.9,0.2,1) both" }}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[16px] font-semibold text-[var(--t2-ember)]">{step.title}</span>
        <span className="shrink-0 text-[11.5px] font-medium text-[var(--ink5)]">
          {index + 1} / {total}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {step.text.map((p, i) => (
          <p
            key={i}
            className="m-0 text-[13px] leading-relaxed text-[var(--ink2)]"
            /* Lines stagger in so the card reads as it's being spoken. Keep the
               total (delay + duration) well inside the shortest step `hold` in
               scenes.tsx, or the last line is still fading in when the step
               cuts — a 4-line step must finish in ~0.6s. */
            style={{ animation: `t2-rise 0.2s ease-out ${0.06 + i * 0.09}s both` }}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

/* The "Nicely done" card the page shows once the elimination lands. */
function DoneCard({ lesson }: { lesson: Lesson }) {
  return (
    <div
      className="w-full rounded-[18px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 shadow-[0_18px_44px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
      style={{ animation: "t2-drop 0.4s cubic-bezier(0.3,1.4,0.5,1) both" }}
    >
      <div className="mb-1 text-[16px] font-semibold text-[var(--t2-ember)]">Nicely done</div>
      <p className="m-0 text-[13px] leading-relaxed text-[var(--ink2)]">
        You spotted the {lesson.name.toLowerCase()} and made the elimination it unlocks.
      </p>
    </div>
  );
}

/* A 3×3 pad that presses its own key. Static until `pressAt`, so it reads as the
 * real pad waiting for a tap. Its width comes from the PAD_W column. */
function SelfPad({ digit, t, pressAt }: { digit: string; t: number; pressAt: number }) {
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {Array.from({ length: 9 }, (_, i) => String(i + 1)).map((d) => {
        const hot = d === digit && t >= pressAt;
        return (
          <div
            key={d}
            className="flex aspect-square items-center justify-center rounded-[14px] bg-gradient-to-b from-[var(--pad0)] to-[var(--pad1)] text-[23px] font-medium text-[var(--ink1)] shadow-[0_2px_5px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.04)_inset]"
            style={hot ? { animation: "t2-press 0.42s ease-out both" } : undefined}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}

/* The candidate being crossed out, drawn over the target cell: the digit swells
 * and fades while a stroke sweeps through it. Positioned from the digit's slot
 * in the cell's 3×3 scribble grid. */
function StrikeOut({
  boardWidth,
  cellIndex,
  digit,
  t,
  at,
}: {
  boardWidth: number;
  cellIndex: number;
  digit: string;
  t: number;
  at: number;
}) {
  if (t < at) return null;
  const geom = cellGeometry(boardWidth, cellIndex);
  const d = Number(digit) - 1;
  const slotW = geom.size / 3;
  // The scribble grid is inset 5px inside the cell (see src/components/Cell.tsx).
  const inset = 5;
  const gridSize = geom.size - inset * 2;
  const sw = gridSize / 3;
  const cx = geom.left + inset + ((d % 3) + 0.5) * sw;
  const cy = geom.top + inset + (Math.floor(d / 3) + 0.5) * sw;

  return (
    <div className="pointer-events-none absolute z-[50]" style={{ left: cx, top: cy }}>
      <span
        className="absolute text-[13px] leading-none font-semibold text-[var(--error)]"
        style={{
          transform: "translate(-50%,-50%)",
          animation: "t2-strike 0.7s ease-out both",
        }}
      >
        {digit}
      </span>
      <span
        className="absolute bg-[var(--error)]"
        style={{
          width: slotW * 0.82,
          height: 2,
          borderRadius: 2,
          transform: "translate(-50%,-50%) rotate(-24deg)",
          animation: "t2-slash 0.7s ease-out both",
        }}
      />
    </div>
  );
}

/* A ring that pings outward over a cell, so a cut to a new pattern reads. */
function Ping({
  boardWidth,
  cellIndex,
  delay,
}: {
  boardWidth: number;
  cellIndex: number;
  delay: number;
}) {
  const geom = cellGeometry(boardWidth, cellIndex);
  return (
    <div
      className="pointer-events-none absolute z-[45] rounded-[9px] shadow-[0_0_0_2px_rgba(var(--lesson-target-rgb),0.9)_inset]"
      style={{
        left: geom.left,
        top: geom.top,
        width: geom.size,
        height: geom.size,
        animation: `t2-ping 0.9s ease-out ${delay}s both`,
      }}
    />
  );
}

/* ── Cell geometry ──────────────────────────────────────────────────────────
 * Computed, not measured, so overlays stay exact under any CSS scale (a
 * getBoundingClientRect approach would return post-transform pixels — see
 * TRAILER.md). Mirrors src/components/Board.tsx's layout: a 16px pad, a 3×3 of
 * boxes with a 9px gap, each box a 3×3 of cells with a 4px gap. */
const BOARD_PAD = 16;
const BOX_GAP = 9;
const CELL_GAP = 4;

function cellGeometry(boardWidth: number, index: number) {
  const inner = boardWidth - BOARD_PAD * 2;
  const boxSize = (inner - BOX_GAP * 2) / 3;
  const cellSize = (boxSize - CELL_GAP * 2) / 3;
  const r = Math.floor(index / 9);
  const c = index % 9;
  const br = Math.floor(r / 3);
  const bc = Math.floor(c / 3);
  const left = BOARD_PAD + bc * (boxSize + BOX_GAP) + (c % 3) * (cellSize + CELL_GAP);
  const top = BOARD_PAD + br * (boxSize + BOX_GAP) + (r % 3) * (cellSize + CELL_GAP);
  return { left, top, size: cellSize };
}

/* ── The playing lesson ─────────────────────────────────────────────────── */
export default function LessonBoard({
  plan,
  t,
  kicker,
}: {
  plan: LessonPlan;
  t: number;
  /* Small label above the technique name, e.g. "Lesson one". */
  kicker: string;
}) {
  const { lesson } = plan;
  const elimAt = elimTime(plan);
  const doneAt = doneTime(plan);
  /* The candidate leaves the notes just as the strike animation fades, so the
   * digit doesn't pop back for a frame between the two. */
  const struck = t >= elimAt + 0.42;
  const done = t >= doneAt;
  const i = stepAt(plan, t);
  const s = lesson.steps[i];

  /* The cursor lands on the target cell a beat before the tap, like a learner
   * selecting it. Before the final step nothing is selected. */
  const selectingAt = elimAt - 0.7;
  const selected = t >= selectingAt ? lesson.elim.cell : null;

  const state = useMemo(() => buildState(lesson, struck, selected), [lesson, struck, selected]);

  /* Highlights clear once the elimination lands — same as the page. */
  const unit = done ? [] : s.unit;
  const pattern = done ? [] : s.pattern;
  const target = done ? [] : s.target;

  /* A fixed two-column layout — board left, pad + narration right — rather than
   * the page's responsive grid; the scene scales the whole block to fit.
   *
   * The two columns are laid out as a GRID with an explicit title row, so the pad
   * lines up with the top of the BOARD rather than with the title. (As plain
   * siblings the right column would start at the title's top.) This mirrors how
   * learn/Lesson.tsx gives the title its own grid row for the same reason. */
  return (
    <div
      className="grid gap-x-9"
      style={{ gridTemplateColumns: `${BOARD_W}px ${PAD_W}px`, gridTemplateRows: `auto auto` }}
    >
      <div className="col-start-1 row-start-1 flex flex-col items-center gap-1 pb-4">
        {/* The title sits over the BOARD, not the screen, so it reads as this
            board's heading and stays aligned with it under any scale. */}
        <K at={0} kind="rise" className={KICKER}>
          {kicker}
        </K>
        <K
          at={0.12}
          kind="drop"
          className="text-[30px] leading-none font-semibold tracking-[0.2px] text-[var(--t2-ember)]"
        >
          {lesson.name}
        </K>
      </div>

      <div className="col-start-1 row-start-2 flex flex-col items-center gap-4">
        {/* t2-pencil-ember re-tints ONLY the board's pencil-mode border back to
            ember; see trailer2.css. */}
        <div
          className="t2-pencil-ember relative shrink-0"
          style={{ width: BOARD_W, height: BOARD_W }}
        >
          <Board
            state={state}
            onSelect={noop}
            onDragSelect={noop}
            animate
            guides={false}
            tutorialStep={null}
            onTutorialNext={noop}
            onTutorialSkip={noop}
            unitCells={unit}
            patternCells={pattern}
            targetCells={target}
          />
          {/* Ping the target the moment the last step comes up. */}
          {target && target.length > 0 && (
            <Ping key={`ping:${i}`} boardWidth={BOARD_W} cellIndex={target[0]} delay={0.1} />
          )}
          <StrikeOut
            boardWidth={BOARD_W}
            cellIndex={lesson.elim.cell}
            digit={lesson.elim.digit}
            t={t}
            at={elimAt}
          />
        </div>
        {!done && s.legend && <Legend items={s.legend} />}
      </div>

      {/* Row 2, so this column starts level with the top of the board rather than
          the title. The column is exactly PAD_W wide, so the narration card ends
          up the same width as the pad above it — as on the /learn/ page.
          `items-start` keeps the card hugging its text instead of stretching to
          the board's full height. */}
      <div className="col-start-2 row-start-2 flex flex-col items-start gap-4">
        <SelfPad digit={lesson.elim.digit} t={t} pressAt={elimAt} />
        {done ? (
          <DoneCard lesson={lesson} />
        ) : (
          <StepCard key={`step:${i}`} step={s} index={i} total={lesson.steps.length} />
        )}
      </div>
    </div>
  );
}

function noop() {}
