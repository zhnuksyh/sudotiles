interface GameOverlayProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  animate: boolean;
  onButtonClick: () => void;
}

export default function GameOverlay({ title, subtitle, buttonLabel, animate, onButtonClick }: GameOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/[0.62] backdrop-blur-[3px]"
      style={{ animation: animate ? "st-fade 0.25s ease-out both" : undefined }}
    >
      <div
        className="flex flex-col items-center gap-3.5 rounded-[28px] bg-gradient-to-b from-[var(--panel0)] to-[var(--panel1)] px-[46px] py-[38px] shadow-[0_34px_70px_-18px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
        style={{ animation: animate ? "st-rise 0.3s ease-out both" : undefined }}
      >
        <span className="text-[30px] font-semibold text-[var(--ink0)]">{title}</span>
        <span className="text-base font-normal text-[var(--ink3)]">{subtitle}</span>
        <button
          onClick={onButtonClick}
          className="mt-1.5 cursor-pointer rounded-2xl border-none bg-gradient-to-b from-[var(--btn0)] to-[var(--btn1)] px-[30px] py-3.5 text-lg font-semibold text-[var(--btn-ink)] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)] transition-transform duration-100 ease-in-out hover:-translate-y-0.5 active:translate-y-0"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
