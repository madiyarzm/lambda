"""
Access control for collaborative WebSocket rooms.

A `room_id` encodes which classroom and assignment the room belongs to. The
relay (`app/api/ws_collab.py`) accepted any room_id from any authenticated
client, so any logged-in user could subscribe to or write into any room.
This module parses the room_id and verifies the user has membership.

Recognised room_id formats:

  "<classroom_uuid>:<assignment_uuid>:<file_id>"   — collaborative editor
  "drawing:<classroom_uuid>:<assignment_uuid>"     — collaborative drawing

Anything else is rejected. If you add a new room shape, extend `_parse_room_id`.
"""

import uuid
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.classroom import Classroom
from app.models.group_membership import GroupMembership
from app.models.user import User


@dataclass(frozen=True)
class RoomKey:
    classroom_id: uuid.UUID
    assignment_id: uuid.UUID


def _parse_uuid(s: str) -> Optional[uuid.UUID]:
    try:
        return uuid.UUID(s)
    except (ValueError, AttributeError):
        return None


def _parse_room_id(room_id: str) -> Optional[RoomKey]:
    if not room_id:
        return None
    parts = room_id.split(":")
    # editor form: <classroom>:<assignment>:<file>
    if len(parts) >= 3 and parts[0] != "drawing":
        c = _parse_uuid(parts[0])
        a = _parse_uuid(parts[1])
        if c and a:
            return RoomKey(c, a)
    # drawing form: drawing:<classroom>:<assignment>
    if len(parts) == 3 and parts[0] == "drawing":
        c = _parse_uuid(parts[1])
        a = _parse_uuid(parts[2])
        if c and a:
            return RoomKey(c, a)
    return None


def user_can_join_room(db: Session, user_id: str, room_id: str) -> bool:
    """Return True if the user is allowed in this room.

    Allowed when:
      - user is admin, OR
      - user is the classroom's teacher, OR
      - user is a member of the group that owns the classroom.

    Also verifies the assignment actually belongs to the named classroom so a
    valid (classroom, assignment) pair can't be spoofed.
    """
    uid = _parse_uuid(user_id)
    key = _parse_room_id(room_id)
    if not uid or not key:
        return False

    user = db.get(User, uid)
    if not user:
        return False
    if user.role == "admin":
        return True

    classroom = db.get(Classroom, key.classroom_id)
    if not classroom:
        return False

    assignment = db.get(Assignment, key.assignment_id)
    if not assignment or assignment.classroom_id != classroom.id:
        return False

    if classroom.teacher_id == user.id:
        return True

    membership = (
        db.query(GroupMembership)
        .filter(
            GroupMembership.group_id == classroom.group_id,
            GroupMembership.user_id == user.id,
        )
        .first()
    )
    return membership is not None
