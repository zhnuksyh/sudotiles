# Sudotiles

A Sudoku game with an arcade twist — lives, streaks, scoring, and a
dark, tactile board. Built with Vite + React + TypeScript + Tailwind CSS,
using the Fredoka typeface throughout.

## Gameplay

- **Board** — a 9×9 grid grouped into 3×3 boxes on a vignette-lit dark panel.
- **Lives** — you start with 3 hearts. Placing a wrong definitive number
  turns the tile red and costs a life; at 0 hearts the game ends.
- **Scribbles** — pencil-in temporary candidates that cost no lives.
  Toggle the pencil button, or **right-click** any cell / number to
  scribble without leaving normal mode. Left-click places the real number.
- **Streak** — consecutive correct placements build a streak; every 10 in
  a row triggers a confetti flourish. A mistake resets it.
- **Score & Timer** — each correct placement scores points; the timer
  starts on your first input and stops on win or loss.
- **Show Guide** — highlights peers (row / column / box) and matching
  numbers for the selected cell.
- **Difficulty** — Easy / Medium / Expert / Hardcore (currently a
  placeholder selector).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  App.tsx              # top-level layout + overlays
  components/          # Board, Cell, Hud, NumberPad, Controls,
                       # DifficultyModal, StreakFlourish, GameOverlay, Confetti
  game/
    constants.ts       # puzzle (givens/solution), difficulties, scoring
    types.ts           # Cell / GameState models
    freshState.ts      # initial game state
    derive.ts          # board-view derivation (peers, highlights, boxes)
    useSudotiles.ts    # game logic hook (placement, lives, streak, timer)
design/                # original Claude Design handoff bundle (chats + HTML mock)
```

The puzzle is a single fixed board (the classic Wikipedia example);
the difficulty selector is wired as a placeholder for future puzzle
generation.
