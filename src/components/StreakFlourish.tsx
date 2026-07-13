interface StreakFlourishProps {
  show: boolean;
  text: string;
  animate: boolean;
}

export default function StreakFlourish({ show, text, animate }: StreakFlourishProps) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[45] flex items-center justify-center">
      <div
        className="flex flex-col items-center gap-1.5 rounded-3xl bg-gradient-to-b from-[var(--pad0)] to-[var(--pad1)] px-10 py-[22px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
        style={{ animation: animate ? "st-pop 1.3s ease-out both" : undefined }}
      >
        <span className="text-[44px] leading-none font-bold text-[#f0eee9]">{text}</span>
        <span className="text-sm font-medium tracking-[2px] text-[#9a938a]">IN A ROW</span>
      </div>
    </div>
  );
}
