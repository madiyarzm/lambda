"""
Business logic for submissions and sandbox stub.

This module creates Submission records and, for now, simulates sandbox
execution without running any user code. Real isolation will be added
in the dedicated sandbox phase.
"""

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.classroom import Classroom
from app.models.submission import Submission
from app.models.user import User
from app.services.assignment_service import get_assignment_or_404
from app.services.classroom_service import ensure_user_can_access_classroom


def _get_classroom_from_assignment(db: Session, assignment: Assignment) -> Classroom:
    """
    Resolve the classroom for the given assignment.

    Args:
        db: Database session.
        assignment: Assignment instance with a classroom_id.

    Returns:
        Classroom instance associated with the assignment.
    """

    classroom = db.get(Classroom, assignment.classroom_id)
    if classroom is None:
        raise ValueError("Classroom not found for assignment")
    return classroom


def create_submission(
    db: Session,
    *,
    assignment_id: UUID,
    user: User,
    code: str,
) -> Submission:
    """
    Create a new submission for an assignment and simulate sandbox execution.

    Args:
        db: Database session.
        assignment_id: Target assignment identifier.
        user: Current user making the submission.
        code: Python source code submitted by the student.

    Returns:
        Persisted Submission instance with a stubbed result.

    Raises:
        PermissionError: If the user cannot access the assignment's classroom.
        ValueError: If the assignment or classroom does not exist.
    """

    assignment = get_assignment_or_404(db, assignment_id=assignment_id)
    classroom = _get_classroom_from_assignment(db, assignment)
    ensure_user_can_access_classroom(classroom, user, db)

    submission = Submission(
        assignment_id=assignment.id,
        user_id=user.id,
        code=code,
        status="success",
        result_json={
            "summary": "Sandbox execution is not yet implemented. This is a stub result.",
            "stdout": "",
            "stderr": "",
        },
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def list_submissions_for_assignment(
    db: Session, *, assignment_id: UUID, user: User
) -> List[Submission]:
    """
    List submissions for an assignment visible to the user.

    Students see only their own submissions; teachers see all submissions
    for assignments in their classrooms.
    """

    assignment = get_assignment_or_404(db, assignment_id=assignment_id)
    classroom = _get_classroom_from_assignment(db, assignment)

    # Check that user can access the classroom at all.
    ensure_user_can_access_classroom(classroom, user, db)

    query = db.query(Submission).filter(Submission.assignment_id == assignment.id)

    if user.id != classroom.teacher_id:
        query = query.filter(Submission.user_id == user.id)

    return query.order_by(Submission.submitted_at.desc()).all()


def get_submission_or_404(db: Session, submission_id: UUID, user: User) -> Submission:
    """
    Retrieve a submission that the user is allowed to see.

    Students can see only their submissions; teachers can see submissions
    for classrooms they teach.
    """

    submission = db.get(Submission, submission_id)
    if submission is None:
        raise ValueError("Submission not found")

    assignment = get_assignment_or_404(db, assignment_id=submission.assignment_id)
    classroom = _get_classroom_from_assignment(db, assignment)

    if user.id != classroom.teacher_id and user.id != submission.user_id:
        raise PermissionError("You do not have access to this submission")

    return submission

