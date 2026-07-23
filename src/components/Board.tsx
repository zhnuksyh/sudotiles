import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Cell from "./Cell";
import type { LessonHighlight } from "./Cell";
import { BOX_INDICES, deriveCellView } from "../game/derive";
import { TUTORIAL_STEPS } from "../game/tutorial";
import type { GameState } from "../game/types";

interface BoardProps {
  state: GameState;
  onSelect: (index: number) => void;
  onDragSelect: (index: number) => void;
  animate: boolean;
  guides: boolean;
  tutorialStep: number | null;
  onTutorialNext: () => void;
  onTutorialSkip: () => void;
  /* Lesson-only emphasis (see Cell's LessonHighlight). The game omits these. */
  unitCells?: number[];
  patternCells?: number[];
  targetCells?: number[];
}

/* The tutorial popup card, pinned to whichever half of the board keeps it
 * clear of the step's target cell. */
function TutorialPopup({
  step,
  onNext,
  onSkip,
  animate,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  animate: boolean;
}) {
  const s = TUTORIAL_STEPS[step];
  const targetRow = s.cell != null ? Math.floor(s.cell / 9) : 8;
  const onTop = targetRow >= 5;
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div
      key={step}
      className={`absolute right-4 left-4 z-20 rounded-[18px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 shadow-[0_18px_44px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.07)_inset] ${
        onTop ? "top-4" : "bottom-4"
      }`}
      style={{ animation: animate ? "st-rise 0.25s ease-out both" : undefined }}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-[var(--accent)]">{s.title}</span>
        <span className="shrink-0 text-[11px] font-medium text-[var(--ink5)]">
          {step + 1} / {TUTORIAL_STEPS.length}
        </span>
      </div>
      <p className="m-0 text-[12.5px] leading-relaxed text-[var(--ink2)]">{s.text}</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        {!isLast && (
          <button
            onClick={onSkip}
            className="cursor-pointer rounded-[10px] border-none bg-transparent px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink4)] transition-[filter] duration-100 ease-in-out hover:brightness-140"
          >
            Skip tutorial
          </button>
        )}
        {s.cell == null && (
          <button
            onClick={onNext}
            className="cursor-pointer rounded-[10px] border-none bg-gradient-to-b from-[var(--btn0)] to-[var(--btn1)] px-4 py-1.5 text-[12.5px] font-semibold text-[var(--btn-ink)] transition-transform duration-100 ease-in-out hover:-translate-y-px active:translate-y-0"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

function cellIndexAt(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)?.closest("[data-cell]");
  if (!el) return null;
  return Number((el as HTMLElement).dataset.cell);
}

export default function Board({
  state,
  onSelect,
  onDragSelect,
  animate,
  guides,
  tutorialStep,
  onTutorialNext,
  onTutorialSkip,
  unitCells,
  patternCells,
  targetCells,
}: BoardProps) {
  const dragging = useRef(false);
  const tutorialCell = tutorialStep != null ? TUTORIAL_STEPS[tutorialStep].cell : undefined;

  // Resolve a cell's lesson emphasis, most-specific first.
  const highlightOf = (idx: number): LessonHighlight => {
    if (targetCells?.includes(idx)) return "target";
    if (patternCells?.includes(idx)) return "pattern";
    if (unitCells?.includes(idx)) return "unit";
    return undefined;
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const idx = cellIndexAt(e.clientX, e.clientY);
    if (idx == null) return;
    dragging.current = true;
    // Capture the pointer so touch drags keep firing pointermove on the grid
    // instead of being swallowed by the cell that was first touched.
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(idx);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const idx = cellIndexAt(e.clientX, e.clientY);
    if (idx != null) onDragSelect(idx);
  };

  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div className="relative box-border w-[560px] max-w-[90vw] rounded-[30px] bg-gradient-to-b from-[var(--board0)] to-[var(--board1)] p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_34px_60px_-22px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(125%_80%_at_50%_-12%,rgba(255,255,255,0.05),rgba(255,255,255,0)_52%),radial-gradient(135%_130%_at_50%_118%,rgba(0,0,0,0.45),rgba(0,0,0,0)_58%)]" />
      {state.pencil && (
        <div className="pointer-events-none absolute inset-0 z-[5] rounded-[30px] shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.7)_inset]" />
      )}
      <div
        className="relative grid touch-none grid-cols-3 gap-[9px] select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onContextMenu={(e) => e.preventDefault()}
      >
        {BOX_INDICES.map((box, bi) => (
          <div key={bi} className="grid min-w-0 grid-cols-3 gap-1">
            {box.map((idx) => (
              <Cell
                key={idx}
                cell={deriveCellView(state, idx, guides)}
                animate={animate}
                tutorialTarget={idx === tutorialCell}
                lessonHighlight={highlightOf(idx)}
              />
            ))}
          </div>
        ))}
      </div>
      {tutorialStep != null && (
        <TutorialPopup
          step={tutorialStep}
          onNext={onTutorialNext}
          onSkip={onTutorialSkip}
          animate={animate}
        />
      )}
      {state.dealing && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[30px] bg-black/55 backdrop-blur-[2px]"
          style={{ animation: animate ? "st-fade 0.2s ease-out both" : undefined }}
        >
          <span className="text-[17px] font-medium tracking-wide text-[var(--accent)]">Dealing…</span>
        </div>
      )}
    </div>
  );
}
