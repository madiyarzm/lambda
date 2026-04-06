"""
User routes.

Exposes endpoints for user profile and admin user management.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.dependencies import CurrentUser, DBSession, RequireAdmin
from app.models.submission import Submission
from app.models.user import User
from app.schemas.user import UserRead, UserRoleUpdate

router = APIRouter()


@router.get("/me/stats")
def get_my_stats(current_user: CurrentUser, db: DBSession) -> dict:
    """Return XP and submission stats for the authenticated user."""
    total = db.execute(
        select(func.count()).where(Submission.user_id == current_user.id)
    ).scalar() or 0
    accepted = db.execute(
        select(func.count()).where(
            Submission.user_id == current_user.id,
            Submission.status == "success",
        )
    ).scalar() or 0
    xp = accepted * 10 + (total - accepted) * 2
    return {"xp": xp, "submissions_total": total, "submissions_accepted": accepted}


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: CurrentUser) -> UserRead:
    """
    Return profile information for the authenticated user.
    """

    return UserRead.model_validate(current_user)


@router.get("/", response_model=list[UserRead])
def list_users(admin: RequireAdmin, db: DBSession) -> list[UserRead]:
    """
    Return all registered users. Admin-only.
    """

    users = db.execute(select(User).order_by(User.created_at)).scalars().all()
    return [UserRead.model_validate(u) for u in users]


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(user_id: UUID, body: UserRoleUpdate, admin: RequireAdmin, db: DBSession) -> UserRead:
    """
    Update a user's role. Admin-only. Allowed roles: teacher, student.
    """

    if body.role not in ("teacher", "student"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Role must be 'teacher' or 'student'")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = body.role
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)
