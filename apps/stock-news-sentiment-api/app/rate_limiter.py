"""
In-memory fixed-window rate limiter.

Each (api_key, window_start) pair gets a counter.  When the counter exceeds the
limit a 429 is returned with a Retry-After header.

A Redis-backed variant can be swapped in by implementing the same interface
(``check_rate_limit``) and replacing the dependency.
"""
from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Tuple

from fastapi import Depends, HTTPException, status

from app.auth import verify_api_key
from app.config import Settings, get_settings

# (api_key, window_bucket) → request_count
_rate_limit_windows: Dict[Tuple[str, int], int] = defaultdict(int)
_lock = Lock()


def _window_bucket(window_seconds: int) -> int:
    """Return the current fixed-window bucket (integer timestamp / window)."""
    return int(time.time()) // window_seconds


def check_rate_limit(
    api_key: str = Depends(verify_api_key),
    settings: Settings = Depends(get_settings),
) -> str:
    """
    FastAPI dependency.  Raises 429 when the caller exceeds the rate limit.
    Returns the api_key so it can be forwarded further if needed.

    Redis alternative
    -----------------
    Replace this function with one that uses ``redis.incr`` / ``expire`` on a
    key like ``rl:{api_key}:{bucket}`` and set RATE_LIMITER=redis + REDIS_URL
    in your environment to enable it without changing router code.
    """
    window = settings.RATE_LIMIT_WINDOW_SECONDS
    limit = settings.RATE_LIMIT_REQUESTS

    bucket = _window_bucket(window)
    key = (api_key, bucket)

    with _lock:
        _rate_limit_windows[key] += 1
        count = _rate_limit_windows[key]

        # Evict old buckets to prevent unbounded growth
        old_bucket = bucket - 2
        stale = [k for k in _rate_limit_windows if k[1] <= old_bucket]
        for k in stale:
            del _rate_limit_windows[k]

    if count > limit:
        retry_after = window - (int(time.time()) % window)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    return api_key
