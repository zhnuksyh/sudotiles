export interface Cell {
  r: number;
  c: number;
  given: boolean;
  value: string;
  error: boolean;
  scribbles: boolean[];
}

export interface GameState {
  board: Cell[];
  solution: string;
  dealing: boolean;
  selected: number | null;
  /* All selected cells (drag to multi-select); `selected` is the anchor. */
  multiSelected: number[];
  pencil: boolean;
  /* Cells a hint is currently highlighting; empty when no hint is showing. */
  hintCells: number[];
  started: boolean;
  hearts: number;
  score: number;
  streak: number;
  elapsed: number;
  over: boolean;
  won: boolean;
  difficulty: string;
}
