import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Reuse the app's design tokens and keyframes (--accent, st-rise, st-pulse, …)
// and the real Board component, so the lessons look exactly like the game.
import "../src/index.css";
import { applyTheme, loadSettings } from "../src/game/settings";
import Learn from "./Learn";

// This page has its own entry, so it must apply the saved theme itself —
// settings live in localStorage and are shared with the game. Done before
// the first render so there's no flash of the default palette.
applyTheme(loadSettings().theme);

createRoot(document.getElementById("learn-root")!).render(
  <StrictMode>
    <Learn />
  </StrictMode>,
);
