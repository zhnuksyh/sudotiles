import { applyCustomVars, clearCustomVars, loadCustomTheme } from "./customTheme";
import { DEFAULT_DIFFICULTY } from "./constants";

export type NumpadPosition = "bottom" | "right";

/* "ember" is the default warm look from :root in index.css, "void" the black
 * & white variant, and "custom" derives a palette from the user's uploaded
 * background picture. */
export type ThemeChoice = "ember" | "void" | "custom";

/* Apply the theme: the custom palette goes on as inline CSS-variable
 * overrides, void via the data-theme attribute, ember by clearing both so
 * :root shows through. */
export function applyTheme(theme: ThemeChoice): void {
  if (theme === "custom") {
    const custom = loadCustomTheme();
    if (custom) {
      delete document.documentElement.dataset.theme;
      applyCustomVars(custom.vars);
      return;
    }
    theme = "ember"; // stored image gone — fall back to the default
  }
  clearCustomVars();
  if (theme === "void") document.documentElement.dataset.theme = "void";
  else delete document.documentElement.dataset.theme;
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
  theme: "ember",
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
    // Map legacy/unknown theme names to the default look.
    if (!["ember", "void", "custom"].includes(merged.theme)) merged.theme = "ember";
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
