"""
WebSocket endpoint for collaborative editing (Yjs).

The server acts as a simple relay: it forwards binary Yjs updates between all
clients connected to the same room. Conflict resolution is handled on the
client by Yjs/CRDT logic.

Authentication: clients must pass a valid JWT via the `token` query parameter.
"""

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.config import get_settings
from app.core.collab_manager import manager
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/collab/{room_id}")
async def collab_websocket(
    websocket: WebSocket,
    room_id: str,
) -> None:
    """
    Collaborative editing WebSocket. Requires a valid JWT in the `token` query param.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Missing token")
        return

    try:
        settings = get_settings()
        decode_access_token(token, settings=settings)
    except JWTError:
        await websocket.close(code=4401, reason="Invalid or expired token")
        return
    except Exception as exc:
        logger.exception("Unexpected error validating WebSocket token: %s", exc)
        await websocket.close(code=4500, reason="Internal error")
        return

    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            await manager.broadcast(room_id, data, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    except Exception as exc:
        logger.warning("WebSocket error in room %s: %s", room_id, exc)
        manager.disconnect(room_id, websocket)
