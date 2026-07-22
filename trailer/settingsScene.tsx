import { useMemo } from "react";
import Board from "../src/components/Board";
import SettingsModal from "../src/components/SettingsModal";
import { GIVENS, SOLUTION } from "../src/game/constants";
import { DEFAULT_SETTINGS, type Settings } from "../src/game/settings";
import type { Cell, GameState } from "../src/game/types";
// Real background pictures the user dropped in trailer/, bundled as hashed URLs
// (resolve correctly under the /sudotiles/ base — never reference by raw path).
import img1 from "./img1.jpg";
import img2 from "./img2.jpg";
import img3 from "./img3.jpg";

const PHOTOS = [img1, img2, img3];

/* Scene phases:
 *   Phase 1 (t < 3.0): the real Settings panel — walk difficulty, flip a toggle,
 *     switch Ember → Void (the subtree recolors to the greyscale palette).
 *   Phase 2 (t ≥ 3.0): "Custom" is chosen → the panel is dismissed and a Sudoku
 *     board is shown while the page background cycles through the three real
 *     uploaded pictures, exactly how the app composites a custom background
 *     (picture under a dark scrim, greyscale board palette). */
const CUSTOM_AT = 3.0;
const PHOTO_STEP = 1.2; // seconds each picture is shown

interface Look {
  settings: Settings;
  custom: boolean;
  pageBg: string | null;
}

function lookAt(t: number): Look {
  const s: Settings = { ...DEFAULT_SETTINGS };

  // Difficulty walks up.
  if (t >= 2.2) s.difficulty = "Expert";
  else if (t >= 1.1) s.difficulty = "Hard";

  // A toggle flips visibly partway through.
  s.guidesEnabled = t < 1.6;

  const custom = t >= CUSTOM_AT;
  if (custom) {
    s.theme = "custom";
    const idx = Math.min(PHOTOS.length - 1, Math.floor((t - CUSTOM_AT) / PHOTO_STEP));
    return { settings: s, custom: true, pageBg: PHOTOS[idx] };
  }
  // Ember first, then Void.
  s.theme = t >= 1.6 ? "void" : "ember";
  return { settings: s, custom: false, pageBg: null };
}

/* A near-complete board to show off behind the cycling backgrounds. */
function showcaseBoard(): Cell[] {
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const given = GIVENS[i] !== "0";
    // Fill everything (givens + the rest as player values) so it reads as a
    // lively in-progress board over the pictures.
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value: SOLUTION[i],
      error: false,
      scribbles: Array(9).fill(false),
    });
  }
  return board;
}

const BOARD_STATE: GameState = {
  board: showcaseBoard(),
  solution: SOLUTION,
  dealing: false,
  selected: 40,
  multiSelected: [],
  pencil: false,
  hintCells: [],
  started: true,
  hearts: 3,
  score: 3200,
  streak: 15,
  elapsed: 120,
  over: false,
  won: false,
  difficulty: "Expert",
};

export default function SettingsScene({ t }: { t: number }) {
  const look = useMemo(() => lookAt(t), [t]);
  // Void palette applies for the Void theme and whenever a custom picture is on
  // (the app uses the greyscale palette in both cases).
  const voidPalette = look.settings.theme === "void" || look.custom;

  return (
    <div
      className="absolute inset-0 transition-[background] duration-500"
      data-theme={voidPalette ? "void" : undefined}
      style={
        look.pageBg
          ? {
              // Picture under a dark scrim — exactly how App.tsx composites it.
              backgroundImage: `linear-gradient(rgba(8,8,10,0.72), rgba(8,8,10,0.82)), url("${look.pageBg}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { background: "var(--bg2)" }
      }
    >
      {look.custom ? (
        // Custom chosen: panel dismissed, the board shows over the pictures.
        <div className="flex h-full w-full items-center justify-center">
          <div
            key="board"
            style={{ transform: "scale(0.9)", animation: "st-rise 0.35s ease-out both" }}
          >
            <Board
              state={BOARD_STATE}
              onSelect={() => {}}
              onDragSelect={() => {}}
              animate
              guides
              tutorialStep={null}
              onTutorialNext={() => {}}
              onTutorialSkip={() => {}}
            />
          </div>
        </div>
      ) : (
        // No key — the panel stays mounted so difficulty/theme changes update in
        // place (a remounting key made it flicker its whole entrance each change).
        <SettingsModal
          open
          closing={false}
          settings={look.settings}
          customBg={null}
          onSelectDifficulty={() => {}}
          onSetNumpadPosition={() => {}}
          onSetTheme={() => {}}
          onUploadBackground={() => {}}
          onRemoveBackground={() => {}}
          onToggleLives={() => {}}
          onToggleTimer={() => {}}
          onToggleKeyboard={() => {}}
          onToggleAnimations={() => {}}
          onToggleSounds={() => {}}
          onToggleGuides={() => {}}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
