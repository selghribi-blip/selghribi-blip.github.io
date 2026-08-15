"""توليد المقالات والصفحات | Article and HTML page generation."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import prompts
from .config import Settings
from .llm import complete

LOGGER = logging.getLogger(__name__)

WORDS_PER_MINUTE = 220
_JSON_FENCE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)
_HTML_FENCE = re.compile(r"```(?:html)?\s*(.*?)\s*```", re.DOTALL)


class GenerationError(RuntimeError):
    """محتوى غير صالح | Raised when the model output cannot be used."""


@dataclass
class Topic:
    keyword: str
    language: str = "ar"
    angle: str = ""
    audience: str = "general readers"
    categories: List[str] = field(default_factory=list)
    geo: str = ""
    mode: str = "article"

    @classmethod
    def from_dict(cls, raw: Dict[str, Any]) -> "Topic":
        if not raw.get("keyword"):
            raise GenerationError("topic is missing `keyword`: {0}".format(raw))
        return cls(
            keyword=str(raw["keyword"]).strip(),
            language=str(raw.get("language", "ar")).strip(),
            angle=str(raw.get("angle", "")).strip(),
            audience=str(raw.get("audience", "general readers")).strip(),
            categories=[str(item) for item in raw.get("categories", [])],
            geo=str(raw.get("geo", "")).strip(),
            mode=str(raw.get("mode", "article")).strip(),
        )

    @property
    def key(self) -> str:
        return "{0}|{1}|{2}".format(self.language, self.mode, self.keyword.lower())


@dataclass
class Content:
    topic: Topic
    title: str
    title_en: str
    slug: str
    description: str
    tags: List[str]
    body_markdown: str = ""
    html_page: str = ""

    @property
    def read_time(self) -> int:
        return max(1, round(len(self.body_markdown.split()) / WORDS_PER_MINUTE))


LANGUAGE_NAMES = {"ar": "Arabic", "en": "English", "fr": "French"}


def _language_name(code: str) -> str:
    return LANGUAGE_NAMES.get(code, code)


def _strip_fence(text: str, pattern: re.Pattern) -> str:
    match = pattern.search(text)
    return match.group(1).strip() if match else text.strip()


def _slugify(text: str, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    if not slug:
        slug = re.sub(r"[^a-z0-9]+", "-", fallback.lower()).strip("-")
    return slug[:60].strip("-") or "ai-post"


def _parse_article_payload(raw: str, topic: Topic) -> Content:
    text = _strip_fence(raw, _JSON_FENCE)
    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GenerationError("model did not return valid JSON: {0}".format(exc)) from exc
    if not isinstance(payload, dict):
        raise GenerationError("model returned {0}, expected an object".format(type(payload).__name__))

    body = str(payload.get("body", "")).strip()
    title = str(payload.get("title", "")).strip()
    if not title or len(body.split()) < 250:
        raise GenerationError(
            "generated article is too thin (title={0!r}, words={1})".format(title, len(body.split()))
        )

    tags = [str(tag).strip().lower() for tag in payload.get("tags", []) if str(tag).strip()]
    return Content(
        topic=topic,
        title=title,
        title_en=str(payload.get("title_en", "")).strip() or topic.keyword,
        slug=_slugify(str(payload.get("slug", "")), topic.keyword),
        description=str(payload.get("description", "")).strip() or title,
        tags=tags or [topic.keyword],
        body_markdown=body,
    )


def generate_article(
    settings: Settings, topic: Topic, internal_links: Optional[List[str]] = None
) -> Content:
    """توليد مقالة كاملة مع بيانات SEO | Generate a full article with SEO metadata."""
    user = prompts.ARTICLE_USER.format(
        language=_language_name(topic.language),
        keyword=topic.keyword,
        angle=topic.angle or "practical, comprehensive guide",
        audience=topic.audience,
        internal_links=", ".join(internal_links or []) or "none",
    )
    raw = complete(settings, prompts.ARTICLE_SYSTEM, user, temperature=0.8)
    content = _parse_article_payload(raw, topic)
    LOGGER.info("generated article %r (%s words)", content.title, len(content.body_markdown.split()))
    return content


def generate_page(settings: Settings, topic: Topic) -> Content:
    """توليد صفحة HTML كاملة بأسلوب DeepSite | Generate a DeepSite-style single-file page."""
    user = prompts.PAGE_USER.format(
        language=_language_name(topic.language),
        keyword=topic.keyword,
        angle=topic.angle or "marketing landing page",
        audience=topic.audience,
    )
    raw = complete(settings, prompts.PAGE_SYSTEM, user, temperature=0.9)
    html = _strip_fence(raw, _HTML_FENCE)
    if "<html" not in html.lower() or "</html>" not in html.lower():
        raise GenerationError("model did not return a complete HTML document")

    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    description_match = re.search(
        r"<meta[^>]+name=[\"']description[\"'][^>]+content=[\"'](.*?)[\"']", html, re.IGNORECASE | re.DOTALL
    )
    title = (title_match.group(1).strip() if title_match else topic.keyword)[:120]
    LOGGER.info("generated page %r (%s bytes)", title, len(html))
    return Content(
        topic=topic,
        title=title,
        title_en=topic.keyword,
        slug=_slugify("", topic.keyword),
        description=(description_match.group(1).strip() if description_match else title)[:200],
        tags=[topic.keyword.split()[0].lower(), "deepsite", "ai-generated"],
        html_page=html,
    )


def generate(settings: Settings, topic: Topic, internal_links: Optional[List[str]] = None) -> Content:
    if topic.mode == "page":
        return generate_page(settings, topic)
    return generate_article(settings, topic, internal_links)
