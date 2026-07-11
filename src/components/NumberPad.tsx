import type { MouseEvent } from "react";

interface NumberPadProps {
  onPlace: (n: number) => void;
  onScribble: (n: number) => void;
}

export default function NumberPad({ onPlace, onScribble }: NumberPadProps) {
  return (
    <div className="grid grid-cols-9 gap-2">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
        <button
          key={d}
          onClick={() => onPlace(d)}
          onContextMenu={(e: MouseEvent) => {
            e.preventDefault();
            onScribble(d);
          }}
          className="aspect-square cursor-pointer rounded-[14px] border-none bg-gradient-to-b from-[#262320] to-[#1c1a17] text-[23px] font-medium text-[#e4e1db] shadow-[0_2px_5px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.04)_inset] transition-[transform,filter] duration-100 ease-in-out hover:-translate-y-0.5 hover:brightness-125 active:translate-y-0 active:brightness-90"
        >
          {d}
        </button>
      ))}
    </div>
  );
}
