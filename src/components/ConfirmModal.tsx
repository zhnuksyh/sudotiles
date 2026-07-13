import { CloseIcon } from "./icons";

const IDLE_BG = "linear-gradient(180deg,var(--row0),var(--row1))";
const IDLE_SHADOW = "0 1px 0 rgba(255,255,255,0.04) inset";

interface ConfirmModalProps {
  open: boolean;
  closing: boolean;
  animate: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({ open, closing, animate, onConfirm, onClose }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
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
        className="relative flex w-[320px] max-w-[86vw] flex-col gap-2.5 rounded-[26px] bg-gradient-to-b from-[var(--panel0)] to-[var(--panel1)] p-[26px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
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
          className="absolute top-[18px] right-[18px] flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-white/[0.06] p-1.5 text-[#b3ada3] transition-[filter] duration-100 ease-in-out hover:brightness-150"
        >
          <CloseIcon />
        </button>
        <div className="text-[20px] font-semibold text-[#ecebe8]">Start a new puzzle?</div>
        <p className="mb-2 text-[13.5px] leading-relaxed text-[#8a837a]">
          Your current board, streak, and score will be cleared, and a fresh puzzle will be dealt.
        </p>
        <button
          onClick={onConfirm}
          className="cursor-pointer rounded-2xl border-none bg-gradient-to-b from-[#e5e1d8] to-[#c9c3b8] px-[30px] py-3 text-base font-semibold text-[#191714] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)] transition-transform duration-100 ease-in-out hover:-translate-y-0.5 active:translate-y-0"
        >
          New puzzle
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-2xl border-none px-[30px] py-3 text-base font-medium text-[#c2bcb2] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-125 active:translate-y-0"
          style={{ background: IDLE_BG, boxShadow: IDLE_SHADOW }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
