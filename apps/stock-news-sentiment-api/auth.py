from __future__ import annotations

import hashlib
import os
import secrets
import string
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader
from sqlmodel import Session, select

from database import get_session
from models import ApiKey, KeyStatus

_API_KEY_SALT: str = os.getenv("API_KEY_SALT", "changeme-salt")

_header_rapidapi = APIKeyHeader(name="X-RapidAPI-Key", auto_error=False)
_header_api_key = APIKeyHeader(name="X-API-Key", auto_error=False)

# Attribute name used to attach the resolved ApiKey to the request state
REQUEST_API_KEY_ATTR = "_resolved_api_key"


def _hash_key(raw_key: str) -> str:
    return hashlib.sha256((_API_KEY_SALT + raw_key).encode()).hexdigest()


def generate_api_key() -> tuple[str, str, str]:
    """Return (plaintext_key, key_prefix, key_hash)."""
    alphabet = string.ascii_letters + string.digits
    raw = "sk-" + "".join(secrets.choice(alphabet) for _ in range(40))
    prefix = raw[:8]
    key_hash = _hash_key(raw)
    return raw, prefix, key_hash


async def get_current_api_key(
    request: Request,
    rapidapi_key: Optional[str] = Security(_header_rapidapi),
    api_key: Optional[str] = Security(_header_api_key),
    session: Session = Depends(get_session),
) -> ApiKey:
    raw_key = rapidapi_key or api_key
    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide X-RapidAPI-Key or X-API-Key header.",
        )

    key_hash = _hash_key(raw_key)
    db_key = session.exec(select(ApiKey).where(ApiKey.key_hash == key_hash)).first()

    if db_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    if db_key.status != KeyStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key has been revoked.",
        )

    db_key.last_used_at = datetime.now(timezone.utc)
    session.add(db_key)
    session.commit()
    session.refresh(db_key)

    # Attach to request state for middleware usage logging
    request.state._resolved_api_key = db_key
    return db_key
