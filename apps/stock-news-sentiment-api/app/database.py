from __future__ import annotations

import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

# Default: SQLite file inside the project directory (./app.db).
# Override by setting DATABASE_URL in .env, e.g.:
#   sqlite:////absolute/path/to/other.db
#   postgresql://user:pass@localhost:5432/dbname
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)


def create_db_and_tables() -> None:
    """Create all SQLModel tables (idempotent — safe to call on every startup)."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    with Session(engine) as session:
        yield session
