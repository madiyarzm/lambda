"""
Application-level dependency injection.

Used by FastAPI Depends() to provide DB session, config, and (later) current user.
Keeps route handlers thin and testable.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

# Type aliases for cleaner route signatures
SettingsDep = Annotated[Settings, Depends(get_settings)]
DBSession = Annotated[Session, Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_current_user_token(token: str = Depends(oauth2_scheme)) -> str:
    """
    Dependency that extracts the raw JWT token from the Authorization header.

    Returns:
        Bearer token string without the scheme prefix.
    """

    return token


def get_current_user(
    token: str = Depends(get_current_user_token),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the current authenticated user from a JWT access token.

    Raises HTTP 401 if the token is invalid or the user does not exist.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token, settings=settings)
        user_id: str | None = payload.get("sub")  # type: ignore[assignment]
        if user_id is None:
            raise credentials_exception
    except Exception:
        # Intentionally catch broad exceptions here to avoid leaking token errors.
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
