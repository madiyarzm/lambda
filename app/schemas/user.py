"""
Pydantic schemas for User entity.

Used to control what user data is returned to clients.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class UserBase(BaseModel):
    """
    Base fields shared across user schemas.
    """

    email: str
    name: str
    role: str


class UserRead(UserBase):
    """
    User data returned to authenticated clients.
    """

    id: UUID
    picture_url: HttpUrl | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """
        ORM mode allows constructing this schema directly from SQLAlchemy model instances.
        """

        from_attributes = True


class TokenResponse(BaseModel):
    """
    Response schema for authentication endpoints that issue JWTs.
    """

    access_token: str
    token_type: str = "bearer"


class UserRoleUpdate(BaseModel):
    """
    Request body for updating a user's role. Admin-only.
    """

    role: str

    class Config:
        json_schema_extra = {"example": {"role": "teacher"}}

