import { applyCustomVars, clearCustomVars, loadCustomTheme } from "./customTheme";
import { DEFAULT_DIFFICULTY } from "./constants";

export type NumpadPosition = "bottom" | "right";

/* "default" is the built-in look from :root in index.css; "custom" derives a
 * palette from the user's uploaded background picture. */
export type ThemeChoice = "default" | "custom";

/* Apply the theme: the custom palette goes on as inline CSS-variable
 * overrides; the default clears them so :root shows through. */
export function applyTheme(theme: ThemeChoice): void {
  if (theme === "custom") {
    const custom = loadCustomTheme();
    if (custom) {
      applyCustomVars(custom.vars);
      return;
    }
    // stored image gone — fall through to the default
  }
  clearCustomVars();
}

export interface Settings {
  difficulty: string;
  theme: ThemeChoice;
  numpadPosition: NumpadPosition;
  livesEnabled: boolean;
  timerEnabled: boolean;
  keyboardEnabled: boolean;
  animationsEnabled: boolean;
  guidesEnabled: boolean;
  soundsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: DEFAULT_DIFFICULTY,
  theme: "default",
  numpadPosition: "bottom",
  livesEnabled: true,
  timerEnabled: true,
  keyboardEnabled: true,
  animationsEnabled: true,
  guidesEnabled: true,
  soundsEnabled: true,
};

const STORAGE_KEY = "sudotiles:settings";

/* Load persisted settings, merged over the defaults so new fields fall back
 * cleanly. Safe to call when localStorage is unavailable. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    // Map legacy named themes (ember/ocean/...) to the default look.
    if (merged.theme !== "custom") merged.theme = "default";
    return merged;
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
