import { useMemo } from "react";
import Board from "../src/components/Board";
import Hud from "../src/components/Hud";
import SceneConfetti from "./sceneConfetti";
import { SOLUTION, streakMultiplier } from "../src/game/constants";
import type { Cell, GameState } from "../src/game/types";

/* ── Board specs ────────────────────────────────────────────────────────────
 * Each board plays a genuinely valid solved grid: the bundled solution plus two
 * Sudoku-preserving transforms of it, so every row/column/box is valid. Each
 * board starts with a distinct number of EMPTY cells (Easy nearly done, Expert
 * mostly empty) and fills them in order — every placement uses the cell's true
 * solution digit. The empties are chosen to cluster in one target row and one
 * target box, so finishing them genuinely completes those units and fires the
 * "Row complete!" / "Box complete!" pops. */
export interface BoardSpec {
  label: string;
  solution: string;
  empties: number[]; // cells that start blank, filled in this order
  targetRow: number;
  targetBox: number;
  step: number; // seconds between placements
  start: number;
}

const SOL_A = "735942618948561732612378594259137486384256179167489253473695821826713945591824367";
const SOL_B = "716589342254376918398124567642958731187632495539741286421897653875463129963215874";

// Empties are ORDERED so the target row fills first (done @ move 3), then the
// target box (done @ move 7), then the rest (board done @ last move) — giving a
// clean gap between the Row/Box/Solved pops so each is clearly seen.
export const SPECS: BoardSpec[] = [
  {
    label: "Easy",
    solution: SOLUTION,
    empties: [20, 21, 22, 23, 30, 31, 32, 39, 7, 72, 73, 74],
    targetRow: 2,
    targetBox: 4,
    step: 0.36,
    start: 0.4,
  },
  {
    label: "Hard",
    solution: SOL_A,
    empties: [47, 48, 49, 50, 57, 58, 59, 66, 3, 11, 29, 63, 71, 20, 24],
    targetRow: 5,
    targetBox: 7,
    step: 0.32,
    start: 0.5,
  },
  {
    label: "Expert",
    solution: SOL_B,
    empties: [65, 66, 67, 68, 6, 7, 8, 15, 1, 14, 19, 40, 50, 55, 30, 48, 60, 77],
    targetRow: 7,
    targetBox: 2,
    step: 0.26,
    start: 0.6,
  },
];

function rowCells(r: number): number[] {
  return Array.from({ length: 9 }, (_, c) => r * 9 + c);
}
function boxCells(b: number): number[] {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  const out: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push((br + r) * 9 + bc + c);
  return out;
}

/* The placement index (0-based) at which every cell of `cells` is filled, i.e.
 * the max fill-order position among the empties in that unit. */
function completionMove(spec: BoardSpec, cells: number[]): number {
  let last = -1;
  for (const cell of cells) {
    const idx = spec.empties.indexOf(cell);
    if (idx > last) last = idx;
  }
  return last; // -1 if the unit had no empties (already complete)
}

interface Snapshot {
  filled: number;
  selected: number | null;
  /* The single pop to show now, centered on the board (null = none). */
  pop: string | null;
}

/* Absolute scene-relative time each milestone fires for a board. */
function rowDoneTime(spec: BoardSpec): number {
  const m = completionMove(spec, rowCells(spec.targetRow));
  return m >= 0 ? spec.start + m * spec.step + 0.06 : Infinity;
}
function boxDoneTime(spec: BoardSpec): number {
  const m = completionMove(spec, boxCells(spec.targetBox));
  return m >= 0 ? spec.start + m * spec.step + 0.06 : Infinity;
}
export function boardDoneTime(spec: BoardSpec): number {
  return spec.start + (spec.empties.length - 1) * spec.step + 0.12;
}

/* Which pop is centered on the board at time `t`. Once the board is solved,
 * "Solved!" stays. Otherwise the most recent row/box completion shows for a
 * short window, so every milestone is seen without stacking. */
function activePop(spec: BoardSpec, t: number): string | null {
  if (t >= boardDoneTime(spec)) return "Solved!";
  const WINDOW = 1.1;
  const candidates: [number, string][] = [
    [rowDoneTime(spec), "Row complete!"],
    [boxDoneTime(spec), "Box complete!"],
  ];
  const active = candidates
    .filter(([time]) => t >= time && t < time + WINDOW)
    .sort((a, b) => b[0] - a[0]);
  return active.length ? active[0][1] : null;
}

function snapshotAt(spec: BoardSpec, t: number): Snapshot {
  const lead = 0.14;
  let filled = 0;
  let selected: number | null = null;
  for (let i = 0; i < spec.empties.length; i++) {
    const placeAt = spec.start + i * spec.step;
    if (t >= placeAt - lead) selected = spec.empties[i];
    if (t >= placeAt) filled = i + 1;
  }
  const boardDone = filled >= spec.empties.length;
  return {
    filled,
    selected: boardDone ? null : selected,
    pop: activePop(spec, t),
  };
}

/* Cue times for one board's placements plus its unit-completion chimes. */
export function boardCueTimes(spec: BoardSpec): { blips: number[]; units: number[] } {
  const blips = spec.empties.map((_, i) => spec.start + i * spec.step);
  const units: number[] = [];
  const rowMove = completionMove(spec, rowCells(spec.targetRow));
  const boxMove = completionMove(spec, boxCells(spec.targetBox));
  if (rowMove >= 0) units.push(spec.start + rowMove * spec.step + 0.05);
  if (boxMove >= 0) units.push(spec.start + boxMove * spec.step + 0.05);
  return { blips, units };
}

function buildBoard(spec: BoardSpec, filled: number): Cell[] {
  const emptySet = new Set(spec.empties);
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const isEmpty = emptySet.has(i);
    const emptyIdx = spec.empties.indexOf(i);
    const placed = isEmpty && emptyIdx < filled;
    const given = !isEmpty;
    // Givens show their digit; empties are blank until placed (then player-styled).
    const value = given || placed ? spec.solution[i] : "";
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value,
      error: false,
      scribbles: Array(9).fill(false),
    });
  }
  return board;
}

function stateFor(spec: BoardSpec, t: number): GameState {
  const { filled, selected } = snapshotAt(spec, t);
  const streak = 8 + filled;
  const score = 1500 + filled * 100 * streakMultiplier(streak);
  return {
    board: buildBoard(spec, filled),
    solution: spec.solution,
    dealing: false,
    selected,
    multiSelected: [],
    pencil: false,
    hintCells: [],
    started: true,
    hearts: 3,
    score,
    streak,
    elapsed: 90 + Math.floor(t),
    over: false,
    won: false,
    difficulty: spec.label,
  };
}

/* A completion pill centered on the board (unlike the app's brief flash, this
 * holds while shown). A full-size flex overlay guarantees centering regardless
 * of `scale`, which only sizes the pill itself. */
function CompletePill({
  show,
  text,
  scale = 1,
}: {
  show: boolean;
  text: string;
  scale?: number;
}) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[46] flex items-center justify-center">
      <div
        className="rounded-full bg-[rgba(var(--accent-rgb),0.16)] px-4 py-1.5 text-[13px] font-semibold tracking-wide whitespace-nowrap text-[var(--accent)] shadow-[0_0_0_1.5px_rgba(var(--accent-rgb),0.6)_inset,0_14px_34px_-10px_rgba(0,0,0,0.7)] backdrop-blur-[2px]"
        style={{
          transform: `scale(${scale})`,
          animation: "tr-drop 0.4s cubic-bezier(0.3,1.4,0.5,1) both",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* A compact self-playing board, scaled to a fixed width so three fit side by
 * side without overlap. Fires confetti and a "Solved!" pop on completion. */
export function MiniBoard({
  spec,
  t,
  boxWidth,
}: {
  spec: BoardSpec;
  t: number;
  boxWidth: number;
}) {
  const state = useMemo(() => stateFor(spec, t), [spec, t]);
  const { pop } = snapshotAt(spec, t);
  const BOARD_W = 560; // the real Board's intrinsic width (and height — it's square)
  const scale = boxWidth / BOARD_W;

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[15px] font-semibold tracking-[0.25em] text-[var(--accent)] uppercase">
        {spec.label}
      </span>
      {/* Fixed square footprint drives the flex layout (so boards never overlap);
          the scaled wrapper holds BOTH the Board and the pill in one `relative`
          box sized to the board, so the pill centers on the real board — it rides
          the same scale, staying perfectly aligned. */}
      <div style={{ width: boxWidth, height: boxWidth }}>
        <div
          className="relative origin-top-left [&>div]:!max-w-none"
          style={{ width: BOARD_W, height: BOARD_W, transform: `scale(${scale})` }}
        >
          <Board
            state={state}
            onSelect={() => {}}
            onDragSelect={() => {}}
            animate
            guides
            tutorialStep={null}
            onTutorialNext={() => {}}
            onTutorialSkip={() => {}}
          />
          {/* Centered pop (confetti is fired scene-level in MultiPlay). It rides
              the board scale, so counter-scale it up to stay legible. */}
          <CompletePill key={pop ?? "none"} show={pop != null} text={pop ?? ""} scale={1.15 / scale} />
        </div>
      </div>
    </div>
  );
}

/* A single large self-playing board with the real Hud, for a focused scene.
 * Shows the row/box completion pops, plus confetti + "Solved!" on completion. */
export default function PlayingBoard({ t }: { t: number }) {
  const spec = SPECS[0];
  const state = useMemo(() => stateFor(spec, t), [spec, t]);
  const { pop } = snapshotAt(spec, t);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Hud
        hearts={state.hearts}
        score={state.score}
        elapsed={state.elapsed}
        streak={state.streak}
        showLives
        showTimer
      />
      <div className="relative">
        <Board
          state={state}
          onSelect={() => {}}
          onDragSelect={() => {}}
          animate
          guides
          tutorialStep={null}
          onTutorialNext={() => {}}
          onTutorialSkip={() => {}}
        />
        <SceneConfetti t={t} bleed={140} bursts={[{ t: boardDoneTime(spec), count: 120, y: 0.45 }]} />
        {/* One pop at a time, centered on the board, keyed so each milestone
            replays its entrance. */}
        <CompletePill key={pop ?? "none"} show={pop != null} text={pop ?? ""} />
      </div>
    </div>
  );
}
