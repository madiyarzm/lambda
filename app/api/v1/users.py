"""
User routes.

Currently exposes a single authenticated endpoint to return the current user's profile.
"""

from fastapi import APIRouter

from app.dependencies import CurrentUser
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: CurrentUser) -> UserRead:
    """
    Return profile information for the authenticated user.
    """

    return UserRead.model_validate(current_user)
