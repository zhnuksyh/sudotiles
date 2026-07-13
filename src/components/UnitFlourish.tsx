interface UnitFlourishProps {
  show: boolean;
  text: string;
  animate: boolean;
}

/* Brief "Row complete!" pill shown when a row, column, or box is filled. */
export default function UnitFlourish({ show, text, animate }: UnitFlourishProps) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[44] flex items-center justify-center">
      <div
        className="-translate-y-[110px] rounded-full bg-[rgba(var(--accent-rgb),0.14)] px-6 py-2.5 shadow-[0_0_0_1.5px_rgba(var(--accent-rgb),0.55)_inset,0_14px_34px_-10px_rgba(0,0,0,0.7)] backdrop-blur-[2px]"
        style={{ animation: animate ? "st-pop 1.3s ease-out both" : undefined }}
      >
        <span className="text-[17px] font-semibold tracking-wide text-[var(--accent)]">{text}</span>
      </div>
    </div>
  );
}
