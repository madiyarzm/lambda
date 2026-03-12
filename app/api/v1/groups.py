"""
Group routes: creation, listing, joining, and member management.

Groups are the top-level container. Students join a group via invite code
and gain access to all classrooms within it.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser, DBSession
from app.schemas.group import GroupCreate, GroupMemberRead, GroupRead, JoinGroupRequest
from app.services.group_service import (
    create_group,
    get_group_or_404,
    get_member_count,
    join_group_by_invite_code,
    list_group_members,
    list_groups_for_user,
    remove_member,
)

router = APIRouter()


def _group_to_read(group, member_count: int = 0) -> GroupRead:
    return GroupRead.model_validate(group).model_copy(update={"member_count": member_count})


@router.get("/", response_model=list[GroupRead])
def list_groups(current_user: CurrentUser, db: DBSession) -> list[GroupRead]:
    """List groups visible to the current user (owned + joined)."""
    groups = list_groups_for_user(db, current_user)
    return [_group_to_read(g, get_member_count(db, g.id)) for g in groups]


@router.post("/", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group_endpoint(
    payload: GroupCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> GroupRead:
    """Create a new group. Only teachers can create groups."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create groups")

    group = create_group(db, teacher=current_user, name=payload.name, description=payload.description)
    return _group_to_read(group, 0)


@router.get("/{group_id}", response_model=GroupRead)
def get_group(group_id: UUID, current_user: CurrentUser, db: DBSession) -> GroupRead:
    """Get group details."""
    try:
        group = get_group_or_404(db, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return _group_to_read(group, get_member_count(db, group.id))


@router.post("/join", response_model=GroupRead)
def join_group(
    payload: JoinGroupRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> GroupRead:
    """Join a group using an invite code."""
    try:
        membership = join_group_by_invite_code(db, user=current_user, invite_code=payload.invite_code)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    group = get_group_or_404(db, membership.group_id)
    return _group_to_read(group, get_member_count(db, group.id))


@router.get("/{group_id}/members", response_model=list[GroupMemberRead])
def list_members(group_id: UUID, current_user: CurrentUser, db: DBSession) -> list[GroupMemberRead]:
    """List members of a group. Only the group owner can view members."""
    try:
        group = get_group_or_404(db, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    if group.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group owner can view members")

    members = list_group_members(db, group)
    return [GroupMemberRead(**m) for m in members]


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_group_member(
    group_id: UUID,
    user_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """Remove a member from a group. Only the group owner can do this."""
    try:
        group = get_group_or_404(db, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    if group.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group owner can remove members")

    try:
        remove_member(db, group, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
