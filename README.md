# Sudotiles

A Sudoku game with an arcade twist — generated puzzles, lives, streaks,
scoring, and a dark, tactile board. Built with Vite + React + TypeScript +
Tailwind CSS, using the Fredoka typeface throughout. Installable as a PWA and
deployed to GitHub Pages.

**Live:** https://zhnuksyh.github.io/sudotiles/

## Gameplay

- **Board** — a 9×9 grid grouped into 3×3 boxes on a vignette-lit dark panel.
- **Generated puzzles** — every board is generated with a unique solution.
  The board is dug out of a complete solution: a full grid is solved, then
  cells are removed one at a time and a removal is kept only while the puzzle
  still has exactly one solution (see [Puzzle generation](#puzzle-generation)).
  Generation runs in a Web Worker so the UI never blocks; a brief "Dealing…"
  state shows while a puzzle is prepared.
- **Difficulty** — Easy / Medium / Expert / Hardcore, mapped to how many clues
  the board starts with (45 / 36 / 30 / 25). Choosing one deals a fresh board.
- **Locked answers** — a correctly placed number locks in: it can't be erased
  or overwritten. Only wrong entries and scribbles can be cleared.
- **Lives** — you start with 3 hearts. A wrong definitive number turns the tile
  red and costs a life; at 0 hearts the game ends. Lives can be turned off in
  Settings.
- **Scribbles** — pencil-in temporary candidates that cost no lives. Toggle the
  pencil button, or **right-click** any cell / number to scribble without
  leaving normal mode. Left-click places the real number.
- **Streak** — consecutive correct placements build a streak; every 10 in a row
  triggers a confetti flourish. A mistake resets it.
- **Score & Timer** — each correct placement scores points; the timer starts on
  your first input and stops on win or loss. The timer can be turned off.
- **New puzzle** — the refresh button deals a fresh board after a confirmation
  card, so you don't wipe progress by accident.
- **How to play** — an in-app guide (open-book button) covers the rules, core
  techniques with mini-grid examples, keyboard shortcuts, and beginner video
  tutorials.

## Puzzle generation

Puzzles are built with a **dig-from-solution** algorithm (`src/game/sudoku.ts`):

1. **Build a full solution.** A blank grid is seeded with a handful of random
   givens and solved by constraint propagation + depth-first search, producing a
   complete, valid board that differs run to run.
2. **Dig out clues.** Cells are removed one at a time in random order. After each
   removal the puzzle is checked for a **unique** solution (a solution count with
   an early exit at 2); a cell is only kept blank while the board stays unique,
   and is otherwise restored. Digging stops once the target clue count for the
   chosen difficulty is reached.

This converges in a bounded number of solves at every difficulty — typically
well under ~100ms even for Hardcore. It replaces an earlier
blank-random-cells-and-retry approach that re-rolled the entire board whenever
the result wasn't unique, which could take seconds (or hang effectively
indefinitely) at low clue counts.

**Guardrails.** Generation can never leave the board stuck "dealing":

- The full-solution builder is capped at a bounded number of attempts and
  throws rather than looping forever; `makePuzzle` catches any failure and falls
  back to a bundled static puzzle.
- The worker request is backed by a timeout in `useSudotiles.ts` — if a puzzle
  isn't returned in time, the bundled puzzle is dealt so the UI always recovers.

The constraint-propagation solver and its helpers are adapted (to TypeScript)
from [robatron/sudoku.js](https://github.com/robatron/sudoku.js) (MIT); the
dig-from-solution generator and guardrails above are our own.

## Keyboard shortcuts

Desktop only, and can be turned off in Settings:

- **1–9** — place that number in the selected cell
- **Space** — erase the selected cell
- **Tab** — enter / leave scribble (pencil) mode

## Settings

Opened from the gear button and persisted to `localStorage`:

- **Difficulty** — Easy / Medium / Expert / Hardcore.
- **Number pad** — Bottom (default) or Right of the board. In the Right layout
  the pad and controls sit in a column beside the board, with the header
  directly above the board; it collapses below the board on narrow screens.
- **Show guide** — highlights peers (row / column / box) and matching numbers
  for the selected cell. On by default.
- **Lives**, **Timer**, **Animations**, **Keyboard shortcuts** — toggles.
  Disabling animations makes the whole UI static (no cell pops, modal
  transitions, shake, flourish, or confetti); a wrong answer still flashes red.

## PWA

The app ships a web app manifest, maskable icons, and a service worker, so it
can be installed to a mobile home screen and launched standalone (no browser
chrome) and offline.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## Deployment

Pushing to `main` runs the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to
GitHub Pages. The production base path is `/sudotiles/` (set in
`vite.config.ts`).

## Project structure

```
src/
  App.tsx              # top-level layout (bottom / right) + overlays
  main.tsx             # entry point + service worker registration
  components/          # Board, Cell, Hud, NumberPad, Controls, SettingsModal,
                       # ConfirmModal, GuideModal, StreakFlourish, GameOverlay,
                       # Confetti, icons
  game/
    constants.ts       # difficulties + clue counts, scoring, fallback puzzle
    settings.ts        # persisted settings (difficulty, layout, toggles)
    types.ts           # Cell / GameState models
    sudoku.ts          # dig-from-solution generator + ported constraint solver
    sudoku.worker.ts   # Web Worker wrapper around generation
    freshState.ts      # dealing / ready game state
    derive.ts          # board-view derivation (peers, highlights, boxes)
    useSudotiles.ts    # game logic hook (placement, lives, streak, timer,
                       # settings, keyboard shortcuts, worker)
public/                # favicon, PWA icons, manifest, service worker
design/                # original Claude Design handoff bundle (chats + HTML mock)
```
