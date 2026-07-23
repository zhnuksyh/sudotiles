import { LESSONS } from "../learn/lessons";
import { K } from "./kinetic";
import type { CueSpec } from "./audio";

/* ── Scene: the library filling up ──────────────────────────────────────────
 * A recreation of the /learn/ index grid, with the real lesson names and
 * taglines, dealing itself in card by card. Reads LESSONS directly so it can
 * never drift from the page — add a lesson there and it shows up here.
 *
 * The card markup mirrors learn/Learn.tsx. It's copied rather than imported
 * because the page's card is a <button> wired to its own open/close state; the
 * trailer needs an inert, clock-driven version and the app source stays
 * untouched. */

/* Cards deal in on a fast stagger, and that's the whole motion. There is
 * deliberately NO pan: the full grid fits the 1080p frame at this card size, so
 * drifting it would animate past nothing and just read as a stray scroll. If a
 * future lesson count overflows the frame, shrink the cards rather than
 * reintroducing a pan. */
const CARD_IN = 0.24;
const CARD_STEP = 0.055;

/* Long enough for the last card to land and be read, and no longer. */
export const INDEX_DUR = 4.4;

/* A blip per card as it lands, thinned so the fast stagger reads as a rhythm
 * rather than noise, plus a chime once the grid is complete. */
export function indexCues(): CueSpec[] {
  const cues: CueSpec[] = [];
  for (let i = 0; i < LESSONS.length; i++) {
    if (i % 2 === 0) cues.push({ t: CARD_IN + i * CARD_STEP, cue: "blip" });
  }
  cues.push({ t: CARD_IN + LESSONS.length * CARD_STEP + 0.15, cue: "unit" });
  return cues;
}

/* All motion here is CSS keyframes off the scene mount, so this scene needs no
 * clock at all — it takes no props. */
export default function IndexScene() {
  /* Fluid, not fixed-size: the card grid is a normal responsive layout, so it
   * reflows to whatever the viewport is instead of being scaled by a factor tuned
   * for one frame size. That's why this scene needs no fit-to-viewport logic. */
  return (
    <div className="flex h-full w-full items-center overflow-hidden px-8">
      <div className="flex w-full flex-col items-center gap-[min(1.75rem,3vh)]">
        <div className="flex shrink-0 flex-col items-center gap-2 text-center">
          <K at={0} kind="slam" className="text-[46px] leading-none font-semibold text-[var(--ink0)]">
            Learn Advanced Techniques
          </K>
          <K
            at={0.22}
            kind="rise"
            className="max-w-[720px] text-[19px] leading-relaxed text-[var(--ink3)]"
          >
            Interactive lessons for the patterns that crack harder puzzles.
          </K>
        </div>

        <div className="grid w-full max-w-[1320px] grid-cols-3 gap-3.5">
          {LESSONS.map((l, i) => (
            <div
              key={l.id}
              className="flex h-full flex-col items-start gap-1 rounded-[18px] bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 text-left shadow-[0_10px_28px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
              style={{
                animation: `t2-drop 0.42s cubic-bezier(0.3,1.4,0.5,1) ${CARD_IN + i * CARD_STEP}s both`,
              }}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.16)] text-[13.5px] font-semibold text-[var(--accent)]">
                  {i + 1}
                </span>
                <span className="text-[19px] font-semibold text-[var(--ink1)]">{l.name}</span>
              </span>
              <span className="text-[15px] leading-relaxed text-[var(--ink3)]">{l.tagline}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* The lesson count, so the copy elsewhere never has to be hand-updated. */
export const LESSON_COUNT = LESSONS.length;
