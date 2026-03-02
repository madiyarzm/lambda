"""
Create all tables from models.

Used for development and tests. In production, use Alembic migrations.
Import app.models so all models are registered with Base.metadata.
"""

from app.db.session import Base, engine

# Import all models so they register with Base.metadata
from app.models import Assignment, Classroom, Enrollment, Submission, User  # noqa: F401


def init_db() -> None:
    """Create all tables. Safe to call if they already exist (idempotent for SQLite)."""
    Base.metadata.create_all(bind=engine)
