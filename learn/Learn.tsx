import { useState } from "react";
import { ChevronLeftIcon } from "../src/components/icons";
import { loadCustomBackground } from "../src/game/customTheme";
import { loadSettings } from "../src/game/settings";
import Lesson from "./Lesson";
import { LESSONS } from "./lessons";

/* Page background, matching the game: the user's picture under a dark scrim
 * when the custom theme is active, otherwise the themed radial gradient.
 * Read once at module load — settings can't change while this page is open. */
const customBg = loadSettings().theme === "custom" ? loadCustomBackground() : null;

const pageBackground: React.CSSProperties = customBg
  ? {
      backgroundImage: `linear-gradient(rgba(8,8,10,0.72), rgba(8,8,10,0.82)), url("${customBg}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }
  : {
      background:
        "radial-gradient(135% 105% at 50% 14%, var(--bg0) 0%, var(--bg1) 58%, var(--bg2) 100%)",
    };

/* The technique-library page: an index of lessons that opens the real Board in
 * a guided, interactive walkthrough for each. A separate HTML entry (see
 * learn/index.html) so the game page never downloads any of this. */
export default function Learn() {
  const [openId, setOpenId] = useState<string | null>(null);
  const lesson = LESSONS.find((l) => l.id === openId) ?? null;

  const gameHref = `${import.meta.env.BASE_URL}`;

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center overflow-x-hidden px-3 py-8 font-sans sm:px-6"
      style={pageBackground}
    >
      {lesson ? (
        <Lesson lesson={lesson} onBack={() => setOpenId(null)} />
      ) : (
        <div className="flex w-full max-w-[1040px] flex-col gap-6">
          {/* Top-left "Back" chevron to the game. */}
          <a
            href={gameHref}
            className="flex w-fit items-center gap-1 rounded-[12px] bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-[var(--ink2)] no-underline transition-[filter] duration-100 ease-in-out hover:brightness-150"
          >
            <ChevronLeftIcon />
            Back
          </a>

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="m-0 text-[26px] font-semibold text-[var(--ink0)]">Learn Techniques</h1>
            <p className="m-0 max-w-[440px] text-[13.5px] leading-relaxed text-[var(--ink3)]">
              Interactive lessons for the patterns that crack harder puzzles. Each one runs on a real
              board — spot the pattern, make the move it unlocks.
            </p>
          </div>

          {LESSONS.length === 0 ? (
            <p className="text-center text-[13px] text-[var(--ink5)]">Lessons are on the way.</p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LESSONS.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setOpenId(l.id)}
                  className="flex h-full cursor-pointer flex-col items-start gap-1 rounded-[18px] border-none bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 text-left shadow-[0_10px_28px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.16)] text-[12px] font-semibold text-[var(--accent)]">
                      {i + 1}
                    </span>
                    <span className="text-[15.5px] font-semibold text-[var(--ink1)]">{l.name}</span>
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-[var(--ink3)]">{l.tagline}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
