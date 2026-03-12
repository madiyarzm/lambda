"""
Business logic for classrooms.

Classrooms belong to a group. Access is determined by group membership:
if a user is in the group (owner or member), they can see all classrooms.
"""

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.group import Group
from app.models.user import User
from app.services.group_service import is_user_in_group


def create_classroom(
    db: Session, *, group_id: UUID, teacher: User, name: str, description: str | None
) -> Classroom:
    """
    Create a new classroom within a group.

    Only the group owner (teacher) can create classrooms.

    Raises:
        ValueError: If the group does not exist.
        PermissionError: If the user is not the group owner.
    """
    group = db.get(Group, group_id)
    if group is None:
        raise ValueError("Group not found")
    if group.teacher_id != teacher.id:
        raise PermissionError("Only the group owner can create classrooms")

    classroom = Classroom(
        group_id=group.id,
        teacher_id=teacher.id,
        name=name,
        description=description,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


def list_classrooms_for_group(db: Session, group_id: UUID, user: User) -> List[Classroom]:
    """
    List classrooms within a group that the user can access.

    Raises:
        PermissionError: If the user is not in the group.
    """
    if not is_user_in_group(db, group_id, user):
        raise PermissionError("User is not a member of this group")

    return (
        db.query(Classroom)
        .filter(Classroom.group_id == group_id)
        .order_by(Classroom.created_at.asc())
        .all()
    )


def list_classrooms_for_user(db: Session, user: User) -> List[Classroom]:
    """
    List all classrooms the user can see across all their groups.

    Returns classrooms from groups the user owns or is a member of.
    """
    from app.models.group_membership import GroupMembership

    owned_group_ids = db.query(Group.id).filter(Group.teacher_id == user.id)
    member_group_ids = (
        db.query(GroupMembership.group_id)
        .filter(GroupMembership.user_id == user.id)
    )
    all_group_ids = owned_group_ids.union(member_group_ids).subquery()

    return (
        db.query(Classroom)
        .filter(Classroom.group_id.in_(db.query(all_group_ids)))
        .order_by(Classroom.created_at.asc())
        .all()
    )


def get_classroom_or_404(db: Session, classroom_id: UUID) -> Classroom:
    """Retrieve a classroom or raise ValueError if not found."""
    classroom = db.get(Classroom, classroom_id)
    if classroom is None:
        raise ValueError("Classroom not found")
    return classroom


def ensure_user_can_access_classroom(classroom: Classroom, user: User, db: Session) -> None:
    """
    Ensure that a user has access to a classroom via group membership.

    Access is granted if:
    - user is the group owner (teacher), or
    - user is a member of the classroom's group.

    Raises:
        PermissionError: If the user cannot access the classroom.
    """
    if not is_user_in_group(db, classroom.group_id, user):
        raise PermissionError("User does not have access to this classroom")
