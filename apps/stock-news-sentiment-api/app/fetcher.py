"""
Upstream news fetcher.

Sources:
  - Google News RSS  (default, no auth required)

The feed URL template is::

    https://news.google.com/rss/search?q={TICKER}+stock&hl=en-US&gl=US&ceid=US:en

Fetching uses ``httpx`` with configurable timeout and retry logic.
Parsing uses ``feedparser``.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

import feedparser
import httpx

from app.config import Settings

logger = logging.getLogger(__name__)

GOOGLE_NEWS_RSS = (
    "https://news.google.com/rss/search"
    "?q={query}&hl=en-US&gl=US&ceid=US:en"
)


def _rss_url(ticker: str) -> str:
    query = quote_plus(f"{ticker} stock news")
    return GOOGLE_NEWS_RSS.format(query=query)


def _parse_date(value: Optional[str]) -> Optional[str]:
    """Parse RFC-2822 date from RSS into ISO-8601."""
    if not value:
        return None
    try:
        dt = parsedate_to_datetime(value)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return value


def _make_id(url: str) -> str:
    """Deterministic ID from URL so it is stable across fetches."""
    return hashlib.sha1(url.encode()).hexdigest()[:16]


def _normalize_entry(entry: Any) -> Dict[str, Any]:
    url: str = entry.get("link", "")
    published_raw: Optional[str] = entry.get("published") or entry.get("updated")
    return {
        "id": _make_id(url),
        "title": entry.get("title", ""),
        "url": url,
        "source": (entry.get("source") or {}).get("title")
        or entry.get("author", ""),
        "published_at": _parse_date(published_raw),
        "summary": entry.get("summary", ""),
    }


async def fetch_news(ticker: str, limit: int, settings: Settings) -> List[Dict[str, Any]]:
    """
    Fetch and normalize news for *ticker* from Google News RSS.

    Raises ``httpx.HTTPError`` on network failures (after retries).
    """
    url = _rss_url(ticker)
    headers = {"User-Agent": settings.USER_AGENT}
    timeout = settings.HTTP_TIMEOUT_SECONDS
    max_retries = settings.HTTP_MAX_RETRIES

    last_exc: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                logger.debug("Fetching RSS (attempt %d): %s", attempt, url)
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                break
        except httpx.HTTPError as exc:
            last_exc = exc
            logger.warning("RSS fetch attempt %d failed: %s", attempt, exc)
    else:
        raise last_exc  # type: ignore[misc]

    feed = feedparser.parse(response.text)
    entries = feed.get("entries", [])[:limit]
    return [_normalize_entry(e) for e in entries]
