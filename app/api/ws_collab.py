"""
WebSocket endpoint for collaborative editing (Yjs).

The server acts as a simple relay: it forwards binary Yjs updates between all
clients connected to the same room. Conflict resolution is handled on the
client by Yjs/CRDT logic.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.collab_manager import manager

router = APIRouter()


@router.websocket("/ws/collab/{room_id}")
async def collab_websocket(
    websocket: WebSocket,
    room_id: str,
) -> None:
    """
    Collaborative editing WebSocket.

    Args:
        websocket: WebSocket connection.
        room_id: Logical room identifier (e.g. classroom:assignment:file).
    """

    # accept connection and add to room
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            await manager.broadcast(room_id, data, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    except Exception:
        manager.disconnect(room_id, websocket)

