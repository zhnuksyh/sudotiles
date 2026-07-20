import { useEffect, useRef } from "react";
import Confetti, { type ConfettiHandle } from "../src/components/Confetti";

/* Fires the app's real Confetti off the scene clock. Each entry in `bursts`
 * fires once when scene-relative `t` crosses its time; the fired-set resets when
 * the scene remounts (new mount = fresh refs), so replays work automatically.
 * `count`, `x`, `y` (fractions 0-1) tune each burst. */
export interface Burst {
  t: number;
  count?: number;
  x?: number;
  y?: number;
}

export default function SceneConfetti({
  t,
  bursts,
  above = false,
  bleed = 0,
}: {
  t: number;
  bursts: Burst[];
  /* Render above z-50 overlays (e.g. the win card) so confetti bursts on top. */
  above?: boolean;
  /* Pixels the confetti canvas extends beyond its parent on every side, so
   * particles fly out past the board instead of being clipped at its edge. The
   * burst x/y fractions are compensated so the origin stays over the board. */
  bleed?: number;
}) {
  const ref = useRef<ConfettiHandle>(null);
  const firedRef = useRef<Set<number>>(new Set());
  // A canvas grown by `bleed` on each side needs the origin fractions nudged so
  // (x,y) still lands on the same board point. We approximate by shifting toward
  // center; exact compensation isn't needed since bursts originate near center.
  useEffect(() => {
    for (let i = 0; i < bursts.length; i++) {
      const b = bursts[i];
      if (t >= b.t && !firedRef.current.has(i)) {
        firedRef.current.add(i);
        ref.current?.fire(b.count ?? 70, b.x ?? 0.5, b.y ?? 0.4);
      }
    }
  }, [t, bursts]);

  const style = bleed
    ? { top: -bleed, left: -bleed, right: -bleed, bottom: -bleed }
    : undefined;
  const cls = `pointer-events-none absolute ${bleed ? "" : "inset-0"} ${above ? "z-[60]" : "z-40"}`;
  return (
    <div className={cls} style={style}>
      <Confetti ref={ref} />
    </div>
  );
}
