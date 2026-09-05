from __future__ import annotations

import os
import re
from typing import Any, Optional
from urllib.parse import quote_plus

import feedparser
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from auth import get_current_api_key
from models import ApiKey
from rate_limiter import check_rate_limit

router = APIRouter()

_GOOGLE_RSS_TEMPLATE = (
    "https://news.google.com/rss/search?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"
)

_EXTRA_TEMPLATES: list[str] = [
    t.strip()
    for t in os.getenv("RSS_TEMPLATES", "").split(",")
    if t.strip()
]


class NewsItem(BaseModel):
    title: str
    url: str
    source: str
    published: Optional[str] = None
    summary: Optional[str] = None


def _fetch_feed(url: str) -> list[dict]:
    try:
        feed = feedparser.parse(url)
        return feed.entries
    except Exception:
        return []


def _entry_to_item(entry: Any, source_label: str) -> NewsItem:
    return NewsItem(
        title=getattr(entry, "title", ""),
        url=getattr(entry, "link", ""),
        source=source_label,
        published=getattr(entry, "published", None),
        summary=re.sub(r"<[^>]+>", "", getattr(entry, "summary", "") or ""),
    )


def _fetch_news(ticker: str, source: str) -> list[NewsItem]:
    ticker_encoded = quote_plus(ticker.upper())
    templates: list[tuple[str, str]] = []

    if source in ("google", "all"):
        templates.append((_GOOGLE_RSS_TEMPLATE.replace("{ticker}", ticker_encoded), "google"))

    if source == "all":
        for tmpl in _EXTRA_TEMPLATES:
            templates.append((tmpl.replace("{ticker}", ticker_encoded), "custom"))

    seen_urls: set[str] = set()
    items: list[NewsItem] = []

    for feed_url, label in templates:
        for entry in _fetch_feed(feed_url):
            url = getattr(entry, "link", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                items.append(_entry_to_item(entry, label))

    return items


@router.get(
    "/v1/news",
    response_model=list[NewsItem],
    summary="Get stock news",
    tags=["News"],
)
def get_news(
    ticker: str = Query(..., description="Stock ticker symbol, e.g. AAPL"),
    source: str = Query("all", description="RSS source: google | all"),
    limit: int = Query(20, ge=1, le=100, description="Max articles to return"),
    api_key: ApiKey = Depends(get_current_api_key),
) -> list[NewsItem]:
    """Fetch recent news articles for a given stock ticker."""
    if source not in ("google", "all"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="source must be 'google' or 'all'.",
        )
    check_rate_limit(api_key)
    items = _fetch_news(ticker, source)
    return items[:limit]
