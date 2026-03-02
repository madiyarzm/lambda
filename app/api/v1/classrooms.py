"""
Classroom routes: creation, listing, and enrollment.

These endpoints are protected and require a valid JWT.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentUser, DBSession
from app.schemas.classroom import ClassroomCreate, ClassroomRead
from app.services.classroom_service import (
    create_classroom,
    enroll_user_in_classroom,
    ensure_user_can_access_classroom,
    get_classroom_or_404,
    list_classrooms_for_user,
)

router = APIRouter()


@router.get("/", response_model=list[ClassroomRead])
def list_classrooms(current_user: CurrentUser, db: DBSession) -> list[ClassroomRead]:
    """
    List classrooms visible to the current user.

    Teachers see their own classrooms; students see classrooms they are enrolled in.
    """

    classrooms = list_classrooms_for_user(db, current_user)
    return [ClassroomRead.model_validate(c) for c in classrooms]


@router.post("/", response_model=ClassroomRead, status_code=status.HTTP_201_CREATED)
def create_classroom_endpoint(
    payload: ClassroomCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> ClassroomRead:
    """
    Create a new classroom owned by the current user.

    Only users with the 'teacher' role should typically call this in the UI.
    """

    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create classrooms")

    classroom = create_classroom(db, teacher=current_user, name=payload.name, description=payload.description)
    return ClassroomRead.model_validate(classroom)


@router.post("/{classroom_id}/enroll", response_model=ClassroomRead)
def enroll_in_classroom(
    classroom_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    invite_code: str | None = Query(default=None, description="Invite code for this classroom, if required."),
) -> ClassroomRead:
    """
    Enroll the current user into a classroom using an invite code.

    Teachers cannot enroll into their own classrooms using this endpoint.
    """

    classroom = get_classroom_or_404(db, classroom_id=classroom_id)
    try:
        enroll_user_in_classroom(db, classroom=classroom, user=current_user, invite_code=invite_code)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return ClassroomRead.model_validate(classroom)
