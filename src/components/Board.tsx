import Cell from "./Cell";
import { BOX_INDICES, deriveCellView } from "../game/derive";
import type { GameState } from "../game/types";

interface BoardProps {
  state: GameState;
  onSelect: (index: number) => void;
}

export default function Board({ state, onSelect }: BoardProps) {
  return (
    <div className="relative box-border w-[560px] max-w-[90vw] rounded-[30px] bg-gradient-to-b from-[#1a1917] to-[#121110] p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_34px_60px_-22px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(125%_80%_at_50%_-12%,rgba(255,255,255,0.05),rgba(255,255,255,0)_52%),radial-gradient(135%_130%_at_50%_118%,rgba(0,0,0,0.45),rgba(0,0,0,0)_58%)]" />
      {state.pencil && (
        <div className="pointer-events-none absolute inset-0 z-[5] rounded-[30px] shadow-[0_0_0_2px_rgba(224,170,96,0.7)_inset]" />
      )}
      <div className="relative grid grid-cols-3 gap-[9px]">
        {BOX_INDICES.map((box, bi) => (
          <div key={bi} className="grid min-w-0 grid-cols-3 gap-1">
            {box.map((idx) => (
              <Cell key={idx} cell={deriveCellView(state, idx)} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
