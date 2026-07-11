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
  selected: number | null;
  pencil: boolean;
  guides: boolean;
  started: boolean;
  hearts: number;
  score: number;
  streak: number;
  elapsed: number;
  over: boolean;
  won: boolean;
  difficulty: string;
}
