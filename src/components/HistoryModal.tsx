import { useMemo, useState } from "react";
import { loadHistory } from "../game/history";
import type { HistoryEntry } from "../game/history";
import { CloseIcon, ShareIcon } from "./icons";

interface HistoryModalProps {
  open: boolean;
  closing: boolean;
  animate: boolean;
  onShare: (givens: string, difficulty: string) => void;
  onClose: () => void;
}

function formatTime(elapsed: number) {
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/* The solved board in miniature: givens bright, player-solved cells dim. */
function MiniBoard({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="mt-2.5 grid grid-cols-9 gap-px rounded-[8px] bg-black/40 p-1">
      {entry.solution.split("").map((ch, i) => {
        const given = entry.givens[i] !== ".";
        const r = Math.floor(i / 9);
        const c = i % 9;
        const boxShade = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0;
        return (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-[3px] text-[10px] leading-none"
            style={{
              background: boxShade ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
              color: given ? "#ecebe8" : "#7f7970",
              fontWeight: given ? 600 : 400,
            }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryModal({ open, closing, animate, onShare, onClose }: HistoryModalProps) {
  // Read once per open; history only changes on a win, which closes all modals.
  const entries = useMemo(() => (open ? loadHistory() : []), [open]);
  const [expanded, setExpanded] = useState<number | null>(null);

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
        className="relative flex max-h-[86vh] w-[min(92vw,340px)] flex-col overflow-y-auto rounded-[26px] bg-gradient-to-b from-[#201e1b] to-[#161513] p-[26px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:w-[400px] lg:w-[440px]"
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

        <div className="text-[20px] font-semibold text-[#ecebe8]">History</div>
        <div className="mt-0.5 mb-3 text-[12px] text-[#8a837a]">
          {entries.length === 0
            ? "Solved puzzles will show up here."
            : "Tap a puzzle to see the solved board."}
        </div>

        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => {
            const isOpen = expanded === i;
            return (
              <div
                key={entry.date + i}
                className="rounded-[14px] px-4 py-3"
                style={{
                  background: "linear-gradient(180deg,#282520,#1e1b17)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="flex flex-1 cursor-pointer flex-col gap-0.5 border-none bg-transparent p-0 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[#e4e1db]">
                      {entry.difficulty}
                      <span className="ml-2 text-[12px] font-normal text-[#8a837a]">
                        {formatDate(entry.date)}
                      </span>
                    </span>
                    <span className="text-[12px] text-[#8a837a]">
                      {entry.score.toLocaleString()} pts · {formatTime(entry.elapsed)}
                    </span>
                  </button>
                  <button
                    onClick={() => onShare(entry.givens, entry.difficulty)}
                    title="Share this puzzle"
                    className="flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-white/[0.06] p-2 text-[#b3ada3] transition-[filter] duration-100 ease-in-out hover:brightness-150"
                  >
                    <ShareIcon />
                  </button>
                </div>
                {isOpen && <MiniBoard entry={entry} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
