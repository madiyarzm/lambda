import { useEffect, useState } from "react";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";

export type PeerInfo = {
  clientId: number;
  name: string;
  color: string;
  isSelf: boolean;
};

const TEACHER_COLOR = "#22c55e"; // green-500

const STUDENT_COLORS = [
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#facc15", // yellow-400
  "#22d3ee", // cyan-400
  "#c084fc", // purple-400
  "#f87171", // red-400
];

function pickStudentColor(clientId: number): string {
  return STUDENT_COLORS[clientId % STUDENT_COLORS.length];
}

// Wire tags: 0 = Yjs doc update, 1 = awareness update.
const TAG_DOC = 0;
const TAG_AWARENESS = 1;

/**
 * Yjs + Awareness WebSocket bridge for collaborative editing.
 *
 * Returns the Awareness instance (for yCollab cursor rendering)
 * and a list of connected peers (for the presence bar).
 */
export function useCollab(
  roomId: string | undefined,
  doc: Y.Doc,
  initialValue?: string,
  userName?: string,
  userRole?: string,
): { awareness: Awareness | null; peers: PeerInfo[] } {
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [peers, setPeers] = useState<PeerInfo[]>([]);

  useEffect(() => {
    const ytext = doc.getText("code");

    if (!roomId) {
      if (ytext.length === 0 && initialValue) {
        ytext.insert(0, initialValue);
      }
      setAwareness(null);
      setPeers([]);
      return;
    }

    const aw = new Awareness(doc);
    setAwareness(aw);

    const isTeacher = userRole === "teacher";
    const myColor = isTeacher ? TEACHER_COLOR : pickStudentColor(doc.clientID);
    aw.setLocalStateField("user", {
      name: userName || "Anonymous",
      color: myColor,
      colorLight: myColor + "33",
      role: userRole || "student",
    });

    const buildPeersList = (): PeerInfo[] => {
      const states = aw.getStates();
      const list: PeerInfo[] = [];
      // Add self first.
      list.push({
        clientId: doc.clientID,
        name: (userName || "Anonymous") + " (you)",
        color: myColor,
        isSelf: true,
      });
      states.forEach((state, clientId) => {
        if (clientId === doc.clientID) return;
        const u = state.user;
        if (u) {
          list.push({
            clientId,
            name: u.name || "Peer",
            color: u.color || "#888",
            isSelf: false,
          });
        }
      });
      return list;
    };

    // Set initial peers (self).
    setPeers(buildPeersList());

    let awarenessTimer: ReturnType<typeof setTimeout> | null = null;
    const onAwarenessChange = () => {
      if (awarenessTimer) return;
      awarenessTimer = setTimeout(() => {
        awarenessTimer = null;
        setPeers(buildPeersList());
      }, 300);
    };
    aw.on("change", onAwarenessChange);

    const isBackendSameOrigin = window.location.port === "8000";
    const httpBase = isBackendSameOrigin
      ? window.location.origin
      : "http://127.0.0.1:8000";
    const wsBase = httpBase.replace(/^http/, "ws");
    const url = `${wsBase.replace(/\/$/, "")}/ws/collab/${encodeURIComponent(roomId)}`;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    let receivedPeerState = false;

    function taggedSend(tag: number, payload: Uint8Array) {
      const msg = new Uint8Array(1 + payload.length);
      msg[0] = tag;
      msg.set(payload, 1);
      socket.send(msg);
    }

    // Periodically re-broadcast our awareness state so peers don't time us
    // out (default Yjs awareness timeout is 30s).
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    socket.addEventListener("open", () => {
      taggedSend(TAG_DOC, Y.encodeStateAsUpdate(doc));
      taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(aw, [doc.clientID]));

      heartbeatInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(aw, [doc.clientID]));
        }
      }, 15_000);

      setTimeout(() => {
        if (!receivedPeerState && ytext.length === 0 && initialValue) {
          ytext.insert(0, initialValue);
        }
      }, 600);
    });

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === socket || socket.readyState !== WebSocket.OPEN) return;
      taggedSend(TAG_DOC, update);
    };

    const handleAwarenessUpdate = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    ) => {
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
        receivedPeerState = true;
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
      if (awarenessTimer) clearTimeout(awarenessTimer);
      doc.off("update", handleDocUpdate);
      aw.off("update", handleAwarenessUpdate);
      aw.off("change", onAwarenessChange);
      socket.removeEventListener("message", handleMessage);
      aw.destroy();
      setAwareness(null);
      setPeers([]);
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [roomId, doc, initialValue, userName, userRole]);

  return { awareness, peers };
}
