import { DIFFICULTIES } from "../game/constants";
import { CloseIcon } from "./icons";

const ACTIVE_BG = "rgba(226,224,220,0.10)";
const ACTIVE_SHADOW = "0 0 0 2px rgba(214,210,203,0.55) inset";
const ACTIVE_COLOR = "#e0ddd6";
const IDLE_BG = "linear-gradient(180deg,#282520,#1e1b17)";
const IDLE_SHADOW = "0 1px 0 rgba(255,255,255,0.04) inset";
const IDLE_COLOR = "#e4e1db";

interface DifficultyModalProps {
  open: boolean;
  closing: boolean;
  current: string;
  onSelect: (label: string) => void;
  onClose: () => void;
}

export default function DifficultyModal({ open, closing, current, onSelect, onClose }: DifficultyModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
      style={{ animation: closing ? "st-fadeout 0.2s ease-in both" : "st-fade 0.2s ease-out both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-[320px] max-w-[86vw] flex-col gap-2.5 rounded-[26px] bg-gradient-to-b from-[#201e1b] to-[#161513] p-[26px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
        style={{ animation: closing ? "st-fall 0.2s ease-in both" : "st-rise 0.28s ease-out both" }}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-[18px] right-[18px] flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-white/[0.06] p-1.5 text-[#b3ada3] transition-[filter] duration-100 ease-in-out hover:brightness-150"
        >
          <CloseIcon />
        </button>
        <div className="mb-1.5 text-[20px] font-semibold text-[#ecebe8]">Difficulty</div>
        {DIFFICULTIES.map((d) => {
          const active = d.label === current;
          return (
            <button
              key={d.label}
              onClick={() => onSelect(d.label)}
              className="flex cursor-pointer flex-col gap-0.5 rounded-[14px] border-none px-4 py-[13px] text-left transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-px hover:brightness-[1.12] active:translate-y-0"
              style={{
                background: active ? ACTIVE_BG : IDLE_BG,
                boxShadow: active ? ACTIVE_SHADOW : IDLE_SHADOW,
              }}
            >
              <span className="text-[17px] font-semibold" style={{ color: active ? ACTIVE_COLOR : IDLE_COLOR }}>
                {d.label}
              </span>
              <span className="text-[12.5px] font-normal text-[#8a837a]">{d.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
