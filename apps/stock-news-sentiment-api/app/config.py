"""
Configuration – all settings are driven by environment variables.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import List


class Settings:
    # ── Auth ────────────────────────────────────────────────────────────────
    # Comma-separated list of valid API keys, e.g. "key1,key2"
    # Falls back to a single API_KEY env var for simplicity.
    API_KEYS: List[str]

    # ── Rate limiting ────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int
    RATE_LIMIT_WINDOW_SECONDS: int

    # ── Cache ────────────────────────────────────────────────────────────────
    NEWS_CACHE_TTL_SECONDS: int

    # ── Upstream fetching ────────────────────────────────────────────────────
    HTTP_TIMEOUT_SECONDS: float
    HTTP_MAX_RETRIES: int
    USER_AGENT: str

    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str

    def __init__(self) -> None:
        raw_keys = os.getenv("API_KEYS") or os.getenv("API_KEY") or ""
        self.API_KEYS = [k.strip() for k in raw_keys.split(",") if k.strip()]

        self.RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
        self.RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

        self.NEWS_CACHE_TTL_SECONDS = int(os.getenv("NEWS_CACHE_TTL_SECONDS", "120"))

        self.HTTP_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "10.0"))
        self.HTTP_MAX_RETRIES = int(os.getenv("HTTP_MAX_RETRIES", "3"))
        self.USER_AGENT = os.getenv(
            "USER_AGENT",
            "StockNewsSentimentAPI/1.0 (+https://rapidapi.com)",
        )

        self.APP_ENV = os.getenv("APP_ENV", "production")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
