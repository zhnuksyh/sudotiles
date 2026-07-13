/* The interactive tutorial runs on the bundled static puzzle (GIVENS in
 * constants.ts), so every step below is a real deduction on that exact board:
 *  - cell 40 (row 5, col 5) is a naked single: its row holds 4/8/3/1 and its
 *    column holds 7/9/6/2/1/8, leaving only 5.
 *  - cell 5 (row 1, col 6) is a hidden single: 8 fits nowhere else in the
 *    top-middle box.
 * Steps with a `cell` wait for that exact placement; steps without one are
 * informational and advance via the Next button. */

export interface TutorialStep {
  title: string;
  text: string;
  /* Target cell index and the digit to place there; absent on info steps. */
  cell?: number;
  n?: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Sudotiles",
    text: "The goal: fill every row, every column, and every 3×3 box with the numbers 1–9, no repeats. Let's solve two cells together to see how it's done.",
  },
  {
    title: "Count what's taken",
    cell: 40,
    n: 5,
    text: "Look at the highlighted centre cell. Its row already holds 4, 8, 3 and 1 — and its column adds 7, 9, 6, 2 and 8. That rules out eight different numbers, so only one fits. Tap 5 to place it.",
  },
  {
    title: "Find a number's only home",
    cell: 5,
    n: 8,
    text: "Now ask where 8 goes in the top-middle box. Row 3 already has an 8, blocking the box's bottom row — and the box's other open cell sits in a column that has an 8 too. Only the highlighted cell is left. Tap 8.",
  },
  {
    title: "Scribble when unsure",
    text: "When a cell can't be pinned down yet, tap the pencil (or right-click a number) to scribble small candidate notes. You can even drag across several cells to note them all at once.",
  },
  {
    title: "You're ready",
    text: "That's the core loop: scan, eliminate, place. Finish this board at your own pace — or deal a fresh puzzle whenever you like.",
  },
];
