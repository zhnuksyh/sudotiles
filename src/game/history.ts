/* Solved-puzzle history, persisted in localStorage (newest first, capped). */

export interface HistoryEntry {
  date: string; // ISO timestamp of the win
  difficulty: string;
  score: number;
  elapsed: number; // seconds
  givens: string; // 81 chars, '.' for blanks — enables re-sharing
  solution: string; // 81 chars — enables showing the solved board
}

const STORAGE_KEY = "sudotiles:history";
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e != null &&
        typeof e.date === "string" &&
        typeof e.difficulty === "string" &&
        typeof e.score === "number" &&
        typeof e.elapsed === "number" &&
        typeof e.givens === "string" &&
        typeof e.solution === "string",
    );
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: HistoryEntry): void {
  try {
    const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
}
