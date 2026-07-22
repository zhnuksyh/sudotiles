import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Reuse the app's design tokens and keyframes (--accent, st-rise, st-pulse, …)
// and the real Board component, so the lessons look exactly like the game.
import "../src/index.css";
import Learn from "./Learn";

createRoot(document.getElementById("learn-root")!).render(
  <StrictMode>
    <Learn />
  </StrictMode>,
);
