import { useEffect } from "react";
import * as Y from "yjs";

/**
 * Yjs ↔ WebSocket bridge for collaborative editing.
 *
 * On connect, sends the full document state so late-joining peers receive
 * all prior content. After that, only incremental updates are exchanged.
 * If no peer state arrives within a short window and the document is still
 * empty, inserts initialValue (template code) — so exactly one client
 * seeds the document.
 */
export function useCollab(
  roomId: string | undefined,
  doc: Y.Doc,
  initialValue?: string,
) {
  useEffect(() => {
    const ytext = doc.getText("code");

    if (!roomId) {
      if (ytext.length === 0 && initialValue) {
        ytext.insert(0, initialValue);
      }
      return;
    }

    const isBackendSameOrigin = window.location.port === "8000";
    const httpBase = isBackendSameOrigin
      ? window.location.origin
      : "http://127.0.0.1:8000";
    const wsBase = httpBase.replace(/^http/, "ws");
    const url = `${wsBase.replace(/\/$/, "")}/ws/collab/${encodeURIComponent(
      roomId,
    )}`;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    let receivedPeerState = false;

    socket.addEventListener("open", () => {
      // Send full document state so peers joining later (or already present)
      // can merge our content into theirs.
      const fullState = Y.encodeStateAsUpdate(doc);
      socket.send(fullState);

      // If no peer has sent us their state after a short window, we are the
      // first client in the room — seed the document with the template.
      setTimeout(() => {
        if (!receivedPeerState && ytext.length === 0 && initialValue) {
          ytext.insert(0, initialValue);
        }
      }, 600);
    });

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(update);
    };

    const handleMessage = (event: MessageEvent) => {
      receivedPeerState = true;
      const data = new Uint8Array(event.data as ArrayBuffer);
      Y.applyUpdate(doc, data, socket);
    };

    socket.addEventListener("message", handleMessage);
    doc.on("update", handleUpdate);

    return () => {
      doc.off("update", handleUpdate);
      socket.removeEventListener("message", handleMessage);
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [roomId, doc, initialValue]);
}
