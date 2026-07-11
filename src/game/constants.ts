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
}

export const DIFFICULTIES: Difficulty[] = [
  { label: "Easy", desc: "More clues, forgiving pace" },
  { label: "Medium", desc: "A balanced board" },
  { label: "Expert", desc: "Fewer clues to lean on" },
  { label: "Hardcore", desc: "One life, no guides" },
];

export const STREAK_MILESTONE = 10;
export const MAX_HEARTS = 3;
