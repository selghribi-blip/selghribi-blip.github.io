from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from textblob import TextBlob

from auth import get_current_api_key
from models import ApiKey
from rate_limiter import check_rate_limit
from routers.news import _fetch_news

router = APIRouter()

_POSITIVE_THRESHOLD = 0.05
_NEGATIVE_THRESHOLD = -0.05


class SentimentScore(BaseModel):
    polarity: float
    subjectivity: float
    label: str


class SentimentItem(BaseModel):
    title: str
    url: str
    source: str
    published: Optional[str] = None
    sentiment: SentimentScore


def _analyze(text: str) -> SentimentScore:
    blob = TextBlob(text)
    polarity: float = round(blob.sentiment.polarity, 4)
    subjectivity: float = round(blob.sentiment.subjectivity, 4)
    if polarity > _POSITIVE_THRESHOLD:
        label = "positive"
    elif polarity < _NEGATIVE_THRESHOLD:
        label = "negative"
    else:
        label = "neutral"
    return SentimentScore(polarity=polarity, subjectivity=subjectivity, label=label)


class SentimentSummary(BaseModel):
    ticker: str
    article_count: int
    average_polarity: float
    overall_label: str
    articles: list[SentimentItem]


@router.get(
    "/v1/sentiment",
    response_model=SentimentSummary,
    summary="Get stock news sentiment",
    tags=["Sentiment"],
)
def get_sentiment(
    ticker: str = Query(..., description="Stock ticker symbol, e.g. AAPL"),
    source: str = Query("all", description="RSS source: google | all"),
    limit: int = Query(20, ge=1, le=100, description="Max articles to analyze"),
    api_key: ApiKey = Depends(get_current_api_key),
) -> SentimentSummary:
    """Fetch recent news and compute sentiment analysis for a given ticker."""
    if source not in ("google", "all"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="source must be 'google' or 'all'.",
        )
    check_rate_limit(api_key)

    news_items = _fetch_news(ticker, source)[:limit]
    if not news_items:
        return SentimentSummary(
            ticker=ticker.upper(),
            article_count=0,
            average_polarity=0.0,
            overall_label="neutral",
            articles=[],
        )

    analyzed: list[SentimentItem] = []
    total_polarity = 0.0
    for item in news_items:
        score = _analyze(item.title)
        total_polarity += score.polarity
        analyzed.append(
            SentimentItem(
                title=item.title,
                url=item.url,
                source=item.source,
                published=item.published,
                sentiment=score,
            )
        )

    avg_polarity = round(total_polarity / len(analyzed), 4)
    if avg_polarity > _POSITIVE_THRESHOLD:
        overall_label = "positive"
    elif avg_polarity < _NEGATIVE_THRESHOLD:
        overall_label = "negative"
    else:
        overall_label = "neutral"

    return SentimentSummary(
        ticker=ticker.upper(),
        article_count=len(analyzed),
        average_polarity=avg_polarity,
        overall_label=overall_label,
        articles=analyzed,
    )
