"""إعدادات مصنع المحتوى | AI content factory settings (env-driven)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

REPO_ROOT = Path(__file__).resolve().parents[2]

# وحدة Adsterra 300x250 الافتراضية داخل المقال | Default Adsterra 300x250 in-article unit
DEFAULT_IN_ARTICLE_AD = (
    '<div style="text-align:center;overflow:hidden;margin:12px auto;">'
    "<script>atOptions = {'key' : '821b89004c042c614100d52b799e6a33', "
    "'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {}};</script>"
    '<script src="https://www.highperformanceformat.com/821b89004c042c614100d52b799e6a33/invoke.js">'
    "</script></div>"
)


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


@dataclass
class AdSnippets:
    """أكواد الإعلانات | Ad network snippets (raw HTML, injected as-is)."""

    header: str = ""
    in_article: str = ""
    footer: str = ""

    @property
    def enabled(self) -> bool:
        return bool(self.header or self.in_article or self.footer)

    @classmethod
    def from_env(cls) -> "AdSnippets":
        return cls(
            header=_env("ADSTERRA_HEADER"),
            in_article=_env("ADSTERRA_IN_ARTICLE", DEFAULT_IN_ARTICLE_AD),
            footer=_env("ADSTERRA_FOOTER"),
        )


@dataclass
class Settings:
    google_api_key: str = ""
    gemini_models: List[str] = field(
        default_factory=lambda: ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest"]
    )
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemma-4-31b-it:free"

    blogger_blog_id: str = ""
    blogger_client_id: str = ""
    blogger_client_secret: str = ""
    blogger_refresh_token: str = ""

    site_url: str = "https://artsmoroccan.me"
    posts_dir: Path = REPO_ROOT / "_posts"
    pages_dir: Path = REPO_ROOT / "ai-pages"
    state_file: Path = REPO_ROOT / "scripts" / "ai_factory" / "state.json"
    topics_file: Path = REPO_ROOT / "scripts" / "ai_factory" / "topics.yml"

    ads: AdSnippets = field(default_factory=AdSnippets)

    @classmethod
    def from_env(cls) -> "Settings":
        settings = cls(
            google_api_key=_env("GOOGLE_API_KEY") or _env("GEMINI_API_KEY"),
            openrouter_api_key=_env("OPENROUTER_API_KEY"),
            blogger_blog_id=_env("BLOGGER_BLOG_ID"),
            blogger_client_id=_env("BLOGGER_CLIENT_ID"),
            blogger_client_secret=_env("BLOGGER_CLIENT_SECRET"),
            blogger_refresh_token=_env("BLOGGER_REFRESH_TOKEN"),
            ads=AdSnippets.from_env(),
        )
        if _env("GEMINI_MODEL"):
            settings.gemini_models = [_env("GEMINI_MODEL")]
        if _env("OPENROUTER_MODEL"):
            settings.openrouter_model = _env("OPENROUTER_MODEL")
        if _env("SITE_URL"):
            settings.site_url = _env("SITE_URL")
        return settings

    @property
    def has_llm(self) -> bool:
        return bool(self.google_api_key or self.openrouter_api_key)

    @property
    def has_blogger(self) -> bool:
        return bool(
            self.blogger_blog_id
            and self.blogger_client_id
            and self.blogger_client_secret
            and self.blogger_refresh_token
        )
