from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session

from ..auth import require_api_key
from ..database import get_session
from ..models import APIKey, UsageLog
from ..scraper import fetch_news
from ..sentiment import _article_text, analyze_articles, analyze_sentiment

router = APIRouter(prefix="/v1", tags=["Stock News & Sentiment"])

limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/news/{ticker}",
    summary="Get latest news for a stock ticker",
    response_description="List of news articles",
)
@limiter.limit("60/minute")
async def get_news(
    request: Request,
    ticker: str,
    limit: int = Query(default=10, ge=1, le=50, description="Number of articles (1–50)"),
    api_key: APIKey = Depends(require_api_key),
    session: Session = Depends(get_session),
) -> dict:
    """Return the latest news articles for the given stock *ticker*.

    - **Authentication**: `X-API-Key: <your-api-key>` header.
    - **ticker**: stock symbol, e.g. `AAPL`, `TSLA`, `MSFT`.
    """
    ticker = ticker.upper()
    articles = await fetch_news(ticker, max_items=limit)

    # Track usage
    api_key.request_count += 1
    session.add(api_key)
    session.add(UsageLog(api_key_id=api_key.id, ticker=ticker, endpoint="news"))
    session.commit()

    return {"ticker": ticker, "count": len(articles), "articles": articles}


@router.get(
    "/sentiment/{ticker}",
    summary="Get sentiment analysis for a stock ticker",
    response_description="Sentiment summary and per-article breakdown",
)
@limiter.limit("60/minute")
async def get_sentiment(
    request: Request,
    ticker: str,
    limit: int = Query(default=10, ge=1, le=50, description="Number of articles to analyse (1–50)"),
    api_key: APIKey = Depends(require_api_key),
    session: Session = Depends(get_session),
) -> dict:
    """Return sentiment analysis based on the latest news for the given stock *ticker*.

    - **Authentication**: `X-API-Key: <your-api-key>` header.
    - **ticker**: stock symbol, e.g. `AAPL`, `TSLA`, `MSFT`.
    """
    ticker = ticker.upper()
    articles = await fetch_news(ticker, max_items=limit)

    if not articles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No news found for ticker '{ticker}'.",
        )

    summary = analyze_articles(articles)
    detailed = [
        {**a, "sentiment": analyze_sentiment(_article_text(a))}
        for a in articles
    ]

    # Track usage
    api_key.request_count += 1
    session.add(api_key)
    session.add(UsageLog(api_key_id=api_key.id, ticker=ticker, endpoint="sentiment"))
    session.commit()

    return {"ticker": ticker, "summary": summary, "articles": detailed}
