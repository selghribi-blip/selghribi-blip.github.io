from __future__ import annotations

import os
import time
from collections import defaultdict
from threading import Lock
from typing import Optional

from fastapi import HTTPException, status

from models import ApiKey

# Global defaults (overridable per key)
_DEFAULT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "30"))
_DEFAULT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

# In-memory store: key_id -> list of request timestamps within the current window
# NOTE: This implementation is scoped to a single process. In a multi-worker
# deployment (e.g., gunicorn/uvicorn --workers > 1), use a shared store such
# as Redis for accurate cross-process rate limiting.
_windows: dict[int, list[float]] = defaultdict(list)
_lock = Lock()


def check_rate_limit(api_key: Optional[ApiKey]) -> None:
    """Raise 429 if the key has exceeded its rate limit."""
    if api_key is None:
        return

    key_id = api_key.id
    max_requests = api_key.rate_limit_requests_override or _DEFAULT_REQUESTS
    window_seconds = api_key.rate_limit_window_seconds_override or _DEFAULT_WINDOW

    now = time.monotonic()
    window_start = now - window_seconds

    with _lock:
        timestamps = _windows[key_id]
        # Evict old timestamps outside the current window
        timestamps = [t for t in timestamps if t > window_start]

        if len(timestamps) >= max_requests:
            oldest = timestamps[0]
            retry_after = int(window_seconds - (now - oldest)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please slow down.",
                headers={"Retry-After": str(retry_after)},
            )

        timestamps.append(now)
        _windows[key_id] = timestamps
