import type { ReactNode } from "react";
import { CloseIcon } from "./icons";

interface GuideModalProps {
  open: boolean;
  closing: boolean;
  animate: boolean;
  onStartTutorial: () => void;
  onClose: () => void;
}

/* A tiny 3x3 example grid. Each cell is one character: a digit, "." for empty,
 * or "*" for the highlighted target cell (shown in gold). */
function MiniGrid({ cells }: { cells: string }) {
  return (
    <div
      className="grid shrink-0 grid-cols-3 overflow-hidden rounded-[8px]"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
    >
      {cells.split("").map((ch, i) => {
        const target = ch === "*";
        return (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center text-[15px] font-medium"
            style={{
              background: target ? "rgba(var(--accent-rgb),0.16)" : "linear-gradient(180deg,#222019,#191712)",
              color: target ? "var(--accent-strong)" : "#d8d3ca",
              boxShadow: "0 0 0 0.5px rgba(255,255,255,0.05) inset",
            }}
          >
            {target ? "?" : ch === "." ? "" : ch}
          </div>
        );
      })}
    </div>
  );
}

interface Technique {
  title: string;
  body: string;
  grid: string;
  caption: string;
}

const TECHNIQUES: Technique[] = [
  {
    title: "Scanning",
    body: "Look along a row, column, or box and cross off numbers that already appear. Where only one spot is left for a number, you've found it.",
    grid: "12.4*6.89",
    caption: "One empty cell, one missing number — it must be a 3.",
  },
  {
    title: "Naked single",
    body: "For a single empty cell, check its row, column, and box. If eight different numbers surround it, the ninth is the only one that fits.",
    grid: "3.759*128",
    caption: "Everything but 4 is taken, so the ? is a 4.",
  },
  {
    title: "Hidden single",
    body: "A number might fit several empty cells in a box — but if only one of them can legally take it (the others are blocked by their rows or columns), place it there.",
    grid: "*..456...",
    caption: "Only the ? cell in this box can hold the 7.",
  },
  {
    title: "Pencil marks & pairs",
    body: "Use scribbles (right-click a number, or tap the pencil) to note a cell's candidates. When two cells in a unit share the same two candidates, those numbers are locked to them — remove them from the rest of the unit.",
    grid: ".2.5*8.3.",
    caption: "Narrow the ? down by its remaining candidates.",
  },
  {
    title: "Pointing pairs",
    body: "If a number's only possible spots inside a box all sit in one row (or column), that number can be cleared from the rest of that row or column outside the box.",
    grid: "..*..*...",
    caption: "The two ? cells push the number out of the row elsewhere.",
  },
];

interface VideoLink {
  title: string;
  channel: string;
  url: string;
}

const VIDEOS: VideoLink[] = [
  {
    title: "How to Play Sudoku for Absolute Beginners",
    channel: "Step-by-step intro to the rules",
    url: "https://www.youtube.com/watch?v=kvU9_MVAiE0",
  },
  {
    title: "Learn Sudoku in Under 5 Minutes",
    channel: "A fast, no-fluff walkthrough",
    url: "https://www.youtube.com/watch?v=ySQtOr_xt8c",
  },
  {
    title: "Top Techniques for Classic Sudoku",
    channel: "Cracking the Cryptic",
    url: "https://www.youtube.com/watch?v=V38qsL1cmFs",
  },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 mb-1 text-[13px] font-semibold tracking-wide text-[var(--accent)] uppercase">
      {children}
    </div>
  );
}

export default function GuideModal({ open, closing, animate, onStartTutorial, onClose }: GuideModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      style={{
        animation: animate
          ? closing
            ? "st-fadeout 0.2s ease-in both"
            : "st-fade 0.2s ease-out both"
          : undefined,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[82vh] w-[min(92vw,440px)] flex-col overflow-y-auto rounded-[26px] bg-gradient-to-b from-[var(--panel0)] to-[var(--panel1)] p-[26px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:w-[520px] lg:w-[600px]"
        style={{
          animation: animate
            ? closing
              ? "st-fall 0.2s ease-in both"
              : "st-rise 0.28s ease-out both"
            : undefined,
        }}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-[18px] right-[18px] z-10 flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-white/[0.06] p-1.5 text-[#b3ada3] transition-[filter] duration-100 ease-in-out hover:brightness-150"
        >
          <CloseIcon />
        </button>

        <div className="mb-1 text-[22px] font-semibold text-[#ecebe8]">How to play Sudoku</div>

        <button
          onClick={onStartTutorial}
          className="mt-2 cursor-pointer rounded-[14px] border-none bg-[rgba(var(--accent-rgb),0.12)] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_0_0_1.5px_rgba(var(--accent-rgb),0.5)_inset] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-px hover:brightness-115 active:translate-y-0"
        >
          Start the interactive tutorial
        </button>

        <SectionTitle>The goal</SectionTitle>
        <p className="text-[13.5px] leading-relaxed text-[#b3ada3]">
          Fill the 9×9 grid so every <strong className="text-[#e4e1db]">row</strong>, every{" "}
          <strong className="text-[#e4e1db]">column</strong>, and every{" "}
          <strong className="text-[#e4e1db]">3×3 box</strong> contains the numbers 1 through 9 exactly
          once. No number may repeat within a row, column, or box.
        </p>

        <SectionTitle>Techniques</SectionTitle>
        <div className="flex flex-col gap-3.5">
          {TECHNIQUES.map((t) => (
            <div key={t.title} className="flex gap-3.5">
              <div className="flex flex-col items-center gap-1">
                <MiniGrid cells={t.grid} />
                <span className="max-w-[96px] text-center text-[10.5px] leading-tight text-[#7c756b]">
                  {t.caption}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-[#e4e1db]">{t.title}</div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#a49d92]">{t.body}</p>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Tips in this app</SectionTitle>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-[12.5px] leading-relaxed text-[#a49d92]">
          <li>
            Right-click a number (or tap the <span className="text-[var(--accent)]">pencil</span>) to jot
            candidate scribbles in a cell.
          </li>
          <li>
            Drag across cells to select several at once — a scribble (or erase) then applies to all
            of them.
          </li>
          <li>
            Turn on <span className="text-[var(--accent)]">Show guide</span> in Settings to highlight the
            peers and matching numbers of the selected cell.
          </li>
          <li>A correct number locks into place — it can't be erased or overwritten.</li>
          <li>Wrong answers cost a heart — build a streak of correct placements for bonus flourishes.</li>
        </ul>

        <SectionTitle>Keyboard shortcuts</SectionTitle>
        <p className="mb-2 text-[11.5px] leading-relaxed text-[#7c756b]">
          Desktop only, and can be turned off in Settings.
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            { keys: ["1", "–", "9"], desc: "Place that number in the selected cell" },
            { keys: ["Space"], desc: "Erase the selected cell" },
            { keys: ["Tab"], desc: "Enter or leave scribble (pencil) mode" },
          ].map((row) => (
            <div key={row.desc} className="flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-1">
                {row.keys.map((k, i) =>
                  k === "–" ? (
                    <span key={i} className="text-[12px] text-[#8a837a]">
                      –
                    </span>
                  ) : (
                    <kbd
                      key={i}
                      className="inline-flex min-w-[26px] items-center justify-center rounded-[7px] px-2 py-1 text-[12px] font-medium text-[#e4e1db]"
                      style={{
                        background: "linear-gradient(180deg,#2c2924,#201d19)",
                        boxShadow:
                          "0 1px 0 rgba(255,255,255,0.05) inset, 0 1px 2px rgba(0,0,0,0.4)",
                      }}
                    >
                      {k}
                    </kbd>
                  ),
                )}
              </div>
              <span className="text-[12.5px] leading-relaxed text-[#a49d92]">{row.desc}</span>
            </div>
          ))}
        </div>

        <SectionTitle>Video tutorials</SectionTitle>
        <div className="flex flex-col gap-2">
          {VIDEOS.map((v) => (
            <a
              key={v.url}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 no-underline transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-px hover:brightness-[1.12]"
              style={{
                background: "linear-gradient(180deg,#282520,#1e1b17)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "#e0605f" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="text-[13.5px] font-medium text-[#e4e1db]">{v.title}</span>
                <span className="text-[11.5px] text-[#8a837a]">{v.channel}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
