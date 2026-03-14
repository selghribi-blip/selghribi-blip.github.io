"""
Tests for the Stock News Sentiment API.

Run with:
    pytest tests/ -v
"""
from __future__ import annotations

import os
from typing import Any, Dict, List
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# ── Fixtures / helpers ────────────────────────────────────────────────────────

SAMPLE_NEWS: List[Dict[str, Any]] = [
    {
        "id": "abc123def456ab78",
        "title": "Tesla stock surges on strong earnings",
        "url": "https://example.com/news/tsla-1",
        "source": "Reuters",
        "published_at": "2024-10-23T18:00:00+00:00",
        "summary": "Tesla reported strong Q3 earnings beating analyst estimates.",
    },
    {
        "id": "def456abc123cd90",
        "title": "Analysts warn of Tesla supply issues",
        "url": "https://example.com/news/tsla-2",
        "source": "Bloomberg",
        "published_at": "2024-10-22T12:00:00+00:00",
        "summary": "Supply chain concerns may weigh on Tesla production this quarter.",
    },
]


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear in-memory cache before each test."""
    from app.cache import cache_clear
    cache_clear()


@pytest.fixture
def client_no_auth():
    """TestClient with authentication disabled (empty API_KEYS)."""
    with patch.dict(os.environ, {"API_KEYS": "", "API_KEY": ""}, clear=False):
        # Re-import to reset the lru_cache
        from app.config import get_settings
        get_settings.cache_clear()

        from app.main import app
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c

    get_settings.cache_clear()


@pytest.fixture
def client_with_auth():
    """TestClient with a known API key configured."""
    with patch.dict(os.environ, {"API_KEYS": "testkey123", "API_KEY": ""}, clear=False):
        from app.config import get_settings
        get_settings.cache_clear()

        from app.main import app
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c

    from app.config import get_settings
    get_settings.cache_clear()


# ── Health ────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_ok(self, client_no_auth):
        resp = client_no_auth.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "service" in data


# ── Auth ──────────────────────────────────────────────────────────────────────

class TestAuth:
    def test_missing_key_returns_401(self, client_with_auth):
        resp = client_with_auth.get("/v1/news?ticker=TSLA")
        assert resp.status_code == 401

    def test_invalid_key_returns_401(self, client_with_auth):
        resp = client_with_auth.get(
            "/v1/news?ticker=TSLA",
            headers={"X-API-Key": "wrongkey"},
        )
        assert resp.status_code == 401

    def test_valid_x_api_key_header(self, client_with_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_with_auth.get(
                "/v1/news?ticker=TSLA",
                headers={"X-API-Key": "testkey123"},
            )
        assert resp.status_code == 200

    def test_valid_rapidapi_key_header(self, client_with_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_with_auth.get(
                "/v1/news?ticker=TSLA",
                headers={"X-RapidAPI-Key": "testkey123"},
            )
        assert resp.status_code == 200

    def test_no_auth_required_when_keys_empty(self, client_no_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_no_auth.get("/v1/news?ticker=TSLA")
        assert resp.status_code == 200


# ── News endpoint ─────────────────────────────────────────────────────────────

class TestNewsEndpoint:
    def test_returns_news_items(self, client_no_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_no_auth.get("/v1/news?ticker=TSLA&limit=5")

        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "TSLA"
        assert data["count"] == len(SAMPLE_NEWS)
        assert len(data["items"]) == len(SAMPLE_NEWS)

        first = data["items"][0]
        assert "id" in first
        assert "title" in first
        assert "url" in first
        assert "source" in first
        assert "published_at" in first
        assert "summary" in first

    def test_ticker_uppercased(self, client_no_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_no_auth.get("/v1/news?ticker=tsla")
        assert resp.json()["ticker"] == "TSLA"

    def test_missing_ticker_returns_422(self, client_no_auth):
        resp = client_no_auth.get("/v1/news")
        assert resp.status_code == 422

    def test_limit_too_large_returns_422(self, client_no_auth):
        resp = client_no_auth.get("/v1/news?ticker=TSLA&limit=9999")
        assert resp.status_code == 422

    def test_get_by_id_found(self, client_no_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            news_id = SAMPLE_NEWS[0]["id"]
            resp = client_no_auth.get(f"/v1/news/{news_id}?ticker=TSLA")
        assert resp.status_code == 200
        assert resp.json()["id"] == news_id

    def test_get_by_id_not_found(self, client_no_auth):
        with patch(
            "app.routers.news.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_no_auth.get("/v1/news/nonexistentid1234?ticker=TSLA")
        assert resp.status_code == 404


# ── Sentiment endpoint ────────────────────────────────────────────────────────

class TestSentimentEndpoint:
    def test_returns_sentiment(self, client_no_auth):
        with patch(
            "app.routers.sentiment.fetch_news",
            new_callable=AsyncMock,
            return_value=SAMPLE_NEWS,
        ):
            resp = client_no_auth.get("/v1/sentiment?ticker=TSLA&limit=10")

        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "TSLA"

        agg = data["aggregate"]
        assert "count" in agg
        assert "average_compound" in agg
        assert "label" in agg
        assert agg["label"] in ("positive", "neutral", "negative")
        assert "positive_count" in agg
        assert "neutral_count" in agg
        assert "negative_count" in agg

        items = data["items"]
        assert len(items) == len(SAMPLE_NEWS)
        for item in items:
            assert "sentiment" in item
            s = item["sentiment"]
            assert "compound" in s
            assert "label" in s
            assert s["label"] in ("positive", "neutral", "negative")
            assert -1.0 <= s["compound"] <= 1.0

    def test_missing_ticker_returns_422(self, client_no_auth):
        resp = client_no_auth.get("/v1/sentiment")
        assert resp.status_code == 422


# ── Rate limiting ─────────────────────────────────────────────────────────────

class TestRateLimiting:
    def test_rate_limit_exceeded_returns_429(self):
        """Set limit=2 and fire 3 requests from the same key."""
        with patch.dict(
            os.environ,
            {
                "API_KEYS": "ratelimitkey",
                "RATE_LIMIT_REQUESTS": "2",
                "RATE_LIMIT_WINDOW_SECONDS": "60",
            },
            clear=False,
        ):
            from app.config import get_settings
            get_settings.cache_clear()

            # Clear the limiter state
            from app import rate_limiter
            rate_limiter._windows.clear()

            from app.main import app
            with TestClient(app, raise_server_exceptions=False) as c:
                headers = {"X-API-Key": "ratelimitkey"}
                with patch(
                    "app.routers.news.fetch_news",
                    new_callable=AsyncMock,
                    return_value=SAMPLE_NEWS,
                ):
                    r1 = c.get("/v1/news?ticker=TSLA", headers=headers)
                    r2 = c.get("/v1/news?ticker=TSLA", headers=headers)
                    r3 = c.get("/v1/news?ticker=TSLA", headers=headers)

            get_settings.cache_clear()
            rate_limiter._windows.clear()

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r3.status_code == 429
        assert "Retry-After" in r3.headers


# ── Sentiment engine unit tests ───────────────────────────────────────────────

class TestVaderEngine:
    def test_positive_label(self):
        from app.sentiment import VaderEngine
        eng = VaderEngine()
        result = eng.analyze("Great news! Excellent earnings! Outstanding performance!")
        assert result["label"] == "positive"
        assert result["compound"] > 0

    def test_negative_label(self):
        from app.sentiment import VaderEngine
        eng = VaderEngine()
        result = eng.analyze("Terrible crash, terrible losses, disaster!")
        assert result["label"] == "negative"
        assert result["compound"] < 0

    def test_scores_in_range(self):
        from app.sentiment import VaderEngine
        eng = VaderEngine()
        result = eng.analyze("Some stock news headline.")
        assert -1.0 <= result["compound"] <= 1.0
        assert 0 <= result["positive"] <= 1
        assert 0 <= result["neutral"] <= 1
        assert 0 <= result["negative"] <= 1


# ── Cache unit tests ──────────────────────────────────────────────────────────

class TestCache:
    def test_cache_miss_returns_none(self):
        from app.cache import cache_get
        assert cache_get("nonexistent") is None

    def test_cache_set_and_get(self):
        from app.cache import cache_get, cache_set
        cache_set("mykey", {"data": 42}, ttl_seconds=60)
        result = cache_get("mykey")
        assert result == {"data": 42}

    def test_cache_expiry(self):
        import time
        from app.cache import cache_get, cache_set
        cache_set("expkey", "value", ttl_seconds=1)
        time.sleep(1.1)
        assert cache_get("expkey") is None
