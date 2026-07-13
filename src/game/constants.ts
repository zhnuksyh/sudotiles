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
}

export const DIFFICULTIES: Difficulty[] = [
  { label: "Easy", desc: "More clues, forgiving pace", clues: 45 },
  { label: "Medium", desc: "A balanced board", clues: 36 },
  { label: "Expert", desc: "Fewer clues to lean on", clues: 30 },
  { label: "Hardcore", desc: "One life, no guides", clues: 25 },
];

export const DEFAULT_DIFFICULTY = "Medium";

export function cluesFor(difficulty: string): number {
  return DIFFICULTIES.find((d) => d.label === difficulty)?.clues ?? 36;
}

export const STREAK_MILESTONE = 10;
export const MAX_HEARTS = 3;

export const APP_VERSION = "1.0.0";
export const REPO_URL = "https://github.com/zhnuksyh/sudotiles";
