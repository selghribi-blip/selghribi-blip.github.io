from __future__ import annotations

import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./stock_api.db")

# For SQLite, enable WAL + check_same_thread=False
connect_args: dict = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
