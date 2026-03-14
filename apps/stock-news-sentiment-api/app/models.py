from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class APIKey(SQLModel, table=True):
    """Stores API keys issued to API consumers."""

    __tablename__ = "api_keys"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True)
    name: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=_utcnow)
    request_count: int = Field(default=0)


class UsageLog(SQLModel, table=True):
    """Logs every authenticated request for audit and billing purposes."""

    __tablename__ = "usage_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    api_key_id: int = Field(foreign_key="api_keys.id")
    ticker: str
    endpoint: str
    timestamp: datetime = Field(default_factory=_utcnow)
