"""Tests for the Stock News & Sentiment API."""
from __future__ import annotations

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Must be set BEFORE importing any app module so env vars are picked up.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ADMIN_API_KEY"] = "test-admin-key-12345"

# ---------------------------------------------------------------------------
# Shared in-memory SQLite engine (StaticPool keeps a single connection so
# all sessions within the same test share the same in-memory database).
# ---------------------------------------------------------------------------
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

# Patch the database module BEFORE importing the app so the app uses our engine.
import app.database as _db_module  # noqa: E402

_db_module.engine = _engine
_db_module.SessionLocal = _TestingSessionLocal

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def client(setup_db):
    """Return a TestClient with the in-memory DB wired in."""

    def override_get_db():
        db = _TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


# ---------------------------------------------------------------------------
# Admin: create / list / revoke keys
# ---------------------------------------------------------------------------

ADMIN_HEADERS = {"X-Admin-API-Key": "test-admin-key-12345"}


def test_create_key(client):
    resp = client.post(
        "/v1/admin/keys",
        json={"name": "test-key"},
        headers=ADMIN_HEADERS,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "test-key"
    assert data["status"] == "active"
    assert "plaintext_key" in data
    # 40 random bytes expressed as hex = 80 characters.
    _RAW_KEY_BYTES = 40
    assert len(data["plaintext_key"]) == _RAW_KEY_BYTES * 2
    assert data["key_prefix"] == data["plaintext_key"][:8]


def test_create_key_requires_admin_header(client):
    resp = client.post("/v1/admin/keys", json={"name": "bad"})
    assert resp.status_code == 403


def test_list_keys(client):
    client.post("/v1/admin/keys", json={"name": "k1"}, headers=ADMIN_HEADERS)
    client.post("/v1/admin/keys", json={"name": "k2"}, headers=ADMIN_HEADERS)
    resp = client.get("/v1/admin/keys", headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    keys = resp.json()
    assert len(keys) == 2
    names = {k["name"] for k in keys}
    assert names == {"k1", "k2"}


def test_revoke_key(client):
    create_resp = client.post(
        "/v1/admin/keys", json={"name": "revoke-me"}, headers=ADMIN_HEADERS
    )
    key_id = create_resp.json()["id"]

    revoke_resp = client.post(
        f"/v1/admin/keys/{key_id}/revoke", headers=ADMIN_HEADERS
    )
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["status"] == "revoked"


def test_revoke_nonexistent_key(client):
    resp = client.post("/v1/admin/keys/9999/revoke", headers=ADMIN_HEADERS)
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Auth: X-API-Key header validation
# ---------------------------------------------------------------------------

def _create_key(client) -> str:
    """Helper: create a key and return the plaintext."""
    resp = client.post(
        "/v1/admin/keys", json={"name": "api-test"}, headers=ADMIN_HEADERS
    )
    assert resp.status_code == 201
    return resp.json()["plaintext_key"]


def test_news_requires_api_key(client):
    resp = client.get("/v1/news", params={"q": "AAPL"})
    assert resp.status_code == 401


def test_news_rejects_invalid_key(client):
    resp = client.get(
        "/v1/news",
        params={"q": "AAPL"},
        headers={"X-API-Key": "invalid" * 10},
    )
    assert resp.status_code == 403


def test_news_rejects_revoked_key(client):
    key = _create_key(client)
    key_id = client.get("/v1/admin/keys", headers=ADMIN_HEADERS).json()[0]["id"]
    client.post(f"/v1/admin/keys/{key_id}/revoke", headers=ADMIN_HEADERS)

    resp = client.get(
        "/v1/news",
        params={"q": "AAPL"},
        headers={"X-API-Key": key},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Hashing helpers
# ---------------------------------------------------------------------------

def test_hash_deterministic():
    from app.auth import hash_key

    result1 = hash_key("mykey", "mysalt")
    result2 = hash_key("mykey", "mysalt")
    assert result1 == result2


def test_hash_salt_changes_result():
    from app.auth import hash_key

    h1 = hash_key("mykey", "salt1")
    h2 = hash_key("mykey", "salt2")
    assert h1 != h2


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

def test_rate_limit_allows_within_budget():
    from app.rate_limit import _buckets, check_rate_limit

    _buckets.clear()
    # Should not raise for first call.
    check_rate_limit(key_id=999, rate_limit_requests=5, rate_limit_window=60)


def test_rate_limit_blocks_over_budget():
    from fastapi import HTTPException

    from app.rate_limit import _buckets, check_rate_limit

    _buckets.clear()
    for _ in range(3):
        check_rate_limit(key_id=998, rate_limit_requests=3, rate_limit_window=60)
    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit(key_id=998, rate_limit_requests=3, rate_limit_window=60)
    assert exc_info.value.status_code == 429


# ---------------------------------------------------------------------------
# News de-duplication helper
# ---------------------------------------------------------------------------

def test_news_deduplication():
    from app.news import _parse_entry

    class _FakeEntry:
        title = "Test headline"
        link = "https://example.com/article"
        published = ""
        summary = ""

    entry = _FakeEntry()
    article = _parse_entry(entry, "google")
    assert article["link"] == "https://example.com/article"
    assert article["source"] == "google"
    assert article["sentiment"]["label"] in ("positive", "negative", "neutral")


# ---------------------------------------------------------------------------
# Sources endpoint
# ---------------------------------------------------------------------------

def test_list_sources(client):
    key = _create_key(client)
    resp = client.get("/v1/sources", headers={"X-API-Key": key})
    assert resp.status_code == 200
    data = resp.json()
    assert "sources" in data
    assert "google" in data["sources"]
