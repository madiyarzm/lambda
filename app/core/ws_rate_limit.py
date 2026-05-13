"""
Tiny in-process sliding-window limiter for WebSocket endpoints.

slowapi works through HTTP route decorators and middleware, neither of which
applies to WebSocket handlers. We keep a per-key deque of recent timestamps
and check the window manually inside the handler.

Single-process only — fine for one Northflank container. If we ever scale
horizontally, swap the in-memory dict for Redis (`INCR` + `EXPIRE`).
"""

import asyncio
import time
from collections import defaultdict, deque
from typing import Deque

_WINDOW_SECONDS = 60
_lock = asyncio.Lock()
_hits: dict[str, Deque[float]] = defaultdict(deque)


async def allow(key: str, max_per_minute: int) -> bool:
    """Return True if `key` may proceed; False if it is over the limit.

    Records the hit only when allowed, so a rejected request does not push
    the user further past the limit.
    """
    now = time.monotonic()
    cutoff = now - _WINDOW_SECONDS
    async with _lock:
        bucket = _hits[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= max_per_minute:
            return False
        bucket.append(now)
        return True
