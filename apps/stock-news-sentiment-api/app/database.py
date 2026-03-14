"""Database engine and session factory (SQLite via SQLAlchemy)."""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Default to a local SQLite file next to this package; overridable via env.
_DB_URL_DEFAULT = "sqlite:///" + str(
    Path(__file__).parent.parent / "data" / "app.db"
)
DATABASE_URL: str = os.getenv("DATABASE_URL", _DB_URL_DEFAULT)

# Ensure the data directory exists for the default SQLite path.
if DATABASE_URL.startswith("sqlite:///"):
    db_path = Path(DATABASE_URL.replace("sqlite:///", "", 1))
    db_path.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    # connect_args only needed for SQLite (disables same-thread check).
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
