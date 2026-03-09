import { useEffect } from "react";
import * as Y from "yjs";

/**
 * Simple Yjs/WebSocket bridge for collaborative editing.
 *
 * The server acts as a dumb relay: it forwards binary Yjs updates between
 * all clients in the same room. Yjs handles conflict resolution on the client.
 */
export function useCollab(roomId: string | undefined, doc: Y.Doc) {
  useEffect(() => {
    if (!roomId) return;

    const isBackendSameOrigin = window.location.port === "8000";
    const httpBase = isBackendSameOrigin
      ? window.location.origin
      : "http://127.0.0.1:8000";
    const wsBase = httpBase.replace(/^http/, "ws");
    const socket = new WebSocket(
      `${wsBase.replace(/\/$/, "")}/ws/collab/${encodeURIComponent(roomId)}`,
    );
    socket.binaryType = "arraybuffer";

    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(update);
    };

    const handleMessage = (event: MessageEvent) => {
      const data = new Uint8Array(event.data as ArrayBuffer);
      Y.applyUpdate(doc, data, socket);
    };

    socket.addEventListener("message", handleMessage);
    doc.on("update", handleUpdate);

    return () => {
      doc.off("update", handleUpdate);
      socket.removeEventListener("message", handleMessage);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [roomId, doc]);
}

