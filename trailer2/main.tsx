import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Reuse the app's design tokens and keyframes (--accent, st-rise, st-pulse, …)
// so this trailer looks exactly like the /learn/ page for free.
import "../src/index.css";
import "./trailer2.css";
import Trailer2 from "./Trailer2";

/* This trailer is shot in the VOID theme (the app's black & white palette), so
 * it pins data-theme itself rather than reading the user's saved setting — a
 * trailer must look the same on every machine. Setting it here, before the first
 * render, means every --ink/--accent/--cell token below resolves to the void
 * value with no flash of the warm palette.
 *
 * Note this only touches THIS page's <html>: it never writes to localStorage, so
 * the game's own saved theme is untouched. */
document.documentElement.dataset.theme = "void";

createRoot(document.getElementById("trailer2-root")!).render(
  <StrictMode>
    <Trailer2 />
  </StrictMode>,
);
