import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";

export type DrawingStroke = {
  id: string;
  tool: "pen" | "eraser";
  color: string;
  width: number;
  points: { x: number; y: number }[];
};

// Wire tags: 0 = Yjs doc update, 1 = awareness update.
const TAG_DOC = 0;
const TAG_AWARENESS = 1;

/**
 * Yjs + WebSocket bridge for collaborative drawing.
 *
 * Stores drawing strokes as a Y.Array and syncs them across all connected peers.
 * Reuses the same WebSocket relay as the code collaboration.
 */
export function useCollabDrawing(
  roomId: string | undefined,
  userName?: string,
  userRole?: string,
): {
  strokes: DrawingStroke[];
  addStroke: (stroke: DrawingStroke) => void;
  clearStrokes: () => void;
} {
  const docRef = useRef<Y.Doc>(new Y.Doc());
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);

  const addStroke = (stroke: DrawingStroke) => {
    const ystrokes = docRef.current.getArray<DrawingStroke>("strokes");
    ystrokes.push([stroke]);
  };

  const clearStrokes = () => {
    const ystrokes = docRef.current.getArray<DrawingStroke>("strokes");
    docRef.current.transact(() => {
      ystrokes.delete(0, ystrokes.length);
    });
  };

  useEffect(() => {
    const doc = docRef.current;
    const ystrokes = doc.getArray<DrawingStroke>("strokes");

    const syncStrokes = () => {
      setStrokes(ystrokes.toArray());
    };

    ystrokes.observe(syncStrokes);
    syncStrokes();

    if (!roomId) {
      return () => {
        ystrokes.unobserve(syncStrokes);
      };
    }

    const aw = new Awareness(doc);

    const TEACHER_COLOR = "#22c55e";
    const STUDENT_COLORS = [
      "#38bdf8", "#a78bfa", "#fb923c", "#f472b6",
      "#facc15", "#22d3ee", "#c084fc", "#f87171",
    ];
    const myColor =
      userRole === "teacher"
        ? TEACHER_COLOR
        : STUDENT_COLORS[doc.clientID % STUDENT_COLORS.length];

    aw.setLocalStateField("user", {
      name: userName || "Anonymous",
      color: myColor,
      role: userRole || "student",
    });

    const isBackendSameOrigin = window.location.port === "8000";
    const httpBase = isBackendSameOrigin
      ? window.location.origin
      : "http://127.0.0.1:8000";
    const wsBase = httpBase.replace(/^http/, "ws");
    const url = `${wsBase.replace(/\/$/, "")}/ws/collab/${encodeURIComponent(roomId)}`;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    function taggedSend(tag: number, payload: Uint8Array) {
      const msg = new Uint8Array(1 + payload.length);
      msg[0] = tag;
      msg.set(payload, 1);
      socket.send(msg);
    }

    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    socket.addEventListener("open", () => {
      taggedSend(TAG_DOC, Y.encodeStateAsUpdate(doc));
      taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(aw, [doc.clientID]));

      heartbeatInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(aw, [doc.clientID]));
        }
      }, 15_000);
    });

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === socket || socket.readyState !== WebSocket.OPEN) return;
      taggedSend(TAG_DOC, update);
    };

    const handleAwarenessUpdate = ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      const changed = added.concat(updated, removed);
      taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(aw, changed));
    };

    const handleMessage = (event: MessageEvent) => {
      const raw = new Uint8Array(event.data as ArrayBuffer);
      if (raw.length < 2) return;
      const tag = raw[0];
      const payload = raw.slice(1);
      if (tag === TAG_DOC) {
        Y.applyUpdate(doc, payload, socket);
      } else if (tag === TAG_AWARENESS) {
        applyAwarenessUpdate(aw, payload, socket);
      }
    };

    socket.addEventListener("message", handleMessage);
    doc.on("update", handleDocUpdate);
    aw.on("update", handleAwarenessUpdate);

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      doc.off("update", handleDocUpdate);
      aw.off("update", handleAwarenessUpdate);
      socket.removeEventListener("message", handleMessage);
      ystrokes.unobserve(syncStrokes);
      aw.destroy();
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [roomId, userName, userRole]);

  return { strokes, addStroke, clearStrokes };
}
