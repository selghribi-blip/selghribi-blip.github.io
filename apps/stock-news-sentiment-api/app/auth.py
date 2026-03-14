"""
API-key authentication dependency.

Checks (in order):
  1. X-RapidAPI-Key  header  (RapidAPI gateway)
  2. X-API-Key       header  (direct / fallback)
  3. api_key         query-param (convenience, not recommended for production)

When API_KEYS is empty the service runs **unauthenticated** (useful for local
development).  Set at least one key in production.
"""
from __future__ import annotations

from fastapi import Depends, Header, HTTPException, Query, status
from fastapi.security import api_key

from app.config import Settings, get_settings


async def verify_api_key(
    x_rapidapi_key: str | None = Header(default=None, alias="X-RapidAPI-Key"),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    api_key_query: str | None = Query(default=None, alias="api_key"),
    settings: Settings = Depends(get_settings),
) -> str:
    """
    FastAPI dependency that validates an API key.
    Returns the validated key so downstream code can use it for rate limiting.
    """
    # No keys configured → allow all (dev mode)
    if not settings.API_KEYS:
        return "anonymous"

    candidate = x_rapidapi_key or x_api_key or api_key_query

    if not candidate or candidate not in settings.API_KEYS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return candidate
