import { useMemo } from "react";
import Board from "../src/components/Board";
import Hud from "../src/components/Hud";
import { GIVENS, SOLUTION } from "../src/game/constants";
import type { Cell, GameState } from "../src/game/types";

/* Scripted "a miss costs you" beat on the bundled puzzle's top row (blanks at
 * 2,3,5,6,7,8):
 *   1. place four correct cells (2,3,5,6,7),
 *   2. on cell 8, place a WRONG digit → red error + a heart deducts + streak
 *      resets, and the "−1 life" pop appears.
 * After the miss, nothing else moves — the scene holds on the error state. */

const CORRECT: number[] = [2, 3, 5, 6, 7]; // filled correctly, in order
const ERR_CELL = 8; // last blank in the row
const ERR_VALUE = "5"; // wrong (row needs a 2 here)

// Beat schedule (scene-relative seconds).
const T_FIRST = 0.5;
const T_STEP = 0.5;
const T_WRONG = T_FIRST + CORRECT.length * T_STEP + 0.2; // place wrong digit
const T_HEART = T_WRONG + 0.05; // heart deducts as the error lands

export const MOMENTS_CUES = [
  ...CORRECT.map((_, i) => ({ t: T_FIRST + i * T_STEP, cue: "blip" as const })),
  { t: T_WRONG, cue: "error" as const },
];

interface Snapshot {
  filledCorrect: number;
  wrong: boolean;
  selected: number | null;
  hearts: number;
}

function snapshotAt(t: number): Snapshot {
  let filledCorrect = 0;
  let selected: number | null = null;
  for (let i = 0; i < CORRECT.length; i++) {
    const at = T_FIRST + i * T_STEP;
    if (t >= at - 0.18) selected = CORRECT[i];
    if (t >= at) filledCorrect = i + 1;
  }
  const wrong = t >= T_WRONG; // once wrong, it STAYS wrong — no correction
  if (t >= T_WRONG - 0.18) selected = ERR_CELL;
  const hearts = t >= T_HEART ? 2 : 3;
  return { filledCorrect, wrong, selected, hearts };
}

function buildBoard(s: Snapshot): Cell[] {
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const given = GIVENS[i] !== "0";
    let value = given ? GIVENS[i] : "";
    let error = false;
    const ci = CORRECT.indexOf(i);
    if (!given && ci !== -1 && ci < s.filledCorrect) value = SOLUTION[i];
    if (i === ERR_CELL && s.wrong) {
      value = ERR_VALUE;
      error = true;
    }
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value,
      error,
      scribbles: Array(9).fill(false),
    });
  }
  return board;
}

export default function MomentsBoard({ t }: { t: number }) {
  const snap = useMemo(() => snapshotAt(t), [t]);
  const state = useMemo<GameState>(
    () => ({
      board: buildBoard(snap),
      solution: SOLUTION,
      dealing: false,
      selected: snap.selected,
      multiSelected: [],
      pencil: false,
      started: true,
      hearts: snap.hearts,
      score: 2100,
      streak: snap.wrong ? 0 : 12,
      elapsed: 96 + Math.floor(Math.min(t, T_WRONG)),
      over: false,
      won: false,
      difficulty: "Medium",
    }),
    [snap, t],
  );

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
        {snap.wrong && (
          <Pill tone="bad">−1 life</Pill>
        )}
      </div>
    </div>
  );
}

/* A persistent feedback pill centered on the board (the app's own flash is too
 * brief for a trailer). Shared look with the board-completion pops. */
export function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "bad" | "good";
}) {
  const color = tone === "bad" ? "#e0605f" : "var(--accent)";
  const rgb = tone === "bad" ? "224,96,95" : "var(--accent-rgb)";
  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 z-[46] -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-wide whitespace-nowrap backdrop-blur-[2px]"
      style={{
        color,
        background: `rgba(${rgb},0.16)`,
        boxShadow: `0 0 0 1.5px rgba(${rgb},0.6) inset, 0 14px 34px -10px rgba(0,0,0,0.7)`,
        animation: "tr-drop 0.4s cubic-bezier(0.3,1.4,0.5,1) both",
      }}
    >
      {children}
    </div>
  );
}
