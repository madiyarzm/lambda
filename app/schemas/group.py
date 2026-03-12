"""
Pydantic schemas for Group and GroupMembership entities.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class GroupCreate(BaseModel):
    """Payload for creating a new group."""

    name: str
    description: str | None = None


class GroupRead(BaseModel):
    """Group representation returned to clients."""

    id: UUID
    teacher_id: UUID
    name: str
    description: str | None = None
    invite_code: str | None = None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JoinGroupRequest(BaseModel):
    """Payload for joining a group via invite code."""

    invite_code: str


class GroupMemberRead(BaseModel):
    """Member representation within a group."""

    id: UUID
    user_id: UUID
    name: str
    email: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True
