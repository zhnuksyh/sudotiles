export const GIVENS =
  "530070000" +
  "600195000" +
  "098000060" +
  "800060003" +
  "400803001" +
  "700020006" +
  "060000280" +
  "000419005" +
  "000080079";

export const SOLUTION =
  "534678912" +
  "672195348" +
  "198342567" +
  "859761423" +
  "426853791" +
  "713924856" +
  "961537284" +
  "287419635" +
  "345286179";

export const BASE_POINTS = 100;

export interface Difficulty {
  label: string;
  desc: string;
  clues: number;
  /* Graded tiers are additionally screened so the human techniques up to
   * this tier (see sudoku.ts) can't finish the board. Hardcore is always the
   * top tier; when a harder one lands, the old top gets a new name below it. */
  graded?: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { label: "Easy", desc: "More clues, forgiving pace", clues: 45 },
  { label: "Medium", desc: "A balanced board", clues: 36 },
  { label: "Hard", desc: "Fewer clues to lean on", clues: 30 },
  { label: "Expert", desc: "Barely any clues at all", clues: 25 },
  { label: "Extreme", desc: "Singles won't save you", clues: 24, graded: 1 },
  { label: "Hardcore", desc: "Even X-wings fall short", clues: 23, graded: 2 },
];

export const DEFAULT_DIFFICULTY = "Medium";

export function difficultyFor(label: string): Difficulty {
  return DIFFICULTIES.find((d) => d.label === label) ?? DIFFICULTIES[1];
}

export const STREAK_MILESTONE = 10;
export const MAX_HEARTS = 3;

/* Every STREAK_MILESTONE correct placements raise the score multiplier by
 * one, capped: streak 0-9 scores x1, 10-19 x2, ... 40+ x5. */
export const MAX_STREAK_MULTIPLIER = 5;

export function streakMultiplier(streak: number): number {
  return Math.min(1 + Math.floor(streak / STREAK_MILESTONE), MAX_STREAK_MULTIPLIER);
}

export const APP_VERSION = "1.2.0";
export const REPO_URL = "https://github.com/zhnuksyh/sudotiles";
