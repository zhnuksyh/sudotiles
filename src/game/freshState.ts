import { cluesFor, DEFAULT_DIFFICULTY, GIVENS, MAX_HEARTS, SOLUTION } from "./constants";
import { generate, solve } from "./sudoku";
import type { Cell, GameState } from "./types";

export interface Puzzle {
  givens: string;
  solution: string;
}

/* Generate a fresh puzzle for the given difficulty. Returns the givens board
 * (digits with '.' for blanks) and its unique solution. Falls back to the
 * bundled static puzzle if generation ever fails. This is CPU-heavy for low
 * clue counts, so it normally runs in a Web Worker (see sudoku.worker.ts). */
export function makePuzzle(difficulty: string): Puzzle {
  try {
    const givens = generate(cluesFor(difficulty));
    const solution = solve(givens);
    if (solution) {
      return { givens, solution };
    }
  } catch {
    // fall through to the bundled puzzle
  }
  return { givens: GIVENS.replace(/0/g, "."), solution: SOLUTION };
}

function boardFromGivens(givens: string): Cell[] {
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const given = givens[i] !== ".";
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value: given ? givens[i] : "",
      error: false,
      scribbles: Array(9).fill(false),
    });
  }
  return board;
}

const BLANK_GIVENS = ".".repeat(81);

function baseState(difficulty: string): Omit<GameState, "board" | "solution" | "dealing"> {
  return {
    selected: null,
    pencil: false,
    guides: false,
    started: false,
    hearts: MAX_HEARTS,
    score: 0,
    streak: 0,
    elapsed: 0,
    over: false,
    won: false,
    difficulty,
  };
}

/* A placeholder state shown immediately while the worker generates a puzzle:
 * an empty, non-interactive board flagged `dealing`. */
export function dealingState(difficulty = DEFAULT_DIFFICULTY): GameState {
  return {
    ...baseState(difficulty),
    board: boardFromGivens(BLANK_GIVENS),
    solution: SOLUTION,
    dealing: true,
  };
}

/* A ready-to-play state built from a generated puzzle. */
export function readyState(difficulty: string, puzzle: Puzzle): GameState {
  return {
    ...baseState(difficulty),
    board: boardFromGivens(puzzle.givens),
    solution: puzzle.solution,
    dealing: false,
  };
}

/* Synchronous fresh state (used as a fallback when no worker is available). */
export function freshState(difficulty = DEFAULT_DIFFICULTY): GameState {
  return readyState(difficulty, makePuzzle(difficulty));
}
