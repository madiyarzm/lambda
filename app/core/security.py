"""
JWT utilities for Lambda.

We issue short-lived access tokens after successful authentication
and verify them on protected routes. Tokens are signed with a secret
key from settings; never hardcode secrets in code.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt

from app.config import Settings


ALGORITHM = "HS256"


def create_access_token(*, data: Dict[str, Any], settings: Settings, expires_minutes: int = 60) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Claims to embed in the token payload.
        settings: Application settings with secret_key.
        expires_minutes: Token lifetime in minutes.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str, settings: Settings) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Args:
        token: Encoded JWT string from Authorization header.
        settings: Application settings with secret_key.

    Returns:
        Decoded payload dictionary if token is valid.

    Raises:
        JWTError: If the token is invalid or expired.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
