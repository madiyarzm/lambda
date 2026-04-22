"""
User routes.

Exposes endpoints for user profile, stats, cosmetics, activity, and admin user management.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.dependencies import CurrentUser, DBSession, RequireAdmin
from app.models.submission import Submission
from app.models.user import User
from app.schemas.user import UserRead, UserRoleUpdate

router = APIRouter()


def _calc_xp(submissions: list) -> int:
    """Chalk XP model: +200 per fully-accepted submission, +40 per passing test case."""
    xp = 0
    for sub in submissions:
        if sub.status == "success":
            xp += 200
        result = sub.result_json or {}
        passed = result.get("passed", 0)
        xp += passed * 40
    return xp


@router.get("/me/stats")
def get_my_stats(current_user: CurrentUser, db: DBSession) -> dict:
    """Return XP and submission stats for the authenticated user."""
    submissions = (
        db.execute(select(Submission).where(Submission.user_id == current_user.id))
        .scalars()
        .all()
    )
    total = len(submissions)
    accepted = sum(1 for s in submissions if s.status == "success")
    xp = _calc_xp(submissions)

    # Persist the latest computed XP on the user record
    current_user.xp = xp
    db.commit()

    return {"xp": xp, "submissions_total": total, "submissions_accepted": accepted}


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: CurrentUser) -> UserRead:
    """Return profile information for the authenticated user."""
    return UserRead.model_validate(current_user)


# ---------------------------------------------------------------------------
# Cosmetics
# ---------------------------------------------------------------------------

class CosmeticsUpdate(BaseModel):
    cosmetics: dict


@router.get("/me/cosmetics")
def get_cosmetics(current_user: CurrentUser) -> dict:
    """Return the authenticated user's cosmetics settings."""
    return current_user.cosmetics or {}


@router.put("/me/cosmetics")
def update_cosmetics(body: CosmeticsUpdate, current_user: CurrentUser, db: DBSession) -> dict:
    """Update the authenticated user's cosmetics settings."""
    current_user.cosmetics = body.cosmetics
    db.commit()
    db.refresh(current_user)
    return current_user.cosmetics or {}


# ---------------------------------------------------------------------------
# Activity heatmap
# ---------------------------------------------------------------------------

@router.get("/me/activity")
def get_activity(current_user: CurrentUser, db: DBSession) -> dict:
    """
    Return daily submission counts for the past 90 days.
    Response: { "days": [{"date": "YYYY-MM-DD", "count": N}, ...] }
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=89)

    rows = db.execute(
        select(
            func.date_trunc("day", Submission.submitted_at).label("day"),
            func.count().label("cnt"),
        )
        .where(
            Submission.user_id == current_user.id,
            Submission.submitted_at >= since,
        )
        .group_by("day")
        .order_by("day")
    ).all()

    counts: dict[str, int] = {row.day.strftime("%Y-%m-%d"): row.cnt for row in rows}

    days = []
    for i in range(90):
        d = (since + timedelta(days=i)).strftime("%Y-%m-%d")
        days.append({"date": d, "count": counts.get(d, 0)})

    return {"days": days}


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[UserRead])
def list_users(admin: RequireAdmin, db: DBSession) -> list[UserRead]:
    """Return all registered users. Admin-only."""
    users = db.execute(select(User).order_by(User.created_at)).scalars().all()
    return [UserRead.model_validate(u) for u in users]


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(user_id: UUID, body: UserRoleUpdate, admin: RequireAdmin, db: DBSession) -> UserRead:
    """Update a user's role. Admin-only. Allowed roles: teacher, student."""
    if body.role not in ("teacher", "student"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Role must be 'teacher' or 'student'")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = body.role
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)
