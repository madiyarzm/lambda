"""
Pydantic schemas for Classroom and Enrollment entities.

These schemas define the shape of data exposed to the frontend.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.user import UserRead


class ClassroomBase(BaseModel):
    """
    Shared fields for classroom creation and updates.
    """

    name: str
    description: str | None = None


class ClassroomCreate(ClassroomBase):
    """
    Payload for creating a new classroom.
    """

    pass


class ClassroomRead(ClassroomBase):
    """
    Classroom representation returned to clients.
    """

    id: UUID
    teacher_id: UUID
    invite_code: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """
        Enable construction from SQLAlchemy ORM instances.
        """

        from_attributes = True


class EnrollmentRead(BaseModel):
    """
    Enrollment representation, used when listing members of a classroom.
    """

    id: UUID
    classroom_id: UUID
    user_id: UUID
    role: str
    enrolled_at: datetime

    class Config:
        """
        Enable construction from SQLAlchemy ORM instances.
        """

        from_attributes = True

