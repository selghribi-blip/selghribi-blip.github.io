"""SQLAlchemy ORM models."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # First 8 chars of the raw key (safe to store, used for lookup / display).
    key_prefix: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    # SHA-256(salt + raw_key), hex-encoded.
    key_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    # Random per-key salt stored alongside the hash.
    key_salt: Mapped[str] = mapped_column(String(64), nullable=False)
    # "active" | "revoked"
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
    # Per-key rate-limit override: max requests per window (0 = use global default).
    rate_limit_requests: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Window size in seconds for the override (0 = use global default).
    rate_limit_window: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=_utcnow,
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    api_key_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    path: Mapped[str] = mapped_column(String(512), nullable=False)
    method: Mapped[str] = mapped_column(String(16), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    request_id: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=_utcnow,
    )
