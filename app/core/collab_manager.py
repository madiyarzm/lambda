import logging
from collections import defaultdict
from typing import Dict, Optional, Set
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class CollabRoomManager:
    """
    In-memory room manager for collaborative editing WebSockets.

    Each room_id maps to a set of connected WebSocket clients. The server
    does not interpret Yjs updates; it simply relays binary messages between
    clients in the same room.

    Also tracks per-classroom presence (distinct user_ids connected to any
    room scoped to that classroom). Used by the "Live Now" UI.
    """

    def __init__(self) -> None:
        self._rooms: Dict[str, Set[WebSocket]] = defaultdict(set)
        # classroom_id -> {user_id -> connection count}
        self._presence: Dict[UUID, Dict[UUID, int]] = defaultdict(lambda: defaultdict(int))
        # websocket -> (classroom_id, user_id) for cleanup
        self._socket_meta: Dict[WebSocket, tuple[UUID, UUID]] = {}

    async def connect(
        self,
        room_id: str,
        websocket: WebSocket,
        classroom_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> None:
        """Accept the WebSocket and add it to the room (and presence)."""
        await websocket.accept()
        self._rooms[room_id].add(websocket)
        if classroom_id is not None and user_id is not None:
            self._presence[classroom_id][user_id] += 1
            self._socket_meta[websocket] = (classroom_id, user_id)

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket from the room and presence map."""
        clients = self._rooms.get(room_id)
        if clients:
            clients.discard(websocket)
            if not clients:
                self._rooms.pop(room_id, None)
        meta = self._socket_meta.pop(websocket, None)
        if meta is not None:
            classroom_id, user_id = meta
            users = self._presence.get(classroom_id)
            if users and user_id in users:
                users[user_id] -= 1
                if users[user_id] <= 0:
                    users.pop(user_id, None)
                if not users:
                    self._presence.pop(classroom_id, None)

    async def broadcast(self, room_id: str, data: bytes, sender: WebSocket) -> None:
        """Broadcast binary data to all clients in the room except the sender."""
        for client in list(self._rooms.get(room_id, set())):
            if client is sender:
                continue
            try:
                await client.send_bytes(data)
            except Exception as exc:
                logger.warning("Dropping unresponsive client in room %s: %s", room_id, exc)
                self.disconnect(room_id, client)

    def active_user_count(self, classroom_id: UUID) -> int:
        """Number of distinct users currently connected to any room in this classroom."""
        return len(self._presence.get(classroom_id, {}))

    def active_user_ids(self, classroom_id: UUID) -> Set[UUID]:
        """Distinct user_ids currently connected to any room in this classroom."""
        return set(self._presence.get(classroom_id, {}).keys())


manager = CollabRoomManager()
