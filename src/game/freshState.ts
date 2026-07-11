import { GIVENS, MAX_HEARTS } from "./constants";
import type { Cell, GameState } from "./types";

export function freshState(difficulty = "Medium"): GameState {
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const given = GIVENS[i] !== "0";
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value: given ? GIVENS[i] : "",
      error: false,
      scribbles: Array(9).fill(false),
    });
  }
  return {
    board,
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
