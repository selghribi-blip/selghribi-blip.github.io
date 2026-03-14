import enum
from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class KeyStatus(str, enum.Enum):
    active = "active"
    revoked = "revoked"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ApiKey(SQLModel, table=True):
    __tablename__ = "api_key"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    key_prefix: str = Field(index=True)
    key_hash: str = Field(index=True)
    status: KeyStatus = Field(default=KeyStatus.active)
    rate_limit_requests_override: Optional[int] = Field(default=None)
    rate_limit_window_seconds_override: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)
    last_used_at: Optional[datetime] = Field(default=None)

    usage_logs: List["UsageLog"] = Relationship(back_populates="api_key")


class UsageLog(SQLModel, table=True):
    __tablename__ = "usage_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    api_key_id: Optional[int] = Field(default=None, foreign_key="api_key.id", index=True)
    method: str
    path: str
    status_code: int
    request_id: str
    created_at: datetime = Field(default_factory=_utcnow)

    api_key: Optional["ApiKey"] = Relationship(back_populates="usage_logs")
