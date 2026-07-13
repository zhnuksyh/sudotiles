import { DEFAULT_DIFFICULTY } from "./constants";

export type NumpadPosition = "bottom" | "right";

export type ThemeId = "ember" | "ocean" | "forest" | "plum";

export interface Theme {
  id: ThemeId;
  label: string;
  /* Swatch colors shown in the settings picker. */
  accent: string;
  surface: string;
}

export const THEMES: Theme[] = [
  { id: "ember", label: "Ember", accent: "#dcb887", surface: "#211f1d" },
  { id: "ocean", label: "Ocean", accent: "#8fbedd", surface: "#1d2022" },
  { id: "forest", label: "Forest", accent: "#a9cc8b", surface: "#1e211d" },
  { id: "plum", label: "Plum", accent: "#c8a3dc", surface: "#201d22" },
];

/* Stamp the theme onto <html> so the CSS variable overrides apply. The
 * default theme removes the attribute and falls back to :root. */
export function applyTheme(theme: ThemeId): void {
  if (theme === "ember") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

export interface Settings {
  difficulty: string;
  theme: ThemeId;
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
