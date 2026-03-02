"""
Business logic for classrooms and enrollments.

Routes should be thin and call these helpers to keep authorization and
query logic centralized and testable.
"""

import secrets
from typing import Iterable, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.user import User


def _generate_invite_code() -> str:
    """
    Generate a short invite code for classrooms.

    Returns:
        URL-safe string suitable for sharing with students.
    """

    return secrets.token_urlsafe(6)


def create_classroom(db: Session, teacher: User, name: str, description: str | None) -> Classroom:
    """
    Create a new classroom for the given teacher.

    Args:
        db: Database session.
        teacher: User who will own the classroom.
        name: Classroom name.
        description: Optional long-form description.

    Returns:
        Persisted Classroom instance.
    """

    classroom = Classroom(
        teacher_id=teacher.id,
        name=name,
        description=description,
        invite_code=_generate_invite_code(),
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


def list_classrooms_for_user(db: Session, user: User) -> List[Classroom]:
    """
    List classrooms where the user is either the teacher or enrolled as a student.

    Args:
        db: Database session.
        user: Current user.

    Returns:
        List of Classroom instances visible to this user.
    """

    # Classrooms taught by the user
    taught = db.query(Classroom).filter(Classroom.teacher_id == user.id)

    # Classrooms where the user is enrolled
    enrolled = (
        db.query(Classroom)
        .join(Enrollment, Enrollment.classroom_id == Classroom.id)
        .filter(Enrollment.user_id == user.id)
    )

    # Use set semantics via IDs to avoid duplicates.
    classrooms_by_id: dict[UUID, Classroom] = {}
    for c in taught.union(enrolled).all():
        classrooms_by_id[c.id] = c
    return list(classrooms_by_id.values())


def get_classroom_or_404(db: Session, classroom_id: UUID) -> Classroom:
    """
    Retrieve a classroom or raise ValueError if not found.

    Routes should translate this into HTTP 404.
    """

    classroom = db.get(Classroom, classroom_id)
    if classroom is None:
        raise ValueError("Classroom not found")
    return classroom


def ensure_user_can_access_classroom(classroom: Classroom, user: User, db: Session) -> None:
    """
    Ensure that a user has access to a classroom.

    Access is granted if:
    - user is the teacher of the classroom, or
    - user is enrolled in the classroom.

    Raises:
        PermissionError: If the user cannot access the classroom.
    """

    if classroom.teacher_id == user.id:
        return
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.classroom_id == classroom.id, Enrollment.user_id == user.id)
        .one_or_none()
    )
    if enrollment is None:
        raise PermissionError("User is not enrolled in this classroom")


def enroll_user_in_classroom(db: Session, classroom: Classroom, user: User, invite_code: str | None) -> Enrollment:
    """
    Enroll a user into a classroom, validating the invite code if present.

    Args:
        db: Database session.
        classroom: Target classroom.
        user: User to enroll.
        invite_code: Optional invite code for this classroom.

    Returns:
        Enrollment instance for this user and classroom.

    Raises:
        PermissionError: If the invite code is invalid.
    """

    if classroom.teacher_id == user.id:
        # Teachers implicitly have access and do not need an enrollment record.
        raise PermissionError("Teacher does not need to enroll in their own classroom")

    if classroom.invite_code and invite_code and invite_code != classroom.invite_code:
        raise PermissionError("Invalid invite code")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.classroom_id == classroom.id, Enrollment.user_id == user.id)
        .one_or_none()
    )
    if existing:
        return existing

    enrollment = Enrollment(classroom_id=classroom.id, user_id=user.id, role="student")
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment

