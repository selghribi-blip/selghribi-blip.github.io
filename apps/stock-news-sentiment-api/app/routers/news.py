"""
GET /v1/news           – paginated list of news items for a ticker
GET /v1/news/{news_id} – single news item by its stable ID
"""
from __future__ import annotations

import logging
from typing import Annotated, Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field

from app.cache import cache_get, cache_set
from app.config import Settings, get_settings
from app.fetcher import fetch_news
from app.rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["News"])


# ── Response models ───────────────────────────────────────────────────────────

class NewsItem(BaseModel):
    id: str = Field(..., description="Stable SHA-1 derived ID (16 chars hex)")
    title: str
    url: str
    source: str
    published_at: str | None
    summary: str

    model_config = {"json_schema_extra": {"examples": [{
        "id": "a1b2c3d4e5f6a7b8",
        "title": "Tesla Q3 earnings beat estimates",
        "url": "https://example.com/news/tsla-q3",
        "source": "Reuters",
        "published_at": "2024-10-23T18:00:00+00:00",
        "summary": "Tesla reported Q3 earnings that beat analyst estimates...",
    }]}}


class NewsResponse(BaseModel):
    ticker: str
    count: int
    items: List[NewsItem]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_news(
    ticker: str,
    limit: int,
    settings: Settings,
) -> List[Dict[str, Any]]:
    cache_key = f"news:{ticker.upper()}:{limit}"
    cached = cache_get(cache_key)
    if cached is not None:
        logger.debug("Cache hit: %s", cache_key)
        return cached

    items = await fetch_news(ticker, limit, settings)
    cache_set(cache_key, items, settings.NEWS_CACHE_TTL_SECONDS)
    return items


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/news",
    response_model=NewsResponse,
    summary="Fetch latest news for a stock ticker",
    response_description="Normalized list of news articles",
)
async def get_news(
    ticker: Annotated[str, Query(description="Stock ticker symbol, e.g. TSLA")],
    limit: Annotated[int, Query(ge=1, le=100, description="Max number of articles to return")] = 20,
    settings: Settings = Depends(get_settings),
    _key: str = Depends(check_rate_limit),
) -> NewsResponse:
    """
    Fetch the latest financial news for the given stock ticker.

    Results are cached per-ticker for `NEWS_CACHE_TTL_SECONDS` (default 120 s).

    **Example ticker values**: TSLA, AAPL, NVDA, MSFT, AMZN
    """
    items = await _get_news(ticker.upper(), limit, settings)
    return NewsResponse(ticker=ticker.upper(), count=len(items), items=items)


@router.get(
    "/news/{news_id}",
    response_model=NewsItem,
    summary="Get a single news item by ID",
    response_description="A single normalized news article",
)
async def get_news_by_id(
    news_id: Annotated[str, Path(description="Stable news item ID (16-char hex)")],
    ticker: Annotated[str, Query(description="Ticker used to look up the item")],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    settings: Settings = Depends(get_settings),
    _key: str = Depends(check_rate_limit),
) -> NewsItem:
    """
    Retrieve a specific news article by its ID.

    The ID is a 16-character hex string derived from the article URL, so it is
    stable across repeated fetches as long as the URL does not change.
    """
    items = await _get_news(ticker.upper(), limit, settings)
    for item in items:
        if item["id"] == news_id:
            return NewsItem(**item)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"News item '{news_id}' not found for ticker '{ticker.upper()}'.",
    )
