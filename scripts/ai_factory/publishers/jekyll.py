"""النشر على مدونة Jekyll | Publish to the Jekyll site as a post or standalone page."""

from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import List

from ..ads import inject_html, inject_markdown
from ..config import REPO_ROOT, Settings
from ..generator import Content

LOGGER = logging.getLogger(__name__)


def _yaml_list(values: List[str]) -> str:
    return "[{0}]".format(", ".join('"{0}"'.format(value.replace('"', "'")) for value in values))


def _display_path(path: Path) -> str:
    """مسار نسبي للمستودع | Repo-relative path when possible, absolute otherwise."""
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def _quote(value: str) -> str:
    return '"{0}"'.format(value.replace('"', "'").replace("\n", " ").strip())


class JekyllPublisher:
    """يكتب المحتوى في `_posts/` أو `ai-pages/` | Writes content into the repo."""

    name = "jekyll"

    def __init__(self, settings: Settings, dry_run: bool = False) -> None:
        self.settings = settings
        self.dry_run = dry_run

    def _post_path(self, content: Content, today: date) -> Path:
        return self.settings.posts_dir / "{0}-{1}.md".format(today.isoformat(), content.slug)

    def _page_path(self, content: Content) -> Path:
        return self.settings.pages_dir / "{0}.html".format(content.slug)

    def render_post(self, content: Content, today: date) -> str:
        front_matter = [
            "---",
            "layout: post",
            "title: {0}".format(_quote(content.title)),
            "title_en: {0}".format(_quote(content.title_en)),
            "date: {0}".format(today.isoformat()),
            "categories: {0}".format(_yaml_list(content.topic.categories or ["tools"])),
            "tags: {0}".format(_yaml_list(content.tags)),
            "description: {0}".format(_quote(content.description)),
            "lang: {0}".format(content.topic.language),
            "read_time: {0}".format(content.read_time),
            "generated_by: ai-factory",
            "---",
            "",
        ]
        body = inject_markdown(content.body_markdown, self.settings.ads)
        return "\n".join(front_matter) + body.rstrip() + "\n"

    def render_page(self, content: Content) -> str:
        return inject_html(content.html_page, self.settings.ads).rstrip() + "\n"

    def publish(self, content: Content, today: date = None) -> str:
        """يعيد المسار النسبي للملف المكتوب | Returns the repo-relative path written."""
        today = today or date.today()
        if content.topic.mode == "page":
            path, rendered = self._page_path(content), self.render_page(content)
        else:
            path, rendered = self._post_path(content, today), self.render_post(content, today)

        if self.dry_run:
            LOGGER.info("[dry-run] would write %s (%s bytes)", path, len(rendered))
            return _display_path(path)

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(rendered, encoding="utf-8")
        LOGGER.info("wrote %s (%s bytes)", path, len(rendered))
        return _display_path(path)
