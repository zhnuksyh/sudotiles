import type { GameState } from "./types";

export const BOX_INDICES: number[][] = (() => {
  const boxes: number[][] = Array.from({ length: 9 }, () => []);
  for (let idx = 0; idx < 81; idx++) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)].push(idx);
  }
  return boxes;
})();

export interface CellView {
  index: number;
  value: string;
  isSelected: boolean;
  isPeer: boolean;
  isSame: boolean;
  isGiven: boolean;
  isError: boolean;
  isPlayer: boolean;
  isScrib: boolean;
  isHint: boolean;
  scribbles: string[];
}

export function deriveCellView(state: GameState, idx: number, guides: boolean): CellView {
  const cell = state.board[idx];
  const sel = state.selected;
  const isSelected = idx === sel || state.multiSelected.includes(idx);
  const selCell = sel != null ? state.board[sel] : null;
  const selVal = selCell ? selCell.value : "";
  const sr = sel != null ? Math.floor(sel / 9) : -1;
  const sc = sel != null ? sel % 9 : -1;

  let isPeer = false;
  let isSame = false;
  if (guides && sel != null && !isSelected) {
    const sameRow = cell.r === sr;
    const sameCol = cell.c === sc;
    const sameBox = Math.floor(cell.r / 3) === Math.floor(sr / 3) && Math.floor(cell.c / 3) === Math.floor(sc / 3);
    isPeer = sameRow || sameCol || sameBox;
    if (selVal !== "" && cell.value === selVal) isSame = true;
  }

  const hasVal = cell.value !== "";
  return {
    index: idx,
    value: cell.value,
    isSelected,
    isPeer: isPeer && !isSame,
    isSame,
    isGiven: cell.given,
    isError: hasVal && !cell.given && cell.error,
    isPlayer: hasVal && !cell.given && !cell.error,
    isScrib: !hasVal && cell.scribbles.some(Boolean),
    isHint: state.hintCells.includes(idx),
    scribbles: cell.scribbles.map((on, i) => (on ? String(i + 1) : "")),
  };
}
