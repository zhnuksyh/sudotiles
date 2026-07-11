import { forwardRef, useImperativeHandle, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  life: number;
  max: number;
}

export interface ConfettiHandle {
  /** originXFrac/originYFrac are fractions (0-1) of the canvas size; both default to center-ish. */
  fire: (count: number, originXFrac?: number, originYFrac?: number) => void;
}

const COLORS = ["#d8d3ca", "#e0605f", "#5ec98a", "#5aa9f0", "#f5e9d0", "#c9a15e"];

const Confetti = forwardRef<ConfettiHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);

  const loop = () => {
    const c = canvasRef.current;
    if (!c) {
      raf.current = null;
      return;
    }
    if (c.width !== c.offsetWidth) c.width = c.offsetWidth;
    if (c.height !== c.offsetHeight) c.height = c.offsetHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    particles.current = particles.current.filter((p) => p.life < p.max);
    particles.current.forEach((p) => {
      p.life++;
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      ctx.restore();
    });
    if (particles.current.length) {
      raf.current = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, c.width, c.height);
      raf.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    fire(count, originXFrac = 0.5, originYFrac = 0.35) {
      const c = canvasRef.current;
      if (!c) return;
      const w = c.offsetWidth,
        h = c.offsetHeight;
      const ox = w * originXFrac;
      const oy = h * originYFrac;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2,
          sp = 4 + Math.random() * 8;
        particles.current.push({
          x: ox,
          y: oy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 5,
          g: 0.14 + Math.random() * 0.1,
          size: 5 + Math.random() * 7,
          color: COLORS[i % COLORS.length],
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.5,
          life: 0,
          max: 75 + Math.random() * 45,
        });
      }
      if (raf.current == null) raf.current = requestAnimationFrame(loop);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-40 h-full w-full"
    />
  );
});

Confetti.displayName = "Confetti";

export default Confetti;
