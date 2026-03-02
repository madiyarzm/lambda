"""
Business logic for assignments.

Routes delegate to this module to keep authorization and DB queries
in one place.
"""

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.classroom import Classroom
from app.models.user import User
from app.services.classroom_service import ensure_user_can_access_classroom, get_classroom_or_404


def create_assignment(
    db: Session,
    *,
    classroom_id: UUID,
    teacher: User,
    title: str,
    description: str | None,
    template_code: str | None,
    test_code: str | None,
    due_at,
) -> Assignment:
    """
    Create a new assignment within a classroom owned by the teacher.

    Args:
        db: Database session.
        classroom_id: Classroom identifier.
        teacher: Current user expected to be the classroom teacher.
        title: Assignment title.
        description: Optional longer description.
        template_code: Optional starter code for students.
        test_code: Optional tests or validation code.
        due_at: Optional due datetime.

    Returns:
        Persisted Assignment instance.

    Raises:
        PermissionError: If the user is not the classroom teacher.
        ValueError: If the classroom does not exist.
    """

    classroom = get_classroom_or_404(db, classroom_id=classroom_id)
    if classroom.teacher_id != teacher.id:
        raise PermissionError("Only the classroom teacher can create assignments")

    assignment = Assignment(
        classroom_id=classroom.id,
        title=title,
        description=description,
        template_code=template_code,
        test_code=test_code,
        due_at=due_at,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def list_assignments_for_classroom(db: Session, *, classroom_id: UUID, user: User) -> List[Assignment]:
    """
    List assignments for a classroom visible to the given user.

    Args:
        db: Database session.
        classroom_id: Classroom identifier.
        user: Current user for access checks.

    Returns:
        List of Assignment instances.

    Raises:
        PermissionError: If the user cannot access the classroom.
        ValueError: If the classroom does not exist.
    """

    classroom = get_classroom_or_404(db, classroom_id=classroom_id)
    ensure_user_can_access_classroom(classroom, user, db)

    return (
        db.query(Assignment)
        .filter(Assignment.classroom_id == classroom.id)
        .order_by(Assignment.created_at.asc())
        .all()
    )


def get_assignment_or_404(db: Session, assignment_id: UUID) -> Assignment:
    """
    Retrieve an assignment or raise ValueError if not found.
    """

    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise ValueError("Assignment not found")
    return assignment

