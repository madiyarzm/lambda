"""
Enrollment model: links a student to a classroom.

One enrollment per (user, classroom); required to access assignments and submit.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Enrollment(Base):
    """Student enrollment in a classroom."""

    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("classroom_id", "user_id", name="uq_enrollment_classroom_user"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    classroom = relationship("Classroom", back_populates="enrollments")
    user = relationship("User", back_populates="enrollments")
