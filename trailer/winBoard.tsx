import { useMemo } from "react";
import Board from "../src/components/Board";
import Hud from "../src/components/Hud";
import GameOverlay from "../src/components/GameOverlay";
import SceneConfetti from "./sceneConfetti";
import { Pill } from "./momentsBoard";
import { SOLUTION } from "../src/game/constants";
import type { Cell, GameState } from "../src/game/types";

/* The winning moment: the last cell drops in, the board is complete, then the
 * real "Solved!" overlay rises. `lastCell` is the final placement so it pops. */
const LAST_CELL = 80;

function buildSolvedBoard(filledLast: boolean): Cell[] {
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    // Treat the whole solution as "given" except the last cell, which the
    // player places to finish — so it plays its cellpop entrance.
    const isLast = i === LAST_CELL;
    const given = !isLast;
    const value = given ? SOLUTION[i] : filledLast ? SOLUTION[i] : "";
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

export const WIN_CUES = [
  { t: 0.35, cue: "blip" as const }, // last placement
  { t: 0.6, cue: "streak" as const }, // brief flourish
  { t: 1.0, cue: "win" as const }, // solved fanfare
];

export default function WinBoard({ t }: { t: number }) {
  const filledLast = t >= 0.35;
  // Between the final placement and the overlay, flash the unit-complete pop.
  const showComplete = t >= 0.4 && t < 1.0;
  const showOverlay = t >= 1.0;
  const state = useMemo<GameState>(
    () => ({
      board: buildSolvedBoard(filledLast),
      solution: SOLUTION,
      dealing: false,
      selected: filledLast ? null : LAST_CELL,
      multiSelected: [],
      pencil: false,
      hintCells: [],
      started: true,
      hearts: 3,
      score: 8400,
      streak: 40,
      elapsed: 132,
      over: showOverlay,
      won: showOverlay,
      difficulty: "Expert",
    }),
    [filledLast, showOverlay],
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
        {showComplete && <Pill tone="good">Board complete!</Pill>}
        {/* Confetti on the win, mirroring the app's real solved celebration.
            `above` lifts it over the "Solved!" card so it bursts on top. */}
        <SceneConfetti
          above
          bleed={160}
          t={t}
          bursts={[
            { t: 0.45, count: 120, y: 0.45 }, // on the winning placement
            { t: 1.0, count: 160, y: 0.42 }, // as the overlay rises
            { t: 1.7, count: 90, x: 0.32, y: 0.5 },
            { t: 1.7, count: 90, x: 0.68, y: 0.5 },
          ]}
        />
        {showOverlay && (
          <GameOverlay
            title="Solved!"
            subtitle="Expert · 8,400 points · 40 streak"
            buttonLabel="New puzzle"
            animate
            onButtonClick={() => {}}
          />
        )}
      </div>
    </div>
  );
}
