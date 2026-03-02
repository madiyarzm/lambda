"""
Assignment routes: creation and listing within classrooms.

All endpoints are protected and use the current authenticated user.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentUser, DBSession
from app.schemas.assignment import AssignmentCreate, AssignmentRead
from app.services.assignment_service import create_assignment, list_assignments_for_classroom

router = APIRouter()


@router.get("/", response_model=list[AssignmentRead])
def list_assignments(
    current_user: CurrentUser,
    db: DBSession,
    classroom_id: UUID = Query(..., description="Classroom to list assignments for."),
) -> list[AssignmentRead]:
    """
    List assignments for a classroom that the current user can access.
    """

    try:
        assignments = list_assignments_for_classroom(db, classroom_id=classroom_id, user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return [AssignmentRead.model_validate(a) for a in assignments]


@router.post("/", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_assignment_endpoint(
    payload: AssignmentCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> AssignmentRead:
    """
    Create a new assignment in a classroom owned by the current user.
    """

    try:
        assignment = create_assignment(
            db,
            classroom_id=payload.classroom_id,
            teacher=current_user,
            title=payload.title,
            description=payload.description,
            template_code=payload.template_code,
            test_code=payload.test_code,
            due_at=payload.due_at,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return AssignmentRead.model_validate(assignment)

