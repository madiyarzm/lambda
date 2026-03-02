"""
Submission routes: create, list, get result.

Uses a stubbed sandbox implementation that does not execute user code yet.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentUser, DBSession
from app.schemas.assignment import SubmissionCreate, SubmissionRead
from app.services.submission_service import (
    create_submission,
    get_submission_or_404,
    list_submissions_for_assignment,
)

router = APIRouter()


@router.post("/", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission_endpoint(
    payload: SubmissionCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> SubmissionRead:
    """
    Create a new submission for an assignment.

    For now, the sandbox result is stubbed and no user code is executed.
    """

    try:
        submission = create_submission(db, assignment_id=payload.assignment_id, user=current_user, code=payload.code)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return SubmissionRead.model_validate(submission)


@router.get("/", response_model=list[SubmissionRead])
def list_submissions_endpoint(
    current_user: CurrentUser,
    db: DBSession,
    assignment_id: UUID = Query(..., description="Assignment to list submissions for."),
) -> list[SubmissionRead]:
    """
    List submissions for an assignment.

    Students see only their own submissions; teachers see all for their classroom.
    """

    try:
        submissions = list_submissions_for_assignment(db, assignment_id=assignment_id, user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return [SubmissionRead.model_validate(s) for s in submissions]


@router.get("/{submission_id}", response_model=SubmissionRead)
def get_submission_endpoint(
    submission_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> SubmissionRead:
    """
    Retrieve a single submission, enforcing access control.
    """

    try:
        submission = get_submission_or_404(db, submission_id=submission_id, user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return SubmissionRead.model_validate(submission)

