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
 * marks the pattern cells, and a pulsing teal ring marks the target cell.
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
  /* A video that teaches this technique, offered on the completion screen. */
  video: { title: string; channel: string; url: string };
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
    video: {
      title: "Locked Candidates: Pointing and Claiming",
      channel: "Learn Something",
      url: "https://www.youtube.com/watch?v=Xa13k7a9wos",
    },
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
          "The teal cell lower down still lists 5 as a candidate — but it's now impossible.",
          "Cross it out: select the teal cell, then tap 5 on the pad.",
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
    video: {
      title: "How To Solve Sudoku Better Using Hidden And Claiming Pairs",
      channel: "Smart Hobbies",
      url: "https://www.youtube.com/watch?v=okTnzo6o4L0",
    },
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
          "The teal cell (same box, a different row) still lists 1 — impossible now.",
          "Select the teal cell and tap 1 to cross it out.",
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
    video: {
      title: "Sudoku Tutorial 2 — Naked Pairs",
      channel: "dkmgames",
      url: "https://www.youtube.com/watch?v=KUF_P9LypNs",
    },
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
          "The teal cell in the same row still lists 5 as a candidate — but the pair has claimed it.",
          "Select the teal cell and tap 5 to cross it out.",
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
    video: {
      title: "Hidden Pairs — A Sudoku Technique",
      channel: "Sudoku.com",
      url: "https://www.youtube.com/watch?v=dD1fSm8BEj8",
    },
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
          "The teal cell is reserved for the 5/6 pair, yet it still lists 8.",
          "Select the teal cell and tap 8 to cross it out (its 9 would go the same way).",
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
    video: {
      title: "Naked Triple — Step-by-Step Guide",
      channel: "Sudoku VC",
      url: "https://www.youtube.com/watch?v=Vc5JOcLK6nQ",
    },
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
          "The teal cell in the same row still lists 7 — but the triple has claimed it.",
          "Select the teal cell and tap 7 to cross it out.",
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
    video: {
      title: "Advanced Sudoku: Making X-Wings Simple",
      channel: "Cracking The Cryptic",
      url: "https://www.youtube.com/watch?v=8PqBDhKma7E",
    },
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
          "The teal cell sits in column 2 and still lists 1 — impossible now.",
          "Select the teal cell and tap 1 to cross it out.",
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
  {
    id: "hidden-triple",
    name: "Hidden triple",
    tagline: "Three digits with only three homes lock those cells, clearing their clutter.",
    board: ".4.7...6...23......5.4..38.2..............4...38...9.2.6..8...15...2......364...7",
    scribbles: { 35: "3568", 44: "3568", 71: "34689" },
    elim: { cell: 35, digit: "5" },
    video: {
      title: "Hidden Triples — a Sudoku Technique",
      channel: "Sudoku.com",
      url: "https://www.youtube.com/watch?v=b-n1eCknvKg",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: col(8),
        legend: [{ kind: "unit", label: "The column we're studying" }],
      },
      {
        title: "Where can 3, 6 and 8 go?",
        text: [
          "Focus on the highlighted column (column 9).",
          "Track three digits at once: 3, 6 and 8. Each of them fits only the three ringed cells.",
          "Three digits, three cells — between them they use up all three.",
        ],
        unit: col(8),
        pattern: [35, 44, 71],
        legend: [
          { kind: "unit", label: "This column" },
          { kind: "pattern", label: "Only homes for 3, 6 and 8" },
        ],
      },
      {
        title: "So those cells are reserved",
        text: [
          "The column needs a 3, a 6 and an 8 somewhere, and only these three cells can take them.",
          "So these cells hold exactly 3, 6 and 8 in some order — nothing else fits.",
          "It's 'hidden' because each cell still lists extra candidates that can't survive.",
        ],
        pattern: [35, 44, 71],
        legend: [{ kind: "pattern", label: "Reserved for {3,6,8}" }],
      },
      {
        title: "Clear the extras",
        text: [
          "The teal cell is reserved for the triple, yet it still lists 5.",
          "Select the teal cell and tap 5 to cross it out (its neighbours' extras go the same way).",
        ],
        pattern: [44, 71],
        target: [35],
        legend: [
          { kind: "pattern", label: "The rest of the triple" },
          { kind: "target", label: "Cross 5 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "xy-wing",
    name: "XY-wing",
    tagline: "Two pincers hinged on a pivot trap a digit that must fall somewhere.",
    board: "..6.5..49.....83.5.7.........2.6..1.....35.7......78..86.54.1....5..2...9.1.8....",
    scribbles: { 32: "49", 35: "34", 59: "39", 62: "237" },
    elim: { cell: 62, digit: "3" },
    video: {
      title: "How To Solve XY-Wings Effortlessly",
      channel: "Smart Hobbies",
      url: "https://www.youtube.com/watch?v=-9pdS77qNl4",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        pattern: [32],
        legend: [{ kind: "pattern", label: "The pivot cell" }],
      },
      {
        title: "A pivot with two pincers",
        text: [
          "The ringed cell in the middle is the pivot: it holds exactly 4 and 9.",
          "It sees one cell along its row holding 3 and 4, and one down its column holding 3 and 9.",
          "Those two are the pincers. Notice all three cells hold just two candidates each.",
        ],
        pattern: [32, 35, 59],
        legend: [{ kind: "pattern", label: "Pivot and its two pincers" }],
      },
      {
        title: "Either way, a 3 appears",
        text: [
          "The pivot is a 4 or a 9. Follow both cases.",
          "If the pivot is 4, the row pincer can't be 4, so it must be 3.",
          "If the pivot is 9, the column pincer can't be 9, so it must be 3.",
          "Either way one of the two pincers ends up a 3 — we just don't know which.",
        ],
        pattern: [35, 59],
        legend: [{ kind: "pattern", label: "One of these is a 3" }],
      },
      {
        title: "Clear 3 where both pincers see",
        text: [
          "A 3 is guaranteed in one of the pincers, so any cell that sees both of them cannot be a 3.",
          "The teal cell sits in the same row as one pincer and the same column as the other.",
          "Select the teal cell and tap 3 to cross it out.",
        ],
        pattern: [35, 59],
        target: [62],
        legend: [
          { kind: "pattern", label: "The pincers" },
          { kind: "target", label: "Cross 3 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "swordfish",
    name: "Swordfish",
    tagline: "A digit confined to three rows and three columns clears those columns.",
    board: "6...7.........5....3....2...8.4...357.4....61..9....7.41.8........3.4.5.....2...3",
    scribbles: {
      5: "12389",
      6: "134589",
      13: "134689",
      15: "1346789",
      40: "3589",
      41: "2389",
      49: "13568",
    },
    elim: { cell: 49, digit: "3" },
    video: {
      title: "Swordfish — an Advanced Sudoku Technique",
      channel: "Sudoku.com",
      url: "https://www.youtube.com/watch?v=lLVAVPLH7G4",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: [...row(0), ...row(1), ...row(4)],
        legend: [{ kind: "unit", label: "The three rows we're studying" }],
      },
      {
        title: "Three rows, three columns",
        text: [
          "Track the digit 3 across the three highlighted rows.",
          "In row 1 it fits only columns 6 and 7; in row 2 only columns 5 and 7; in row 5 only columns 5 and 6.",
          "Six cells, but they all land inside just three columns — 5, 6 and 7.",
        ],
        unit: [...row(0), ...row(1), ...row(4)],
        pattern: [5, 6, 13, 15, 40, 41],
        legend: [
          { kind: "unit", label: "The three rows" },
          { kind: "pattern", label: "Where 3 can go" },
        ],
      },
      {
        title: "The three columns are spoken for",
        text: [
          "Each of the three rows needs a 3, and every one of them must come from these six cells.",
          "Three 3s spread across three columns means each of columns 5, 6 and 7 gets exactly one.",
          "That's a swordfish: an X-wing stretched from two lines to three.",
        ],
        pattern: [5, 6, 13, 15, 40, 41],
        legend: [{ kind: "pattern", label: "The swordfish" }],
      },
      {
        title: "Clear 3 from those columns",
        text: [
          "Columns 5, 6 and 7 already get their 3s from the rows above, so no other cell in them can be a 3.",
          "The teal cell sits in column 5 and still lists 3 — impossible now.",
          "Select the teal cell and tap 3 to cross it out.",
        ],
        unit: col(4),
        pattern: [5, 6, 13, 15, 40, 41],
        target: [49],
        legend: [
          { kind: "pattern", label: "The swordfish" },
          { kind: "target", label: "Cross 3 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "skyscraper",
    name: "Skyscraper",
    tagline: "Two lines sharing a base send their tops hunting for a digit together.",
    board: "..3.1.7.9..13.7.56.7..5.31..65.43.7..175..643..4176.....8.61.9...6..4.3....835.6.",
    scribbles: { 7: "28", 10: "2489", 15: "248", 46: "2389", 52: "28" },
    elim: { cell: 15, digit: "8" },
    video: {
      title: "Skyscraper — Sudoku Technique",
      channel: "Sudoku Swami",
      url: "https://www.youtube.com/watch?v=Ui1hrx7iTeo",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: [...col(1), ...col(7)],
        legend: [{ kind: "unit", label: "The two columns we're studying" }],
      },
      {
        title: "Two columns, two homes each",
        text: [
          "Track the digit 8 down the two highlighted columns.",
          "In column 2 it fits only two cells; in column 8 it fits only two cells.",
          "An X-wing would need all four to line up on the same two rows — here they don't quite.",
        ],
        unit: [...col(1), ...col(7)],
        pattern: [7, 10, 46, 52],
        legend: [
          { kind: "unit", label: "The two columns" },
          { kind: "pattern", label: "Where 8 can go" },
        ],
      },
      {
        title: "The shared base, and the two tops",
        text: [
          "Two of the four cells share a row — row 6. That shared row is the skyscraper's base.",
          "The other two cells are the tops, and they sit on different rows: rows 1 and 2.",
          "Both columns need an 8. They can't both take it from the base row, so at least one top is an 8.",
        ],
        pattern: [7, 10, 46, 52],
        legend: [{ kind: "pattern", label: "Base below, tops above" }],
      },
      {
        title: "Clear 8 where both tops reach",
        text: [
          "One of the two tops is definitely an 8, so any cell seeing both tops cannot be one.",
          "The teal cell shares a row with one top and a box with the other, and still lists 8.",
          "Select the teal cell and tap 8 to cross it out.",
        ],
        pattern: [7, 10],
        target: [15],
        legend: [
          { kind: "pattern", label: "The two tops" },
          { kind: "target", label: "Cross 8 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "two-string-kite",
    name: "Two-string kite",
    tagline: "A row and a column meeting in one box point at a single guilty cell.",
    board: "5..91.48....4...3..4..7....273851..4...649..3496.3..5.....8...2...3.4..9.6.19.3..",
    scribbles: { 11: "12789", 13: "26", 67: "26", 74: "2458", 77: "257" },
    elim: { cell: 11, digit: "2" },
    video: {
      title: "Two String Kite — Sudoku Technique",
      channel: "Sudoku Swami",
      url: "https://www.youtube.com/watch?v=SVJqIunDdWs",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: [...row(8), ...col(4)],
        legend: [{ kind: "unit", label: "The row and column we're studying" }],
      },
      {
        title: "One string along a row, one down a column",
        text: [
          "Track the digit 2. In the bottom row it fits only two cells — that's the first string.",
          "In column 5 it also fits only two cells — the second string.",
          "Each string is a promise: one of its two ends must be a 2.",
        ],
        unit: [...row(8), ...col(4)],
        pattern: [74, 77, 13, 67],
        legend: [
          { kind: "unit", label: "The row and the column" },
          { kind: "pattern", label: "Where 2 can go" },
        ],
      },
      {
        title: "The strings are knotted in one box",
        text: [
          "One end of the row-string and one end of the column-string sit in the same box, bottom middle.",
          "Two 2s can't share a box, so those two knotted ends can't both be the 2.",
          "That forces at least one of the two far ends — the loose ends — to be a 2.",
        ],
        pattern: [77, 67, 74, 13],
        legend: [{ kind: "pattern", label: "Knot in the box, loose ends outside" }],
      },
      {
        title: "Clear 2 where both loose ends reach",
        text: [
          "One loose end sits in the bottom row, the other up in column 5.",
          "The teal cell shares its column with one and its row with the other, so a 2 there is impossible.",
          "Select the teal cell and tap 2 to cross it out.",
        ],
        pattern: [74, 13],
        target: [11],
        legend: [
          { kind: "pattern", label: "The two loose ends" },
          { kind: "target", label: "Cross 2 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "xyz-wing",
    name: "XYZ-wing",
    tagline: "A three-candidate pivot and two pincers gang up on one digit.",
    board: "....275.9...3.9...9...6...8365..1..4.89..3...2...9...3.....28.7..2..846.1.85.6..2",
    scribbles: { 36: "47", 39: "2467", 40: "457", 50: "45" },
    elim: { cell: 39, digit: "4" },
    video: {
      title: "XYZ-Wing — Sudoku Technique",
      channel: "Sudoku Swami",
      url: "https://www.youtube.com/watch?v=I0-8bIWlqWA",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        pattern: [40],
        legend: [{ kind: "pattern", label: "The pivot cell" }],
      },
      {
        title: "A pivot of three, two pincers of two",
        text: [
          "The ringed cell in the middle of row 5 is the pivot: it holds 4, 5 and 7 — three candidates.",
          "Along its row sits a pincer holding 4 and 7; down in the box below sits one holding 4 and 5.",
          "An XY-wing has a two-candidate pivot; here the pivot carries a third. That's the Z.",
        ],
        pattern: [40, 36, 50],
        legend: [{ kind: "pattern", label: "Pivot and its two pincers" }],
      },
      {
        title: "All three can be the 4",
        text: [
          "The digit shared by all three cells is 4. Walk through the pivot's options.",
          "If the pivot is 4, there's the 4. If the pivot is 7, the row pincer must be 4.",
          "If the pivot is 5, the other pincer must be 4. Every case puts a 4 in one of the three.",
        ],
        pattern: [40, 36, 50],
        legend: [{ kind: "pattern", label: "One of these three is a 4" }],
      },
      {
        title: "Clear 4 where all three reach",
        text: [
          "Unlike an XY-wing, the target must see all three cells — the pivot included.",
          "The teal cell shares row 5 with the pivot and the row pincer, and its box with the other pincer.",
          "Select the teal cell and tap 4 to cross it out.",
        ],
        pattern: [40, 36, 50],
        target: [39],
        legend: [
          { kind: "pattern", label: "The XYZ-wing" },
          { kind: "target", label: "Cross 4 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "w-wing",
    name: "W-wing",
    tagline: "Twin pairs bridged by a strong link rule a digit out between them.",
    board: "7.5..214.19.4..25....3519789...86..78...3.6..56...9...35962....4.1....62.........",
    scribbles: { 13: "67", 14: "78", 64: "78", 67: "79", 68: "3578" },
    elim: { cell: 68, digit: "8" },
    video: {
      title: "W-Wing — Sudoku Technique",
      channel: "Sudoku Swami",
      url: "https://www.youtube.com/watch?v=xNKZBnWqIsA",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        pattern: [14, 64],
        legend: [{ kind: "pattern", label: "The twin pair cells" }],
      },
      {
        title: "Two cells, the identical pair",
        text: [
          "The two ringed cells both hold exactly 7 and 8 — the same two candidates.",
          "They don't share a row, a column or a box, so neither one restricts the other directly.",
          "A naked pair needs them in the same unit. Here we need something to bridge them.",
        ],
        pattern: [14, 64],
        legend: [{ kind: "pattern", label: "Both are exactly {7,8}" }],
      },
      {
        title: "A strong link on 7 bridges them",
        text: [
          "Look down column 5: the digit 7 fits only two cells there — a strong link, so one of them is a 7.",
          "The top of that link shares row 2 with one twin; the bottom shares row 8 with the other.",
          "So whichever end takes the 7, it knocks the 7 out of the twin beside it — leaving that twin an 8.",
        ],
        unit: col(4),
        pattern: [13, 67],
        legend: [
          { kind: "unit", label: "The bridging column" },
          { kind: "pattern", label: "The strong link on 7" },
        ],
      },
      {
        title: "Clear 8 where both twins reach",
        text: [
          "Either way, one of the two twins ends up an 8 — we just don't know which.",
          "So a cell seeing both twins can't be an 8. The teal cell shares a column with one and a row with the other.",
          "Select the teal cell and tap 8 to cross it out.",
        ],
        pattern: [14, 64],
        target: [68],
        legend: [
          { kind: "pattern", label: "The twin pair" },
          { kind: "target", label: "Cross 8 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "empty-rectangle",
    name: "Empty rectangle",
    tagline: "A digit filling an L inside a box teams up with a strong link.",
    board: "....1..3.....3..65....96..894..725.........7.2..3......8.7614..76.924...41.8536.7",
    scribbles: { 29: "1368", 36: "13568", 37: "35", 38: "13568", 42: "12389", 65: "35", 69: "138" },
    elim: { cell: 65, digit: "3" },
    video: {
      title: "Empty Rectangle — Sudoku Technique",
      channel: "Sudoku Swami",
      url: "https://www.youtube.com/watch?v=Ac1TCVIvbxY",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        unit: box(3),
        legend: [{ kind: "unit", label: "The box we're studying" }],
      },
      {
        title: "The 3s in this box make an L",
        text: [
          "Focus on the highlighted box on the left. Track the digit 3 inside it.",
          "Its four homes all lie on row 5 or on column 3 — an L, crossing at the corner cell r5c3.",
          "The empty part is the rectangle of cells with no 3 at all. That corner is the hinge.",
        ],
        unit: box(3),
        pattern: [29, 36, 37, 38],
        legend: [
          { kind: "unit", label: "This box" },
          { kind: "pattern", label: "Where 3 can go" },
        ],
      },
      {
        title: "The hinge promise",
        text: [
          "The box's 3 sits somewhere on that L, so it is on row 5, or on column 3, or on both at the hinge.",
          "Now look at column 7: the digit 3 fits only two cells there — a strong link.",
          "The top of that link is on row 5; the bottom is on row 8.",
        ],
        unit: col(6),
        pattern: [42, 69],
        legend: [
          { kind: "unit", label: "The linked column" },
          { kind: "pattern", label: "The strong link on 3" },
        ],
      },
      {
        title: "Clear 3 at the crossing",
        text: [
          "Suppose the teal cell were a 3. It sits on column 3, so the box's 3 would have to be on row 5.",
          "That row-5 three would knock out the top of the link, forcing the link's bottom — on row 8 — to be a 3.",
          "But the teal cell is on row 8 too, so we'd have two 3s in one row. Impossible.",
          "Select the teal cell and tap 3 to cross it out.",
        ],
        pattern: [29, 36, 37, 38, 42, 69],
        target: [65],
        legend: [
          { kind: "pattern", label: "The L and the link" },
          { kind: "target", label: "Cross 3 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
  {
    id: "simple-colouring",
    name: "Simple colouring",
    tagline: "Chain a digit's strong links, paint them alternately, and trap the cells that see both.",
    board: "..9.47.83...39...73.76.89..91.4...72734..9..6....7..9...57..16.6.15..73.873961245",
    scribbles: { 0: "125", 3: "12", 9: "1245", 16: "125", 22: "125", 40: "12", 43: "15" },
    elim: { cell: 43, digit: "1" },
    video: {
      title: "Simple Colouring — Sudoku Technique",
      channel: "Sudoku Swami",
      url: "https://www.youtube.com/watch?v=ZC6PsTvcgQY",
    },
    steps: [
      {
        title: "How candidates work",
        text: CANDIDATES_PRIMER,
        pattern: [0, 3],
        legend: [{ kind: "pattern", label: "A strong link on 1" }],
      },
      {
        title: "Strong links, chained together",
        text: [
          "A strong link is a unit where a digit has exactly two homes: one of them must be it.",
          "Track the digit 1. Row 1 gives a link, and each end of it starts another link elsewhere.",
          "Chain them and six cells hang together, every neighbouring pair a strong link.",
        ],
        pattern: [0, 3, 9, 16, 22, 40],
        legend: [{ kind: "pattern", label: "The chain of strong links" }],
      },
      {
        title: "Paint the chain in two colours",
        text: [
          "Walk the chain and alternate colours at every step, like a chessboard.",
          "Because each link holds exactly one 1, the true 1s are all one colour — either every cell of colour A, or every cell of colour B.",
          "We don't know which colour is the true one. We don't need to.",
        ],
        pattern: [0, 22, 16],
        legend: [{ kind: "pattern", label: "Colour A — the other three are colour B" }],
      },
      {
        title: "Trap the cell that sees both colours",
        text: [
          "One colour is entirely 1s, so any cell outside the chain that sees both colours is doomed either way.",
          "The teal cell shares row 5 with a colour-B cell and column 8 with a colour-A cell.",
          "Whichever colour turns out true, a 1 lands next to it. Select the teal cell and tap 1 to cross it out.",
        ],
        pattern: [22, 16, 40],
        target: [43],
        legend: [
          { kind: "pattern", label: "Both colours reach the target" },
          { kind: "target", label: "Cross 1 out here" },
        ],
        awaitElim: true,
      },
    ],
  },
];
