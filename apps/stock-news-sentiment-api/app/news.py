"""Multi-source RSS news fetcher with de-duplication."""
from __future__ import annotations

import logging
import os
import urllib.parse
from typing import Any, Dict, List, Literal, Optional

import feedparser  # type: ignore
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer  # type: ignore

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# RSS source templates
# Google News RSS encodes the query via `q=` param.
# Yahoo Finance RSS search is available at search.yahoo.com/rss.
# Bing News RSS (unofficial) is also available.
# Users can add extra templates via the RSS_EXTRA_TEMPLATES env var
# (comma-separated URL templates using {query} as placeholder).
# ---------------------------------------------------------------------------

_GOOGLE_NEWS_TEMPLATE = (
    "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
)

_YAHOO_FINANCE_TEMPLATE = (
    "https://finance.yahoo.com/rss/headline?s={query}"
)

_BING_NEWS_TEMPLATE = (
    "https://www.bing.com/news/search?q={query}&format=RSS"
)

_SOURCE_TEMPLATES: Dict[str, str] = {
    "google": _GOOGLE_NEWS_TEMPLATE,
    "yahoo": _YAHOO_FINANCE_TEMPLATE,
    "bing": _BING_NEWS_TEMPLATE,
}

# Allow extra custom templates via env (comma-separated, each with {query}).
_extra_raw = os.getenv("RSS_EXTRA_TEMPLATES", "")
if _extra_raw.strip():
    for _i, _tpl in enumerate(_extra_raw.split(","), start=1):
        _tpl = _tpl.strip()
        if _tpl:
            _SOURCE_TEMPLATES[f"extra_{_i}"] = _tpl

_analyzer = SentimentIntensityAnalyzer()

SourceParam = Literal["google", "yahoo", "bing", "all"]


def _sentiment_label(compound: float) -> str:
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"


def _parse_entry(entry: Any, source_name: str) -> Dict[str, Any]:
    title: str = getattr(entry, "title", "") or ""
    link: str = getattr(entry, "link", "") or ""
    published: str = getattr(entry, "published", "") or ""
    summary: str = getattr(entry, "summary", "") or ""
    text_for_sentiment = title + " " + summary

    scores = _analyzer.polarity_scores(text_for_sentiment)
    compound: float = scores["compound"]

    return {
        "title": title,
        "link": link,
        "published": published,
        "summary": summary,
        "source": source_name,
        "sentiment": {
            "label": _sentiment_label(compound),
            "compound": round(compound, 4),
            "positive": round(scores["pos"], 4),
            "negative": round(scores["neg"], 4),
            "neutral": round(scores["neu"], 4),
        },
    }


def _fetch_source(source_name: str, template: str, query: str) -> List[Dict[str, Any]]:
    encoded = urllib.parse.quote_plus(query)
    url = template.replace("{query}", encoded)
    try:
        feed = feedparser.parse(url)
        return [_parse_entry(e, source_name) for e in feed.entries]
    except Exception as exc:
        logger.warning("Failed to fetch source=%s url=%s: %s", source_name, url, exc)
        return []


def fetch_news(
    query: str,
    source: SourceParam = "all",
    max_results: int = 20,
) -> List[Dict[str, Any]]:
    """
    Fetch news articles from one or more RSS sources and return de-duplicated results.

    :param query: Search query / ticker symbol.
    :param source: "google" | "yahoo" | "bing" | "all".
    :param max_results: Max items to return.
    :return: List of article dicts with sentiment scores.
    """
    if source == "all":
        sources_to_fetch = list(_SOURCE_TEMPLATES.items())
    elif source in _SOURCE_TEMPLATES:
        sources_to_fetch = [(source, _SOURCE_TEMPLATES[source])]
    else:
        # Fallback to google if unknown source provided.
        sources_to_fetch = [("google", _GOOGLE_NEWS_TEMPLATE)]

    seen_links: set[str] = set()  # requires Python 3.9+ (matches Dockerfile)
    results: List[Dict[str, Any]] = []

    for src_name, template in sources_to_fetch:
        for article in _fetch_source(src_name, template, query):
            link = article.get("link", "")
            # De-duplicate by link.
            if link and link in seen_links:
                continue
            if link:
                seen_links.add(link)
            results.append(article)

    return results[:max_results]


def available_sources() -> List[str]:
    """Return the list of known source names."""
    return list(_SOURCE_TEMPLATES.keys())
