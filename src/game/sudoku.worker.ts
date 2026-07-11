/// <reference lib="webworker" />
import { makePuzzle, type Puzzle } from "./freshState";

export interface WorkerRequest {
  id: number;
  difficulty: string;
}

export interface WorkerResponse {
  id: number;
  puzzle: Puzzle;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, difficulty } = e.data;
  const puzzle = makePuzzle(difficulty);
  const response: WorkerResponse = { id, puzzle };
  self.postMessage(response);
};
