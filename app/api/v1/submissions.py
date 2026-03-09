"""
Submission routes: create, list, get result.

Submissions store real sandbox outcome; list/get include submitter name
and human-readable status for the UI.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUser, DBSession
from app.models.user import User
from app.schemas.assignment import SubmissionCreate, SubmissionRead
from app.services.submission_service import (
    create_submission,
    get_submission_or_404,
    get_submission_status_display,
    list_submissions_for_assignment,
)

router = APIRouter()


def _submission_to_read(submission, submitter_name: str = "", submitter_email: str | None = None) -> SubmissionRead:
    """Build SubmissionRead with display fields (submitter, status_display, error_summary)."""
    status_display, error_summary = get_submission_status_display(submission)
    return SubmissionRead.model_validate(submission).model_copy(
        update={
            "submitter_name": submitter_name,
            "submitter_email": submitter_email,
            "status_display": status_display,
            "error_summary": error_summary,
        }
    )


@router.post("/", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission_endpoint(
    payload: SubmissionCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> SubmissionRead:
    """
    Create a new submission: run code in sandbox and save result.
    """
    try:
        submission = create_submission(db, assignment_id=payload.assignment_id, user=current_user, code=payload.code)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return _submission_to_read(submission, submitter_name=current_user.name or "", submitter_email=current_user.email)


@router.get("/", response_model=list[SubmissionRead])
def list_submissions_endpoint(
    current_user: CurrentUser,
    db: DBSession,
    assignment_id: UUID = Query(..., description="Assignment to list submissions for."),
) -> list[SubmissionRead]:
    """
    List submissions for an assignment with submitter and status display.
    """
    try:
        submissions = list_submissions_for_assignment(db, assignment_id=assignment_id, user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    user_ids = list({s.user_id for s in submissions})
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    return [
        _submission_to_read(
            s,
            submitter_name=users[s.user_id].name if users.get(s.user_id) else "Unknown",
            submitter_email=users[s.user_id].email if users.get(s.user_id) else None,
        )
        for s in submissions
    ]


@router.get("/{submission_id}", response_model=SubmissionRead)
def get_submission_endpoint(
    submission_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> SubmissionRead:
    """
    Get a single submission with submitter and status display.
    """
    try:
        submission = get_submission_or_404(db, submission_id=submission_id, user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    submitter = db.get(User, submission.user_id)
    return _submission_to_read(
        submission,
        submitter_name=submitter.name if submitter else "Unknown",
        submitter_email=submitter.email if submitter else None,
    )

