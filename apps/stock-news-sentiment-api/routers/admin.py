from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from sqlmodel import Session, func, select

from auth import generate_api_key, _hash_key
from database import get_session
from models import ApiKey, KeyStatus, UsageLog

router = APIRouter(prefix="/v1/admin", tags=["Admin"])

_ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
_admin_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)


def _require_admin(admin_key: Optional[str] = Security(_admin_header)) -> None:
    if not _ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API key not configured on this server.",
        )
    if admin_key != _ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key.",
        )


# ---------- Request / Response schemas ----------

class CreateKeyRequest(BaseModel):
    name: str
    rate_limit_requests_override: Optional[int] = None
    rate_limit_window_seconds_override: Optional[int] = None


class KeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    status: str
    rate_limit_requests_override: Optional[int]
    rate_limit_window_seconds_override: Optional[int]
    created_at: datetime
    last_used_at: Optional[datetime]


class CreateKeyResponse(KeyResponse):
    plaintext_key: str


class UsageSummaryItem(BaseModel):
    api_key_id: Optional[int]
    key_name: Optional[str]
    total_requests: int
    success_requests: int
    error_requests: int


# ---------- Endpoints ----------

@router.post(
    "/keys",
    response_model=CreateKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API key",
    dependencies=[Depends(_require_admin)],
)
def create_key(
    body: CreateKeyRequest,
    session: Session = Depends(get_session),
) -> CreateKeyResponse:
    plaintext, prefix, key_hash = generate_api_key()
    db_key = ApiKey(
        name=body.name,
        key_prefix=prefix,
        key_hash=key_hash,
        status=KeyStatus.active,
        rate_limit_requests_override=body.rate_limit_requests_override,
        rate_limit_window_seconds_override=body.rate_limit_window_seconds_override,
    )
    session.add(db_key)
    session.commit()
    session.refresh(db_key)
    return CreateKeyResponse(
        id=db_key.id,
        name=db_key.name,
        key_prefix=db_key.key_prefix,
        status=db_key.status,
        rate_limit_requests_override=db_key.rate_limit_requests_override,
        rate_limit_window_seconds_override=db_key.rate_limit_window_seconds_override,
        created_at=db_key.created_at,
        last_used_at=db_key.last_used_at,
        plaintext_key=plaintext,
    )


@router.get(
    "/keys",
    response_model=list[KeyResponse],
    summary="List all API keys",
    dependencies=[Depends(_require_admin)],
)
def list_keys(session: Session = Depends(get_session)) -> list[KeyResponse]:
    keys = session.exec(select(ApiKey).order_by(ApiKey.created_at.desc())).all()
    return [
        KeyResponse(
            id=k.id,
            name=k.name,
            key_prefix=k.key_prefix,
            status=k.status,
            rate_limit_requests_override=k.rate_limit_requests_override,
            rate_limit_window_seconds_override=k.rate_limit_window_seconds_override,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
        )
        for k in keys
    ]


@router.post(
    "/keys/{key_id}/revoke",
    response_model=KeyResponse,
    summary="Revoke an API key",
    dependencies=[Depends(_require_admin)],
)
def revoke_key(
    key_id: int,
    session: Session = Depends(get_session),
) -> KeyResponse:
    db_key = session.get(ApiKey, key_id)
    if db_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found.")
    db_key.status = KeyStatus.revoked
    session.add(db_key)
    session.commit()
    session.refresh(db_key)
    return KeyResponse(
        id=db_key.id,
        name=db_key.name,
        key_prefix=db_key.key_prefix,
        status=db_key.status,
        rate_limit_requests_override=db_key.rate_limit_requests_override,
        rate_limit_window_seconds_override=db_key.rate_limit_window_seconds_override,
        created_at=db_key.created_at,
        last_used_at=db_key.last_used_at,
    )


@router.get(
    "/usage",
    response_model=list[UsageSummaryItem],
    summary="Get usage summary",
    dependencies=[Depends(_require_admin)],
)
def get_usage(
    from_dt: Optional[datetime] = Query(None, alias="from", description="ISO 8601 start datetime"),
    to_dt: Optional[datetime] = Query(None, alias="to", description="ISO 8601 end datetime"),
    session: Session = Depends(get_session),
) -> list[UsageSummaryItem]:
    stmt = select(UsageLog)
    if from_dt:
        stmt = stmt.where(UsageLog.created_at >= from_dt)
    if to_dt:
        stmt = stmt.where(UsageLog.created_at <= to_dt)
    logs = session.exec(stmt).all()

    # Aggregate per api_key_id
    aggregated: dict[Optional[int], dict] = {}
    for log in logs:
        bucket = aggregated.setdefault(
            log.api_key_id,
            {"total": 0, "success": 0, "error": 0, "key_name": None},
        )
        bucket["total"] += 1
        if 200 <= log.status_code < 400:
            bucket["success"] += 1
        else:
            bucket["error"] += 1

    # Resolve key names
    key_ids = [kid for kid in aggregated if kid is not None]
    key_map: dict[int, str] = {}
    if key_ids:
        keys = session.exec(select(ApiKey).where(ApiKey.id.in_(key_ids))).all()
        key_map = {k.id: k.name for k in keys}

    results: list[UsageSummaryItem] = []
    for key_id, data in aggregated.items():
        results.append(
            UsageSummaryItem(
                api_key_id=key_id,
                key_name=key_map.get(key_id) if key_id else None,
                total_requests=data["total"],
                success_requests=data["success"],
                error_requests=data["error"],
            )
        )
    return results
