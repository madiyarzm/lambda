"""
Classroom model: container for assignments and enrollments.

Teacher owns the classroom; students enroll via invite code or link.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Classroom(Base):
    """Classroom created by a teacher; has many assignments and enrollments."""

    __tablename__ = "classrooms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    invite_code: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    teacher = relationship("User", back_populates="classrooms_taught", foreign_keys=[teacher_id])
    enrollments = relationship("Enrollment", back_populates="classroom", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="classroom", cascade="all, delete-orphan")
