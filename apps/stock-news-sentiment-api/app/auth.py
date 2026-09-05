from __future__ import annotations

import os

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlmodel import Session, select

from .database import get_session
from .models import APIKey

# ─── Header schemes ──────────────────────────────────────────────────────────

_API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
_ADMIN_KEY_HEADER = APIKeyHeader(name="X-Admin-Key", auto_error=False)


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _get_configured_admin_key() -> str:
    """Read ADMIN_API_KEY from environment; raise 500 if not set."""
    key = os.getenv("ADMIN_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ADMIN_API_KEY is not configured on this server.",
        )
    return key


# ─── Dependencies ─────────────────────────────────────────────────────────────


async def require_api_key(
    api_key: str = Security(_API_KEY_HEADER),
    session: Session = Depends(get_session),
) -> APIKey:
    """Validate X-API-Key header against the database.

    Raises 401 if the header is missing, 403 if the key is invalid/inactive.
    Returns the matching APIKey row on success.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    key_obj = session.exec(
        select(APIKey).where(APIKey.key == api_key, APIKey.is_active == True)  # noqa: E712
    ).first()
    if not key_obj:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or inactive API key.",
        )
    return key_obj


async def require_admin_key(
    admin_key: str = Security(_ADMIN_KEY_HEADER),
) -> str:
    """Validate X-Admin-Key header against ADMIN_API_KEY env variable.

    Admin endpoints are intentionally separate from normal API keys —
    passing X-API-Key will NOT grant admin access.
    Raises 403 if the header is missing or does not match.
    """
    expected = _get_configured_admin_key()
    if not admin_key or admin_key != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Admin-Key header.",
        )
    return admin_key
