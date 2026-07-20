import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Reuse the app's design tokens and keyframes (--accent, st-rise, st-pop, …)
// so the trailer looks exactly like the product for free.
import "../src/index.css";
import "./trailer.css";
import Trailer from "./Trailer";

createRoot(document.getElementById("trailer-root")!).render(
  <StrictMode>
    <Trailer />
  </StrictMode>,
);
