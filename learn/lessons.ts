/* Advanced-technique lessons for the /learn/ page.
 *
 * Each lesson runs on a real, uniquely-solvable board (81-char string, '.' for
 * blanks) where the named technique is the pivotal next step. Every claim in
 * the copy is a true deduction on that exact board; the boards, candidate
 * scribbles, and eliminations were computed from the app's own solver (see the
 * generator/verifier in the commit that added this feature).
 *
 * Elimination techniques don't place a digit — they remove a candidate — so a
 * lesson's interactive move is crossing out `elim.digit` in `elim.cell` (the
 * learner taps that digit on the number pad). To make the deduction visible,
 * `scribbles` pre-seeds the candidate notes on the cells that matter, and each
 * step colours the board: a soft blue wash marks the unit in play, a blue ring
 * marks the pattern cells, and a pulsing gold ring marks the target cell.
 *
 * This library is meant to grow: add a Lesson to LESSONS and it appears on the
 * index automatically. */

/* Unit helpers (0-80 indices) so the step data reads clearly. */
export const row = (r: number): number[] => Array.from({ length: 9 }, (_, c) => r * 9 + c);
export const col = (c: number): number[] => Array.from({ length: 9 }, (_, r) => r * 9 + c);
export const box = (b: number): number[] => {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  const out: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push((br + r) * 9 + bc + c);
  return out;
};

export type LegendKind = "unit" | "pattern" | "target";

export interface Lesson {
  id: string;
  /* Short name shown on the index card and lesson header. */
  name: string;
  /* One-line teaser for the index. */
  tagline: string;
  /* The teaching board (81 chars, '.' for blank). */
  board: string;
  /* Candidate notes to pre-seed, keyed by board index (0-80) -> digits string.
   * Shown as scribbles so the learner can see the pattern and the elimination. */
  scribbles: Record<number, string>;
  /* The elimination the technique unlocks: the learner crosses `digit` out of
   * `cell`. */
  elim: { cell: number; digit: string };
  /* Narration + visuals, authored against this exact board. The final step
   * waits for the cross-out; earlier steps advance with "Next". */
  steps: LessonStep[];
}

export interface LessonStep {
  title: string;
  /* Short paragraphs. Each renders as its own line for easy reading. */
  text: string[];
  /* Board emphasis for this step (all optional). */
  unit?: number[];
  pattern?: number[];
  target?: number[];
  /* Colour legend chips shown under the board, in order. */
  legend?: { kind: LegendKind; label: string }[];
  /* When true, this final step waits for the cross-out instead of a Next button. */
  awaitElim?: boolean;
}

/* A reusable opener that teaches candidates/scribbles to absolute beginners. */
const CANDIDATES_PRIMER: string[] = [
  "The small numbers inside a cell are its candidates — every digit that could still legally go there.",
  "A technique's job is to rule candidates out. When a cell is down to one candidate, that's its answer.",
  "In this lesson you'll spot a pattern, then cross out the one candidate it rules out.",
];

export const LESSONS: Lesson[] = [
  {
    id: "pointing",
    name: "Pointing pair",
    tagline: "A digit trapped on one line inside a box clears that line elsewhere.",
    board: ".8.314..6.268793.4.4.256.98654.38..7....4.68..78.6.43..62483...81.69..4.4...2.86.",
    scribbles: { 44: "1259", 53: "1259", 71: "235" },
    elim: { cell: 71, digit: "5" },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: box(5),
        legend: [{ kind: "unit", label: "The box we're studying" }],
      },
      {
        title: "Where can 5 go in this box?",
        text: [
          "Focus on the highlighted box on the right (rows 4–6, columns 7–9).",
          "Check its empty cells: the digit 5 only appears as a candidate in the two ringed cells.",
          "Notice they're both in the same column — column 9.",
        ],
        unit: box(5),
        pattern: [44, 53],
        legend: [
          { kind: "unit", label: "This box" },
          { kind: "pattern", label: "The only homes for 5" },
        ],
      },
      {
        title: "So the box's 5 lives in column 9",
        text: [
          "One of those two cells must be the 5 for this box — we don't yet know which.",
          "Either way, the box's 5 is somewhere in column 9. The two cells 'point' along that column.",
        ],
        pattern: [44, 53],
        legend: [{ kind: "pattern", label: "5 is trapped on this line" }],
      },
      {
        title: "Clear 5 from the rest of the column",
        text: [
          "If a 5 must land in column 9 up in the box, no other cell in column 9 can be a 5.",
          "The gold cell lower down still lists 5 as a candidate — but it's now impossible.",
          "Cross it out: select the gold cell, then tap 5 on the pad.",
        ],
        unit: col(8),
        pattern: [44, 53],
        target: [71],
        legend: [
          { kind: "pattern", label: "The pointing pair" },
          { kind: "target", label: "Cross 5 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "claiming",
    name: "Claiming",
    tagline: "A digit trapped in one box along a line clears the rest of that box.",
    board: "3....265.729865314..6.3..27...6.3..22.3.9..6.69.25..3..3.429..6.643172..972586143",
    scribbles: { 27: "1458", 28: "1458", 29: "1578", 37: "1458", 47: "178" },
    elim: { cell: 37, digit: "1" },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: row(3),
        legend: [{ kind: "unit", label: "The row we're studying" }],
      },
      {
        title: "Where can 1 go in this row?",
        text: [
          "Focus on the highlighted row (row 4).",
          "The digit 1 only survives as a candidate in the three ringed cells.",
          "See how all three sit inside the same 3×3 box — the left one.",
        ],
        unit: row(3),
        pattern: [27, 28, 29],
        legend: [
          { kind: "unit", label: "This row" },
          { kind: "pattern", label: "The only homes for 1" },
        ],
      },
      {
        title: "So this box's 1 is on this row",
        text: [
          "The row's 1 has to be one of those three cells — all in the left box.",
          "That means the box gets its 1 from row 4. This is 'claiming': a line claiming a digit for one box.",
        ],
        pattern: [27, 28, 29],
        legend: [{ kind: "pattern", label: "1 is claimed by this box+row" }],
      },
      {
        title: "Clear 1 from the rest of the box",
        text: [
          "If the box's 1 must be on row 4, no other cell in that box can be a 1.",
          "The gold cell (same box, a different row) still lists 1 — impossible now.",
          "Select the gold cell and tap 1 to cross it out.",
        ],
        unit: box(3),
        pattern: [27, 28, 29],
        target: [37],
        legend: [
          { kind: "pattern", label: "The claiming line" },
          { kind: "target", label: "Cross 1 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "naked-pair",
    name: "Naked pair",
    tagline: "Two cells with the same two candidates lock those digits to themselves.",
    board: "248513769135769428...824351.23...8767..3.8142814276935.....2597.9.6..283..29..614",
    scribbles: { 63: "45", 67: "45", 68: "157" },
    elim: { cell: 68, digit: "5" },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: row(7),
        legend: [{ kind: "unit", label: "The row we're studying" }],
      },
      {
        title: "Two cells, the very same pair",
        text: [
          "Look along the highlighted bottom row.",
          "The two ringed cells each have exactly the same two candidates: 4 and 5 — nothing else.",
        ],
        unit: row(7),
        pattern: [63, 67],
        legend: [
          { kind: "unit", label: "This row" },
          { kind: "pattern", label: "Both are exactly {4,5}" },
        ],
      },
      {
        title: "The pair claims 4 and 5",
        text: [
          "One of these cells will be 4 and the other 5 — together they use up both digits.",
          "So within this row, 4 and 5 are spoken for. No other cell in the row can be a 4 or a 5.",
        ],
        pattern: [63, 67],
        legend: [{ kind: "pattern", label: "4 and 5 belong to these two" }],
      },
      {
        title: "Clear 5 from a neighbour",
        text: [
          "The gold cell in the same row still lists 5 as a candidate — but the pair has claimed it.",
          "Select the gold cell and tap 5 to cross it out.",
        ],
        unit: row(7),
        pattern: [63, 67],
        target: [68],
        legend: [
          { kind: "pattern", label: "The naked pair" },
          { kind: "target", label: "Cross 5 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "hidden-pair",
    name: "Hidden pair",
    tagline: "Two digits with only two homes lock those cells, clearing their clutter.",
    board: ".....4..89....6154.4..5...7795462381124389576368715249....47893.....14654.....712",
    scribbles: { 57: "256", 75: "5689" },
    elim: { cell: 75, digit: "8" },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: col(3),
        legend: [{ kind: "unit", label: "The column we're studying" }],
      },
      {
        title: "Two digits with only two homes",
        text: [
          "Look down the highlighted column (column 4).",
          "The digits 5 and 6 each appear as a candidate in only the two ringed cells — nowhere else in the column.",
          "The pair is 'hidden' because those cells carry other candidates too.",
        ],
        unit: col(3),
        pattern: [57, 75],
        legend: [
          { kind: "unit", label: "This column" },
          { kind: "pattern", label: "Only homes for 5 and 6" },
        ],
      },
      {
        title: "Those two cells belong to 5 and 6",
        text: [
          "Two digits that fit only two cells must fill exactly those cells: one takes 5, the other 6.",
          "So any other candidate sitting in these two cells is an impostor — it can be cleared.",
        ],
        pattern: [57, 75],
        legend: [{ kind: "pattern", label: "Reserved for {5,6}" }],
      },
      {
        title: "Clear an impostor candidate",
        text: [
          "The gold cell is reserved for the 5/6 pair, yet it still lists 8.",
          "Select the gold cell and tap 8 to cross it out (its 9 would go the same way).",
        ],
        pattern: [57, 75],
        target: [75],
        legend: [
          { kind: "pattern", label: "The hidden pair" },
          { kind: "target", label: "Cross 8 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "naked-triple",
    name: "Naked triple",
    tagline: "Three cells sharing three candidates lock those digits to themselves.",
    board: "1978465326589321472431..968..9.246..4.5...2..3.2..17.4..4.1.326.264.3815531268479",
    scribbles: { 40: "789", 41: "79", 43: "89", 37: "1678", 39: "367" },
    elim: { cell: 37, digit: "7" },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: row(4),
        legend: [{ kind: "unit", label: "The row we're studying" }],
      },
      {
        title: "Three cells, only three digits",
        text: [
          "Look along the highlighted middle row (row 5).",
          "The three ringed cells hold 789, 79 and 89 — between them, only the digits 7, 8 and 9 appear.",
          "They don't all need the same candidates; what matters is that together they use just three digits.",
        ],
        unit: row(4),
        pattern: [40, 41, 43],
        legend: [
          { kind: "unit", label: "This row" },
          { kind: "pattern", label: "Together only {7,8,9}" },
        ],
      },
      {
        title: "The trio claims 7, 8 and 9",
        text: [
          "Three cells restricted to three digits must use exactly those three between them.",
          "So 7, 8 and 9 are spoken for in this row — no other cell here can be any of them.",
        ],
        pattern: [40, 41, 43],
        legend: [{ kind: "pattern", label: "7, 8, 9 belong to these three" }],
      },
      {
        title: "Clear 7 from a neighbour",
        text: [
          "The gold cell in the same row still lists 7 — but the triple has claimed it.",
          "Select the gold cell and tap 7 to cross it out.",
        ],
        unit: row(4),
        pattern: [40, 41, 43],
        target: [37],
        legend: [
          { kind: "pattern", label: "The naked triple" },
          { kind: "target", label: "Cross 7 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "x-wing",
    name: "X-wing",
    tagline: "A digit boxed into a rectangle across two lines clears its columns.",
    board: ".4982.3755.7.34..8382795461.75.43..98.3.5.7.42.4.78653738569142456312..7921487536",
    scribbles: { 10: "16", 12: "16", 46: "19", 48: "19", 37: "169" },
    elim: { cell: 37, digit: "1" },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: [...row(1), ...row(5)],
        legend: [{ kind: "unit", label: "The two rows we're studying" }],
      },
      {
        title: "The same two columns, in two rows",
        text: [
          "Track the digit 1. In row 2 it fits only two cells; in row 6 it fits only two cells.",
          "All four ringed cells line up on the very same pair of columns — columns 2 and 4.",
          "Four corners on two rows and two columns: that's the rectangle an X-wing needs.",
        ],
        unit: [...row(1), ...row(5)],
        pattern: [10, 12, 46, 48],
        legend: [
          { kind: "unit", label: "The two rows" },
          { kind: "pattern", label: "Corners where 1 can go" },
        ],
      },
      {
        title: "The rectangle pins the columns",
        text: [
          "In each row the 1 takes one corner, and the two chosen corners end up in different columns.",
          "So between them, columns 2 and 4 already get their 1s from these corners.",
        ],
        pattern: [10, 12, 46, 48],
        legend: [{ kind: "pattern", label: "The X-wing corners" }],
      },
      {
        title: "Clear 1 from those columns",
        text: [
          "Because columns 2 and 4 get their 1s at the corners, no other cell in either column can be a 1.",
          "The gold cell sits in column 2 and still lists 1 — impossible now.",
          "Select the gold cell and tap 1 to cross it out.",
        ],
        unit: col(1),
        pattern: [10, 12, 46, 48],
        target: [37],
        legend: [
          { kind: "pattern", label: "The X-wing corners" },
          { kind: "target", label: "Cross 1 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
];
