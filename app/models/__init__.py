"""Re-export all models so Alembic and app can import from app.models."""

from app.models.assignment import Assignment
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.submission import Submission
from app.models.user import User

__all__ = ["User", "Classroom", "Enrollment", "Assignment", "Submission"]
