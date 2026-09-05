from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, col, func, select

from ..auth import require_admin_key
from ..database import get_session
from ..models import APIKey, UsageLog

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Request / Response schemas ───────────────────────────────────────────────


class CreateAPIKeyRequest(BaseModel):
    name: str


class APIKeyResponse(BaseModel):
    id: int
    key: str
    name: str
    is_active: bool
    request_count: int
    created_at: str


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post(
    "/api-keys",
    summary="Create a new API key",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_key)],
)
async def create_api_key(
    body: CreateAPIKeyRequest,
    session: Session = Depends(get_session),
) -> APIKeyResponse:
    """Create and persist a new API key.

    - **Authentication**: `X-Admin-Key: <ADMIN_API_KEY>` header.
    """
    key_obj = APIKey(key=secrets.token_urlsafe(32), name=body.name)
    session.add(key_obj)
    session.commit()
    session.refresh(key_obj)
    return _to_response(key_obj)


@router.get(
    "/api-keys",
    summary="List all API keys",
    dependencies=[Depends(require_admin_key)],
)
async def list_api_keys(
    active_only: bool = Query(default=False, description="Return only active keys"),
    session: Session = Depends(get_session),
) -> list[APIKeyResponse]:
    """List all stored API keys.

    - **Authentication**: `X-Admin-Key: <ADMIN_API_KEY>` header.
    """
    query = select(APIKey)
    if active_only:
        query = query.where(APIKey.is_active == True)  # noqa: E712
    return [_to_response(k) for k in session.exec(query).all()]


@router.patch(
    "/api-keys/{key_id}/revoke",
    summary="Revoke (deactivate) an API key",
    dependencies=[Depends(require_admin_key)],
)
async def revoke_api_key(
    key_id: int,
    session: Session = Depends(get_session),
) -> dict:
    """Deactivate an API key without deleting it.

    - **Authentication**: `X-Admin-Key: <ADMIN_API_KEY>` header.
    """
    key_obj = session.get(APIKey, key_id)
    if not key_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    key_obj.is_active = False
    session.add(key_obj)
    session.commit()
    return {"message": f"API key {key_id} has been revoked."}


@router.delete(
    "/api-keys/{key_id}",
    summary="Permanently delete an API key",
    dependencies=[Depends(require_admin_key)],
)
async def delete_api_key(
    key_id: int,
    session: Session = Depends(get_session),
) -> dict:
    """Permanently remove an API key from the database.

    - **Authentication**: `X-Admin-Key: <ADMIN_API_KEY>` header.
    """
    key_obj = session.get(APIKey, key_id)
    if not key_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    session.delete(key_obj)
    session.commit()
    return {"message": f"API key {key_id} has been deleted."}


@router.get(
    "/usage",
    summary="Get usage statistics",
    dependencies=[Depends(require_admin_key)],
)
async def get_usage(
    session: Session = Depends(get_session),
) -> dict:
    """Return aggregated usage statistics across all API keys.

    - **Authentication**: `X-Admin-Key: <ADMIN_API_KEY>` header.
    """
    total_keys = session.exec(select(func.count(col(APIKey.id)))).one()
    active_keys = session.exec(
        select(func.count(col(APIKey.id))).where(APIKey.is_active == True)  # noqa: E712
    ).one()
    total_requests = session.exec(select(func.count(col(UsageLog.id)))).one()

    return {
        "total_api_keys": total_keys,
        "active_api_keys": active_keys,
        "total_requests": total_requests,
    }


# ─── Internal helpers ─────────────────────────────────────────────────────────


def _to_response(key_obj: APIKey) -> APIKeyResponse:
    created: datetime = key_obj.created_at or datetime.now(timezone.utc)
    return APIKeyResponse(
        id=key_obj.id,  # type: ignore[arg-type]
        key=key_obj.key,
        name=key_obj.name,
        is_active=key_obj.is_active,
        request_count=key_obj.request_count,
        created_at=created.isoformat(),
    )
