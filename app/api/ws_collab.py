"""
WebSocket endpoint for collaborative editing (Yjs).

The server acts as a simple relay: it forwards binary Yjs updates between all
clients connected to the same room. Conflict resolution is handled on the
client by Yjs/CRDT logic.

Authentication: clients must pass a valid JWT via the `token` query parameter.
Authorisation: the room_id encodes a classroom + assignment; the user must
belong to that classroom (teacher, group member, or admin). See `ws_acl.py`.
"""

import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.config import get_settings
from app.core.collab_manager import manager
from app.core.security import decode_access_token
from app.core.ws_acl import _parse_room_id, user_can_join_room
from app.db.session import SessionLocal
from app.dependencies import AUTH_COOKIE_NAME

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/collab/{room_id}")
async def collab_websocket(
    websocket: WebSocket,
    room_id: str,
) -> None:
    """
    Collaborative editing WebSocket. Requires a valid JWT in the `token` query param
    AND the user must be a member of the classroom encoded in `room_id`.
    """
    # Cookie first (browsers send it automatically on same-origin WS), then
    # fall back to the legacy ?token= query param for older clients.
    token = websocket.cookies.get(AUTH_COOKIE_NAME) or websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Missing token")
        return

    try:
        settings = get_settings()
        payload = decode_access_token(token, settings=settings)
    except JWTError:
        await websocket.close(code=4401, reason="Invalid or expired token")
        return
    except Exception as exc:
        logger.exception("Unexpected error validating WebSocket token: %s", exc)
        await websocket.close(code=4500, reason="Internal error")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4401, reason="Invalid token payload")
        return

    db = SessionLocal()
    try:
        allowed = user_can_join_room(db, user_id=user_id, room_id=room_id)
    finally:
        db.close()
    if not allowed:
        await websocket.close(code=4403, reason="Not authorised for this room")
        return

    room_key = _parse_room_id(room_id)
    try:
        uid_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        uid_uuid = None
    classroom_id = room_key.classroom_id if room_key else None

    await manager.connect(room_id, websocket, classroom_id=classroom_id, user_id=uid_uuid)
    try:
        while True:
            data = await websocket.receive_bytes()
            await manager.broadcast(room_id, data, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    except Exception as exc:
        logger.warning("WebSocket error in room %s: %s", room_id, exc)
        manager.disconnect(room_id, websocket)
