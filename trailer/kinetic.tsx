import type { CSSProperties, ReactNode } from "react";

/* Entrance kinds mapped to the trailer keyframes in trailer.css. */
export type Kind = "slam" | "rise" | "drop" | "cut";

const ENTER: Record<Kind, string> = {
  slam: "tr-slam 0.34s cubic-bezier(0.2,0.9,0.2,1) both",
  rise: "tr-rise 0.28s cubic-bezier(0.2,0.9,0.2,1) both",
  drop: "tr-drop 0.36s cubic-bezier(0.3,1.4,0.5,1) both",
  cut: "tr-cut 0.12s linear both",
};

interface KProps {
  /* Scene-relative seconds at which the entrance fires. */
  at: number;
  /* Optional scene-relative seconds at which an exit fade fires. */
  until?: number;
  kind?: Kind;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/* A kinetic word/line: plays an entrance at `at` and an optional exit at
 * `until`, composed in a single `animation` shorthand so both beats run off the
 * scene mount with pure CSS — no per-frame React work. */
export function K({ at, until, kind = "rise", className, style, children }: KProps) {
  const anims = [`${ENTER[kind]} ${at}s`];
  if (until != null) anims.push(`tr-exit 0.22s ease-in ${until}s both`);
  return (
    <span
      className={className}
      style={{ display: "inline-block", animation: anims.join(", "), ...style }}
    >
      {children}
    </span>
  );
}

interface TypeLineProps {
  text: string;
  /* Scene-relative start and total reveal duration in seconds. */
  at: number;
  dur?: number;
  caret?: boolean;
  className?: string;
  style?: CSSProperties;
}

/* Reveals text left-to-right with a steps() clip-path for a mechanical
 * typewriter feel, with an optional blinking block caret trailing the line. */
export function TypeLine({ text, at, dur = 0.9, caret = true, className, style }: TypeLineProps) {
  const steps = Math.max(6, text.length);
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "baseline", ...style }}>
      <span
        style={{
          display: "inline-block",
          animation: `tr-type ${dur}s steps(${steps}) ${at}s both`,
        }}
      >
        {text}
      </span>
      {caret && (
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.5em",
            height: "1em",
            marginLeft: "0.08em",
            transform: "translateY(0.08em)",
            background: "currentColor",
            animation: `tr-caret 0.9s steps(1) ${at}s infinite both`,
          }}
        />
      )}
    </span>
  );
}
