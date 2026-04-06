import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  onDone?: () => void;
}

const COLORS = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
const COUNT = 60;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export const Confetti: React.FC<ConfettiProps> = ({ active, onDone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: COUNT }, () => ({
      x: rand(canvas.width * 0.2, canvas.width * 0.8),
      y: rand(canvas.height * 0.3, canvas.height * 0.6),
      r: rand(4, 9),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: rand(-4, 4),
      vy: rand(-8, -2),
      gravity: rand(0.15, 0.35),
      alpha: 1,
      spin: rand(-0.2, 0.2),
      angle: rand(0, Math.PI * 2),
    }));

    let elapsed = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed++;
      let alive = false;
      for (const p of particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (elapsed > 40) p.alpha -= 0.018;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
          ctx.restore();
        }
      }
      if (alive) {
        frameRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
};
