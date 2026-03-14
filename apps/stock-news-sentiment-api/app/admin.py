"""Admin router: API key management and usage summary."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .auth import generate_raw_key, generate_salt, hash_key
from .database import get_db
from .models import APIKey, UsageLog

router = APIRouter(prefix="/v1/admin", tags=["admin"])

# ---------------------------------------------------------------------------
# Admin auth guard
# ---------------------------------------------------------------------------

def _require_admin(x_admin_api_key: Optional[str] = Header(default=None)) -> None:
    """Dependency: validate X-Admin-API-Key against ADMIN_API_KEY env var."""
    expected = os.getenv("ADMIN_API_KEY", "")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin access is not configured (ADMIN_API_KEY env var missing).",
        )
    if not x_admin_api_key or x_admin_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Admin-API-Key header.",
        )


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class CreateKeyRequest(BaseModel):
    name: str
    rate_limit_requests: int = 0
    rate_limit_window: int = 0


class CreateKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    status: str
    rate_limit_requests: int
    rate_limit_window: int
    created_at: datetime
    # Returned ONCE only.
    plaintext_key: str


class KeySummary(BaseModel):
    id: int
    name: str
    key_prefix: str
    status: str
    rate_limit_requests: int
    rate_limit_window: int
    created_at: datetime
    last_used_at: Optional[datetime]


class UsageSummaryItem(BaseModel):
    api_key_id: Optional[int]
    path: str
    method: str
    status_code: int
    request_id: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/keys",
    response_model=CreateKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API key (plaintext returned only once)",
)
def create_key(
    body: CreateKeyRequest,
    db: Session = Depends(get_db),
    _admin: None = Depends(_require_admin),
) -> CreateKeyResponse:
    raw_key = generate_raw_key()
    salt = generate_salt()
    key_hash = hash_key(raw_key, salt)
    prefix = raw_key[:8]

    api_key = APIKey(
        name=body.name,
        key_prefix=prefix,
        key_hash=key_hash,
        key_salt=salt,
        status="active",
        rate_limit_requests=body.rate_limit_requests,
        rate_limit_window=body.rate_limit_window,
        created_at=datetime.now(timezone.utc),
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return CreateKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        status=api_key.status,
        rate_limit_requests=api_key.rate_limit_requests,
        rate_limit_window=api_key.rate_limit_window,
        created_at=api_key.created_at,
        plaintext_key=raw_key,
    )


@router.get(
    "/keys",
    response_model=List[KeySummary],
    summary="List all API keys",
)
def list_keys(
    db: Session = Depends(get_db),
    _admin: None = Depends(_require_admin),
) -> List[KeySummary]:
    rows = db.query(APIKey).order_by(APIKey.id).all()
    return [
        KeySummary(
            id=r.id,
            name=r.name,
            key_prefix=r.key_prefix,
            status=r.status,
            rate_limit_requests=r.rate_limit_requests,
            rate_limit_window=r.rate_limit_window,
            created_at=r.created_at,
            last_used_at=r.last_used_at,
        )
        for r in rows
    ]


@router.post(
    "/keys/{key_id}/revoke",
    response_model=KeySummary,
    summary="Revoke an API key by ID",
)
def revoke_key(
    key_id: int,
    db: Session = Depends(get_db),
    _admin: None = Depends(_require_admin),
) -> KeySummary:
    row = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found.")
    row.status = "revoked"
    db.commit()
    db.refresh(row)
    return KeySummary(
        id=row.id,
        name=row.name,
        key_prefix=row.key_prefix,
        status=row.status,
        rate_limit_requests=row.rate_limit_requests,
        rate_limit_window=row.rate_limit_window,
        created_at=row.created_at,
        last_used_at=row.last_used_at,
    )


@router.get(
    "/usage",
    response_model=List[UsageSummaryItem],
    summary="Query usage logs (filterable by date range)",
)
def get_usage(
    from_dt: Optional[datetime] = Query(
        default=None,
        alias="from",
        description="Start datetime (ISO 8601, inclusive)",
    ),
    to_dt: Optional[datetime] = Query(
        default=None,
        alias="to",
        description="End datetime (ISO 8601, inclusive)",
    ),
    limit: int = Query(default=100, le=1000, description="Max rows to return"),
    db: Session = Depends(get_db),
    _admin: None = Depends(_require_admin),
) -> List[UsageSummaryItem]:
    q = db.query(UsageLog)
    if from_dt:
        q = q.filter(UsageLog.created_at >= from_dt)
    if to_dt:
        q = q.filter(UsageLog.created_at <= to_dt)
    q = q.order_by(UsageLog.created_at.desc()).limit(limit)
    rows = q.all()
    return [
        UsageSummaryItem(
            api_key_id=r.api_key_id,
            path=r.path,
            method=r.method,
            status_code=r.status_code,
            request_id=r.request_id,
            created_at=r.created_at,
        )
        for r in rows
    ]
