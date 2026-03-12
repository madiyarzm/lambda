"""
Classroom routes: creation and listing within groups.

Classrooms belong to a group. Access is controlled through group membership.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUser, DBSession
from app.schemas.classroom import ClassroomCreate, ClassroomRead
from app.services.classroom_service import (
    create_classroom,
    list_classrooms_for_group,
    list_classrooms_for_user,
)

router = APIRouter()


@router.get("/", response_model=list[ClassroomRead])
def list_classrooms(
    current_user: CurrentUser,
    db: DBSession,
    group_id: UUID | None = Query(default=None, description="Filter classrooms by group."),
) -> list[ClassroomRead]:
    """
    List classrooms visible to the current user.

    If group_id is provided, returns classrooms for that group only.
    Otherwise returns all classrooms across all groups the user belongs to.
    """
    try:
        if group_id:
            classrooms = list_classrooms_for_group(db, group_id=group_id, user=current_user)
        else:
            classrooms = list_classrooms_for_user(db, current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    return [ClassroomRead.model_validate(c) for c in classrooms]


@router.post("/", response_model=ClassroomRead, status_code=status.HTTP_201_CREATED)
def create_classroom_endpoint(
    payload: ClassroomCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> ClassroomRead:
    """
    Create a new classroom within a group.

    Only the group owner (teacher) can create classrooms.
    """
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create classrooms")

    try:
        classroom = create_classroom(
            db,
            group_id=payload.group_id,
            teacher=current_user,
            name=payload.name,
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    return ClassroomRead.model_validate(classroom)
