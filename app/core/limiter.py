"""
Rate limiter shared across the app.

Northflank (and most managed PaaS) terminates TLS at a proxy and forwards
requests to your container. The proxy adds the real client IP to
`X-Forwarded-For`; `request.client.host` only sees the proxy. Without
honouring X-F-F, every user collapses into one bucket and limits become
useless behind the proxy.

We trust X-F-F outside of development. In dev, fall back to the socket IP
so curl from localhost still gets a real key.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings


def client_ip(request: Request) -> str:
    """Return the real client IP, honouring X-Forwarded-For behind a proxy."""
    settings = get_settings()
    if settings.app_env != "development":
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip)
