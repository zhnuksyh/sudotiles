/*
 * Sudoku puzzle generator and solver.
 *
 * Adapted to TypeScript from robatron/sudoku.js
 * (https://github.com/robatron/sudoku.js).
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Rob McGuire-Dale
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * The algorithm (constraint propagation + depth-first search, with a
 * forward/reverse solve to verify a unique solution) is preserved from the
 * original; only the module shape and typing have changed.
 */

const DIGITS = "123456789";
const ROWS = "ABCDEFGHI";
const COLS = DIGITS;

const MIN_GIVENS = 17;
const NR_SQUARES = 81;
const BLANK_CHAR = ".";

type CandidateMap = Record<string, string>;

function cross(a: string, b: string): string[] {
  const result: string[] = [];
  for (const ai of a) {
    for (const bi of b) {
      result.push(ai + bi);
    }
  }
  return result;
}

function getAllUnits(rows: string, cols: string): string[][] {
  const units: string[][] = [];

  // Rows
  for (const r of rows) {
    units.push(cross(r, cols));
  }

  // Columns
  for (const c of cols) {
    units.push(cross(rows, c));
  }

  // Boxes
  const rowSquares = ["ABC", "DEF", "GHI"];
  const colSquares = ["123", "456", "789"];
  for (const rs of rowSquares) {
    for (const cs of colSquares) {
      units.push(cross(rs, cs));
    }
  }

  return units;
}

function getSquareUnitsMap(squares: string[], units: string[][]): Record<string, string[][]> {
  const map: Record<string, string[][]> = {};
  for (const square of squares) {
    map[square] = units.filter((unit) => unit.indexOf(square) !== -1);
  }
  return map;
}

function getSquarePeersMap(
  squares: string[],
  unitsMap: Record<string, string[][]>,
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const square of squares) {
    const peers: string[] = [];
    for (const unit of unitsMap[square]) {
      for (const unitSquare of unit) {
        if (unitSquare !== square && peers.indexOf(unitSquare) === -1) {
          peers.push(unitSquare);
        }
      }
    }
    map[square] = peers;
  }
  return map;
}

// Static square relationships, computed once at module load.
const SQUARES = cross(ROWS, COLS);
const UNITS = getAllUnits(ROWS, COLS);
const SQUARE_UNITS_MAP = getSquareUnitsMap(SQUARES, UNITS);
const SQUARE_PEERS_MAP = getSquarePeersMap(SQUARES, SQUARE_UNITS_MAP);

function randRange(max: number): number {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(seq: T[]): T[] {
  const shuffled: (T | false)[] = new Array(seq.length).fill(false);
  for (const item of seq) {
    let ti = randRange(seq.length);
    while (shuffled[ti] !== false) {
      ti = ti + 1 > seq.length - 1 ? 0 : ti + 1;
    }
    shuffled[ti] = item;
  }
  return shuffled as T[];
}

function forceRange(nr: number, max: number, min: number): number {
  if (nr < min) return min;
  if (nr > max) return max;
  return nr;
}

function validateBoard(board: string): true | string {
  if (!board) {
    return "Empty board";
  }
  if (board.length !== NR_SQUARES) {
    return `Invalid board size. Board must be exactly ${NR_SQUARES} squares.`;
  }
  for (let i = 0; i < board.length; i++) {
    if (DIGITS.indexOf(board[i]) === -1 && board[i] !== BLANK_CHAR) {
      return `Invalid board character encountered at index ${i}: ${board[i]}`;
    }
  }
  return true;
}

function getSquareValsMap(board: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (board.length !== SQUARES.length) {
    throw new Error("Board/squares length mismatch.");
  }
  for (let i = 0; i < SQUARES.length; i++) {
    map[SQUARES[i]] = board[i];
  }
  return map;
}

/* Eliminate `val` from candidates[square] and propagate. Mutates `candidates`.
 * Returns the candidates map, or false on contradiction. */
function eliminate(candidates: CandidateMap, square: string, val: string): CandidateMap | false {
  // Already eliminated.
  if (candidates[square].indexOf(val) === -1) {
    return candidates;
  }

  candidates[square] = candidates[square].replace(val, "");

  const nrCandidates = candidates[square].length;
  if (nrCandidates === 1) {
    // Only one value left: eliminate it from peers.
    const targetVal = candidates[square];
    for (const peer of SQUARE_PEERS_MAP[square]) {
      if (!eliminate(candidates, peer, targetVal)) {
        return false;
      }
    }
  } else if (nrCandidates === 0) {
    // No candidates left: contradiction.
    return false;
  }

  // If a unit is reduced to only one place for `val`, assign it there.
  for (const unit of SQUARE_UNITS_MAP[square]) {
    const valPlaces = unit.filter((us) => candidates[us].indexOf(val) !== -1);
    if (valPlaces.length === 0) {
      return false;
    }
    if (valPlaces.length === 1) {
      if (!assign(candidates, valPlaces[0], val)) {
        return false;
      }
    }
  }

  return candidates;
}

/* Assign `val` to `square` by eliminating every other candidate, propagating.
 * Mutates `candidates`. Returns the candidates map, or false on contradiction. */
function assign(candidates: CandidateMap, square: string, val: string): CandidateMap | false {
  const otherVals = candidates[square].replace(val, "");
  for (const otherVal of otherVals) {
    if (!eliminate(candidates, square, otherVal)) {
      return false;
    }
  }
  return candidates;
}

function getCandidatesMap(board: string): CandidateMap | false {
  const report = validateBoard(board);
  if (report !== true) {
    throw new Error(report);
  }

  const candidateMap: CandidateMap = {};
  for (const square of SQUARES) {
    candidateMap[square] = DIGITS;
  }

  const valsMap = getSquareValsMap(board);
  for (const square in valsMap) {
    const val = valsMap[square];
    if (DIGITS.indexOf(val) !== -1) {
      if (!assign(candidateMap, square, val)) {
        return false;
      }
    }
  }

  return candidateMap;
}

/* Depth-first search over the candidate map. `reverse` rotates the candidate
 * order backwards, which lets us detect non-unique solutions. */
function search(candidates: CandidateMap | false, reverse: boolean): CandidateMap | false {
  if (!candidates) {
    return false;
  }

  // Solved when every square has exactly one candidate.
  let maxNrCandidates = 0;
  for (const square of SQUARES) {
    const nr = candidates[square].length;
    if (nr > maxNrCandidates) {
      maxNrCandidates = nr;
    }
  }
  if (maxNrCandidates === 1) {
    return candidates;
  }

  // Choose the unfilled square with the fewest candidates.
  let minNrCandidates = 10;
  let minCandidatesSquare: string | null = null;
  for (const square of SQUARES) {
    const nr = candidates[square].length;
    if (nr > 1 && nr < minNrCandidates) {
      minNrCandidates = nr;
      minCandidatesSquare = square;
    }
  }
  if (minCandidatesSquare === null) {
    return false;
  }

  const minCandidates = candidates[minCandidatesSquare];
  if (!reverse) {
    for (let vi = 0; vi < minCandidates.length; vi++) {
      const copy: CandidateMap = { ...candidates };
      const next = search(assign(copy, minCandidatesSquare, minCandidates[vi]), reverse);
      if (next) {
        return next;
      }
    }
  } else {
    for (let vi = minCandidates.length - 1; vi >= 0; vi--) {
      const copy: CandidateMap = { ...candidates };
      const next = search(assign(copy, minCandidatesSquare, minCandidates[vi]), reverse);
      if (next) {
        return next;
      }
    }
  }

  return false;
}

/* Solve an 81-character board string (digits 1-9 with '.' for blanks).
 * Returns the 81-character solution, or false if unsolvable. Set `reverse` to
 * solve with candidates rotated backwards (used for the uniqueness check). */
export function solve(board: string, reverse = false): string | false {
  const report = validateBoard(board);
  if (report !== true) {
    throw new Error(report);
  }

  let nrGivens = 0;
  for (const ch of board) {
    if (ch !== BLANK_CHAR && DIGITS.indexOf(ch) !== -1) {
      nrGivens++;
    }
  }
  if (nrGivens < MIN_GIVENS) {
    throw new Error(`Too few givens. Minimum givens is ${MIN_GIVENS}`);
  }

  const result = search(getCandidatesMap(board), reverse);
  if (result) {
    let solution = "";
    for (const square of SQUARES) {
      solution += result[square];
    }
    return solution;
  }
  return false;
}

/* Count solutions of a candidate map, stopping early once `limit` is reached.
 * Used for the uniqueness check when digging clues out of a full solution. A
 * puzzle is unique iff this returns exactly 1. */
function countSolutions(candidates: CandidateMap | false, limit: number): number {
  if (!candidates) {
    return 0;
  }

  // Choose the unfilled square with the fewest candidates (most constrained).
  let minNrCandidates = 10;
  let minCandidatesSquare: string | null = null;
  for (const square of SQUARES) {
    const nr = candidates[square].length;
    if (nr > 1 && nr < minNrCandidates) {
      minNrCandidates = nr;
      minCandidatesSquare = square;
    }
  }
  // No square with more than one candidate: this is a complete solution.
  if (minCandidatesSquare === null) {
    return 1;
  }

  let count = 0;
  const minCandidates = candidates[minCandidatesSquare];
  for (let vi = 0; vi < minCandidates.length; vi++) {
    const copy: CandidateMap = { ...candidates };
    count += countSolutions(assign(copy, minCandidatesSquare, minCandidates[vi]), limit - count);
    if (count >= limit) {
      return count;
    }
  }
  return count;
}

/* Whether `board` (81-char string) has exactly one solution. */
function hasUniqueSolution(board: string): boolean {
  return countSolutions(getCandidatesMap(board), 2) === 1;
}

/* Build a complete, valid solved board by filling a blank board with a random
 * DFS. Returns the 81-character solution. Throws if it can't after a generous
 * number of attempts (a seeded contradiction should be rare, so this only trips
 * on something genuinely wrong). */
function fullSolution(): string {
  const blankBoard = BLANK_CHAR.repeat(NR_SQUARES);
  // Seed a handful of random givens so successive boards differ, then solve.
  // On the rare contradiction, just retry from scratch.
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidates = getCandidatesMap(blankBoard) as CandidateMap;
    let ok = true;
    for (const square of shuffle(SQUARES).slice(0, 11)) {
      const options = candidates[square];
      const pick = options[randRange(options.length)];
      if (!assign(candidates, square, pick)) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const solved = search(candidates, false);
    if (solved) {
      let solution = "";
      for (const square of SQUARES) {
        solution += solved[square];
      }
      return solution;
    }
  }
  throw new Error("Failed to build a full solution.");
}

/* Generate a new puzzle as an 81-character board string, where `clues` is the
 * number of given squares (clamped to [17, 81]). Returned boards are solvable
 * and have a unique solution.
 *
 * Works by digging clues out of a complete solution: cells are removed one at a
 * time and only kept removed while the board still has a unique solution. This
 * converges in a bounded number of solves for every clue count (unlike blanking
 * random cells and re-rolling the whole board when the result isn't unique). */
export function generate(clues: number): string {
  const target = forceRange(clues, NR_SQUARES, MIN_GIVENS);

  const solution = fullSolution();
  const board = solution.split("");
  let given = NR_SQUARES;

  // Try to remove cells in random order; put a cell back if removing it makes
  // the puzzle non-unique. Stops when we hit the target clue count or run out
  // of cells that can be safely removed.
  for (const idx of shuffle([...Array(NR_SQUARES).keys()])) {
    if (given <= target) break;
    const saved = board[idx];
    board[idx] = BLANK_CHAR;
    if (hasUniqueSolution(board.join(""))) {
      given--;
    } else {
      board[idx] = saved;
    }
  }

  return board.join("");
}
