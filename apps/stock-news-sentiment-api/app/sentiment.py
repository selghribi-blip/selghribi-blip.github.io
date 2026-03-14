from __future__ import annotations

from typing import Any

from textblob import TextBlob  # type: ignore[import-untyped]


def _classify(polarity: float) -> str:
    if polarity > 0.05:
        return "positive"
    if polarity < -0.05:
        return "negative"
    return "neutral"


def analyze_sentiment(text: str) -> dict[str, Any]:
    """Return polarity, subjectivity and a sentiment label for *text*."""
    blob = TextBlob(text or "")
    polarity: float = blob.sentiment.polarity
    subjectivity: float = blob.sentiment.subjectivity
    return {
        "label": _classify(polarity),
        "polarity": round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
    }


def _article_text(article: dict[str, Any]) -> str:
    """Combine title and summary into a single text string for analysis."""
    return f"{article.get('title', '')} {article.get('summary', '')}"


def analyze_articles(articles: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate sentiment across a list of news articles."""
    if not articles:
        return {
            "overall": "neutral",
            "avg_polarity": 0.0,
            "avg_subjectivity": 0.0,
            "articles_analyzed": 0,
            "breakdown": {"positive": 0, "negative": 0, "neutral": 0},
        }

    results: list[dict[str, Any]] = []
    breakdown: dict[str, int] = {"positive": 0, "negative": 0, "neutral": 0}

    for article in articles:
        s = analyze_sentiment(_article_text(article))
        results.append(s)
        breakdown[s["label"]] += 1

    avg_polarity = sum(r["polarity"] for r in results) / len(results)
    avg_subjectivity = sum(r["subjectivity"] for r in results) / len(results)

    return {
        "overall": _classify(avg_polarity),
        "avg_polarity": round(avg_polarity, 4),
        "avg_subjectivity": round(avg_subjectivity, 4),
        "articles_analyzed": len(articles),
        "breakdown": breakdown,
    }
