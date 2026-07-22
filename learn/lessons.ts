/* Advanced-technique lessons for the /learn/ page.
 *
 * Each lesson runs on a real, uniquely-solvable board (81-char string, '.' for
 * blanks) where the named technique is the pivotal next step. Every claim in
 * the copy is a true deduction on that exact board; the boards, candidate
 * scribbles, and eliminations were computed from the app's own solver (see the
 * generator/verifier in the commit that added this file).
 *
 * Elimination techniques don't place a digit — they remove a candidate — so a
 * lesson's interactive move is crossing out `elim.digit` in `elim.cell` (the
 * learner taps the pencil or right-clicks that digit). To make the deduction
 * visible, `scribbles` pre-seeds the candidate notes on the cells that matter.
 *
 * This library is meant to grow: add a Lesson to LESSONS and it appears on the
 * index automatically. */

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
  /* Cells forming the technique's pattern, highlighted while explaining it. */
  pattern: number[];
  /* The elimination the technique unlocks: the learner crosses `digit` out of
   * `cell`. That cell is highlighted on the final step. */
  elim: { cell: number; digit: string };
  /* Narration, authored against this exact board. The final step waits for the
   * cross-out; earlier steps advance with "Next". */
  steps: LessonStep[];
}

export interface LessonStep {
  title: string;
  text: string;
  /* Cells to highlight for this step; defaults to the lesson `pattern`. */
  highlight?: number[];
  /* When true, this final step waits for the cross-out instead of a Next button. */
  awaitElim?: boolean;
}

export const LESSONS: Lesson[] = [
  {
    id: "pointing",
    name: "Pointing pair",
    tagline: "A digit trapped on one line inside a box clears that line elsewhere.",
    board: ".8.314..6.268793.4.4.256.98654.38..7....4.68..78.6.43..62483...81.69..4.4...2.86.",
    scribbles: { 44: "1259", 53: "1259", 71: "235" },
    pattern: [44, 53],
    elim: { cell: 71, digit: "5" },
    steps: [
      {
        title: "A box hems a digit in",
        text: "Look at the right-hand box (rows 4–6, columns 7–9). Inside it, the digit 5 can only go in the two highlighted cells — and both sit in column 9.",
      },
      {
        title: "So the line is settled inside the box",
        text: "Whichever of the two it turns out to be, the box's 5 is definitely somewhere in column 9. That's the whole idea of a pointing pair.",
      },
      {
        title: "Clear it from the rest of the column",
        text: "Because a 5 must land in column 9 up here, no other cell in column 9 can be a 5. Cross the 5 out of the highlighted cell (tap the pencil, then 5 — or right-click 5).",
        highlight: [71],
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
    pattern: [27, 28, 29],
    elim: { cell: 37, digit: "1" },
    steps: [
      {
        title: "A line hems a digit in",
        text: "In row 4, every place the digit 1 could still go lies in the left box — the three highlighted cells.",
      },
      {
        title: "So the box's 1 is on this line",
        text: "The 1 for that box must therefore come from row 4. This is claiming: a line pinning a digit inside one box.",
      },
      {
        title: "Clear it from the rest of the box",
        text: "Since the box's 1 is in row 4, the box's other cells can't be 1. Cross the 1 out of the highlighted cell.",
        highlight: [37],
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
    pattern: [63, 67],
    elim: { cell: 68, digit: "5" },
    steps: [
      {
        title: "Two cells, two candidates",
        text: "In the bottom row, the two highlighted cells each hold exactly the same pair: 4 and 5.",
      },
      {
        title: "The pair is theirs alone",
        text: "Between them they must use up both the 4 and the 5 — one takes 4, the other 5. So no other cell in the row can be a 4 or a 5.",
      },
      {
        title: "Clear the pair from a neighbour",
        text: "The highlighted cell in the same row still lists 5 as a candidate, but the pair has claimed it. Cross the 5 out of that cell.",
        highlight: [68],
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
    pattern: [57, 75],
    elim: { cell: 75, digit: "8" },
    steps: [
      {
        title: "Two digits, two homes",
        text: "In column 4, the digits 5 and 6 can each go in only the two highlighted cells — nowhere else in the column.",
      },
      {
        title: "Those cells belong to the pair",
        text: "Two digits confined to two cells must fill them: together they take the 5 and the 6. Any other candidates in those two cells are impostors.",
      },
      {
        title: "Clear an impostor candidate",
        text: "The lower highlighted cell still lists 8, but it's reserved for the 5/6 pair. Cross the 8 out of that cell.",
        highlight: [75],
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
    pattern: [40, 41, 43],
    elim: { cell: 37, digit: "7" },
    steps: [
      {
        title: "Three cells, three candidates",
        text: "In row 5, the three highlighted cells hold only the digits 7, 8 and 9 between them (as 789, 79 and 89). None of them can be anything else.",
      },
      {
        title: "The trio owns 7, 8 and 9",
        text: "Three cells restricted to three digits must use exactly those three. So 7, 8 and 9 are spoken for elsewhere in the row.",
      },
      {
        title: "Clear one from a neighbour",
        text: "Another cell in row 5 still lists 7, but the triple has claimed it. Cross the 7 out of the highlighted cell.",
        highlight: [37],
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
    pattern: [10, 12, 46, 48],
    elim: { cell: 37, digit: "1" },
    steps: [
      {
        title: "The same two columns, twice",
        text: "Look at the digit 1. In row 2 it fits only two cells; in row 6 it fits only two cells — and all four sit in the very same pair of columns (2 and 4). They form a rectangle.",
      },
      {
        title: "The rectangle locks the columns",
        text: "In each of those rows the 1 takes one corner, and the two chosen corners sit in different columns. So between columns 2 and 4, both 1s live at these four corners.",
      },
      {
        title: "Clear the columns elsewhere",
        text: "That means no other cell in column 2 or column 4 can be a 1. Cross the 1 out of the highlighted cell in column 2.",
        highlight: [37],
        awaitElim: true,
      },
    ],
  },
];
