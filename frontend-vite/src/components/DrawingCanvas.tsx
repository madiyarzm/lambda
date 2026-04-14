import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Eraser, Trash2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useCollabDrawing } from "../hooks/useCollabDrawing";
import type { DrawingStroke, PeerCursor } from "../hooks/useCollabDrawing";

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

const CANVAS_BG = "#020617"; // slate-950

interface View {
  scale: number;
  ox: number;
  oy: number;
}

function renderStrokes(
  canvas: HTMLCanvasElement,
  strokes: DrawingStroke[],
  view: View,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);

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

  ctx.restore();
}

/** World → screen coordinate conversion for cursor overlay positioning. */
function worldToScreen(worldX: number, worldY: number, view: View) {
  return {
    x: worldX * view.scale + view.ox,
    y: worldY * view.scale + view.oy,
  };
}

interface DrawingCanvasProps {
  roomId?: string;
  userName?: string;
  userRole?: string;
  className?: string;
  /** When true, hides the "open in new tab" button (already fullscreen). */
  isFullscreen?: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  roomId,
  userName,
  userRole,
  className = "",
  isFullscreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(WIDTHS[1].value);

  // View (zoom/pan) — ref for event handlers, state for UI
  const viewRef = useRef<View>({ scale: 1, ox: 0, oy: 0 });
  const [displayScale, setDisplayScale] = useState(1);

  // Pan state
  const spaceDownRef = useRef(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Throttle for live stroke awareness updates (~30fps max)
  const lastLiveSendRef = useRef(0);

  // Keep strokes ref for use in non-reactive callbacks (wheel handler)
  const strokesRef = useRef<DrawingStroke[]>([]);
  const peerCursorsRef = useRef<PeerCursor[]>([]);

  const { strokes, addStroke, clearStrokes, updateLiveStroke, peerCursors } =
    useCollabDrawing(roomId, userName, userRole);

  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  useEffect(() => { peerCursorsRef.current = peerCursors; }, [peerCursors]);

  // Build the full stroke list to render: committed + all peers' live strokes + own live stroke
  const getAllStrokes = (ownLive: DrawingStroke | null): DrawingStroke[] => {
    const live = peerCursorsRef.current
      .map((p) => p.liveStroke)
      .filter((s): s is DrawingStroke => s !== null);
    return ownLive
      ? [...strokesRef.current, ...live, ownLive]
      : [...strokesRef.current, ...live];
  };

  // Re-render canvas when committed strokes or peer cursors change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderStrokes(canvas, getAllStrokes(currentStrokeRef.current), viewRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, peerCursors]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      renderStrokes(canvas, getAllStrokes(currentStrokeRef.current), viewRef.current);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel: scroll = pan, ctrl/meta + scroll = zoom (Miro-style)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();

      if (e.ctrlKey || e.metaKey) {
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const { scale, ox, oy } = viewRef.current;
        const factor = Math.pow(1.001, -e.deltaY);
        const newScale = Math.max(0.05, Math.min(20, scale * factor));
        const ratio = newScale / scale;
        viewRef.current = {
          scale: newScale,
          ox: cx - (cx - ox) * ratio,
          oy: cy - (cy - oy) * ratio,
        };
        setDisplayScale(newScale);
      } else {
        const { scale, ox, oy } = viewRef.current;
        viewRef.current = { scale, ox: ox - e.deltaX, oy: oy - e.deltaY };
      }

      renderStrokes(canvas, getAllStrokes(currentStrokeRef.current), viewRef.current);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Space key: toggle pan mode
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      if (!t || !(t instanceof Element)) return false;
      const tag = (t as HTMLElement).tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || (t as HTMLElement).isContentEditable;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isTypingTarget(e.target)) {
        e.preventDefault();
        spaceDownRef.current = true;
        setIsPanMode(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTypingTarget(e.target)) {
        spaceDownRef.current = false;
        panStartRef.current = null;
        setIsPanMode(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getWorldPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { scale, ox, oy } = viewRef.current;
    return {
      x: (e.clientX - rect.left - ox) / scale,
      y: (e.clientY - rect.top - oy) / scale,
    };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || (e.button === 0 && spaceDownRef.current)) {
        e.currentTarget.setPointerCapture(e.pointerId);
        panStartRef.current = {
          x: e.clientX, y: e.clientY,
          ox: viewRef.current.ox, oy: viewRef.current.oy,
        };
        setIsPanning(true);
        return;
      }
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const pt = getWorldPoint(e);
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
      if (panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        viewRef.current = {
          ...viewRef.current,
          ox: panStartRef.current.ox + dx,
          oy: panStartRef.current.oy + dy,
        };
        const canvas = canvasRef.current;
        if (canvas) renderStrokes(canvas, getAllStrokes(null), viewRef.current);
        return;
      }

      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const pt = getWorldPoint(e);
      currentStrokeRef.current.points.push(pt);

      // Local preview at full frame rate
      const canvas = canvasRef.current;
      if (canvas) renderStrokes(canvas, getAllStrokes(currentStrokeRef.current), viewRef.current);

      // Broadcast live stroke to peers at ~30fps
      const now = Date.now();
      if (now - lastLiveSendRef.current > 33) {
        lastLiveSendRef.current = now;
        updateLiveStroke(currentStrokeRef.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateLiveStroke],
  );

  const handlePointerUp = useCallback(() => {
    if (panStartRef.current) {
      panStartRef.current = null;
      setIsPanning(false);
      return;
    }
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    // Commit the stroke FIRST so the Yjs doc update (TAG_DOC) is sent before
    // the awareness null (TAG_AWARENESS). Peers receive the committed stroke
    // before the live preview disappears, eliminating the erasure flicker.
    if (stroke.points.length >= 2) {
      addStroke(stroke);
    }
    updateLiveStroke(null);
  }, [addStroke, updateLiveStroke]);

  const zoom = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { scale, ox, oy } = viewRef.current;
    const newScale = Math.max(0.05, Math.min(20, scale * factor));
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const ratio = newScale / scale;
    viewRef.current = { scale: newScale, ox: cx - (cx - ox) * ratio, oy: cy - (cy - oy) * ratio };
    setDisplayScale(newScale);
    renderStrokes(canvas, getAllStrokes(currentStrokeRef.current), viewRef.current);
  };

  const resetView = () => {
    viewRef.current = { scale: 1, ox: 0, oy: 0 };
    setDisplayScale(1);
    const canvas = canvasRef.current;
    if (canvas) renderStrokes(canvas, getAllStrokes(currentStrokeRef.current), viewRef.current);
  };

  const handleOpenFullscreen = () => {
    if (!roomId) return;
    const url = `/draw/${encodeURIComponent(roomId)}?name=${encodeURIComponent(userName || "")}&role=${encodeURIComponent(userRole || "")}`;
    window.open(url, "_blank");
  };

  const cursor = isPanning
    ? "grabbing"
    : isPanMode
    ? "grab"
    : tool === "eraser"
    ? "cell"
    : "crosshair";

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
          style={{ cursor }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Empty hint */}
        {strokes.length === 0 && peerCursors.every((p) => !p.liveStroke) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-slate-700 text-sm select-none">
              Start drawing…
            </span>
          </div>
        )}

        {/* Peer cursor labels — rendered as HTML over the canvas */}
        {peerCursors.map((peer) => {
          if (!peer.liveStroke || peer.liveStroke.points.length === 0) return null;
          const pts = peer.liveStroke.points;
          const lastPt = pts[pts.length - 1];
          const screen = worldToScreen(lastPt.x, lastPt.y, viewRef.current);
          return (
            <div
              key={peer.clientId}
              className="absolute pointer-events-none flex items-center gap-1 whitespace-nowrap"
              style={{ left: screen.x + 8, top: screen.y + 8 }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
                style={{ background: peer.color }}
              />
              <span
                className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: peer.color + "22", color: peer.color, border: `1px solid ${peer.color}44` }}
              >
                {peer.name}
              </span>
            </div>
          );
        })}

        {/* Zoom controls overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-0.5 bg-slate-950/80 border border-slate-700 rounded-md px-1 py-0.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => zoom(1 / 1.25)}
            className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="px-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 min-w-[3.5rem] text-center transition-colors"
            title="Reset view"
          >
            {Math.round(displayScale * 100)}%
          </button>
          <button
            type="button"
            onClick={() => zoom(1.25)}
            className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Pan mode hint */}
        {isPanMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-[11px] text-slate-400 pointer-events-none select-none backdrop-blur-sm">
            Hold Space + drag to pan
          </div>
        )}

        {/* Connected peers indicator */}
        {peerCursors.length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-950/80 border border-slate-700 rounded-md px-2 py-1 backdrop-blur-sm">
            {peerCursors.map((peer) => (
              <div
                key={peer.clientId}
                className="flex items-center gap-1"
                title={peer.name}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: peer.color }}
                />
                <span className="text-[10px] text-slate-400 max-w-[5rem] truncate">
                  {peer.name}
                </span>
              </div>
            ))}
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

        {/* Open fullscreen */}
        {!isFullscreen && roomId && (
          <>
            <div className="w-px h-5 bg-slate-800" />
            <button
              type="button"
              onClick={handleOpenFullscreen}
              title="Open in new tab"
              className="h-7 px-2 flex items-center gap-1 rounded border border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-sky-400 hover:border-sky-500/50 transition-colors text-xs ml-auto"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Fullscreen</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
