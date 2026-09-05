"""In-memory fixed-window rate limiter with per-key overrides."""
from __future__ import annotations

import os
import threading
import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import HTTPException, Request, status

# Global defaults (overridable via environment variables).
_DEFAULT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
_DEFAULT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

# Thread-safe bucket store: key_id -> (window_start, count)
_lock = threading.Lock()
_buckets: Dict[int, Tuple[float, int]] = defaultdict(lambda: (0.0, 0))


def check_rate_limit(
    key_id: int,
    rate_limit_requests: int = 0,
    rate_limit_window: int = 0,
) -> None:
    """
    Enforce a fixed-window rate limit for *key_id*.

    :param key_id: The API key's primary-key id.
    :param rate_limit_requests: Per-key max requests override (0 = use global).
    :param rate_limit_window: Per-key window in seconds override (0 = use global).
    :raises HTTPException 429: when the limit is exceeded.
    """
    max_req = rate_limit_requests if rate_limit_requests > 0 else _DEFAULT_REQUESTS
    window = rate_limit_window if rate_limit_window > 0 else _DEFAULT_WINDOW

    now = time.monotonic()
    with _lock:
        window_start, count = _buckets[key_id]
        if now - window_start >= window:
            # Start a new window.
            _buckets[key_id] = (now, 1)
            return
        if count >= max_req:
            retry_after = int(window - (now - window_start)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded.",
                headers={"Retry-After": str(retry_after)},
            )
        _buckets[key_id] = (window_start, count + 1)
