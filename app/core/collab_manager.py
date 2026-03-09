from collections import defaultdict
from typing import Dict, Set

from fastapi import WebSocket


class CollabRoomManager:
    """
    In-memory room manager for collaborative editing WebSockets.

    Each room_id maps to a set of connected WebSocket clients. The server
    does not interpret Yjs updates; it simply relays binary messages between
    clients in the same room.
    """

    def __init__(self) -> None:
        self._rooms: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, room_id: str, websocket: WebSocket) -> None:
        """Accept the WebSocket and add it to the room."""
        await websocket.accept()
        self._rooms[room_id].add(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket from the room."""
        clients = self._rooms.get(room_id)
        if not clients:
            return
        clients.discard(websocket)
        if not clients:
            self._rooms.pop(room_id, None)

    async def broadcast(self, room_id: str, data: bytes, sender: WebSocket) -> None:
        """Broadcast binary data to all clients in the room except the sender."""
        for client in list(self._rooms.get(room_id, set())):
            if client is sender:
                continue
            try:
                await client.send_bytes(data)
            except Exception:
                # Best-effort: drop clients that cannot be written to.
                self.disconnect(room_id, client)


manager = CollabRoomManager()

