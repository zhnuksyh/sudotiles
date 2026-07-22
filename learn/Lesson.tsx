import { useMemo, useRef, useState } from "react";
import Board from "../src/components/Board";
import NumberPad from "../src/components/NumberPad";
import { sounds } from "../src/game/sounds";
import type { Cell, GameState } from "../src/game/types";
import type { Lesson } from "./lessons";

/* The lesson board as a GameState: givens from the puzzle string, plus the
 * pre-seeded (and learner-edited) candidate scribbles. Nothing is ever placed —
 * the whole interaction is crossing a candidate out — so no cell shows a value
 * beyond the givens. */
function buildState(
  lesson: Lesson,
  scribbles: Record<number, Set<string>>,
  selected: number | null,
  highlight: number[],
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
    hintCells: highlight,
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
  const shakeTimeout = useRef<number | undefined>(undefined);
  const noticeTimeout = useRef<number | undefined>(undefined);

  const s = lesson.steps[step];
  const highlight = s.highlight ?? lesson.pattern;
  const state = useMemo(
    () => buildState(lesson, scribbles, selected, done ? [] : highlight),
    [lesson, scribbles, selected, highlight, done],
  );

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
    // Only allow editing cells that have candidate notes (the ones in play).
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
      setDone(true);
      return;
    }

    // Any other edit is a gentle nudge back to the intended cross-out.
    shake();
    showNotice(`Cross the ${lesson.elim.digit} out of the highlighted cell`);
  };

  const isLast = step === lesson.steps.length - 1;

  return (
    <div className="flex w-full max-w-[min(560px,92vw)] flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={onBack}
          className="cursor-pointer rounded-[12px] border-none bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-[#c2bcb2] transition-[filter] duration-100 ease-in-out hover:brightness-150"
        >
          ← All techniques
        </button>
        <span className="text-[13px] font-medium text-[#7d766c]">
          {step + 1} / {lesson.steps.length}
        </span>
      </div>

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
        />
        {notice && (
          <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center">
            <div
              className="mx-6 rounded-full bg-[var(--menu0)] px-5 py-2.5 text-center text-[13px] font-medium text-[#e4e1db] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
              style={{ animation: "st-rise 0.25s ease-out both" }}
            >
              {notice}
            </div>
          </div>
        )}
      </div>

      {/* Notes-only pad: tapping a digit toggles that candidate in the selected
          cell (left-click and right-click both scribble here). */}
      <NumberPad onPlace={onScribble} onScribble={onScribble} />

      <div
        key={done ? "done" : step}
        className="w-full rounded-[18px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 shadow-[0_18px_44px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.07)_inset]"
        style={{ animation: "st-rise 0.25s ease-out both" }}
      >
        {done ? (
          <>
            <div className="mb-1 text-[15px] font-semibold text-[var(--accent)]">Nicely done</div>
            <p className="m-0 text-[12.5px] leading-relaxed text-[#c2bcb2]">
              You spotted the {lesson.name.toLowerCase()} and made the elimination it unlocks. That
              one cross-out is how these techniques chip away at a hard board. Try another, or head
              back to the game and put it to work.
            </p>
            <div className="mt-3 flex justify-end">
              <button
                onClick={onBack}
                className="cursor-pointer rounded-[10px] border-none bg-gradient-to-b from-[#e5e1d8] to-[#c9c3b8] px-4 py-1.5 text-[12.5px] font-semibold text-[#191714] transition-transform duration-100 ease-in-out hover:-translate-y-px active:translate-y-0"
              >
                Back to techniques
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-1 text-[15px] font-semibold text-[var(--accent)]">{s.title}</div>
            <p className="m-0 text-[12.5px] leading-relaxed text-[#c2bcb2]">{s.text}</p>
            {!s.awaitElim && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setStep((n) => Math.min(n + 1, lesson.steps.length - 1))}
                  className="cursor-pointer rounded-[10px] border-none bg-gradient-to-b from-[#e5e1d8] to-[#c9c3b8] px-4 py-1.5 text-[12.5px] font-semibold text-[#191714] transition-transform duration-100 ease-in-out hover:-translate-y-px active:translate-y-0"
                >
                  {isLast ? "Finish" : "Next"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
