import type { CellView } from "../game/derive";

/* Lesson-only emphasis layers, independent of the game's own highlights: the
 * unit a technique operates in (soft wash), the pattern cells that form it
 * (blue ring), and the target cell where a candidate gets crossed out (pulsing
 * accent ring). The game never passes these. */
export type LessonHighlight = "unit" | "pattern" | "target" | undefined;

interface CellProps {
  cell: CellView;
  animate: boolean;
  tutorialTarget?: boolean;
  lessonHighlight?: LessonHighlight;
}

export default function Cell({ cell, animate, tutorialTarget, lessonHighlight }: CellProps) {
  return (
    <div
      data-cell={cell.index}
      className="relative flex aspect-square min-w-0 cursor-pointer items-center justify-center rounded-[9px] bg-[var(--cell)] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_1px_2px_rgba(0,0,0,0.35)] transition-colors duration-[120ms] ease-linear hover:bg-[var(--cell-hover)]"
    >
      {cell.isPeer && (
        <div className="absolute inset-0 rounded-[9px] bg-white/[0.045]" />
      )}
      {cell.isSame && (
        <div className="absolute inset-0 rounded-[9px] bg-white/[0.12]" />
      )}
      {cell.isError && (
        <div className="absolute inset-0 rounded-[9px] bg-[rgba(var(--error-rgb),0.15)]" />
      )}
      {lessonHighlight === "unit" && (
        <div className="absolute inset-0 rounded-[9px] bg-[rgba(var(--pattern-rgb),0.10)]" />
      )}
      {lessonHighlight === "pattern" && (
        <div className="absolute inset-0 rounded-[9px] bg-[rgba(var(--pattern-rgb),0.14)] shadow-[0_0_0_2.5px_rgba(var(--pattern-rgb),0.85)_inset]" />
      )}
      {/* Lesson target: a fixed teal, since the lesson copy calls it "the teal
          cell". Checked before the accent ring so it wins in a lesson. */}
      {lessonHighlight === "target" && (
        <div
          className="absolute inset-0 rounded-[9px] bg-[rgba(var(--lesson-target-rgb),0.16)] shadow-[0_0_0_2.5px_rgba(var(--lesson-target-rgb),0.95)_inset]"
          style={{ animation: "st-pulse 1.3s ease-in-out infinite" }}
        />
      )}
      {(tutorialTarget || cell.isHint) && lessonHighlight !== "target" && (
        <div
          className="absolute inset-0 rounded-[9px] shadow-[0_0_0_2.5px_rgba(var(--accent-rgb),0.9)_inset]"
          style={{ animation: "st-pulse 1.3s ease-in-out infinite" }}
        />
      )}
      {cell.isSelected && (
        <div className="absolute inset-0 rounded-[9px] bg-white/[0.06] shadow-[0_0_0_2px_rgba(var(--sel-rgb),0.85)_inset]" />
      )}
      {cell.isGiven && (
        <span className="relative text-[22px] font-semibold text-[var(--ink0)] sm:text-[30px]">{cell.value}</span>
      )}
      {cell.isPlayer && (
        <span
          className="relative text-[22px] font-medium text-[var(--ink3)] sm:text-[30px]"
          style={{ animation: animate ? "st-cellpop 0.28s ease-out both" : undefined }}
        >
          {cell.value}
        </span>
      )}
      {cell.isError && (
        <span
          className="relative text-[22px] font-medium text-[var(--error)] sm:text-[30px]"
          style={{ animation: animate ? "st-cellpop 0.28s ease-out both" : undefined }}
        >
          {cell.value}
        </span>
      )}
      {cell.isScrib && (
        <div className="relative box-border grid h-full w-full grid-cols-3 grid-rows-3 p-[5px]">
          {cell.scribbles.map((s, i) => (
            <div key={i} className="flex items-center justify-center text-[11px] leading-none font-normal text-[var(--ink5)]">
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
