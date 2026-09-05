from __future__ import annotations

from typing import Any

import feedparser
import httpx

_YAHOO_RSS = (
    "https://feeds.finance.yahoo.com/rss/2.0/headline"
    "?s={ticker}&region=US&lang=en-US"
)
_GOOGLE_RSS = (
    "https://news.google.com/rss/search"
    "?q={ticker}+stock+finance&hl=en-US&gl=US&ceid=US:en"
)

_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; StockNewsBot/1.0)"}


async def fetch_news(ticker: str, max_items: int = 10) -> list[dict[str, Any]]:
    """Fetch the latest news articles for *ticker* from RSS feeds.

    Tries Yahoo Finance first, then falls back to Google News.
    Returns an empty list if all sources fail.
    """
    ticker = ticker.upper()
    for url_template in (_YAHOO_RSS, _GOOGLE_RSS):
        url = url_template.format(ticker=ticker)
        try:
            async with httpx.AsyncClient(timeout=10.0, headers=_HEADERS) as client:
                resp = await client.get(url)
                resp.raise_for_status()
            feed = feedparser.parse(resp.text)
            entries = feed.entries[:max_items]
            if entries:
                return [
                    {
                        "title": e.get("title", ""),
                        "link": e.get("link", ""),
                        "published": e.get("published", ""),
                        "summary": e.get("summary", ""),
                        "source": (e.get("source") or {}).get("title", ""),
                    }
                    for e in entries
                ]
        except Exception:
            continue  # try next source
    return []
