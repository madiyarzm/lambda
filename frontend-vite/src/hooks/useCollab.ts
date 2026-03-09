import { useEffect, useRef, useState } from "react";
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
};

const COLORS = [
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#34d399", // emerald-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#facc15", // yellow-400
  "#22d3ee", // cyan-400
  "#c084fc", // purple-400
];

function pickColor(clientId: number): string {
  return COLORS[clientId % COLORS.length];
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
): { awareness: Awareness | null; peers: PeerInfo[] } {
  const awarenessRef = useRef<Awareness | null>(null);
  const [peers, setPeers] = useState<PeerInfo[]>([]);

  useEffect(() => {
    const ytext = doc.getText("code");

    if (!roomId) {
      if (ytext.length === 0 && initialValue) {
        ytext.insert(0, initialValue);
      }
      awarenessRef.current = null;
      setPeers([]);
      return;
    }

    const awareness = new Awareness(doc);
    awarenessRef.current = awareness;

    const myColor = pickColor(doc.clientID);
    awareness.setLocalStateField("user", {
      name: userName || "Anonymous",
      color: myColor,
      colorLight: myColor + "33",
    });

    const onAwarenessChange = () => {
      const states = awareness.getStates();
      const list: PeerInfo[] = [];
      states.forEach((state, clientId) => {
        if (clientId === doc.clientID) return;
        const u = state.user;
        if (u) {
          list.push({ clientId, name: u.name || "Peer", color: u.color || "#888" });
        }
      });
      setPeers(list);
    };
    awareness.on("change", onAwarenessChange);

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

    socket.addEventListener("open", () => {
      taggedSend(TAG_DOC, Y.encodeStateAsUpdate(doc));
      taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(awareness, [doc.clientID]));

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
      taggedSend(TAG_AWARENESS, encodeAwarenessUpdate(awareness, changed));
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
        applyAwarenessUpdate(awareness, payload, socket);
      }
    };

    socket.addEventListener("message", handleMessage);
    doc.on("update", handleDocUpdate);
    awareness.on("update", handleAwarenessUpdate);

    return () => {
      doc.off("update", handleDocUpdate);
      awareness.off("update", handleAwarenessUpdate);
      awareness.off("change", onAwarenessChange);
      socket.removeEventListener("message", handleMessage);
      awareness.destroy();
      awarenessRef.current = null;
      setPeers([]);
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [roomId, doc, initialValue, userName]);

  return { awareness: awarenessRef.current, peers };
}
