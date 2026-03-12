"""
User model: identity from Google OAuth.

Role determines whether user can create groups/classrooms (teacher) or only
join groups and submit (student).
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    """User account; created or updated on first Google OAuth login."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    picture_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    classrooms_taught = relationship("Classroom", back_populates="teacher", foreign_keys="Classroom.teacher_id")
    groups_owned = relationship("Group", back_populates="teacher", foreign_keys="Group.teacher_id")
    group_memberships = relationship("GroupMembership", back_populates="user")
    submissions = relationship("Submission", back_populates="user")
