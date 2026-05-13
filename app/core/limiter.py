"""
Rate limiter shared across the app.

Northflank (and most managed PaaS) terminates TLS at a proxy and forwards
requests to your container. The proxy adds the real client IP to
`X-Forwarded-For`; `request.client.host` only sees the proxy. Without
honouring X-F-F, every user collapses into one bucket and limits become
useless behind the proxy.

We trust X-F-F outside of development. In dev, fall back to the socket IP
so curl from localhost still gets a real key.

Two key functions are exported:
  * ``client_ip``  — keys by real client IP (good for anonymous endpoints)
  * ``user_or_ip`` — keys by authenticated user id when a JWT is present,
    falls back to client IP. Used for create endpoints that should be
    measured per-account rather than per-IP (e.g. classroom creation,
    AI hint requests — limiting per-IP would let one user behind a NAT
    starve others, and would let a single user with two networks avoid
    the cap).
"""

import logging
from typing import Optional

from fastapi import Request
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings
from app.core.security import ALGORITHM

logger = logging.getLogger(__name__)


def client_ip(request: Request) -> str:
    """Return the real client IP, honouring X-Forwarded-For behind a proxy."""
    settings = get_settings()
    if settings.app_env != "development":
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
    return get_remote_address(request)


def _try_user_id_from_request(request: Request) -> Optional[str]:
    """Best-effort extraction of the user id from cookie or Bearer header.

    Runs before the auth dependency, so we decode the JWT directly here.
    Returns None on any failure — the caller falls back to IP keying.
    """
    token = request.cookies.get("lambda_token")
    if not token:
        auth = request.headers.get("Authorization") or ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        settings = get_settings()
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None
    except Exception:
        logger.exception("Unexpected error decoding token for rate-limit key")
        return None


def user_or_ip(request: Request) -> str:
    """Key by user id if authenticated, else by client IP."""
    user_id = _try_user_id_from_request(request)
    if user_id:
        return f"user:{user_id}"
    return f"ip:{client_ip(request)}"


limiter = Limiter(key_func=client_ip)
