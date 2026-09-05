"""
Simple in-memory TTL cache.

Keyed by an arbitrary string (e.g. ``"news:TSLA:20"``).
Thread-safe using a lock.
"""
from __future__ import annotations

import time
from threading import Lock
from typing import Any, Dict, Optional, Tuple

_store: Dict[str, Tuple[Any, float]] = {}
_lock = Lock()


def cache_get(key: str) -> Optional[Any]:
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del _store[key]
            return None
        return value


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    expires_at = time.monotonic() + ttl_seconds
    with _lock:
        _store[key] = (value, expires_at)


def cache_clear() -> None:
    """Utility for tests."""
    with _lock:
        _store.clear()
