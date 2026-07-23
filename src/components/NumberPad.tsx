import type { MouseEvent } from "react";

interface NumberPadProps {
  onPlace: (n: number) => void;
  onScribble: (n: number) => void;
  orientation?: "horizontal" | "vertical";
}

const buttonClass =
  "aspect-square cursor-pointer rounded-[14px] border-none bg-gradient-to-b from-[var(--pad0)] to-[var(--pad1)] text-[19px] font-medium text-[var(--ink1)] shadow-[0_2px_5px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.04)_inset] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-125 active:translate-y-0 active:brightness-90 sm:text-[23px]";

export default function NumberPad({ onPlace, onScribble, orientation = "horizontal" }: NumberPadProps) {
  const vertical = orientation === "vertical";
  return (
    <div className={vertical ? "grid grid-cols-3 gap-2" : "grid grid-cols-9 gap-2"}>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
        <button
          key={d}
          onClick={() => onPlace(d)}
          onContextMenu={(e: MouseEvent) => {
            e.preventDefault();
            onScribble(d);
          }}
          className={buttonClass}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
