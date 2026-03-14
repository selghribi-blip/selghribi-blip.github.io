"""
Pluggable sentiment engine.

Default implementation: VADER (``vaderSentiment``) – no API key needed, fast,
suited for short financial news headlines.

To add a new engine:
1. Create a class that implements ``SentimentEngine`` (has ``analyze`` method).
2. Register it in ``ENGINES``.
3. Set ``SENTIMENT_ENGINE=your_engine_name`` env var.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Protocol

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


class SentimentEngine(Protocol):
    def analyze(self, text: str) -> Dict[str, Any]:
        """Return a dict with at least ``compound`` (float) and ``label`` (str)."""
        ...


# ── VADER ───────────────────────────────────────────────────────────────────

class VaderEngine:
    """VADER-based sentiment engine."""

    def __init__(self) -> None:
        self._analyzer = SentimentIntensityAnalyzer()

    def analyze(self, text: str) -> Dict[str, Any]:
        scores = self._analyzer.polarity_scores(text)
        compound: float = scores["compound"]

        if compound >= 0.05:
            label = "positive"
        elif compound <= -0.05:
            label = "negative"
        else:
            label = "neutral"

        return {
            "compound": round(compound, 4),
            "positive": round(scores["pos"], 4),
            "neutral": round(scores["neu"], 4),
            "negative": round(scores["neg"], 4),
            "label": label,
        }


# ── Registry ─────────────────────────────────────────────────────────────────

ENGINES: Dict[str, type] = {
    "vader": VaderEngine,
}

_instance: SentimentEngine | None = None


def get_engine() -> SentimentEngine:
    global _instance
    if _instance is None:
        name = os.getenv("SENTIMENT_ENGINE", "vader").lower()
        engine_cls = ENGINES.get(name, VaderEngine)
        _instance = engine_cls()
    return _instance


# ── Helpers ───────────────────────────────────────────────────────────────────

def analyze_items(
    items: List[Dict[str, Any]],
    engine: SentimentEngine | None = None,
) -> List[Dict[str, Any]]:
    """Attach sentiment scores to each news item (in-place clone returned)."""
    eng = engine or get_engine()
    result = []
    for item in items:
        text = f"{item.get('title', '')}. {item.get('summary', '')}".strip()
        sentiment = eng.analyze(text)
        result.append({**item, "sentiment": sentiment})
    return result


def aggregate_sentiment(analyzed_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute aggregate stats over a list of sentiment-tagged items."""
    if not analyzed_items:
        return {
            "count": 0,
            "average_compound": 0.0,
            "label": "neutral",
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0,
        }

    compounds = [item["sentiment"]["compound"] for item in analyzed_items]
    avg = sum(compounds) / len(compounds)

    pos = sum(1 for item in analyzed_items if item["sentiment"]["label"] == "positive")
    neg = sum(1 for item in analyzed_items if item["sentiment"]["label"] == "negative")
    neu = len(analyzed_items) - pos - neg

    if avg >= 0.05:
        agg_label = "positive"
    elif avg <= -0.05:
        agg_label = "negative"
    else:
        agg_label = "neutral"

    return {
        "count": len(analyzed_items),
        "average_compound": round(avg, 4),
        "label": agg_label,
        "positive_count": pos,
        "neutral_count": neu,
        "negative_count": neg,
    }
