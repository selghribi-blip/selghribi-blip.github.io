"""Authentication dependency: validate API key against the database."""
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from .database import get_db
from .models import APIKey

_API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# ---------------------------------------------------------------------------
# Hashing helpers
# ---------------------------------------------------------------------------

def hash_key(raw_key: str, salt: str) -> str:
    """Return hex-encoded SHA-256(salt + raw_key)."""
    payload = (salt + raw_key).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def generate_salt() -> str:
    """Return a 32-byte random hex salt."""
    return os.urandom(32).hex()


def generate_raw_key() -> str:
    """Return a cryptographically random 40-byte (80 hex char) API key."""
    return os.urandom(40).hex()


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_current_key(
    raw_key: str | None = Security(_API_KEY_HEADER),
    db: Session = Depends(get_db),
) -> APIKey:
    """Validate X-API-Key header against the database; return the APIKey row."""
    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key (X-API-Key header).",
        )

    # Look up candidate keys by prefix to limit hashing attempts.
    prefix = raw_key[:8]
    candidates = (
        db.query(APIKey)
        .filter(APIKey.key_prefix == prefix, APIKey.status == "active")
        .all()
    )

    for key_row in candidates:
        if hash_key(raw_key, key_row.key_salt) == key_row.key_hash:
            # Update last_used_at without blocking the response.
            key_row.last_used_at = datetime.now(timezone.utc)
            db.commit()
            return key_row

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Invalid or revoked API key.",
    )
