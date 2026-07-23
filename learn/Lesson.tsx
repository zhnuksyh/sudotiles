import { useMemo, useRef, useState } from "react";
import Board from "../src/components/Board";
import NumberPad from "../src/components/NumberPad";
import { ChevronLeftIcon } from "../src/components/icons";
import { sounds } from "../src/game/sounds";
import type { Cell, GameState } from "../src/game/types";
import type { Lesson, LessonStep, LegendKind } from "./lessons";

/* The lesson board as a GameState: givens from the puzzle string, plus the
 * pre-seeded (and learner-edited) candidate scribbles. Nothing is ever placed —
 * the whole interaction is crossing a candidate out — so no cell shows a value
 * beyond the givens. */
function buildState(
  lesson: Lesson,
  scribbles: Record<number, Set<string>>,
  selected: number | null,
): GameState {
  const board: Cell[] = [];
  for (let i = 0; i < 81; i++) {
    const given = lesson.board[i] !== ".";
    const notes = scribbles[i];
    board.push({
      r: Math.floor(i / 9),
      c: i % 9,
      given,
      value: given ? lesson.board[i] : "",
      error: false,
      scribbles: Array.from({ length: 9 }, (_, d) => (notes ? notes.has(String(d + 1)) : false)),
    });
  }
  return {
    board,
    solution: lesson.board, // no solving happens; solution is unused here
    dealing: false,
    selected,
    multiSelected: selected == null ? [] : [selected],
    pencil: true, // notes-only lesson: the pad always toggles candidates
    hintCells: [],
    started: true,
    hearts: 3,
    score: 0,
    streak: 0,
    elapsed: 0,
    over: false,
    won: false,
    difficulty: "Learn",
  };
}

function seedScribbles(lesson: Lesson): Record<number, Set<string>> {
  const out: Record<number, Set<string>> = {};
  for (const [k, digits] of Object.entries(lesson.scribbles)) {
    out[Number(k)] = new Set(digits.split(""));
  }
  return out;
}

const LEGEND_SWATCH: Record<LegendKind, string> = {
  unit: "bg-[rgba(var(--pattern-rgb),0.18)] shadow-[0_0_0_1px_rgba(var(--pattern-rgb),0.5)_inset]",
  pattern: "bg-[rgba(var(--pattern-rgb),0.22)] shadow-[0_0_0_2px_rgba(var(--pattern-rgb),0.9)_inset]",
  target:
    "bg-[rgba(var(--lesson-target-rgb),0.18)] shadow-[0_0_0_2px_rgba(var(--lesson-target-rgb),0.95)_inset]",
};

function Legend({ items }: { items: NonNullable<LessonStep["legend"]> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 shrink-0 rounded-[4px] ${LEGEND_SWATCH[it.kind]}`} />
          <span className="text-[11.5px] text-[var(--ink3)]">{it.label}</span>
        </span>
      ))}
    </div>
  );
}

interface LessonProps {
  lesson: Lesson;
  onBack: () => void;
}

export default function Lesson({ lesson, onBack }: LessonProps) {
  const [step, setStep] = useState(0);
  const [scribbles, setScribbles] = useState<Record<number, Set<string>>>(() =>
    seedScribbles(lesson),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  /* Sticks once the elimination is made, even while reviewing earlier steps, so
   * the final step never asks for a cross-out that already happened. */
  const [solved, setSolved] = useState(false);
  const shakeTimeout = useRef<number | undefined>(undefined);
  const noticeTimeout = useRef<number | undefined>(undefined);

  const s = lesson.steps[step];
  const state = useMemo(() => buildState(lesson, scribbles, selected), [lesson, scribbles, selected]);

  const shake = () => {
    window.clearTimeout(shakeTimeout.current);
    setShaking(true);
    shakeTimeout.current = window.setTimeout(() => setShaking(false), 460);
  };

  const showNotice = (text: string) => {
    window.clearTimeout(noticeTimeout.current);
    setNotice(text);
    noticeTimeout.current = window.setTimeout(() => setNotice(""), 2200);
  };

  const onSelect = (i: number) => {
    if (done) return;
    setSelected(i);
  };

  // The pad toggles a candidate in the selected cell. The lesson completes when
  // the learner removes exactly the target digit from the target cell.
  const onScribble = (n: number) => {
    if (done || selected == null) return;
    const digit = String(n);
    const isElim = selected === lesson.elim.cell && digit === lesson.elim.digit;
    const notes = scribbles[selected];
    if (!notes) {
      shake();
      showNotice("Work on a cell that shows candidate notes");
      return;
    }
    const removing = notes.has(digit);

    if (isElim && removing) {
      const next = { ...scribbles, [selected]: new Set(notes) };
      next[selected].delete(digit);
      setScribbles(next);
      sounds.blip();
      setSolved(true);
      setDone(true);
      return;
    }

    shake();
    showNotice(`Cross the ${lesson.elim.digit} out of the teal cell`);
  };

  const isLast = step === lesson.steps.length - 1;

  // Move between instructions, with a soft page-turn tick on each switch.
  const goNext = () => {
    if (step >= lesson.steps.length - 1) return;
    sounds.step();
    setStep(step + 1);
  };
  const goPrev = () => {
    if (step === 0) return;
    sounds.step();
    setStep(step - 1);
  };

  /* From the completion card, drop back into the walkthrough at the final step
   * so the learner can re-read the reasoning. `solved` stays true, so the last
   * step offers "Finish" instead of waiting for a cross-out that already
   * happened, and the learner can always get back to the completion card. */
  const reviewPrev = () => {
    sounds.step();
    setDone(false);
    setStep(lesson.steps.length - 1);
  };

  const backButton = (
    <button
      onClick={onBack}
      className="flex w-fit cursor-pointer items-center gap-1 rounded-[12px] border-none bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-[var(--ink2)] transition-[filter] duration-100 ease-in-out hover:brightness-150"
    >
      <ChevronLeftIcon />
      Back
    </button>
  );

  /* The technique being studied, centred above the board so it stays visible
     while the narration scrolls through steps. */
  const boardTitle = (
    <div className="text-center text-[26px] font-semibold tracking-[0.2px] text-[var(--accent)]">
      {lesson.name}
    </div>
  );

  const boardBlock = (
    <div
      className="relative"
      style={{ animation: shaking ? "st-shake 0.45s ease-in-out" : undefined }}
    >
      <Board
        state={state}
        onSelect={onSelect}
        onDragSelect={onSelect}
        animate
        guides={false}
        tutorialStep={null}
        onTutorialNext={() => {}}
        onTutorialSkip={() => {}}
        unitCells={done ? [] : s.unit}
        patternCells={done ? [] : s.pattern}
        targetCells={done ? [] : s.target}
      />
      {notice && (
        <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center">
          <div
            className="mx-6 rounded-full bg-[var(--menu0)] px-5 py-2.5 text-center text-[13px] font-medium text-[var(--ink1)] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
            style={{ animation: "st-rise 0.25s ease-out both" }}
          >
            {notice}
          </div>
        </div>
      )}
    </div>
  );

  const narration = (
    <div
      key={done ? "done" : step}
      className="w-full rounded-[18px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 shadow-[0_18px_44px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
      style={{ animation: "st-rise 0.25s ease-out both" }}
    >
      {done ? (
        <>
          <div className="mb-1 text-[15px] font-semibold text-[var(--accent)]">Nicely done</div>
          <p className="m-0 text-[12.5px] leading-relaxed text-[var(--ink2)]">
            You spotted the {lesson.name.toLowerCase()} and made the elimination it unlocks.
          </p>

          {/* A video that teaches this same technique, for a second take on it. */}
          <div className="mt-3 mb-1 text-[11px] font-semibold tracking-[1.2px] text-[var(--ink5)] uppercase">
            Watch it explained
          </div>
          <a
            href={lesson.video.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 no-underline shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-px hover:brightness-[1.12]"
            style={{ background: "linear-gradient(180deg,var(--row0),var(--row1))" }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: "#e0605f" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[12.5px] leading-snug font-medium text-[var(--ink1)]">
                {lesson.video.title}
              </span>
              <span className="text-[11px] text-[var(--ink4)]">{lesson.video.channel}</span>
            </span>
          </a>

          {/* Same left-aligned "Back" as the step cards, stepping into the
              walkthrough to re-read how the deduction went. The elimination
              stays crossed out; only the narration rewinds. */}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={reviewPrev}
              className="flex cursor-pointer items-center gap-1 rounded-[10px] border-none bg-white/[0.06] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink2)] transition-[filter] duration-100 ease-in-out hover:brightness-150"
            >
              <ChevronLeftIcon />
              Back
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold text-[var(--accent)]">{s.title}</span>
            <span className="shrink-0 text-[11px] font-medium text-[var(--ink5)]">
              {step + 1} / {lesson.steps.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {s.text.map((p, i) => (
              <p key={i} className="m-0 text-[12.5px] leading-relaxed text-[var(--ink2)]">
                {p}
              </p>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            {/* Re-read the previous instruction; hidden on the first step but
                kept in the layout so the Next button stays right-aligned. */}
            <button
              onClick={goPrev}
              disabled={step === 0}
              className={`flex items-center gap-1 rounded-[10px] border-none bg-white/[0.06] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink2)] transition-[filter] duration-100 ease-in-out hover:brightness-150 ${
                step === 0 ? "invisible" : "cursor-pointer"
              }`}
            >
              <ChevronLeftIcon />
              Back
            </button>
            {/* Hidden on the step that waits for the cross-out — unless it's
                already been made, in which case this returns to the summary. */}
            {(!s.awaitElim || solved) && (
              <button
                onClick={isLast && solved ? () => setDone(true) : goNext}
                className="cursor-pointer rounded-[10px] border-none bg-gradient-to-b from-[var(--btn0)] to-[var(--btn1)] px-4 py-1.5 text-[12.5px] font-semibold text-[var(--btn-ink)] transition-transform duration-100 ease-in-out hover:-translate-y-px active:translate-y-0"
              >
                {isLast ? "Finish" : "Next"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const legend = !done && s.legend ? <Legend items={s.legend} /> : null;

  /* Desktop (lg): board on the left; a right column with the vertical pad on
     top and the narration below — mirrors the game's right layout. Below lg it
     collapses to a single centred column with the horizontal pad. */
  return (
    <div className="flex w-full max-w-[860px] flex-col gap-4">
      {backButton}
      <div className="flex flex-col items-center gap-4 lg:grid lg:grid-cols-[560px_260px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6">
        {/* The title owns its own grid row so the pad below can line up with the
            top of the board rather than with the title. */}
        <div className="w-full max-w-[560px] lg:col-start-1 lg:row-start-1">{boardTitle}</div>

        <div className="flex w-full max-w-[560px] flex-col items-center gap-3 lg:col-start-1 lg:row-start-2">
          {boardBlock}
          {legend}
        </div>

        {/* Right column on desktop; below the board on mobile. */}
        <div className="flex w-full max-w-[min(560px,92vw)] flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:w-[260px]">
          <div className="hidden lg:block">
            <NumberPad onPlace={onScribble} onScribble={onScribble} orientation="vertical" />
          </div>
          <div className="lg:hidden">
            <NumberPad onPlace={onScribble} onScribble={onScribble} />
          </div>
          {narration}
        </div>
      </div>
    </div>
  );
}
