import { DEFAULT_DIFFICULTY } from "./constants";

export type NumpadPosition = "bottom" | "right";

export interface Settings {
  difficulty: string;
  numpadPosition: NumpadPosition;
  livesEnabled: boolean;
  timerEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: DEFAULT_DIFFICULTY,
  numpadPosition: "bottom",
  livesEnabled: true,
  timerEnabled: true,
};

const STORAGE_KEY = "sudotiles:settings";

/* Load persisted settings, merged over the defaults so new fields fall back
 * cleanly. Safe to call when localStorage is unavailable. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
}
