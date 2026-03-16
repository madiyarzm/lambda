import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Eraser, Trash2 } from "lucide-react";
import { useCollabDrawing } from "../hooks/useCollabDrawing";
import type { DrawingStroke } from "../hooks/useCollabDrawing";

type Tool = "pen" | "eraser";

const COLORS = [
  { value: "#e2e8f0", label: "White" },
  { value: "#38bdf8", label: "Sky" },
  { value: "#a78bfa", label: "Violet" },
  { value: "#34d399", label: "Emerald" },
  { value: "#fbbf24", label: "Amber" },
  { value: "#fb7185", label: "Rose" },
  { value: "#fb923c", label: "Orange" },
];

const WIDTHS = [
  { value: 2, label: "Thin" },
  { value: 5, label: "Medium" },
  { value: 12, label: "Thick" },
];

// Background color for eraser (matches canvas bg)
const CANVAS_BG = "#020617"; // slate-950

function renderStrokes(
  canvas: HTMLCanvasElement,
  strokes: DrawingStroke[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;

    ctx.save();
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.width;

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
    }

    const pts = stroke.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  }
}

interface DrawingCanvasProps {
  roomId?: string;
  userName?: string;
  userRole?: string;
  className?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  roomId,
  userName,
  userRole,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(WIDTHS[1].value);

  const { strokes, addStroke, clearStrokes } = useCollabDrawing(
    roomId,
    userName,
    userRole,
  );

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      renderStrokes(canvas, strokes);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render all strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderStrokes(canvas, strokes);
  }, [strokes]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const pt = getCanvasPoint(e);
      currentStrokeRef.current = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        tool,
        color,
        width: tool === "eraser" ? strokeWidth * 4 : strokeWidth,
        points: [pt],
      };
    },
    [tool, color, strokeWidth],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const pt = getCanvasPoint(e);
      currentStrokeRef.current.points.push(pt);

      // Live preview: render committed strokes + current in-progress stroke
      const canvas = canvasRef.current;
      if (canvas) {
        renderStrokes(canvas, [...strokes, currentStrokeRef.current]);
      }
    },
    [strokes],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (stroke.points.length >= 2) {
      addStroke(stroke);
    }
  }, [addStroke]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ background: CANVAS_BG }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {/* Hint when empty */}
        {strokes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-slate-700 text-sm select-none">
              Start drawing…
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-800 bg-slate-950/90 flex-wrap">
        {/* Tool buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool("pen")}
            title="Pen"
            className={`h-7 w-7 flex items-center justify-center rounded border transition-colors ${
              tool === "pen"
                ? "border-sky-500 bg-slate-900 text-sky-400"
                : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            title="Eraser"
            className={`h-7 w-7 flex items-center justify-center rounded border transition-colors ${
              tool === "eraser"
                ? "border-sky-500 bg-slate-900 text-sky-400"
                : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Color palette */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => { setColor(c.value); setTool("pen"); }}
              title={c.label}
              className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c.value && tool === "pen"
                  ? "border-sky-400 scale-110"
                  : "border-slate-700"
              }`}
              style={{ background: c.value }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setStrokeWidth(w.value)}
              title={w.label}
              className={`h-7 w-9 flex items-center justify-center rounded border transition-colors ${
                strokeWidth === w.value
                  ? "border-sky-500 bg-slate-900"
                  : "border-slate-700 bg-slate-950 hover:bg-slate-900"
              }`}
            >
              <div
                className="rounded-full bg-slate-300"
                style={{ width: Math.min(w.value * 2.5, 28), height: w.value }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Clear */}
        <button
          type="button"
          onClick={clearStrokes}
          title="Clear canvas"
          className="h-7 px-2 flex items-center gap-1 rounded border border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-red-400 hover:border-red-500/50 transition-colors text-xs"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
