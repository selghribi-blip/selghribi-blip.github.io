"""
GET /v1/sentiment – aggregate + per-article sentiment for a stock ticker
"""
from __future__ import annotations

import logging
from typing import Annotated, Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.cache import cache_get, cache_set
from app.config import Settings, get_settings
from app.fetcher import fetch_news
from app.rate_limiter import check_rate_limit
from app.sentiment import analyze_items, aggregate_sentiment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["Sentiment"])


# ── Response models ───────────────────────────────────────────────────────────

class SentimentScores(BaseModel):
    compound: float = Field(..., description="VADER compound score [-1, 1]")
    positive: float
    neutral: float
    negative: float
    label: str = Field(..., description="positive | neutral | negative")


class SentimentItem(BaseModel):
    id: str
    title: str
    url: str
    source: str
    published_at: str | None
    sentiment: SentimentScores


class AggregateSentiment(BaseModel):
    count: int
    average_compound: float
    label: str
    positive_count: int
    neutral_count: int
    negative_count: int


class SentimentResponse(BaseModel):
    ticker: str
    aggregate: AggregateSentiment
    items: List[SentimentItem]


# ── Route ─────────────────────────────────────────────────────────────────────

@router.get(
    "/sentiment",
    response_model=SentimentResponse,
    summary="Sentiment analysis for a stock ticker's latest news",
    response_description="Aggregated + per-article sentiment scores",
)
async def get_sentiment(
    ticker: Annotated[str, Query(description="Stock ticker symbol, e.g. TSLA")],
    limit: Annotated[int, Query(ge=1, le=100, description="Max articles to analyse")] = 20,
    settings: Settings = Depends(get_settings),
    _key: str = Depends(check_rate_limit),
) -> SentimentResponse:
    """
    Fetch the latest news for the given ticker and run VADER sentiment analysis.

    Returns:
    - **aggregate**: overall compound score, label, and per-label counts.
    - **items**: per-article sentiment detail (compound + pos/neu/neg).

    Results are cached per-ticker for `NEWS_CACHE_TTL_SECONDS` (default 120 s).
    """
    cache_key = f"sentiment:{ticker.upper()}:{limit}"
    cached = cache_get(cache_key)
    if cached is not None:
        logger.debug("Cache hit: %s", cache_key)
        return cached

    raw_items = await fetch_news(ticker.upper(), limit, settings)
    analyzed = analyze_items(raw_items)
    aggregate = aggregate_sentiment(analyzed)

    response = SentimentResponse(
        ticker=ticker.upper(),
        aggregate=AggregateSentiment(**aggregate),
        items=[
            SentimentItem(
                id=item["id"],
                title=item["title"],
                url=item["url"],
                source=item["source"],
                published_at=item["published_at"],
                sentiment=SentimentScores(**item["sentiment"]),
            )
            for item in analyzed
        ],
    )
    cache_set(cache_key, response, settings.NEWS_CACHE_TTL_SECONDS)
    return response
