interface StreakFlourishProps {
  show: boolean;
  text: string;
}

export default function StreakFlourish({ show, text }: StreakFlourishProps) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[45] flex items-center justify-center">
      <div
        className="flex flex-col items-center gap-1.5 rounded-3xl bg-gradient-to-b from-[#26241f] to-[#1a1815] px-10 py-[22px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
        style={{ animation: "st-pop 1.3s ease-out both" }}
      >
        <span className="text-[44px] leading-none font-bold text-[#f0eee9]">{text}</span>
        <span className="text-sm font-medium tracking-[2px] text-[#9a938a]">IN A ROW</span>
      </div>
    </div>
  );
}
