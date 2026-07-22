import { useState } from "react";
import Lesson from "./Lesson";
import { LESSONS } from "./lessons";

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
      style={{
        background:
          "radial-gradient(135% 105% at 50% 14%, var(--bg0) 0%, var(--bg1) 58%, var(--bg2) 100%)",
      }}
    >
      {lesson ? (
        <Lesson lesson={lesson} onBack={() => setOpenId(null)} />
      ) : (
        <div className="flex w-full max-w-[640px] flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="m-0 text-[26px] font-semibold text-[#ecebe8]">Learn techniques</h1>
            <p className="m-0 max-w-[440px] text-[13.5px] leading-relaxed text-[#a49d92]">
              Interactive lessons for the patterns that crack harder puzzles. Each one runs on a real
              board — spot the pattern, make the move it unlocks.
            </p>
            <a
              href={gameHref}
              className="mt-1 text-[13px] font-medium text-[var(--accent)] no-underline hover:brightness-125"
            >
              ← Back to the game
            </a>
          </div>

          {LESSONS.length === 0 ? (
            <p className="text-[13px] text-[#7d766c]">Lessons are on the way.</p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              {LESSONS.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setOpenId(l.id)}
                  className="flex cursor-pointer flex-col items-start gap-1 rounded-[18px] border-none bg-gradient-to-b from-[var(--menu0)] to-[var(--menu1)] p-4 text-left shadow-[0_10px_28px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)_inset] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.16)] text-[12px] font-semibold text-[var(--accent)]">
                      {i + 1}
                    </span>
                    <span className="text-[15.5px] font-semibold text-[#e4e1db]">{l.name}</span>
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-[#a49d92]">{l.tagline}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
